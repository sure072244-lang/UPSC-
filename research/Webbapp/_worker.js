const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...CORS}});
const hash = async (s) => {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
const token = () => crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-','');
const shareCode = () => crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();

async function ai(request, env) {
  if(!env.MISTRAL_API_KEY) return json({error:'MISTRAL_API_KEY is not bound on this deployment. Add it as a secret, then redeploy.'},503);
  let body={}; try{body=await request.json()}catch{return json({error:'Invalid JSON body.'},400)}
  const prompt=String(body.prompt||'').trim(); if(!prompt)return json({error:'Prompt is required.'},400);
  const context=body.context||{};
  const system=`You are the private AI agent for a personal UPSC study portal. Use the supplied portal context. When web research is enabled, use fresh sources. Never invent PYQs, answer keys, marks, schedules or user activity. Clearly distinguish local portal data, web evidence and your own reasoning. You may request safe portal actions only. At the very end, when the user explicitly asks you to navigate or modify the portal, append a single JSON block exactly like <PORTAL_ACTIONS>[{"action":"navigate","value":"study"}]</PORTAL_ACTIONS>. Allowed actions: navigate, select_mock, start_study, set_study_target, open_omr, open_result, save_note. Never emit JavaScript or arbitrary code. Portal context: ${JSON.stringify(context).slice(0,60000)}`;
  const content=`SYSTEM INSTRUCTIONS:\n${system}\n\nUSER REQUEST:\n${prompt}`;
  const model=env.MISTRAL_MODEL||'mistral-small-2603';
  const url='https://api.mistral.ai/v1/conversations';
  const cid=body.conversationId||null;
  const target=cid?`${url}/${encodeURIComponent(cid)}`:url;
  const payload={inputs:[{role:'user',content}],stream:true,completion_args:{temperature:0.2,max_tokens:1800}};
  if(!cid)payload.model=model;
  if(body.web)payload.tools=[{type:'web_search'}];
  let r=await fetch(target,{method:'POST',headers:{Authorization:`Bearer ${env.MISTRAL_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok && !body.web){
    const fb={model,stream:true,messages:[{role:'system',content:system},{role:'user',content:prompt}],temperature:0.2,max_tokens:1800};
    r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.MISTRAL_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(fb)});
  }
  if(!r.ok){let msg=`Mistral ${r.status}`;try{const j=await r.json();msg=j?.message||j?.detail||j?.error?.message||msg}catch{}return json({error:msg},r.status)}
  const headers=new Headers(CORS);headers.set('Content-Type','text/event-stream; charset=utf-8');headers.set('Cache-Control','no-cache, no-transform');headers.set('X-Accel-Buffering','no');return new Response(r.body,{status:r.status,headers});
}

async function sync(request, env){
  if(!env.DB)return json({error:'Cloud sync database is not bound. Local IndexedDB/LocalStorage remains active.'},503);
  if(request.method==='GET'){
    const u=new URL(request.url),deviceId=u.searchParams.get('deviceId'),tok=u.searchParams.get('token');
    if(!deviceId)return json({error:'deviceId required'},400);
    const row=await env.DB.prepare('SELECT token_hash,payload,updated_at FROM portal_state WHERE device_id=?').bind(deviceId).first();
    if(!row)return json({state:null});
    if(!tok || await hash(tok)!==row.token_hash)return json({error:'Unauthorized'},401);
    return json({state:JSON.parse(row.payload),updatedAt:row.updated_at});
  }
  let b={};try{b=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const deviceId=String(b.deviceId||'');if(!deviceId)return json({error:'deviceId required'},400);
  const existing=await env.DB.prepare('SELECT token_hash FROM portal_state WHERE device_id=?').bind(deviceId).first();
  let tok=String(b.token||'');
  if(existing){if(!tok || await hash(tok)!==existing.token_hash)return json({error:'Unauthorized'},401)}
  else {tok=tok||token()}
  const payload=JSON.stringify(b.state||{}),now=Date.now();
  await env.DB.prepare('INSERT INTO portal_state(device_id,token_hash,payload,updated_at) VALUES(?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(deviceId,await hash(tok),payload,now).run();
  return json({ok:true,token:tok,updatedAt:now});
}

async function saveKey(request,env){
  if(!env.DB)return json({error:'Cloud key vault database is not bound. Use local vault or bind D1.'},503);
  let b={};try{b=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const deviceId=String(b.deviceId||''),tok=String(b.token||''),testNo=Number(b.testNo),paperCode=String(b.paperCode||''),source=String(b.source||'personal');
  const key=b.key||{}; if(!deviceId||!tok||!testNo||!paperCode)return json({error:'deviceId, token, testNo and paperCode are required'},400);
  const owner=await env.DB.prepare('SELECT token_hash FROM portal_state WHERE device_id=?').bind(deviceId).first();
  if(!owner||await hash(tok)!==owner.token_hash)return json({error:'Unauthorized'},401);
  const normalized={};for(let i=1;i<=100;i++){const v=String(key[i]||key[String(i)]||'').toUpperCase();if(/^[ABCD]$/.test(v))normalized[i]=v}
  if(Object.keys(normalized).length!==100)return json({error:'Key must contain exactly 100 valid A/B/C/D answers.'},400);
  const existing=await env.DB.prepare('SELECT share_code FROM answer_keys WHERE device_id=? AND test_no=?').bind(deviceId,testNo).first();
  const code=existing?.share_code||shareCode(),now=Date.now();
  await env.DB.prepare('INSERT INTO answer_keys(device_id,test_no,paper_code,key_payload,source,version,share_code,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(device_id,test_no) DO UPDATE SET paper_code=excluded.paper_code,key_payload=excluded.key_payload,source=excluded.source,version=excluded.version,share_code=excluded.share_code,updated_at=excluded.updated_at').bind(deviceId,testNo,paperCode,JSON.stringify(normalized),source,now,code,now).run();
  return json({ok:true,shareCode:code,testNo,paperCode,updatedAt:now,source});
}

async function getKey(request,env){
  if(!env.DB)return json({error:'Cloud key vault database is not bound.'},503);
  const u=new URL(request.url),deviceId=u.searchParams.get('deviceId'),tok=u.searchParams.get('token'),testNo=Number(u.searchParams.get('testNo')||0),code=String(u.searchParams.get('shareCode')||'').trim().toUpperCase();
  let row;
  if(code){row=await env.DB.prepare('SELECT test_no,paper_code,key_payload,source,version,share_code,updated_at FROM answer_keys WHERE share_code=?').bind(code).first();}
  else {
    if(!deviceId||!tok||!testNo)return json({error:'Provide shareCode or deviceId+token+testNo.'},400);
    const owner=await env.DB.prepare('SELECT token_hash FROM portal_state WHERE device_id=?').bind(deviceId).first();if(!owner||await hash(tok)!==owner.token_hash)return json({error:'Unauthorized'},401);
    row=await env.DB.prepare('SELECT test_no,paper_code,key_payload,source,version,share_code,updated_at FROM answer_keys WHERE device_id=? AND test_no=?').bind(deviceId,testNo).first();
  }
  if(!row)return json({state:null});
  return json({ok:true,testNo:row.test_no,paperCode:row.paper_code,key:JSON.parse(row.key_payload),source:row.source,version:row.version,shareCode:row.share_code,updatedAt:row.updated_at});
}

export default {async fetch(request,env){
  if(request.method==='OPTIONS')return new Response(null,{headers:CORS});
  const url=new URL(request.url);
  if(url.pathname==='/api/health')return json({ok:true,service:'precision-v8',ai:!!env.MISTRAL_API_KEY,sync:!!env.DB,model:env.MISTRAL_MODEL||'mistral-small-2603',keyVault:!!env.DB});
  if(url.pathname==='/api/ai'&&request.method==='POST')return ai(request,env);
  if(url.pathname==='/api/sync'&&(request.method==='GET'||request.method==='POST'))return sync(request,env);
  if(url.pathname==='/api/key'&&request.method==='POST')return saveKey(request,env);
  if(url.pathname==='/api/key'&&request.method==='GET')return getKey(request,env);
  return env.ASSETS.fetch(request);
}};
