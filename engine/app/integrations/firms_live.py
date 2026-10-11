"""FIRMS satellite detections with explicit unavailable and cached states."""
import csv, io, math, os, threading, time
from datetime import datetime, timezone
from pathlib import Path
import httpx
from dotenv import dotenv_values

_lock=threading.Lock()
_cache=None
_fetched=0.0
_retry=0.0
_error=None

def parse_csv(text, now):
    reader=csv.DictReader(io.StringIO(text.lstrip('\ufeff')))
    required={'latitude','longitude','frp','confidence','acq_date','acq_time'}
    if not required.issubset(set(reader.fieldnames or [])):
        raise ValueError('invalid_provider_response')
    found={}
    for row in reader:
        try:
            lat,lon,frp=map(float,(row['latitude'],row['longitude'],row['frp']))
            if not all(math.isfinite(x) for x in (lat,lon,frp)) or not (27<=lat<=33 and 73<=lon<=79 and frp>=0):continue
            hm=row['acq_time'].strip().zfill(4)
            stamp=datetime.strptime(row['acq_date']+' '+hm,'%Y-%m-%d %H%M').replace(tzinfo=timezone.utc)
            if not 0 <= (now-stamp).total_seconds() <= 86400:continue
            conf={'l':'low','n':'nominal','h':'high'}.get(row['confidence'].strip().lower())
            if conf not in ('nominal','high'):continue
            ident=f"viirs-{lat}-{lon}-{stamp.isoformat()}"
            found[ident]={'id':ident,'lat':lat,'lon':lon,'frp':frp,'confidence':conf,'acq_time':stamp.isoformat()}
        except (ValueError,TypeError,KeyError):continue
    return sorted(found.values(),key=lambda r:r['acq_time'],reverse=True)

def bearing(lat,lon):
    a,b=math.radians(lat),math.radians(28.6139);d=math.radians(77.209-lon)
    return math.degrees(math.atan2(math.sin(d)*math.cos(b),math.cos(a)*math.sin(b)-math.sin(a)*math.cos(b)*math.cos(d)))%360

def km(lat1,lon1,lat2,lon2):
    a,b=math.radians(lat1),math.radians(lat2)
    h=math.sin((b-a)/2)**2+math.cos(a)*math.cos(b)*math.sin(math.radians(lon2-lon1)/2)**2
    return 12742*math.asin(math.sqrt(min(1,max(0,h))))

def smoke(fires,wind,now):
    usable=[]
    if wind.get('is_demo') is False and not wind.get('is_stale'):
        for v in wind.get('vectors',[]):
            try:
                age=(now-datetime.fromisoformat(v['valid_at'].replace('Z','+00:00'))).total_seconds()
                if 0<=age<=7200 and all(math.isfinite(float(v[k])) for k in ('lat','lon','direction_deg','speed_kmh')):usable.append(v)
            except (KeyError,ValueError,TypeError):continue
    checked=aligned=0
    for f in fires:
        if not usable:break
        v=min(usable,key=lambda v:km(f['lat'],f['lon'],v['lat'],v['lon']))
        if km(f['lat'],f['lon'],v['lat'],v['lon'])>100 or v['speed_kmh']<3:continue
        checked+=1
        angle=abs((bearing(f['lat'],f['lon'])-((v['direction_deg']+180)%360)+180)%360-180)
        if angle<=30 and km(f['lat'],f['lon'],28.6139,77.209)<=400:aligned+=1
    return {'fire_count':len(fires),'hours_to_arrival':None,'confidence':'low',
        'level':'potential_transport' if aligned else 'no_detected_alignment' if checked else 'unknown',
        'checked_count':checked,'aligned_count':aligned,
        'note':'Experimental wind-direction screening, not a smoke forecast. '+str(aligned)+' detections align toward central Delhi among '+str(checked)+' checked. Uses current surface wind near detections, not winds along a plume. No alignment does not establish clean air. No verified smoke-arrival time.'}

def get_fires(wind_provider):
    global _cache,_fetched,_retry,_error
    now=datetime.now(timezone.utc)
    with _lock:
        tick=time.monotonic()
        if tick>=_retry and (_cache is None or tick-_fetched>=900):
            config=dotenv_values(Path(__file__).resolve().parents[2]/'.env')
            key=(os.getenv('FIRMS_MAP_KEY') or config.get('FIRMS_MAP_KEY') or '').strip()
            try:
                if not key:raise ValueError('missing_api_key')
                # Key stays server-side and is never included in returned errors.
                url='https://firms.modaps.eosdis.nasa.gov/api/area/csv/'+key+'/VIIRS_SNPP_NRT/73,27,79,33/2'
                with httpx.Client(timeout=25) as client:
                    r=client.get(url)
                    if r.status_code in (401,403):raise ValueError('authentication_failed')
                    if r.status_code==429:raise ValueError('rate_limited')
                    r.raise_for_status()
                    parsed=parse_csv(r.text,now)
                _cache={'fires':parsed,'fetched_at':now.isoformat()};_fetched=tick;_error=None;_retry=0
            except (httpx.HTTPError,ValueError):
                _error='provider_request_failed' if key else 'missing_api_key'
                _retry=tick+120
        cached=_cache
        stale=bool(_error) or tick-_fetched>=900
        valid_cache=cached is not None and tick-_fetched<=7200
        points=[f for f in cached['fires'] if (now-datetime.fromisoformat(f['acq_time'])).total_seconds()<=86400] if valid_cache else []
        fetched=cached['fetched_at'] if valid_cache else None
        error=_error
    try: wind=wind_provider() if valid_cache and not stale and points else {}
    except Exception:wind={}
    risk=smoke(points,wind,now)
    if not valid_cache or stale:risk.update(level='unknown',note='Current fire data unavailable or cached; smoke screening withheld.',aligned_count=0,checked_count=0)
    return {'generated_at':now.isoformat(),'is_demo':False,'available':valid_cache,'is_stale':stale,
        'source':'NASA FIRMS VIIRS S-NPP','attribution':'NASA FIRMS / LANCE / Earthdata',
        'note':'Satellite thermal detections in 73–79°E, 27–33°N over the past 24 hours; nominal/high confidence only. Detections are not unique fires. Satellite gaps and reporting delays apply; zero detections does not mean no fires.',
        'fires':points,'smoke_risk':risk,'error':error,
        'cache_status':'unavailable' if not valid_cache else 'stale' if stale else 'fresh',
        'data_freshness':{'fetched_at':fetched,'last_updated':max((f['acq_time'] for f in points),default=None)}}
