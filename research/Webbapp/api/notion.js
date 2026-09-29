const NOTION_VERSION = process.env.NOTION_VERSION || '2025-09-03';
const DEFAULT_DATABASE_ID = '1ece01bb-658c-4f2a-a383-98d771127eed';
const DEFAULT_DATA_SOURCE_ID = '225ba3d0-b160-433d-9ce1-576820f7f2b3';

function json(res, status, body){res.status(status).setHeader('Cache-Control','no-store');return res.json(body)}
function cleanId(v){return String(v||'').replace(/-/g,'').trim()}
function notionHeaders(){return {Authorization:`Bearer ${process.env.NOTION_TOKEN||''}`,'Notion-Version':NOTION_VERSION,'Content-Type':'application/json'}}
async function nfetch(path, opts={}){
  const token=process.env.NOTION_TOKEN;
  if(!token) throw new Error('NOTION_TOKEN is not configured on this Vercel deployment.');
  const r=await fetch('https://api.notion.com/v1'+path,{...opts,headers:{...notionHeaders(),...(opts.headers||{})}});
  const text=await r.text();let body={};try{body=text?JSON.parse(text):{}}catch{body={raw:text}}
  if(!r.ok){const e=new Error(body?.message||body?.error||`Notion API ${r.status}`);e.status=r.status;e.body=body;throw e}
  return body;
}
function plain(rt){return Array.isArray(rt)?rt.map(x=>x?.plain_text||x?.text?.content||'').join(''):''}
function propValue(p){
  if(!p)return null;
  switch(p.type){
    case 'title': return plain(p.title);
    case 'rich_text': return plain(p.rich_text);
    case 'select': return p.select?.name||null;
    case 'multi_select': return (p.multi_select||[]).map(x=>x.name);
    case 'checkbox': return !!p.checkbox;
    case 'date': return p.date?.start||null;
    case 'url': return p.url||null;
    case 'number': return p.number;
    case 'status': return p.status?.name||null;
    case 'files': return (p.files||[]).map(f=>({name:f.name||f.file?.url||f.external?.url||'attachment',url:f.file?.url||f.external?.url||null,type:f.type}));
    case 'relation': return (p.relation||[]).map(x=>x.id);
    case 'people': return (p.people||[]).map(x=>x.name||x.id);
    default:return null;
  }
}
function normalizePage(p){
  const props={}; for(const [k,v] of Object.entries(p.properties||{}))props[k]=propValue(v);
  const files=[];
  for(const [k,v] of Object.entries(p.properties||{})) if(v?.type==='files') for(const f of (v.files||[])) files.push({property:k,name:f.name,url:f.file?.url||f.external?.url||null,type:f.type});
  return {id:p.id,url:p.url,created_time:p.created_time,last_edited_time:p.last_edited_time,archived:!!p.archived,icon:p.icon||null,cover:p.cover||null,properties:props,files};
}
function valueProp(type,value){
  if(value===undefined||value===null||value==='') return null;
  if(type==='title') return {title:[{type:'text',text:{content:String(value)}}]};
  if(type==='rich_text'||type==='text') return {rich_text:[{type:'text',text:{content:String(value)}}]};
  if(type==='select'||type==='status') return { [type]: {name:String(value)} };
  if(type==='multi_select') return {[type]: (Array.isArray(value)?value:[value]).filter(Boolean).map(x=>({name:String(x)}))};
  if(type==='checkbox') return {checkbox:!!value};
  if(type==='date') return {date:{start:String(value)}};
  if(type==='url') return {url:String(value)};
  return null;
}
async function schema(){
  const ds=cleanId(process.env.NOTION_DATA_SOURCE_ID||DEFAULT_DATA_SOURCE_ID);
  return nfetch(`/data_sources/${ds}`);
}
async function queryRows(req){
  const ds=cleanId(req.query?.dataSourceId||process.env.NOTION_DATA_SOURCE_ID||DEFAULT_DATA_SOURCE_ID);
  const limit=Math.min(100,Math.max(1,Number(req.query?.pageSize||100)));
  const body={page_size:limit,sorts:[{property:'Date',direction:'descending'}]};
  if(req.query?.startCursor)body.start_cursor=req.query.startCursor;
  const d=await nfetch(`/data_sources/${ds}/query`,{method:'POST',body:JSON.stringify(body)});
  return {results:(d.results||[]).map(normalizePage),has_more:!!d.has_more,next_cursor:d.next_cursor||null,sourceId:ds};
}
async function pageDetails(id){
  const p=await nfetch(`/pages/${cleanId(id)}`);
  const b=await nfetch(`/blocks/${cleanId(id)}/children?page_size=100`);
  const blocks=b.results||[];
  return {page:normalizePage(p),blocks,has_more_blocks:!!b.has_more,next_block_cursor:b.next_cursor||null};
}
function apiPropertiesFromInput(properties){
  const out={};
  const known={
    'Article Title':'title','Completed':'checkbox','Date':'date','Best-Coaching-Source Link':'url','Ethics Issue-Example (Hindi)':'rich_text','Mains Answer Framework (Hindi)':'rich_text','Mains Question (Hindi)':'rich_text','PYQ Reference':'rich_text','Page No.':'rich_text','Philosophy Issue-Example (Hindi)':'rich_text','Quote (Hindi)':'rich_text','Source Link':'url','Sub-Topic':'rich_text','Topic':'select','Topic Tags':'multi_select','GS Paper':'select','Priority':'select','Relevance':'multi_select','Source':'select','Status':'select'
  };
  for(const [k,v] of Object.entries(properties||{})){const type=known[k];if(!type)continue;const pv=valueProp(type,v);if(pv)out[k]=pv}
  return out;
}
async function updatePage(id, properties){return normalizePage(await nfetch(`/pages/${cleanId(id)}`,{method:'PATCH',body:JSON.stringify({properties:apiPropertiesFromInput(properties)})}))}
async function createPage(properties){
  const ds=cleanId(process.env.NOTION_DATA_SOURCE_ID||DEFAULT_DATA_SOURCE_ID);
  const props=apiPropertiesFromInput(properties); if(!props['Article Title'])throw new Error('Article Title is required.');
  return normalizePage(await nfetch('/pages',{method:'POST',body:JSON.stringify({parent:{type:'data_source_id',data_source_id:ds},properties:props})}));
}
async function archivePage(id,archived=true){return normalizePage(await nfetch(`/pages/${cleanId(id)}`,{method:'PATCH',body:JSON.stringify({archived})}))}
async function duplicatePage(id){
  const p=await pageDetails(id);
  const props={}; for(const [k,v] of Object.entries(p.page.properties||{})) if(v!==null&&v!==''&&(!Array.isArray(v)||v.length)) props[k]=v;
  const created=await createPage(props);return created;
}
async function appendComment(id,text){return nfetch(`/comments`,{method:'POST',body:JSON.stringify({parent:{page_id:cleanId(id)},rich_text:[{type:'text',text:{content:String(text).slice(0,1900)}}]})})}
async function attachImage(id,filename,mime,base64){
  const raw=String(base64||'').replace(/^data:[^;]+;base64,/,'');
  const buf=Buffer.from(raw,'base64');
  if(buf.length>20*1024*1024)throw new Error('Image exceeds 20 MiB upload limit.');
  const up=await nfetch('/file_uploads',{method:'POST',body:JSON.stringify({filename:String(filename||'image').slice(0,180),content_type:mime||'image/jpeg'})});
  const uploadId=up.id||up.file_upload_id;if(!uploadId)throw new Error('Notion file upload creation failed.');
  const form=new FormData();form.append('file',new Blob([buf],{type:mime||'application/octet-stream'}),filename||'image');
  const send=await fetch(`https://api.notion.com/v1/file_uploads/${encodeURIComponent(uploadId)}/send`,{method:'POST',headers:{Authorization:`Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version':NOTION_VERSION},body:form});
  const stxt=await send.text();let sd={};try{sd=stxt?JSON.parse(stxt):{}}catch{}
  if(!send.ok)throw new Error(sd?.message||`Notion upload send ${send.status}`);
  const block={object:'block',type:'image',image:{type:'file_upload',file_upload:{id:uploadId}}};
  await nfetch(`/blocks/${cleanId(id)}/children`,{method:'PATCH',body:JSON.stringify({children:[block]})});
  return {uploadId,pageId:id,filename,blocksAdded:1};
}
export default async function handler(req,res){
  try{
    const action=String(req.query?.action|| (req.method==='POST'?req.body?.action:'config') || 'config');
    if(req.method==='GET'&&action==='config'){
      return json(res,200,{ok:true,connected:!!process.env.NOTION_TOKEN,databaseId:process.env.NOTION_DATABASE_ID||DEFAULT_DATABASE_ID,dataSourceId:process.env.NOTION_DATA_SOURCE_ID||DEFAULT_DATA_SOURCE_ID,notionVersion:NOTION_VERSION,workspaceLabel:'CA Tracker Pro — Daily Log'});
    }
    if(!process.env.NOTION_TOKEN)return json(res,503,{ok:false,error:'NOTION_TOKEN is not configured. Add it to Vercel Environment Variables.'});
    if(req.method==='GET'&&action==='schema') return json(res,200,{ok:true,schema:await schema()});
    if(req.method==='GET'&&action==='rows') return json(res,200,{ok:true,...await queryRows(req)});
    if(req.method==='GET'&&action==='page') return json(res,200,{ok:true,...await pageDetails(req.query?.id)});
    if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
    const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    if(action==='update')return json(res,200,{ok:true,page:await updatePage(b.id,b.properties||{})});
    if(action==='create')return json(res,200,{ok:true,page:await createPage(b.properties||{})});
    if(action==='toggle')return json(res,200,{ok:true,page:await updatePage(b.id,{'Completed':!!b.completed})});
    if(action==='archive')return json(res,200,{ok:true,page:await archivePage(b.id,b.archived!==false)});
    if(action==='duplicate')return json(res,200,{ok:true,page:await duplicatePage(b.id)});
    if(action==='comment')return json(res,200,{ok:true,comment:await appendComment(b.id,b.text||'')});
    if(action==='attach')return json(res,200,{ok:true,result:await attachImage(b.id,b.filename,b.mime,b.base64)});
    if(action==='bulkUpdate'){
      const ids=Array.isArray(b.ids)?b.ids.slice(0,100):[]; const out=[];
      for(const id of ids){try{out.push({id,ok:true,page:await updatePage(id,b.properties||{})})}catch(e){out.push({id,ok:false,error:e.message})}}
      return json(res,200,{ok:true,results:out});
    }
    return json(res,400,{ok:false,error:'Unknown action'});
  }catch(e){return json(res,e.status||500,{ok:false,error:e.message||'Notion integration failed',details:e.body||undefined})}
}
