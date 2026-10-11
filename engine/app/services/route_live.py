"""Driving-route exposure estimates; measured PM2.5 inputs, never demo scores."""
from datetime import datetime, timezone
import math
import httpx
from fastapi import HTTPException

RADIUS_KM = 3.0
MAX_AGE_SECONDS = 3 * 3600

def distance(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (a[1], a[0], b[1], b[0]))
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 12742 * math.asin(math.sqrt(min(1, max(0, h))))

def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def recent_points(payload, now):
    if payload.get('is_demo') is not False or payload.get('is_stale'):
        return []
    points = []
    for p in payload.get('points', []):
        try:
            stamp = datetime.fromisoformat(p['last_updated'].replace('Z', '+00:00'))
            age = (now-stamp).total_seconds()
            if not -300 <= age <= MAX_AGE_SECONDS:
                continue
            if not all(number(p.get(k)) for k in ('lat','lon','pm25')):
                continue
            if not (-90 <= p['lat'] <= 90 and -180 <= p['lon'] <= 180 and 0 <= p['pm25'] <= 2000):
                continue
            points.append(p)
        except (KeyError, ValueError, TypeError):
            continue
    return points

def estimate(point, stations):
    nearby = sorted((distance(point, [s['lon'],s['lat']]), s['pm25']) for s in stations)
    nearby = [(d, p) for d,p in nearby[:3] if d <= RADIUS_KM]
    if not nearby:
        return None
    weights = [(1/max(d, .1)**2, p) for d,p in nearby]
    return sum(w*p for w,p in weights)/sum(w for w,p in weights)

def score_route(route, stations, index):
    coordinates = route['geometry']['coordinates']
    if len(coordinates) < 2 or len(coordinates) > 50000:
        raise ValueError('Invalid geometry')
    if any(len(c)!=2 or not all(number(v) for v in c) or not (-180<=c[0]<=180 and -90<=c[1]<=90) for c in coordinates):
        raise ValueError('Invalid coordinates')
    duration, length = route['duration'], route['distance']
    if not number(duration) or duration <= 0 or not number(length) or length <= 0:
        raise ValueError('Invalid duration or distance')
    times = [t for leg in route.get('legs', []) for t in leg.get('annotation', {}).get('duration', [])]
    aligned = len(times)==len(coordinates)-1 and all(number(t) and t>=0 for t in times) and sum(times)>0
    covered=integral=0.0
    if aligned:
        scale=duration/sum(times)
        for a,b,t in zip(coordinates,coordinates[1:],times):
            subdivisions=max(1, math.ceil(distance(a,b)/.25))
            if subdivisions > 1000:
                raise ValueError('Invalid segment length')
            weight=t*scale/subdivisions
            for n in range(subdivisions):
                f=(n+.5)/subdivisions
                pm=estimate([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],stations)
                if pm is not None:
                    covered+=weight
                    integral+=pm*weight
    coverage=min(1.0,covered/duration)
    complete=aligned and bool(stations) and coverage>=1-1e-8
    mean=integral/duration if complete else None
    reason = None if complete else ('No recent measured PM2.5 available.' if not stations else 'Segment timings unavailable.' if not aligned else 'Some route sections are more than 3 km from a recent reporting location.')
    return {'id': 'road-route-'+str(index), 'label':'Route '+str(index),
            'distance_km':round(length/1000,2),'duration_min':round(duration/60,1),
            'geometry':{'type':'LineString','coordinates':coordinates},
            'avg_pm25':round(mean,1) if mean is not None else None,
            'exposure_ug_h_m3':round(integral/3600,3) if complete else None,
            'cigarettes':round(integral/(86400*22),5) if complete else None,
            'coverage_fraction':round(coverage,4),'is_estimate':True,
            'exposure_available':complete,'unavailable_reason':reason,
            'rank':None,'recommended':False}

def get_routes(request, aqi_provider):
    if request.mode != 'commute':
        raise HTTPException(422,'This provider supports driving only; choose commute.')
    a=[request.origin.lon,request.origin.lat]; b=[request.destination.lon,request.destination.lat]
    if not all(number(v) for v in a+b):
        raise HTTPException(422,'Coordinates must be finite.')
    if any(not (28.0<=p[1]<=29.3 and 76.5<=p[0]<=77.8) for p in (a,b)):
        raise HTTPException(422,'Choose origin and destination within Delhi NCR.')
    if distance(a,b)<.1:
        raise HTTPException(422,'Choose points at least 100 metres apart.')
    coords=f'{a[0]},{a[1]};{b[0]},{b[1]}'
    try:
        with httpx.Client(timeout=25) as client:
            response=client.get('https://router.project-osrm.org/route/v1/driving/'+coords,
                params={'alternatives':'true','overview':'full','geometries':'geojson','steps':'false','annotations':'duration'})
            response.raise_for_status()
            data=response.json()
        if data.get('code')!='Ok' or not data.get('routes'):
            raise ValueError('No route')
    except (httpx.HTTPError,ValueError,TypeError,AttributeError):
        raise HTTPException(503,'Road routing is unavailable or no route was found. Please try again.')
    now=datetime.now(timezone.utc)
    payload=aqi_provider()
    stations=recent_points(payload,now)
    try:
        results=[score_route(r,stations,i+1) for i,r in enumerate(data['routes'][:3])]
    except (KeyError,ValueError,TypeError,IndexError):
        raise HTTPException(502,'The routing provider returned incomplete route data.')
    # Compare only when every returned route has complete sampled time coverage.
    can_compare=len(results)>1 and all(r['exposure_available'] for r in results)
    if can_compare:
        results.sort(key=lambda r:r['exposure_ug_h_m3'])
        for i,r in enumerate(results): r['rank']=i+1
        unique_best=results[0]['exposure_ug_h_m3']<results[1]['exposure_ug_h_m3']
        results[0]['recommended']=unique_best
        message=(results[0]['label']+' has the lowest calculated exposure among these routes. Estimates are not validated street-level measurements.' if unique_best else 'The lowest estimates are tied; no unique recommendation.')
    else:
        message='Only one route was returned; no comparison is possible.' if len(results)==1 else 'Insufficient coverage to rank all routes. Compare distance and driving time instead.'
    return {'generated_at':now.isoformat(),'is_demo':False,'is_estimate':True,
            'source':'OSRM road routes; OpenAQ measured PM2.5 where available',
            'origin':request.origin.model_dump(),'destination':request.destination.model_dump(),'mode':'commute',
            'routes':results,'recommendation':message,'can_compare_exposure':can_compare,
            'data_freshness':payload.get('data_freshness') if stations else {'last_updated':None,'age_minutes':None},
            'measurement_locations':len(stations),
            'exposure_note':'Experimental estimate: nearby measured hourly PM2.5 is interpolated within 3 km and weighted by estimated road-segment time. Full-route scores require coverage at every sampled segment. Current readings are held constant during the journey. Coverage is not statistical confidence. Cigarette-equivalents = PM2.5 × travel days / 22, an illustration, not inhaled dose or medical risk. Travel times exclude live traffic.',
            'attribution':'Routes: OSRM / OpenStreetMap. PM2.5: OpenAQ and original providers.'}
