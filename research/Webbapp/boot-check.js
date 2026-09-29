(function(){
  'use strict';
  window.__precisionBootDiag={startedAt:Date.now(),appLoaded:false,v8Loaded:false,ready:false};
  setTimeout(function(){
    try{
      window.__precisionBootDiag.appLoaded=!!window.__precisionAppLoaded;
      window.__precisionBootDiag.v8Loaded=!!window.__PRECISION_V8_ACTIVE;
      window.__precisionBootDiag.ready=!!window.__precisionBootDone;
      var main=document.getElementById('main'), splash=document.getElementById('v8BootSplash');
      if(window.__precisionBootDiag.ready) return;
      if(splash) splash.remove();
      if(main && !main.innerHTML.trim()) main.innerHTML='<div class="card locked" style="margin:24px"><h2>Startup recovery</h2><p class="desc">PRECISION could not finish startup. Your stored workspace has not been deleted.</p><button class="btn primary" onclick="location.reload()">Retry</button></div>';
    }catch(e){}
  },6500);
})();
