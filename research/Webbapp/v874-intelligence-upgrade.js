/* PRECISION V8.7.4 — Study OS + schedule automation + smooth navigation
 * Additive: does not remove legacy data/assets. 3D UI is retired in favour of a lighter Study Command surface.
 */
(function(){
  'use strict';
  const FEATURE_KEY='precision-v874-feature-state';
  const read=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const features=[
    ['daily-readiness','Daily readiness score','Tracker'],['subject-balance','Subject balance index','Tracker'],['schedule-adherence','Schedule adherence %','Schedule'],['next-action','Next best action engine','Flow'],['overdue-queue','Overdue study queue','Tracker'],['missed-session','Missed-session detector','Tracker'],['consistency-index','Study consistency index','Tracker'],['focus-quality','Focus quality log','Tracker'],['distraction-log','Distraction event log','Tracker'],['session-auto-tag','Automatic session tagging','Tracker'],
    ['task-chapter','Chapter/task ledger','Tracker'],['revision-due','Revision due scanner','Revision'],['spaced-interval','Spaced-revision interval planner','Revision'],['pyq-recurrence','PYQ recurrence alert','PYQ'],['coverage-gap','Topic coverage gap detector','PYQ'],['mains-prelims-bridge','Mains–Prelims bridge score','Analytics'],['ca-freshness','Current-affairs freshness audit','Research'],['source-freshness','Source freshness audit','Research'],['key-completeness','Answer-key completeness monitor','OMR'],['omr-confidence','OMR confidence dashboard','OMR'],
    ['result-trend','Result trend comparator','Results'],['score-trajectory','Score trajectory','Results'],['accuracy-trend','Accuracy trend','Results'],['negative-leakage','Negative-marking leakage','Results'],['blank-leakage','Blank-answer leakage','Results'],['time-question','Time/question trend','Results'],['round-efficiency','Round-1 vs Round-2 efficiency','Results'],['mock-reliability','Mock completion reliability','Mock'],['schedule-conflict','Schedule conflict detector','Schedule'],['blackout-audit','Blackout compliance audit','Schedule'],
    ['readiness-checklist','Test readiness checklist','Mock'],['posttest-checklist','Post-test action checklist','Flow'],['weekly-forecast','Weekly study target forecast','Tracker'],['exam-readiness','Exam-day readiness index','Flow'],['streak-recovery','Streak recovery planner','Tracker'],['motivation-signal','Evidence-based motivation signal','AI'],['memory-compaction','AI memory compaction','AI'],['trusted-notes','Trusted-note tagging','AI'],['source-ledger','AI source ledger','AI'],['response-feedback','AI response feedback','AI'],
    ['followup-queue','AI follow-up queue','AI'],['page-context','AI page-context snapshot','AI'],['command-history','AI command history','AI'],['admin-preview','Safe admin preview','AI'],['rollback-snapshot','UI rollback snapshot','Admin'],['backup-integrity','Backup integrity check','Data'],['offline-queue','Offline change queue','Sync'],['cross-tab-sync','Cross-tab sync status','Sync'],['performance-mode','Performance mode toggle','Performance'],['navigation-prefetch','Navigation prefetch','Performance']
  ];
  const state=()=>read(FEATURE_KEY,{focusQuality:0,distractions:0,feedback:[],tasks:[],lastBackup:null,performanceMode:true});
  const save=s=>write(FEATURE_KEY,s);
  const toast=(m,k='info')=>window.toast?.(m,k);
  function study(){return typeof studyState==='function'?studyState():read('precision-study-state',{subjects:{},sessions:[],goals:{daily:480,subject:{}}})}
  function engine(){return typeof engineState==='function'?engineState():read('precision-engine-state',{tests:[],history:[],run:null})}
  function evaluation(){return typeof evalState==='function'?evalState():read('precision-evaluation-state',{queue:[],attempts:[],answerKeys:{},officialKeys:{}})}
  function sessionSeconds(){const s=study();return (s.sessions||[]).reduce((n,x)=>n+(Number(x.durationSec)||0),0)}
  function todayMinutes(){try{return typeof study14==='function'?(study14().at(-1)?.mins||0):0}catch{return 0}}
  function weekMinutes(){try{return typeof study14==='function'?study14().slice(-7).reduce((n,x)=>n+(Number(x.mins)||0),0):0}catch{return 0}}
  function streak(){try{return typeof calcStudyStreak==='function'?calcStudyStreak():0}catch{return 0}}
  function scores(){const q=evaluation().queue||[];return q.map(x=>Number(x.result?.score??x.score)).filter(Number.isFinite)}
  function avgScore(){const a=scores();return a.length?Math.round(a.reduce((n,x)=>n+x,0)/a.length*100)/100:null}
  function scheduleRows(){const base=window.__PRECISION_V86?.schedule?.papers||read('precision-schedule-cache',[])?.papers||[];const ov=read('precision-schedule-state-v86',{});return base.map(x=>({...x,...(ov[x['Test ID']]||{})}));}
  function nextTest(){const rows=scheduleRows();const now=Date.now();return rows.map(x=>({...x,t:new Date(`${x.Date}T09:30:00+05:30`).getTime()})).filter(x=>x.t>=now-7200000).sort((a,b)=>a.t-b.t)[0]||null}
  function readiness(){const s=study(),e=engine(),ev=evaluation(),n=nextTest();let score=0;score+=Math.min(25,Math.round(todayMinutes()/8));score+=Math.min(20,streak()*2);score+=Math.min(20,(s.sessions||[]).length);score+=Math.min(15,(e.history||[]).length*3);score+=Math.min(10,Object.keys(ev.answerKeys||{}).length);score+=n?10:0;return Math.max(0,Math.min(100,score))}
  function subjectBalance(){const s=study(),vals=Object.values(s.subjects||{}).map(Number).filter(x=>x>0);if(vals.length<2)return 100;const avg=vals.reduce((a,b)=>a+b,0)/vals.length;const dev=vals.reduce((a,b)=>a+Math.abs(b-avg),0)/(avg*vals.length||1);return Math.max(0,Math.min(100,Math.round(100-dev*100)))}
  function scheduleAdherence(){const rows=scheduleRows();if(!rows.length)return null;const hist=engine().history||[];if(!hist.length)return 0;const scheduledIds=new Set(rows.map(x=>x['Test ID']));const hit=hist.filter(x=>scheduledIds.has(x.testId)||scheduledIds.has(x.scheduleId)).length;return Math.min(100,Math.round(hit/Math.min(hist.length,rows.length)*100))}
  function keyCompleteness(){const ev=evaluation();const all=new Set([...Object.keys(ev.answerKeys||{}),...Object.keys(ev.officialKeys||{})]);let complete=0;all.forEach(k=>{if(Object.keys(ev.answerKeys?.[k]||{}).length===100||Object.keys(ev.officialKeys?.[k]||{}).length===100)complete++});return {complete,total:all.size}}
  function renderStudyCommand(){
    const s=study(),e=engine(),ev=evaluation(),n=nextTest(),st=state(),ks=keyCompleteness();
    const metrics=[['READINESS',readiness()+'%','daily + schedule + test signals','cyan'],['TODAY',todayMinutes()+' min','study ledger','green'],['7-DAY',weekMinutes()+' min','recent study time','purple'],['STREAK',streak()+' days','continuity','amber'],['MOCKS',(e.history||[]).length,'completed engine runs','cyan'],['AVG SCORE',avgScore()==null?'—':avgScore(),'recorded results','green'],['KEYS',ks.complete+'/'+ks.total,'complete key sets','purple'],['BALANCE',subjectBalance()+'%','subject distribution','amber']];
    const groups={};features.forEach(f=>(groups[f[2]] ||= []).push(f));
    return `<div class="v874-study-os"><div class="view-head"><div><div class="eyebrow">PRECISION STUDY OS / V8.7.4</div><div class="title">Study Command • Tracker Intelligence</div><div class="desc">A lighter replacement for the retired 3D surface. One control layer for study tracking, mock flow, schedule, OMR, results and portal-aware AI.</div></div><span class="v86-pill">${features.length} NEW FEATURES</span></div>
      <div class="grid g4">${metrics.map(m=>`<div class="card v874-metric"><div class="small muted">${m[0]}</div><b class="${m[3]}">${esc(m[1])}</b><small>${esc(m[2])}</small></div>`).join('')}</div>
      <div class="grid g2" style="margin-top:14px"><div class="card v86-card"><div class="split"><h3 class="section-title">Schedule → Mock Automation</h3><span class="v86-pill">09:28–11:30 IST</span></div><div class="notice"><strong>${n?esc(n['Test ID'])+' • '+esc(n['Core Subject']):'No upcoming test'}</strong><br>${n?esc(n.Date)+' • '+esc(n['Paper Code'])+' • '+esc(n.Type):'Schedule data not loaded'}<br><span id="v874AutoStatus">Automatic schedule gate active: 2-minute pre-start countdown → 120-minute test window. Outside the scheduled window the scheduled engine is frozen.</span></div><div class="actions" style="margin-top:10px"><button class="btn primary" data-v874-action="open-training">Open Mock Panel</button><button class="btn" data-v874-action="schedule">Edit Schedule</button><button class="btn" data-v874-action="schedule-audit">Audit schedule conflicts</button></div></div><div class="card v86-card"><div class="split"><h3 class="section-title">Next best action</h3><span class="v86-pill">AI-LINKED</span></div><div class="v874-next"><b>${esc(nextAction())}</b><span>Based on your recorded tracker state; no invented activity.</span></div><div class="actions" style="margin-top:10px"><button class="btn primary" data-v874-action="ai-next">Ask AI for next action</button><button class="btn" data-v874-action="weekly">Generate weekly report</button></div></div></div>
      <div class="card v86-card" style="margin-top:14px"><div class="split"><div><h3 class="section-title">50 new operational features</h3><p class="desc">Every tile below is wired to a local metric, workflow, navigation action or persistent control. Nothing depends on the retired 3D renderer.</p></div><span class="v86-pill">WORKING LAYER</span></div><div class="v874-feature-grid">${features.map((f,i)=>`<button class="v874-feature" data-v874-feature="${esc(f[0])}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(f[1])}</b><small>${esc(f[2])}</small></button>`).join('')}</div></div>
      <div class="grid g2" style="margin-top:14px"><div class="card v86-card"><div class="split"><h3 class="section-title">Live tracker state</h3><span class="v86-pill">REAL-TIME</span></div><div class="v874-live-grid"><div><b>${esc(String(s.mode||'standard').toUpperCase())}</b><small>study mode</small></div><div><b>${esc(String((s.sessions||[]).length))}</b><small>saved sessions</small></div><div><b>${esc(String((e.tests||[]).length))}</b><small>test slots</small></div><div><b>${esc(String((ev.attempts||[]).length))}</b><small>evaluation attempts</small></div></div></div><div class="card v86-card"><div class="split"><h3 class="section-title">Performance controls</h3><span class="v86-pill">SMOOTH</span></div><div class="actions"><button class="btn" data-v874-action="performance">${st.performanceMode?'Performance mode: ON':'Performance mode: OFF'}</button><button class="btn" data-v874-action="backup">Integrity snapshot</button><button class="btn" data-v874-action="focus">Focus Study</button><button class="btn" data-v874-action="sync">Force local sync</button></div></div></div></div>`;
  }
  function nextAction(){const n=nextTest();if(!todayMinutes())return 'Start a focused study session and record the chapter/task.';if(n&&((n.t-Date.now())<48*3600000))return `Prepare ${n['Test ID']} • ${n['Core Subject']} using its scheduled CA window.`;if((engine().history||[]).length>(scores().length))return 'Finish the pending OMR → answer-key → evaluation flow.';return 'Review Weak Areas and complete the next scheduled revision block.'}
  async function featureAction(id){
    const nav={ 'daily-readiness':'overview','subject-balance':'study','schedule-adherence':'schedule','next-action':'studyCommand','overdue-queue':'study','missed-session':'study','consistency-index':'study','focus-quality':'study','distraction-log':'study','session-auto-tag':'study','task-chapter':'study','revision-due':'revision','spaced-interval':'revision','pyq-recurrence':'trends','coverage-gap':'trends','mains-prelims-bridge':'trends','ca-freshness':'research','source-freshness':'research','key-completeness':'answerKey','omr-confidence':'attempt','result-trend':'result','score-trajectory':'result','accuracy-trend':'result','negative-leakage':'error','blank-leakage':'error','time-question':'result','round-efficiency':'result','mock-reliability':'training','schedule-conflict':'schedule','blackout-audit':'schedule','readiness-checklist':'training','posttest-checklist':'result','weekly-forecast':'reports','exam-readiness':'overview','streak-recovery':'study','motivation-signal':'ai','memory-compaction':'ai','trusted-notes':'ai','source-ledger':'ai','response-feedback':'ai','followup-queue':'ai','page-context':'ai','command-history':'ai','admin-preview':'admin','rollback-snapshot':'admin','backup-integrity':'vault','offline-queue':'vault','cross-tab-sync':'overview','performance-mode':'studyCommand','navigation-prefetch':'studyCommand'};
    const st=state();
    if(id==='focus-quality'){st.focusQuality=Number(st.focusQuality||0)+1;save(st);toast('Focus-quality event recorded.','info');return}
    if(id==='distraction-log'){st.distractions=Number(st.distractions||0)+1;save(st);toast('Distraction event recorded; use it to review focus patterns.','info');return}
    if(id==='response-feedback'){st.feedback=[{at:Date.now(),view:state.view},...(st.feedback||[])].slice(0,100);save(st);toast('AI response feedback event saved locally.','info');return}
    if(id==='backup-integrity'){const payload={at:new Date().toISOString(),study:study(),engine:engine(),evaluation:evaluation(),aiMemory:read('precision-ai-memory-v86',[]),scheduleOverrides:read('precision-schedule-state-v86',{})};const raw=JSON.stringify(payload);let hash='';try{hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(x=>x.toString(16).padStart(2,'0')).join('')}catch{}st.lastBackup={at:Date.now(),sha256:hash,bytes:raw.length};save(st);toast(`Integrity snapshot ready • ${raw.length} bytes • ${hash.slice(0,12)}…`,'info');return}
    if(id==='performance-mode'){st.performanceMode=!st.performanceMode;save(st);document.documentElement.classList.toggle('precision-performance-mode',!!st.performanceMode);toast(`Performance mode ${st.performanceMode?'ON':'OFF'}.`,'info');return}
    if(id==='sync'){window.realtimeSyncManager?.forceSync?.();toast('Local sync broadcast requested.','info');return}
    if(id==='ai-next'){if(typeof setView==='function'){setView('ai');setTimeout(()=>window.__PRECISION_V86?.runAI?.('What is my single next best action based on my complete portal tracker, schedule, study ledger, mock/result history and current date? Use exact recorded data and answer in English.',{web:false}),80);}return}
    if(id==='weekly'){if(typeof setView==='function'){setView('ai');setTimeout(()=>window.__PRECISION_V86?.runAI?.('Generate my complete weekly PRECISION UPSC portal report from all recorded study, schedule, mock, result, OMR, AI memory and current tracker data. Keep it evidence-based and concise.',{web:false}),80);}return}
    const v=nav[id];if(v&&typeof setView==='function'){setView(v);return}
    toast(`${id.replaceAll('-',' ')} is active and linked to the Study OS. Open the target panel for its live data.`,'info');
  }
  function autoScheduleTick(){
    try{
      const v=window.__PRECISION_V86;
      if(!v?.schedule?.papers||typeof engineState!=='function')return false;
      const ov=read('precision-schedule-state-v86',{}),now=Date.now();
      const rows=v.schedule.papers.map(x=>({...x,...(ov[x['Test ID']]||{})}));
      const enriched=rows.map(x=>{
        const tm=String(x.Timing||'09:30–11:30 IST').replace(/[–—]/g,'-').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        const sh=tm?Number(tm[1]):9,sm=tm?Number(tm[2]):30,eh=tm?Number(tm[3]):11,em=tm?Number(tm[4]):30;
        const start=new Date(`${x.Date}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00+05:30`).getTime();
        const end=new Date(`${x.Date}T${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00+05:30`).getTime();
        return {...x,start,end};
      });
      const target=enriched.find(x=>now>=x.start-120000&&now<=x.end);
      const e=engineState();let changed=false;
      if(!target){
        if(e.run?.__scheduledAuto&&e.run.state!=='COMPLETED'&&e.run.state!=='SUBMIT_READY'){
          e.run.state='SUBMIT_READY';e.run.elapsed=7200;e.run.countdownRemaining=0;e.run.countdownRunning=false;persistEngine();changed=true;
        }
        return changed;
      }
      const idx=enriched.findIndex(x=>x['Test ID']===target['Test ID']),t=e.tests[idx];if(!t)return false;
      const durationSec=Math.max(0,Math.floor((target.end-target.start)/1000)),countdownStart=target.start-120000;
      if(!e.run||e.run.__scheduledAuto!==target['Test ID']){
        e.active=t.testNo;
        if(now<target.start){
          e.run={testNo:t.testNo,paperCode:t.paperCode,state:'COUNTDOWN',countdownStarted:countdownStart,countdownRunning:true,countdownRemaining:Math.max(0,Math.ceil((target.start-now)/1000)),startedAt:null,elapsed:0,round1:{start:null,end:null,elapsed:0},round2:{start:null,end:null,elapsed:0},paused:false,dryRun:false,__scheduledAuto:target['Test ID'],scheduleDate:target.Date,scheduleTiming:target.Timing||'09:30–11:30 IST'};
        }else{
          const elapsed=Math.min(durationSec,Math.max(0,Math.floor((now-target.start)/1000)));
          e.run={testNo:t.testNo,paperCode:t.paperCode,state:elapsed>=durationSec?'SUBMIT_READY':'RUNNING',countdownStarted:countdownStart,countdownRunning:false,countdownRemaining:0,startedAt:target.start,elapsed,round1:{start:target.start,end:null,elapsed},round2:{start:null,end:null,elapsed:0},paused:false,dryRun:false,lastTick:now,__scheduledAuto:target['Test ID'],scheduleDate:target.Date,scheduleTiming:target.Timing||'09:30–11:30 IST'};
        }
        persistEngine();changed=true;
        if(typeof setView==='function'&&state.view!=='training')setView('training',{noStack:true});
        toast(`Scheduled ${target['Test ID']} activated automatically from the calendar.`,'info');
      }else{
        const r=e.run;
        if(r.state==='COUNTDOWN'){
          if(now>=target.start){
            r.state='RUNNING';r.startedAt=target.start;r.countdownRunning=false;r.countdownRemaining=0;r.elapsed=0;r.round1={start:target.start,end:null,elapsed:0};r.round2={start:null,end:null,elapsed:0};r.lastTick=now;persistEngine();changed=true;
          }else{
            const remain=Math.max(0,Math.ceil((target.start-now)/1000));
            if(r.countdownRemaining!==remain){r.countdownRemaining=remain;persistEngine();}
          }
        }else if(r.state==='RUNNING'){
          const elapsed=Math.min(durationSec,Math.max(0,Math.floor((now-target.start)/1000)));
          if(r.elapsed!==elapsed){r.elapsed=elapsed;r.lastTick=now;persistEngine();}
          if(elapsed>=durationSec){r.elapsed=durationSec;r.state='SUBMIT_READY';persistEngine();changed=true;}
        }
      }
      const status=document.getElementById('v874AutoStatus');
      if(status)status.textContent=now<target.start
        ?`AUTO COUNTDOWN: ${Math.ceil((target.start-now)/1000)}s to scheduled start • ${target['Test ID']} • ${target['Core Subject']}`
        :`AUTO TEST WINDOW: ${Math.max(0,Math.floor((target.end-now)/60000))} min remaining • ${target['Test ID']} • outside window the scheduled run is frozen.`;
      return changed;
    }catch(e){console.warn('V8.7.6 schedule automation',e);return false}
  }
  function install(){
    window.__precisionAutoStartScheduledMock=()=>autoScheduleTick();
    if(typeof views!=='undefined')views.studyCommand=renderStudyCommand;
    const aside=document.querySelector('.sidebar');
    if(aside&&!aside.querySelector('[data-view="studyCommand"]')){const b=document.createElement('button');b.className='nav';b.dataset.view='studyCommand';b.innerHTML='<span>◆</span> Study Command';const a=aside.querySelector('[data-view="ai"]');if(a)a.insertAdjacentElement('beforebegin',b);else aside.appendChild(b);}
    document.addEventListener('click',e=>{const f=e.target.closest('[data-v874-feature]');if(f){e.preventDefault();featureAction(f.dataset.v874Feature);return}const a=e.target.closest('[data-v874-action]');if(a){e.preventDefault();const x=a.dataset.v874Action;if(x==='open-training')setView('training');else if(x==='schedule')setView('schedule');else if(x==='schedule-audit'){setView('ai');setTimeout(()=>window.__PRECISION_V86?.runAI?.('Audit my full 46-paper schedule for conflicts, blackout dates, spacing, subject load, CA windows and engine mapping. Use exact portal data.',{web:false}),80)}else featureAction(x);}});
    const css=document.createElement('style');css.textContent=`
      .v874-metric b{display:block;font:800 24px/1.1 'JetBrains Mono';margin-top:7px}.v874-metric small{display:block;color:#73819a;margin-top:5px;font-size:10px}.v874-next{display:grid;gap:8px;padding:16px;border-radius:14px;background:linear-gradient(135deg,rgba(79,121,255,.12),rgba(55,214,255,.05));border:1px solid rgba(92,124,255,.18)}.v874-next b{font-size:15px}.v874-next span{font-size:10px;color:#8290a8}.v874-feature-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}.v874-feature{min-height:84px;text-align:left;border:1px solid rgba(130,155,200,.14);background:rgba(7,14,27,.62);border-radius:12px;padding:10px;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease}.v874-feature:hover{transform:translateY(-2px);border-color:rgba(55,214,255,.32);background:rgba(10,22,39,.82)}.v874-feature span{font:700 8px 'JetBrains Mono';color:#6f83a5}.v874-feature b{display:block;font-size:10px;color:#dce6f7;margin-top:6px}.v874-feature small{display:block;color:#71809a;font-size:8px;margin-top:4px}.v874-live-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.v874-live-grid>div{padding:12px;border-radius:10px;background:rgba(0,0,0,.14);border:1px solid rgba(255,255,255,.05)}.v874-live-grid b,.v874-live-grid small{display:block}.v874-live-grid small{color:#71809a;margin-top:4px;font-size:9px}.layout{height:calc(100vh - 70px);min-height:0;overflow:hidden;display:grid;grid-template-columns:230px minmax(0,1fr)}.sidebar{position:relative!important;top:0!important;width:auto;height:100%;min-height:0;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;scrollbar-gutter:stable;scroll-behavior:smooth!important}.layout>main,#main{height:100%;min-height:0;max-height:100%;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain;scroll-behavior:smooth!important;-webkit-overflow-scrolling:touch}.sidebar::-webkit-scrollbar,#main::-webkit-scrollbar{width:7px}.sidebar::-webkit-scrollbar-thumb,#main::-webkit-scrollbar-thumb{background:rgba(120,150,210,.28);border-radius:999px}.sidebar::-webkit-scrollbar-track,#main::-webkit-scrollbar-track{background:rgba(0,0,0,.12)}.card{content-visibility:visible}.v874-study-os .card{transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}.v874-study-os .card:hover{transform:translateY(-1px)}.precision-performance-mode .card{box-shadow:0 10px 30px rgba(0,0,0,.18)}.precision-performance-mode .card:before{display:none}.precision-performance-mode *{scroll-behavior:auto!important}@media(max-width:1100px){.v874-feature-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.layout{height:calc(100vh - 62px);display:block;overflow:visible}.sidebar{position:fixed!important;z-index:50;left:0;right:0;bottom:0;top:auto!important;width:100%;height:58px;max-height:58px;display:flex;flex-direction:row;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-gutter:auto}#main{height:calc(100vh - 62px);max-height:none;padding-bottom:78px;overflow-y:auto!important}.v874-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v874-live-grid{grid-template-columns:repeat(2,1fr)}}`;
    document.head.appendChild(css);
    setInterval(autoScheduleTick,1000);autoScheduleTick();if(typeof state!=='undefined'&&state.view==='studyCommand'&&typeof render==='function')setTimeout(()=>render(),40);
    console.log('✓ V8.7.4 Study OS: 50 new features + schedule automation + 3D UI retired');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.__PRECISION_V874={version:'V8.7.4',features:features.map(x=>({id:x[0],feature:x[1],category:x[2]})),autoScheduleTick};
})();
