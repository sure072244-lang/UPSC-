/* PRECISION V8.7.5 — Stability / UX / Schedule / AI integration patch
 * Additive patch. Preserves V8.7.4 data and workflows.
 */
(function(){
  'use strict';
  const VERSION='V8.7.6-STABILITY';
  const css=document.createElement('style');
  css.textContent=`
    /* Desktop: sidebar scrolls independently; center is the primary scroll surface. */
    .layout{height:calc(100vh - 70px)!important;min-height:0!important;overflow:hidden!important;display:grid!important;grid-template-columns:232px minmax(0,1fr)!important;contain:layout size!important}
    .sidebar{grid-column:1!important;position:relative!important;top:0!important;height:100%!important;max-height:none!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;scrollbar-width:thin!important;scrollbar-color:#3a5a86 transparent!important;-webkit-overflow-scrolling:touch!important}
    .sidebar::-webkit-scrollbar{display:block!important;width:6px!important}.sidebar::-webkit-scrollbar-thumb{background:#3a5a86!important;border-radius:999px!important}.sidebar{scrollbar-gutter:stable!important}
    body.v86-focus-view .sidebar{display:none!important}body.v86-focus-view .layout{grid-template-columns:1fr!important}
    .sidebar .nav{min-height:31px!important;height:31px!important;padding:5px 10px!important;margin:1px 8px!important;font-size:11px!important;line-height:1!important}
    .sidebar .nav span{font-size:11px!important;width:18px!important}
    .sidebar .nav-section{padding:9px 12px 5px!important;font-size:8px!important;letter-spacing:.14em!important}
    .sidebar-bottom{padding:8px 12px!important}
    .offline-strip{padding:5px 10px!important}
    .layout>main,#main{grid-column:2!important;height:100%!important;min-height:0!important;max-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scroll-behavior:auto!important;scrollbar-gutter:stable!important;will-change:scroll-position!important;scroll-padding-top:14px!important}
    body.v86-focus-view .layout>main,body.v86-focus-view #main{grid-column:1/-1!important}
    body{overflow:hidden!important;overscroll-behavior:none!important}
    /* Glass / depth without a heavy WebGL renderer. */
    body:before{content:"";position:fixed;inset:0;z-index:-2;pointer-events:none;background:radial-gradient(circle at 18% 18%,rgba(70,102,255,.16),transparent 30%),radial-gradient(circle at 82% 12%,rgba(30,205,190,.12),transparent 28%),radial-gradient(circle at 70% 85%,rgba(132,75,255,.10),transparent 32%),linear-gradient(135deg,#03060b,#07101d 48%,#03060b);}
    .v875-schedule-lock{border-left:3px solid #6d7cff!important;background:rgba(75,95,180,.08)!important}
    .v875-freeze{opacity:.72;filter:saturate(.75)}
    .v875-countdown{font:800 28px/1.1 'JetBrains Mono',monospace;letter-spacing:.02em}
    .v875-status{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;border:1px solid rgba(120,150,255,.2);font:700 9px 'JetBrains Mono',monospace}
    @media(max-width:700px){
      .layout{height:calc(100vh - 62px)!important;display:block!important;overflow:visible!important}
      .sidebar{position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;height:58px!important;max-height:58px!important;display:flex!important;flex-direction:row!important;overflow:hidden!important}
      .sidebar .nav{height:48px!important;min-width:76px!important;margin:5px 2px!important;padding:5px!important;font-size:9px!important}
      #main{height:calc(100vh - 62px)!important;max-height:none!important;padding-bottom:76px!important;overflow-y:auto!important}
    }
  `;
  document.head.appendChild(css);

  function toast(m,k='info'){window.toast?.(m,k)}
  function nowIST(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}))}
  function scheduleRows(){
    const base=window.__PRECISION_V86?.schedule?.papers||[];
    let ov={};try{ov=JSON.parse(localStorage.getItem('precision-schedule-state-v86')||'{}')}catch{}
    return base.map(x=>({...x,...(ov[x['Test ID']]||{})}));
  }
  function timing(row){
    const m=String(row?.Timing||'09:30–11:30 IST').replace(/[–—]/g,'-').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    return m?{sh:+m[1],sm:+m[2],eh:+m[3],em:+m[4]}:{sh:9,sm:30,eh:11,em:30};
  }
  function bounds(row){
    const t=timing(row),d=String(row.Date||'');
    return {start:new Date(`${d}T${String(t.sh).padStart(2,'0')}:${String(t.sm).padStart(2,'0')}:00+05:30`).getTime(),end:new Date(`${d}T${String(t.eh).padStart(2,'0')}:${String(t.em).padStart(2,'0')}:00+05:30`).getTime()};
  }
  function scheduleState(){
    const now=Date.now(),rows=scheduleRows();
    const enriched=rows.map(r=>({...r,...bounds(r)}));
    const current=enriched.find(r=>now>=r.start-120000&&now<=r.end);
    const next=enriched.filter(r=>r.start>now).sort((a,b)=>a.start-b.start)[0]||null;
    return {now,current,next};
  }

  function addScheduleStatus(){
    const st=scheduleState();
    const el=document.getElementById('v874AutoStatus');
    if(!el)return;
    if(st.current){
      const before=st.now<st.current.start;
      const sec=Math.max(0,Math.ceil((before?st.current.start-st.now:st.current.end-st.now)/1000));
      el.innerHTML=before
        ? `<strong class="v875-status">COUNTDOWN • ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</strong> ${st.current['Test ID']} • ${st.current['Core Subject']} • opens ${String(timing(st.current).sh).padStart(2,'0')}:${String(timing(st.current).sm).padStart(2,'0')} IST`
        : `<strong class="v875-status">TEST LIVE • ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</strong> ${st.current['Test ID']} • ${st.current['Core Subject']} • Mock Panel unlocked`;
    } else if(st.next){
      const sec=Math.max(0,Math.ceil((st.next.start-st.now)/1000));
      el.innerHTML=`<strong class="v875-status">FROZEN</strong> Next ${st.next['Test ID']} in ${Math.floor(sec/3600)}h ${Math.floor(sec%3600/60)}m • ${st.next.Date} • ${st.next['Core Subject']}`;
    } else {
      el.innerHTML='<strong class="v875-status">SCHEDULE COMPLETE</strong> No future scheduled paper in the imported calendar.';
    }
  }

  function installBackGuard(){
    if(window.__v875BackGuard)return;window.__v875BackGuard=true;
    window.addEventListener('popstate',()=>{try{if(typeof render==='function')render()}catch{}});
    document.addEventListener('keydown',e=>{if((e.altKey&&e.key==='ArrowLeft')||((e.metaKey||e.ctrlKey)&&e.key==='[')){const b=document.querySelector('[data-v86-action="nav-back"]');if(b){e.preventDefault();b.click()}}});
  }

  function patchFocusToolbar(){
    document.addEventListener('click',e=>{
      const f=e.target.closest?.('[data-v875-focus]');if(!f)return;
      const on=document.body.classList.toggle('v86-focus-view');
      try{localStorage.setItem('precision-ai-prefs-v86',JSON.stringify({...JSON.parse(localStorage.getItem('precision-ai-prefs-v86')||'{}'),focusMode:on}))}catch{}
      toast(on?'Focus view ON • sidebar hidden':'Focus view OFF • sidebar restored','info');
    });
  }

  function patchStartupGate(){
    // The V8.7.4 gate remains authoritative; this only makes the fallback visible immediately.
    const run=()=>{
      const overlay=document.getElementById('deviceLockOverlay');
      if(!overlay)return;
      const primary=overlay.querySelector('#secureGatePrimary');
      const fallback=overlay.querySelector('#secureGateFallback');
      if(fallback){fallback.hidden=false;fallback.style.display='block';fallback.textContent=fallback.textContent||'Use local password fallback';}
      if(primary){primary.setAttribute('aria-label',primary.textContent||'Passkey action');}
    };
    setTimeout(run,80);setTimeout(run,600);setTimeout(run,1800);
  }

  function addLiveScheduleCard(){
    const main=document.getElementById('main');if(!main||document.getElementById('v875LiveSchedule'))return;
    if(state?.view!=='training'&&state?.view!=='studyCommand'&&state?.view!=='overview')return;
    const st=scheduleState();
    const card=document.createElement('div');card.id='v875LiveSchedule';card.className='card v86-card v875-schedule-lock';
    const label=st.current?(st.now<st.current.start?'COUNTDOWN':'TEST LIVE'):'FROZEN';
    const row=st.current||st.next;
    card.innerHTML=`<div class="split"><div><div class="eyebrow">SCHEDULE → MOCK ENGINE</div><h3 class="section-title">${row?String(row['Test ID']):'No scheduled test'} • ${row?String(row['Core Subject']):'—'}</h3></div><span class="v875-status">${label}</span></div><div class="v875-countdown" id="v875LiveClock">—</div><div class="desc" id="v875LiveText">Schedule control active. Outside the scheduled window the mock panel is frozen.</div><div class="actions"><button class="btn primary" data-v874-action="open-training">Open Mock Panel</button><button class="btn" data-v874-action="schedule">Edit Schedule</button></div>`;
    main.prepend(card);
  }

  function tick(){
    addScheduleStatus();
    const st=scheduleState(),clock=document.getElementById('v875LiveClock'),text=document.getElementById('v875LiveText');
    if(clock){
      const r=st.current||st.next;
      if(r){const sec=Math.max(0,Math.ceil((st.current? (st.now<r.start?r.start-st.now:r.end-st.now):(r.start-st.now))/1000));clock.textContent=`${Math.floor(sec/3600)}:${String(Math.floor(sec%3600/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
    }
    if(text&&st.current)text.textContent=st.now<st.current.start?'2-minute pre-start countdown. Mock panel remains locked until the scheduled start.':'120-minute scheduled mock window is active. Autosave and engine timer remain linked.';
  }

  function install(){
    installBackGuard();patchFocusToolbar();patchStartupGate();
    if(!window.__v875Timer){window.__v875Timer=setInterval(tick,1000)}
    setTimeout(tick,250);
    const oldRender=window.render;
    if(oldRender&&!window.__v875RenderWrapped){window.__v875RenderWrapped=true;window.render=async function(){const r=await oldRender.apply(this,arguments);addLiveScheduleCard();tick();return r};setTimeout(()=>{addLiveScheduleCard();tick()},300)}
    window.__PRECISION_V875={version:VERSION,scheduleState};
    console.log('✓ V8.7.6 stability layer active: fixed sidebar + center scroll + singleton countdown + stable schedule cockpit');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
