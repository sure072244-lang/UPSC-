import crypto from 'crypto';
let memory=new Map();
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex');const token=()=>crypto.randomBytes(24).toString('hex');
export default async function handler(req,res){
  // Vercel-compatible fallback for personal use. For durable online storage, deploy the bundled Cloudflare D1 sync endpoint.
  if(req.method==='GET'){const deviceId=String(req.query?.deviceId||''),tok=String(req.query?.token||'');const row=memory.get(deviceId);if(!row)return res.json({state:null});if(!tok||hash(tok)!==row.tokenHash)return res.status(401).json({error:'Unauthorized'});return res.json({state:row.state,updatedAt:row.updatedAt});}
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});const b=req.body||{},deviceId=String(b.deviceId||'');if(!deviceId)return res.status(400).json({error:'deviceId required'});let tok=String(b.token||''),row=memory.get(deviceId);if(row){if(!tok||hash(tok)!==row.tokenHash)return res.status(401).json({error:'Unauthorized'});}else tok=tok||token();row={tokenHash:hash(tok),state:b.state||{},updatedAt:Date.now()};memory.set(deviceId,row);return res.json({ok:true,token:tok,updatedAt:row.updatedAt,persistence:'process-memory; use Cloudflare D1 for durable sync'});
}
