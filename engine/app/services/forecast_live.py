"""CAMS model PM2.5 via Open-Meteo; lower-exposure planning, not safety certification."""
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
import math, threading, time
import httpx
from fastapi import HTTPException

_cache={}
_lock=threading.Lock()
IST=ZoneInfo('Asia/Kolkata')

def parse_hourly(data,now):
    units=data.get('hourly_units',{}).get('pm2_5','').replace('μ','µ')
    if units not in ('µg/m³','µg/m3'):raise ValueError('Unexpected units')
    hourly=data['hourly'];times=hourly['time'];values=hourly['pm2_5']
    if len(times)!=len(values):raise ValueError('Unequal arrays')
    rows={}
    for stamp,value in zip(times,values):
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not 0<=value<=2000:continue
        t=datetime.fromtimestamp(stamp,timezone.utc)
        if now<=t<now+timedelta(hours=49):rows[t.isoformat()]={'time':t.isoformat(),'pm25_pred':round(value,1),'confidence':None}
    result=sorted(rows.values(),key=lambda r:r['time'])[:48]
    if len(result)<24:raise ValueError('Insufficient future coverage')
    return result

def choose_window(rows,hours):
    candidates=[]
    for i in range(len(rows)-hours+1):
        window=rows[i:i+hours];times=[datetime.fromisoformat(r['time']) for r in window]
        if any((b-a).total_seconds()!=3600 for a,b in zip(times,times[1:])):continue
        if any(not 6<=t.astimezone(IST).hour<21 for t in times):continue
        candidates.append((sum(r['pm25_pred'] for r in window)/hours,times[0]))
    if not candidates:return None
    mean,start=min(candidates)
    return {'start':start.isoformat(),'end':(start+timedelta(hours=hours)).isoformat(),'mean_pm25':round(mean,1),'duration_hours':hours,
        'reason':'Lowest modelled average among complete '+str(hours)+'-hour windows between 06:00 and 21:00 IST. Lower exposure does not mean safe.'}

def get_forecast(request):
    lat,lon=request.location.lat,request.location.lon
    if not (math.isfinite(lat) and math.isfinite(lon) and 28<=lat<=29.3 and 76.5<=lon<=77.8):raise HTTPException(422,'Choose a Delhi NCR location.')
    now=datetime.now(timezone.utc);key=(round(lat,3),round(lon,3));tick=time.monotonic()
    with _lock:
        entry=_cache.get(key)
        if not entry or tick-entry[0]>1800:
            try:
                with httpx.Client(timeout=25) as c:
                    r=c.get('https://air-quality-api.open-meteo.com/v1/air-quality',params={'latitude':lat,'longitude':lon,'hourly':'pm2_5','domains':'cams_global','forecast_days':4,'timeformat':'unixtime','timezone':'UTC'})
                    r.raise_for_status();raw=r.json();parse_hourly(raw,now)
                entry=(tick,raw,now.isoformat());_cache[key]=entry
                if len(_cache)>50:_cache.pop(next(iter(_cache)))
            except (httpx.HTTPError,ValueError,TypeError,KeyError,OverflowError):
                raise HTTPException(503,'Air-quality forecast unavailable. No demo forecast substituted.')
    try:rows=parse_hourly(entry[1],now)
    except (ValueError,TypeError,KeyError,OverflowError):raise HTTPException(503,'Insufficient future forecast data.')
    # Product planning defaults only, not medically established safe durations.
    duration={'adult':2,'child':1,'asthma':1,'elderly':1,'outdoor_worker':3}[request.profile.type]
    best=choose_window(rows,duration)
    return {'generated_at':now.isoformat(),'is_demo':False,'is_estimate':True,'source':'CAMS global air-quality model via Open-Meteo',
        'attribution':'CAMS / Copernicus Atmosphere Monitoring Service and Open-Meteo.com',
        'note':'Regional model estimates, not station observations or a street-level forecast. Profile-specific window lengths are app planning defaults, not medical safety limits. A best window may be the same for different profiles.',
        'location':request.location.model_dump(),'profile':request.profile.model_dump(),'hourly':rows,'best_window':best,
        'data_freshness':{'fetched_at':entry[2],'model_run_at':None},'planning_duration_hours':duration}

def get_advice(request):
    parts=[]
    if request.pm25 is not None:parts.append(f'Supplied model PM2.5 estimate: {request.pm25:g} µg/m³.')
    if request.best_window:parts.append('Selected lower-exposure period: '+request.best_window+'.')
    if request.cigarettes is not None:parts.append(f'Illustrative route cigarette-equivalents: {request.cigarettes:g}.')
    if request.smoke_risk:parts.append('Smoke-screening result: '+request.smoke_risk+'.')
    action='Compare predicted concentrations and choose a lower-exposure period where practical.'
    if request.profile.type=='asthma':action='Follow your existing clinician-provided action plan; this app does not establish safe exposure.'
    return {'is_demo':False,'generated_by':'template','headline':'Planning guidance based on supplied results',
        'details':' '.join(parts) if parts else 'No computed values supplied.',
        'actions':[action,'Model estimates can differ from local conditions. Check timestamps before planning.'],
        'note':'General planning information, not medical advice. No AI-generated measurements.'}
