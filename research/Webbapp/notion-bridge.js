(function(){
  const DEFAULT={databaseId:'1ece01bb-658c-4f2a-a383-98d771127eed',dataSourceId:'225ba3d0-b160-433d-9ce1-576820f7f2b3',pollMs:15000,autoSync:true};
  const key='precision-notion-config';
  const load=()=>{try{return {...DEFAULT,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...DEFAULT}}};
  const save=v=>{try{localStorage.setItem(key,JSON.stringify({...load(),...v}))}catch{}};
  async function call(action,body={},query={}){
    const qs=new URLSearchParams({action,...query}); const opts={headers:{'Content-Type':'application/json'}};
    if(body&&Object.keys(body).length){opts.method='POST';opts.body=JSON.stringify(body)}
    const r=await fetch('/api/notion?'+qs.toString(),opts); const j=await r.json().catch(()=>({error:'Invalid response'}));
    if(!r.ok||j.ok===false)throw new Error(j.error||`Notion API ${r.status}`); return j;
  }
  function toast(msg,kind='info'){if(window.showAIStatus)window.showAIStatus(msg,kind);else{let t=document.getElementById('notionToast');if(!t){t=document.createElement('div');t.id='notionToast';t.className='notion-toast';document.body.appendChild(t)}t.textContent=msg;t.dataset.kind=kind;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}}
  async function config(){const j=await call('config');save({databaseId:j.databaseId||DEFAULT.databaseId,dataSourceId:j.dataSourceId||DEFAULT.dataSourceId});return {...j,config:load()}}
  async function rows(extra={}){return call('rows',{}, {...extra,dataSourceId:load().dataSourceId})}
  async function page(id){return call('page',{}, {id})}
  async function update(id,properties){const j=await call('update',{id,properties});return j.page}
  async function toggle(id,completed){const j=await call('toggle',{id,completed});return j.page}
  async function create(properties){const j=await call('create',{properties});return j.page}
  async function archive(id,archived=true){return (await call('archive',{id,archived})).page}
  async function duplicate(id){return (await call('duplicate',{id})).page}
  async function comment(id,text){return call('comment',{id,text})}
  async function attach(id,file){
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Could not read image.'));r.onload=()=>resolve(String(r.result));r.readAsDataURL(file)});
    return call('attach',{id,filename:file.name,mime:file.type,base64:data});
  }
  async function bulkUpdate(ids,properties){return call('bulkUpdate',{ids,properties})}
  function aiContext(page,row){return JSON.stringify({source:'Notion CA Tracker Pro — Daily Log',databaseId:load().databaseId,dataSourceId:load().dataSourceId,page:page||null,row:row||null}).slice(0,120000)}
  window.NotionBridge={DEFAULT,load,save,config,rows,page,update,toggle,create,archive,duplicate,comment,attach,bulkUpdate,aiContext,toast};
})();
