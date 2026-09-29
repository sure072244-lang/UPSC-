const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const v8=read('v8-enhancements.js');
const v86=read('v86-intelligence.js');
const app=read('app.js');
const worker=read('_worker.js');
const out=[];
function ok(name,cond,detail=''){if(!cond)throw new Error(`${name}: ${detail}`);out.push(`PASS ${name}${detail?' — '+detail:''}`)}

// Boot invariant: V8 must be active before the legacy render can attempt a full blocking data load.
ok('safe-boot-order',v8.indexOf("window.__PRECISION_V8_ACTIVE=true")<v8.indexOf('function bootV8'));
ok('legacy-render-gated',app.includes('if(!state.pyq.length&&!window.__PRECISION_V8_ACTIVE)'));
ok('lazy-search',v8.includes('state.searchIndex=[];v8.searchLoaded=false'));

// Study elapsed-time arithmetic: wall-clock minus paused segments.
function elapsed(a,at){
  if(!a)return 0;
  const paused=(a.pausedMs||0)+(a.pausedAt?Math.max(0,at-a.pausedAt):0);
  return Math.max(0,Math.floor((at-a.startedAt-paused)/1000));
}
const start=1_000_000;
ok('timer-60-sec',elapsed({startedAt:start,pausedMs:0},start+60_000)===60);
ok('timer-pause-20-sec',elapsed({startedAt:start,pausedMs:20_000},start+60_000)===40);
ok('timer-active-pause',elapsed({startedAt:start,pausedMs:0,pausedAt:start+30_000},start+60_000)===30);

// D-Day window logic modelled from the release's exact boundaries.
function gate(today,date,min,start=570,end=690){
  if(today<date)return 'before-date';
  if(today>date)return 'after-date';
  if(min<start)return 'before-time';
  if(min>end)return 'after-time';
  return 'open';
}
ok('dday-before-date',gate('2026-09-24','2026-09-25',600)==='before-date');
ok('dday-before-open',gate('2026-09-25','2026-09-25',569)==='before-time');
ok('dday-open',gate('2026-09-25','2026-09-25',570)==='open');
ok('dday-close-boundary',gate('2026-09-25','2026-09-25',690)==='open');
ok('dday-after-window',gate('2026-09-25','2026-09-25',691)==='after-time');

// Answer-key parser invariants.
function normalizeKey(obj){const o={};for(let q=1;q<=100;q++){const v=String(obj?.[q]??'').trim().toUpperCase();if(/^[ABCD]$/.test(v))o[q]=v}return o}
const complete={};for(let i=1;i<=100;i++)complete[i]=['A','B','C','D'][i%4];
ok('key-100-valid',Object.keys(normalizeKey(complete)).length===100);
const incomplete={...complete};delete incomplete[37];
ok('key-incomplete-blocked',Object.keys(normalizeKey(incomplete)).length!==100);

// Evaluation scoring invariant: +2 correct, -1/3 wrong, blank 0.
function score(answers,key){let c=0,w=0,b=0;for(let q=1;q<=100;q++){const a=answers[q]||'',k=key[q]||'';if(!a)b++;else if(a===k)c++;else w++}return{c,w,b,score:c*2-w/3}}
const answers={};for(let i=1;i<=100;i++)answers[i]=complete[i];
answers[1]=answers[2]==='A'?'B':'A';delete answers[3];
const sc=score(answers,complete);
ok('evaluation-counts',sc.c===98 && sc.w===1 && sc.b===1,JSON.stringify(sc));
ok('evaluation-score',Math.abs(sc.score-(196-1/3))<1e-9,`${sc.score}`);

// OMR template geometry: 50 question rows per page, four bubbles per row.
const p1=read('omr_template_page_1.svg');
const p2=read('omr_template_page_2.svg');
ok('omr-page1-50',/QUESTIONS 1[–-]50/.test(p1));
ok('omr-page2-50',/QUESTIONS 51[–-]100/.test(p2));
ok('omr-four-options',(()=>{const cs=[...p1.matchAll(/<circle\b/g)].length;return cs===200})(),`circles=${[...p1.matchAll(/<circle\b/g)].length}`);

// Backend wiring invariants.
ok('mistral-backend-env-secret',worker.includes('env.MISTRAL_API_KEY'));
ok('mistral-stream',worker.includes('stream:true') && worker.includes("'text/event-stream; charset=utf-8'"));
ok('key-cloud-route',worker.includes("url.pathname==='/api/key'"));
ok('d1-answer-keys',read('cloudflare/schema.sql').includes('CREATE TABLE IF NOT EXISTS answer_keys'));
ok('portal-password-lock',app.includes('PBKDF2') && app.includes('setPortalPassword') && app.includes('verifyPortalPassword') && !app.includes('navigator.credentials.create'));
ok('auto-schedule-start',v8.includes('autoStartScheduledMock') && v8.includes('__precisionAutoStartScheduledMock') && v86.includes('__precisionAutoStartScheduledMock'));

console.log('V8 FUNCTIONAL SMOKE: PASS');
console.log(out.join('\n'));
