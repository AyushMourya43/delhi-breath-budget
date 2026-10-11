"""Private Telegram demo bot. Run explicitly; no messages are sent during setup."""
import json, math, os, secrets, time
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import httpx
from dotenv import dotenv_values
ROOT=Path(__file__).resolve().parents[1]
STATE=Path(__file__).with_name('.telegram-state.json')
PROFILES={'adult','child','elderly','asthma','outdoor_worker'}


def fresh_points(data,now):
    if data.get('is_demo') is not False or data.get('is_stale'):return []
    result=[]
    for p in data.get('points',[]):
        try:
            t=datetime.fromisoformat(p['last_updated'].replace('Z','+00:00'))
            value=p['pm25']
            if not isinstance(value,bool) and math.isfinite(value) and 0<=value<=2000 and 0<=(now-t).total_seconds()<=10800:result.append(p)
        except (KeyError,ValueError,TypeError):continue
    return result


def alert_candidates(points,previous,threshold):
    """Need two distinct, consecutive high hourly observations at the same location."""
    candidates=[];updated={}
    for p in points:
        old=previous.get(p['id']);updated[p['id']]={'stamp':p['last_updated'],'high':p['pm25']>=threshold}
        if old and old['high'] and updated[p['id']]['high']:
            delta=(datetime.fromisoformat(p['last_updated'])-datetime.fromisoformat(old['stamp'])).total_seconds()
            if 0<delta<=7200:candidates.append(p)
        if old and old['stamp']==p['last_updated']:updated[p['id']]=old
    return candidates,updated


def main():
    config=dotenv_values(ROOT/'engine/.env')
    token=(os.getenv('TELEGRAM_BOT_TOKEN') or config.get('TELEGRAM_BOT_TOKEN') or '').strip()
    if not token:raise SystemExit('Save TELEGRAM_BOT_TOKEN in engine/.env first. Do not post it in chat.')
    api=(os.getenv('ENGINE_API_URL') or config.get('ENGINE_API_URL') or 'http://127.0.0.1:8000').rstrip('/')
    threshold=float(os.getenv('ALERT_PM25_THRESHOLD') or config.get('ALERT_PM25_THRESHOLD') or '120')
    if not math.isfinite(threshold) or not 1<=threshold<=2000:raise SystemExit('Invalid alert threshold.')
    state={'offset':0,'owner':None,'profile':'adult','alerts':False,'last_alert':0,'previous':{}}
    if STATE.exists():state.update(json.loads(STATE.read_text()))
    pairing=secrets.token_urlsafe(9)
    if not state['owner']:print('In a PRIVATE chat with your bot, send: /start '+pairing,flush=True)
    print('Bot running. Commands: /status /window /profile adult /alerts on /alerts off /testalert /stop',flush=True)
    def save():
        tmp=STATE.with_suffix('.tmp');tmp.write_text(json.dumps(state));tmp.chmod(0o600);tmp.replace(STATE)
    with httpx.Client(timeout=40) as client:
        def telegram(method,body):
            response=client.post('https://api.telegram.org/bot'+token+'/'+method,json=body)
            response.raise_for_status();data=response.json()
            if not data.get('ok'):raise ValueError('Telegram rejected request')
            return data['result']
        def send(text):telegram('sendMessage',{'chat_id':state['owner'],'text':text[:4000]})
        def backend(path,body=None):
            r=client.get(api+'/api'+path) if body is None else client.post(api+'/api'+path,json=body)
            r.raise_for_status();return r.json()
        def status(prefix='Delhi Breath Budget'):
            data=backend('/aqi-grid');points=fresh_points(data,datetime.now(timezone.utc))
            if not points:return prefix+'\nRecent measured PM2.5 unavailable. No demo readings used.'
            high=max(points,key=lambda p:p['pm25'])
            return (prefix+f"\n{len(points)} reporting locations (not all Delhi).\nHighest returned hourly PM2.5: {high['pm25']} µg/m³ at {high['name']}.\nObservation: {high['last_updated']} (UTC).\nSource: OpenAQ / original providers. Not official overall AQI or medical advice.")
        next_check=0
        while True:
            try:
                updates=telegram('getUpdates',{'offset':state['offset'],'timeout':20,'allowed_updates':['message']})
                for update in updates:
                    message=update.get('message',{});chat=message.get('chat',{});text=message.get('text','').strip()
                    state['offset']=update['update_id']+1
                    if chat.get('type')!='private':save();continue
                    if not state['owner'] and secrets.compare_digest(text,'/start '+pairing):
                        state['owner']=chat['id'];save();send('Paired. Use /status or /window. Automatic alerts are OFF. /alerts on opts in; /stop disables them.');continue
                    if chat.get('id')!=state['owner']:save();continue
                    try:
                        parts=text.split();command=parts[0].split('@')[0].lower() if parts else ''
                        if command=='/status':send(status())
                        elif command=='/testalert':send(status('TEST ALERT — user-requested delivery test, not a threshold warning'))
                        elif command=='/profile':
                            if len(parts)==2 and parts[1] in PROFILES:state['profile']=parts[1];send('Profile saved: '+parts[1])
                            else:send('Use /profile adult|child|elderly|asthma|outdoor_worker')
                        elif command=='/window':
                            result=backend('/safe-window',{'location':{'name':'Central Delhi','lat':28.6139,'lon':77.209},'profile':{'type':state['profile'],'activity':'walk'}})
                            w=result.get('best_window')
                            if not w:send('No complete planning window available.')
                            else:
                                fmt=lambda s:datetime.fromisoformat(s).astimezone(ZoneInfo('Asia/Kolkata')).strftime('%d %b %H:%M IST')
                                send(f"Central Delhi · {state['profile']}\nLower-exposure model window: {fmt(w['start'])} to {fmt(w['end'])}\nModel mean: {w['mean_pm25']} µg/m³.\nFetched: {result['data_freshness']['fetched_at']}\nCAMS via Open-Meteo. App planning duration, not a medically safe window.")
                        elif command=='/alerts' and len(parts)==2 and parts[1] in ('on','off'):
                            state['alerts']=parts[1]=='on';state['previous']={}
                            send(f"Automatic alerts {'ON' if state['alerts'] else 'OFF'}. Threshold: {threshold:g} µg/m³ at any returned location. Requires two distinct high hourly observations; 1-hour notification cooldown. Prototype threshold, not medical guidance.")
                        elif command=='/stop':state['alerts']=False;state['previous']={};send('Automatic alerts stopped.')
                        else:send('/status · /window · /profile adult · /alerts on|off · /testalert · /stop')
                    except (httpx.HTTPError,ValueError,KeyError,TypeError):
                        send('Data service unavailable. Please retry. No fabricated result was substituted.')
                    save()
                if state['owner'] and state['alerts'] and time.monotonic()>=next_check:
                    next_check=time.monotonic()+300
                    points=fresh_points(backend('/aqi-grid'),datetime.now(timezone.utc))
                    eligible,previous=alert_candidates(points,state['previous'],threshold)
                    state['previous']=previous
                    if eligible and time.time()-state['last_alert']>=3600:
                        point=max(eligible,key=lambda p:p['pm25'])
                        send(f"PM2.5 threshold alert\n{point['name']}: {point['pm25']} µg/m³.\nTwo distinct high observations detected. Latest: {point['last_updated']} UTC.\nUser-configured threshold {threshold:g}; not medical advice. /stop disables alerts.")
                        state['last_alert']=time.time()
                    save()
            except KeyboardInterrupt:save();print('Bot stopped.');return
            except (httpx.HTTPError,ValueError,KeyError,TypeError):
                # Never log exception text: Telegram URLs contain the secret token.
                print('Request failed; retrying. Check network, API/token settings, and that only one bot process is running.',flush=True)
                time.sleep(5)

if __name__=='__main__':main()
