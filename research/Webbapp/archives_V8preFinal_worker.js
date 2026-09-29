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

async function ai(request, env) {
  if(!env.MISTRAL_API_KEY) return json({error:'MISTRAL_API_KEY is not bound on this deployment. Add it as a secret, then redeploy.'},503);
  let body={}; try{body=await request.json()}catch{return json({error:'Invalid JSON body.'},400)}
  const prompt=String(body.prompt||'').trim(); if(!prompt)return json({error:'Prompt is required.'},400);
  const context=body.context||{};
  const system=`You are the private AI agent for a personal UPSC study portal. You can analyze the supplied portal context and, when web search is enabled, use fresh web information. Do not invent PYQs, answer keys, marks or user activity. Distinguish local data from web data. Keep responses useful and action-oriented. Portal context: ${JSON.stringify(context).slice(0,14000)}`;
  const content=`SYSTEM INSTRUCTIONS:\n${system}\n\nUSER REQUEST:\n${prompt}`;
  const url='https://api.mistral.ai/v1/conversations';
  const cid=body.conversationId||null;
  const target=cid?`${url}/${encodeURIComponent(cid)}`:url;
  const payload={inputs:[{role:'user',content}],stream:true,completion_args:{temperature:0.2,max_tokens:2500}};
  if(!cid)payload.model='mistral-small-latest';
  if(body.web)payload.tools=[{type:'web_search'}];
  const r=await fetch(target,{method:'POST',headers:{Authorization:`Bearer ${env.MISTRAL_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
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

export default {async fetch(request,env){
  if(request.method==='OPTIONS')return new Response(null,{headers:CORS});
  const url=new URL(request.url);
  if(url.pathname==='/api/health')return json({ok:true,service:'precision-v8',ai:!!env.MISTRAL_API_KEY,sync:!!env.DB,model:'mistral-small-latest'});
  if(url.pathname==='/api/ai'&&request.method==='POST')return ai(request,env);
  if(url.pathname==='/api/sync'&&(request.method==='GET'||request.method==='POST'))return sync(request,env);
  return env.ASSETS.fetch(request);
}};
