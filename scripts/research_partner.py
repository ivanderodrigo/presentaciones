#!/usr/bin/env python3
"""Shared partner intelligence refresh for GitHub Actions.

Usage:
  python scripts/research_partner.py --partner "SATEC" --country Spain --horizon 365

Only public metadata is stored: title, source, date, URL, classifications and
confidence. No private commercial data is written to the repository.
"""
from __future__ import annotations
import argparse, json, re, ssl, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT_JSON=ROOT/'data/partner-intelligence.json'; OUT_JS=ROOT/'data/partner-intelligence.js'
KNOWLEDGE=ROOT/'data/knowledge.json'; UA='Mozilla/5.0 (compatible; WestconMeetingIntelligence/2.0)'; CTX=ssl.create_default_context()
TRUSTED={'crn.com','computerweekly.com','techtarget.com','networkworld.com','cio.com','channelweb.co.uk','channelfutures.com','theregister.com','expansion.com','eleconomista.es','cincodias.elpais.com','computerworld.es','computing.es','redestelecom.es','channelpartner.es','muycomputerpro.com','ituser.es','revistabyte.es','datacenterdynamics.com','securityweek.com','darkreading.com'}

def clean(s): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',s or '')).strip()
def fetch(url,accept='*/*',timeout=14):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept})
    with urllib.request.urlopen(req,context=CTX,timeout=timeout) as r:return r.read()
def date(s):
    if not s:return ''
    try:return parsedate_to_datetime(s).astimezone(timezone.utc).isoformat()
    except Exception:
        try:return datetime.strptime(s,'%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc).isoformat()
        except Exception:return s
def host(url):
    try:return urllib.parse.urlparse(url).hostname.lower().removeprefix('www.')
    except Exception:return ''
def slug(s):return re.sub(r'(^-|-$)','',re.sub(r'[^a-z0-9]+','-',s.lower()))

def gdelt(q,horizon=365,limit=80):
    timespan='1m' if horizon<=30 else '3m' if horizon<=120 else '1y'
    params=urllib.parse.urlencode({'query':q,'mode':'artlist','format':'json','sort':'datedesc','maxrecords':limit,'timespan':timespan})
    data=json.loads(fetch('https://api.gdeltproject.org/api/v2/doc/doc?'+params,'application/json').decode('utf8','replace'))
    return [{'title':clean(x.get('title') or x.get('name')),'url':x.get('url') or x.get('link') or '','publisher':x.get('domain') or x.get('source') or '','publishedAt':date(x.get('seendate') or x.get('date') or ''),'discovery':'gdelt'} for x in (data.get('articles') or data.get('items') or [])]
def google(q,limit=25):
    url='https://news.google.com/rss/search?q='+urllib.parse.quote(q)+'&hl=en-US&gl=US&ceid=US:en'
    root=ET.fromstring(fetch(url,'application/rss+xml,application/xml,text/xml,*/*'))
    out=[]
    for it in root.findall('.//item')[:limit]:
        src=it.find('source');out.append({'title':clean(it.findtext('title')),'url':(it.findtext('link') or '').strip(),'publisher':clean(src.text if src is not None and src.text else ''),'publishedAt':date(it.findtext('pubDate') or ''),'discovery':'google-news'})
    return out

def classify(e,vendors):
    t=(e.get('title') or '').lower(); d=host(e.get('url','')); score=58
    if any(d==x or d.endswith('.'+x) for x in TRUSTED):score=82
    if any(k in t for k in ['official','partner','certification','award','acquisition','contract','project']):score+=3
    cls=[]
    for name,terms in {
        'alliances':['partner','alliance','alianza','vendor','fabricante','certification','certificación'],
        'strategy':['strategy','estrategia','acquisition','adquisición','investment','inversión','expansion','expansión'],
        'customers':['customer','cliente','contract','contrato','project','proyecto','award','adjudicación'],
        'talent':['hiring','careers','jobs','contratación','architect','engineer','consultant'],
        'technology':['cybersecurity','security','networking','cloud','ai','ia','automation','data','5g','zero trust','sase','ot']
    }.items():
        if any(x in t for x in terms):cls.append(name)
    mentions=[v for v in vendors if v.lower() in t]
    return {**e,'authorityScore':min(100,score),'confidence':'high' if score>=82 else 'medium' if score>=68 else 'low','classes':cls,'vendorMentions':mentions}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--partner',required=True);ap.add_argument('--country',default='Iberia');ap.add_argument('--horizon',type=int,default=365);args=ap.parse_args()
    k=json.loads(KNOWLEDGE.read_text(encoding='utf8'));vendors=[x['name'] for x in k.get('vendors',[])]
    qs=[
        f'"{args.partner}" (strategy OR partnership OR alliance OR certification OR acquisition OR investment OR expansion OR growth)',
        f'"{args.partner}" (customer OR project OR contract OR award OR tender OR framework OR adjudication)',
        f'"{args.partner}" (cybersecurity OR networking OR cloud OR AI OR automation OR 5G OR zero trust OR SASE OR data)',
        f'"{args.partner}" (hiring OR careers OR architect OR engineer OR consultant OR certification OR academy)',
        f'"{args.partner}" (banking OR public-sector OR government OR industrial OR manufacturing OR energy OR retail)',
        f'"{args.partner}" (managed-services OR MSP OR SOC OR NOC OR cloud-services OR professional-services)',
    ]
    # Search the complete Westcon portfolio without creating a single oversized query.
    for i in range(0,len(vendors),9):
        batch=vendors[i:i+9]
        qs.append(f'"{args.partner}" ({" OR ".join([chr(34)+v+chr(34) for v in batch])})')
    rows=[];errors=[]
    for q in qs:
        for source,fn in [('gdelt',lambda:gdelt(q,args.horizon)),('google-news',lambda:google(q))]:
            try:rows.extend(fn())
            except Exception as ex:errors.append({'source':source,'query':q,'error':str(ex)[:240]})
    best={}
    for e in rows:
        if not e.get('title') or not e.get('url'):continue
        x=classify(e,vendors);key=re.sub(r'[^a-z0-9]+','',x['title'].lower())[:130]
        if key not in best or x['authorityScore']>best[key]['authorityScore']:best[key]=x
    evidence=sorted(best.values(),key=lambda x:(x['authorityScore'],x.get('publishedAt','')),reverse=True)[:35]
    data=json.loads(OUT_JSON.read_text(encoding='utf8')) if OUT_JSON.exists() else {'version':'2.0.0','partners':{}}
    key=slug(args.partner);data['version']='2.0.0';data['generatedAt']=datetime.now(timezone.utc).isoformat();data.setdefault('partners',{})[key]={'name':args.partner,'country':args.country,'updatedAt':data['generatedAt'],'evidence':evidence,'errors':errors,'status':'ok' if evidence else 'no-public-signal'}
    OUT_JSON.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8');OUT_JS.write_text('window.WESTCON_PARTNER_INTELLIGENCE = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
    print(f'{args.partner}: {len(evidence)} evidence items, {len(errors)} source errors')
if __name__=='__main__':main()
