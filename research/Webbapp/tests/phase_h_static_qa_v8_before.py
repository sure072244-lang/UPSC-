#!/usr/bin/env python3
import csv, json, re, subprocess, hashlib, os, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ok(name, cond, detail=''):
    checks.append((name,bool(cond),detail))
    if not cond: raise AssertionError(f'{name}: {detail}')

required=['index.html','app.js','styles.css','sw.js','manifest.webmanifest','vercel.json','PHASE_H_README.md','PHASE_H_QA_REPORT.md','data/feature_registry_v4.csv','data/core/pyq_master_integrated_2014_2026.csv','data/test_registry_01_50.json','omr_template_page_1.svg','omr_template_page_2.svg']
for f in required: ok('required:'+f,(ROOT/f).is_file())

# JS syntax
r=subprocess.run(['node','--check',str(ROOT/'app.js')],capture_output=True,text=True)
ok('node-syntax',r.returncode==0,r.stderr[-500:])

# Feature registry
features=list(csv.DictReader(open(ROOT/'data/feature_registry_v4.csv',encoding='utf-8')))
ok('feature-count>=70',len(features)>=70,str(len(features)))
ok('feature-id-unique',len({x['id'] for x in features})==len(features))
ok('feature-active',sum(x['state']=='ACTIVE' for x in features)==len(features)-1)
ok('single-protected-lock',sum(x['feature']=='Mock-generation hard lock' and x['state']=='LOCKED' for x in features)==1)

# PYQ data integrity
pyq=list(csv.DictReader(open(ROOT/'data/core/pyq_master_integrated_2014_2026.csv',encoding='utf-8')))
ok('pyq-count-1300',len(pyq)==1300,str(len(pyq)))
ok('pyq-id-unique',len({x['id'] for x in pyq})==1300)

years=sorted({int(x['year']) for x in pyq if x.get('year','').isdigit()})
ok('pyq-years-2014-2026',years==list(range(2014,2027)),str(years))

# Test architecture
t=json.load(open(ROOT/'data/test_registry_01_50.json',encoding='utf-8'))['tests']
ok('test-count-50',len(t)==50,str(len(t)))
ok('test-nos-1-50',[x['test_no'] for x in t]==list(range(1,51)))
ok('test-q-count',all(x['question_count']==100 for x in t))
ok('test-marks',all(x['marks']==200 for x in t))
ok('test-duration',all(x['duration_minutes']==120 for x in t))
ok('test-window',all(x['access_window']=='09:30-11:30' for x in t))
ok('paper-code-unique',len({x['paper_code'] for x in t})==50)

app=(ROOT/'app.js').read_text(encoding='utf-8')
css=(ROOT/'styles.css').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
ok('negative-marking',"correct*2-wrong*(1/3)" in app)
ok('wrong-ui-penalty','−0.33 each' in app)
ok('water-ripple','.water-ripple' in css and 'waterRipple' in css)
ok('human-3d-nav','human-nav-card' in index and 'human-figure' in css and 'preserve-3d' in css)
ok('mobile-nav', '@media(max-width:700px)' in css and 'position:fixed' in css)
ok('offline-state','navigator.onLine' in app and 'OFFLINE • LOCAL CACHE ACTIVE' in app)
ok('fullscreen','requestFullscreen' in app and 'fullscreenchange' in app)
ok('timer-recovery','pagehide' in app and 'visibilitychange' in app and 'tickTimer()' in app)
ok('evaluation-recovery','syncEvalUnlocks' in app)
ok('countdown-updates','gUpdateLiveClock' in app and '2026-12-06T00:00:00+05:30' in app and '2027-05-24T00:00:00+05:30' in app)
ok('gemini-default','gemini-3.8-flash' in app)
ok('gemini-stream','streamGenerateContent?alt=sse' in app)
ok('gemini-grounding','google_search' in app)
ok('ai-controlled-actions','navigate|rename|note|hideSignals|showSignals|togglePanel|addModule|removeModule|setCountdown|openTraining|resetUI' in app)
ok('ai-no-arbitrary-js','No source-code execution' in app and 'arbitrary JS' in app)
ok('sw-h-version',"precision-upsc-h-v1" in sw)
# Every SW asset exists
m=re.search(r"const ASSETS=\[(.*?)\];",sw,re.S)
assets=re.findall(r"'([^']+)'",m.group(1)) if m else []
missing=[]
for a in assets:
    if a.startswith('./'):
        p=ROOT/a[2:]
        if not p.exists(): missing.append(a)
ok('sw-assets-all-exist',not missing,str(missing[:20]))
# Navigation coverage: every sidebar data-view has a corresponding view key or alias.
navs=set(re.findall(r'data-view=\"([^\"]+)\"', index))
vm=re.search(r'const views=\{([^}]*)\};', app)
viewkeys=set()
if vm:
    viewkeys.update(re.findall(r'([A-Za-z0-9_]+):',vm.group(1)))
viewkeys.update(['overview','ai','admin','audit'])
ok('navigation-view-coverage',navs.issubset(viewkeys),str(sorted(navs-viewkeys)))
ok('navigation-count>=20',len(navs)>=20,str(len(navs)))
# No duplicate HTML ids in the static shell.
ids=re.findall(r'id=\"([^\"]+)\"',index)
ok('static-id-unique',len(ids)==len(set(ids)),str([x for x in set(ids) if ids.count(x)>1]))

# No supplied API key leaked into package (generic secret pattern only)
ok('no-google-api-key-literal',not re.search(r'AIza[0-9A-Za-z_-]{20,}', '\n'.join(p.read_text(errors='ignore') for p in ROOT.rglob('*') if p.is_file() and p.stat().st_size<5_000_000)))

print('PHASE H STATIC QA: PASS')
for n,c,d in checks: print(('PASS' if c else 'FAIL'),n,d)
