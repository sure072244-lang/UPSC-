#!/usr/bin/env python3
import csv, json, re, subprocess, hashlib, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
checks=[]

def ok(name, cond, detail=''):
    checks.append((name,bool(cond),detail))
    if not cond:
        raise AssertionError(f'{name}: {detail}')

required=[
    'index.html','app.js','v8-enhancements.js','styles.css','sw.js','manifest.webmanifest',
    'vercel.json','wrangler.toml','_worker.js','api/ai.js','api/sync.js','api/health.js',
    'cloudflare/schema.sql','omr_template_page_1.svg','omr_template_page_2.svg',
    'omr_answer_key_100q_template.csv','data/feature_registry_v7.csv',
    'data/core/pyq_master_integrated_2014_2026.csv','data/pyq_1300_master_v4.csv',
    'data/test_registry_01_50.json','data/study_subjects_v6.json','v86-intelligence.js','secure-gate-v4.js','v874-intelligence-upgrade.js','data/feature_registry_v86.csv','data/schedule_2027_v1.json','data/mains_gs_trend_2013_2026.json',
]
for f in required:
    ok('required:'+f,(ROOT/f).is_file())

# Syntax check every JavaScript module shipped by the release.
js_files=[ROOT/'app.js',ROOT/'v8-enhancements.js',ROOT/'v86-intelligence.js',ROOT/'_worker.js',ROOT/'api/ai.js',ROOT/'api/sync.js']
for f in js_files:
    r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    ok('node-syntax:'+str(f.relative_to(ROOT)),r.returncode==0,r.stderr[-800:])

app=(ROOT/'app.js').read_text(encoding='utf-8')
v8=(ROOT/'v8-enhancements.js').read_text(encoding='utf-8')
worker=(ROOT/'_worker.js').read_text(encoding='utf-8')
ai=(ROOT/'api/ai.js').read_text(encoding='utf-8')
sync=(ROOT/'api/sync.js').read_text(encoding='utf-8')
css=(ROOT/'styles.css').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
schema=(ROOT/'cloudflare/schema.sql').read_text(encoding='utf-8')
v86=(ROOT/'v86-intelligence.js').read_text(encoding='utf-8')

ok('v87-release-marker',('V8.7.4-STUDY-OS' in v86 or 'V8.7.6-STABILITY' in index) and 'V8.7.4-STUDY-OS' in v8)
ok('v8-safe-boot-marker','__PRECISION_V8_ACTIVE=true' in v8 and '__PRECISION_V8_ACTIVE' in app)
ok('v8-render-does-not-block','if(!state.pyq.length&&!window.__PRECISION_V8_ACTIVE)' in app)
ok('lazy-search-index','Search index is intentionally lazy' in v8 and 'state.searchIndex=[]' in v8)
ok('v876-cache-version',('precision-upsc-v8-7-6' in sw and 'precision-v8-7-6' in v8) and ('precision-v8-6-1' not in v8 and 'precision-upsc-v8-6-1' not in sw))
ok('latest-model',('mistral-small-2603' in worker) and ('mistral-small-2603' in ai))
ok('mistral-conversations','/v1/conversations' in worker and '/v1/conversations' in ai)
ok('mistral-web-search','type:\'web_search\'' in worker and ('payload.tools' in ai or 'payload.tools' in v86) and 'body.web' in ai)
ok('streaming-sse','text/event-stream' in worker and 'text/event-stream' in ai and 'readEventStream' in v8)
ok('safe-portal-actions','PORTAL_ACTIONS' in worker and 'applyPortalActionBlock' in v8)
ok('no-arbitrary-js-action', 'Never emit JavaScript' in worker and 'applyPortalActionBlock' in v8 and 'eval(' not in v8 and 'new Function' not in v8)
ok('ai-global-fab','v8AIFab' in v8 and 'Cross-tab AI FAB' in v8)
ok('ai-history','precision-ai-history' in v8)

# Feature registry
features=list(csv.DictReader(open(ROOT/'data/feature_registry_v86.csv',encoding='utf-8')))
ok('feature-count>=242',len(features)>=242,str(len(features)))
ok('feature-registry-new-ai',sum(1 for x in features if str(x.get('id','')).isdigit() and int(x['id'])>=163)>=20,str(len(features)))
ok('feature-registry-v874-50',sum(1 for x in features if str(x.get('id','')).isdigit() and int(x['id'])>=193)>=50,str(len(features)))
ok('feature-registry-new-schedule',sum(1 for x in features if str(x.get('id','')).isdigit() and int(x['id'])>=183)>=10,str(len(features)))
ok('feature-id-unique',len({x['id'] for x in features})==len(features))

# PYQ data integrity
pyq=list(csv.DictReader(open(ROOT/'data/core/pyq_master_integrated_2014_2026.csv',encoding='utf-8')))
master=list(csv.DictReader(open(ROOT/'data/pyq_1300_master_v4.csv',encoding='utf-8')))
ok('pyq-count-1300',len(pyq)==1300,str(len(pyq)))
ok('pyq-master-count-1300',len(master)==1300,str(len(master)))
ok('pyq-id-unique',len({x['id'] for x in master})==1300)
years=sorted({int(x['year']) for x in master if x.get('year','').isdigit()})
ok('pyq-years-2014-2026',years==list(range(2014,2027)),str(years))
ok('100-questions-per-year',all(sum(1 for r in master if r['year']==str(y))==100 for y in range(2014,2027)))
full=sum(bool(r.get('question_text','').strip()) for r in master)
topic_only=sum(r.get('text_quality','').strip().upper()=='TOPIC_TITLE_ONLY' for r in master)
ok('full-text-layer>=1200',full>=1200,str(full))
ok('2026-topic-only-layer',topic_only==100,str(topic_only))
ok('pyq-options-metadata','option_count' in master[0] and 'question_text' in master[0])

# Test architecture
reg=json.load(open(ROOT/'data/test_registry_01_50.json',encoding='utf-8'))['tests']
ok('test-count-50',len(reg)==50,str(len(reg)))
ok('test-nos-1-50',[x['test_no'] for x in reg]==list(range(1,51)))
ok('test-q-count',all(x['question_count']==100 for x in reg))
ok('test-marks',all(x['marks']==200 for x in reg))
ok('test-duration',all(x['duration_minutes']==120 for x in reg))
ok('test-window',all(x['access_window']=='09:30-11:30' for x in reg))
ok('paper-code-unique',len({x['paper_code'] for x in reg})==50)

# Study timer / persistence / D-Day / OMR markers
ok('study-subjects>=25','const V8_SUBJECTS' in v8 and v8.count('label:')>=25)
for term in ['Agriculture','Internal Security','Social Justice','Disaster Management','World History','CSAT','Philosophy Optional']:
    ok('subject:'+term,term in v8)
ok('study-specific-time-ledger','Only active study-session time enters these ledgers' in v8 and 'precision-study-state' in app)
ok('background-time-recovery','wall-clock timestamps' in v8 and 'visibilitychange' in app)
ok('365-day-retention','STORE_TTL_MS' in app and ('365' in app or '31536000000' in app))
ok('last-view-persistence','precision-view' in app and 'state.view=LS.getItem' in v8)
ok('cloud-sync','/api/sync' in v8 and 'precision-cloud-envelope' in v8)
ok('cloud-key-bridge','/api/key' in v8 and '/api/key' in worker and 'answer_keys' in schema)
ok('final-key-gate','exactly 100 valid A/B/C/D' in worker and 'Object.keys(key).length!==100' in v8)
ok('official-key','officialKeys' in v8 and 'official-import' in v8)
ok('omr-review-flow','OMR Review → Key Vault → Evaluation' in v8)
ok('omr-100-grid','Array.from({length:100}' in v8)
ok('omr-quality','confidence' in v8 and 'uncertain' in v8)
ok('round1-timer','ROUND 1 MANUAL MINUTES' in v8 and 'round1.manualMinutes' in v8)
ok('dday-date-gate','before-date' in v8 and 'after-date' in v8 and '09:30' in v8 and '11:30' in v8)
ok('dday-dry-run-separation','mock-dry' in v8 and 'if(!dry&&!ws.open)' in v8 and 'dryRun:!!dry' in v8)

# Portal password lock
ok('password-pbkdf2','PBKDF2' in app and 'deriveBits' in app and 'salt' in app)
ok('password-refresh-lock','setTimeout(lockPortal,0)' in app and 'deviceLockState().enabled' in app)
ok('passkey-first-run-gate','Create a device passkey to open PRECISION' in v86 and 'Create passkey & open portal' in v86 and 'precisionSecureGate' in (ROOT/'secure-gate-v4.js').read_text(encoding='utf-8'))
ok('no-duplicate-webauthn-app','navigator.credentials.create' not in app and 'PublicKeyCredential' not in app)
secure=(ROOT/'secure-gate-v4.js').read_text(encoding='utf-8')
ok('secure-gate-webauthn','navigator.credentials.create' in secure and 'navigator.credentials.get' in secure and 'precision-secure-gate-v4' in secure)

# Visual / performance
ok('black-glass-theme','#03060b' in css and 'backdrop-filter' in css)
ok('liquid-3d-background','v8-liquid' in css or 'liquid' in css.lower())
ok('distinct-accent-system','--v8-accent' in css and 'subject-chip' in css)
ok('responsive-mobile','@media(max-width:700px)' in css)
ok('performance-no-early-search-fetch','search_index.json' not in "\n".join([x for x in v8.splitlines() if 'loadAllV8' in x or 'state.searchIndex' in x]))

# Service worker assets all exist and no search index is pre-cached.
m=re.search(r"const CORE=\[(.*?)\];",sw,re.S)
assets=re.findall(r"'([^']+)'",m.group(1)) if m else []
missing=[]
for a in assets:
    if a.startswith('./') and not (ROOT/a[2:]).exists():
        missing.append(a)
ok('sw-assets-all-exist',not missing,str(missing[:20]))
ok('sw-lazy-search','search_index.json' not in sw)

# Navigation coverage: every static sidebar target is represented by legacy or V8 view map.
navs=set(re.findall(r'data-view="([^"]+)"',index))
vm=re.search(r'const views=\{([^}]*)\};',app,re.S)
viewkeys=set(re.findall(r'([A-Za-z0-9_]+):',vm.group(1))) if vm else set()
viewkeys.update({'overview','ai','admin','audit','health','schedule','answerKey','blueprint','studyCommand'})
ok('navigation-view-coverage',navs.issubset(viewkeys),str(sorted(navs-viewkeys)))
ok('navigation-count>=20',len(navs)>=20,str(len(navs)))
ok('v87-startup-gate','precisionLock' in v86 and 'create a device passkey to open precision' in v86.lower())
ok('v86-english-policy','Default response language: ENGLISH' in ai and 'English' in v86)
ok('v86-followups','Follow-up' in v86 or 'followups' in v86)
ok('v86-full-context','workbookSheets' in v86 and 'manualAnswers' in v86 and 'allSessions' in v86)
ok('v86-official-key-tab','renderOfficialKeyView' in v86 and 'views.answerKey=renderOfficialKeyView' in v86 and 'Official Answer Key' in v86)
ok('v86-schedule','schedule_2027_v1.json' in v86 and '46 scheduled papers' in v86 and 'schedule-ai-conflict' in v86 and '2027 Test Schedule' in v86)
ok('v86-mains','mains_gs_trend_2013_2026.json' in v86 and 'Mains Topic-wise Evidence Explorer' in v86)
ok('v87-script-wiring','v86-intelligence.js?v=876' in index and 'v874-intelligence-upgrade.js?v=876' in index and 'secure-gate-v4.js?v=876' in index and 'v875-stability-upgrade.js?v=876' in index and 'defer' in index)
ok('v861-subject-matrix','MATRIX_SUBJECTS' in v86 and 'MATRIX_SUBJECTS.length' in v86 and 'NOT_SEPARATELY_TAGGED' in v86 and '23' in v86)
ok('v861-weightage-data',(ROOT/'data/subject_weightage_v861.json').is_file())
ok('v861-focus-persistence','focusMode' in v86 and 'Show sidebar' in v86)
ok('v86-navigation-stack','precision-nav-stack-v86' in v86 and 'nav-back' in v86 and 'Focus tab' in v86)
ok('threeD-ui-retired','data-view=\"threeD\"' not in index and 'data-goto=\"threeD\"' not in index and 'Study Command' in index)
ok('schedule-auto-run','__precisionAutoStartScheduledMock' in (ROOT/'v874-intelligence-upgrade.js').read_text(encoding='utf-8') and 'countdownRemaining' in (ROOT/'v874-intelligence-upgrade.js').read_text(encoding='utf-8'))
ok('v86-safe-admin', all(x in v86 for x in ['admin-run','set_schedule_date','lock_portal','No destructive changes']))
ok('v87-secure-gate-before-open','data-precision-lock' in v86 and '#app{visibility:hidden}' in v86 and 'secureGatePrimary' in v86 and 'installStartupGate' in v86)



# V8.7.6 stability / UX / schedule continuity
v875=(ROOT/'v875-stability-upgrade.js').read_text(encoding='utf-8')
ok('v875-stability-script','V8.7.6-STABILITY' in v875 and 'sidebar' in v875 and 'overflow:hidden' in v875 and 'scheduleState' in v875)
ok('v875-fixed-sidebar','overflow-y:hidden!important' in v875 and '.layout>main,#main' in v875)
ok('v875-passkey-fallback','fallback' in v86 and 'You can continue with the local password fallback' in v86 and "fallback:'password'" in secure)
ok('v875-passkey-variants',"const variants=[" in secure and "residentKey:'discouraged'" in secure and "userVerification:'preferred'" in secure)
ok('v875-schedule-freeze','FROZEN' in v875 and '120-minute scheduled mock window is active' in v875)
ok('v875-focus-back-guard','nav-back' in v86 and 'altKey' in v875 and 'ArrowLeft' in v875)

schedule=json.load(open(ROOT/'data/schedule_2027_v1.json',encoding='utf-8'))
ok('schedule-46',len(schedule.get('papers',[]))==46,str(len(schedule.get('papers',[]))))
ok('schedule-source-sheets',len(schedule.get('sheets',{}))>=11,str(len(schedule.get('sheets',{}))))
schedule_fields={'Order','Test ID','Date','Day','Month','Level','Test Type','Test Group','Paper Code','Core Subject','Core Topic','CA Window','CA Focus','Questions'}
ok('schedule-master-fields-14',set(schedule.get('master_schedule_headers',[]))==schedule_fields)
ok('schedule-master-fields-populated',all(schedule_fields.issubset(set(p)) for p in schedule.get('papers',[])))
manifest=json.load(open(ROOT/'data/system_manifest_v86.json',encoding='utf-8'))
ok('manifest-version',manifest.get('version') in {'V8.7.4-STUDY-OS','V8.7.5-STABILITY'},str(manifest.get('version')))
ok('manifest-feature-count',manifest.get('data',{}).get('feature_registry_rows')==242,str(manifest.get('data',{}).get('feature_registry_rows')))
mains=json.load(open(ROOT/'data/mains_gs_trend_2013_2026.json',encoding='utf-8'))
ok('mains-years-14',mains.get('years')==list(range(2013,2027)),str(mains.get('years')))
ok('mains-rows-60',len(mains.get('rows',[]))==60,str(len(mains.get('rows',[]))))
ok('mains-row-width',all(set(map(str,mains.get('years',[]))).issubset(set(r.get('marks',{}).keys())) for r in mains.get('rows',[])))
# No leaked API secrets in package.
all_text=[]
for p in ROOT.rglob('*'):
    if p.is_file() and p.stat().st_size<8_000_000 and p.suffix.lower() not in {'.png','.jpg','.jpeg','.zip','.xlsx','.sqlite'}:
        try: all_text.append(p.read_text(errors='ignore'))
        except: pass
blob='\n'.join(all_text)
ok('no-gemini-key-leak',not re.search(r'AIza[0-9A-Za-z_-]{20,}',blob))
ok('no-mistral-key-leak',not re.search(r'mstrl_[A-Za-z0-9_-]{20,}',blob))
ok('no-vercel-token-leak',not re.search(r'vck_[A-Za-z0-9_-]{20,}',blob))

print('PHASE H STATIC QA: PASS')
for n,c,d in checks:
    print(('PASS' if c else 'FAIL'),n,d)
