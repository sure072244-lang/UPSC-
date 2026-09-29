const CACHE='precision-upsc-v8-7-6';
const CORE=['./','./index.html','./app.js','./v8-enhancements.js','./v86-intelligence.js','./v874-intelligence-upgrade.js','./v875-stability-upgrade.js','./boot-check.js','./styles.css','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./omr_template_page_1.svg','./omr_template_page_2.svg','./data/PORTAL_DATA_MANIFEST_PHASE_B.json','./data/pyq_1300_master_v4.csv','./data/core/pyq_master_integrated_2014_2026.csv','./data/analysis/year_analysis_2014_2026.csv','./data/research/post_2026_mock_ecosystem.csv','./data/research/post_2026_public_quiz_stream.csv','./data/core/source_registry_baseline.csv','./data/research/post_2026_research_registry.csv','./data/core/qa_gates_baseline.csv','./data/core/answer_qa_baseline.csv','./data/feature_registry_v7.csv','./data/feature_registry_v86.csv','./data/schedule_2027_v1.json','./data/mains_gs_trend_2013_2026.json','./data/system_manifest_v86.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(a=>c.add(a)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isDocument=e.request.mode==='navigate'||e.request.destination==='document';
  e.respondWith(
    caches.match(e.request).then(hit=>{
      if(hit&&!isDocument)return hit;
      return fetch(e.request).then(res=>{
        if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{})}
        return res;
      }).catch(()=>{
        if(isDocument)return caches.match('./index.html');
        return hit||new Response('',{status:504,statusText:'Offline'});
      });
    })
  );
});
