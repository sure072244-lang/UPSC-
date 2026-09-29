export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({ok:true,service:'precision-v8.6',aiConfigured:!!process.env.MISTRAL_API_KEY,model:process.env.MISTRAL_MODEL||'mistral-small-2603',syncConfigured:!!process.env.PORTAL_SYNC_ENDPOINT});
}
