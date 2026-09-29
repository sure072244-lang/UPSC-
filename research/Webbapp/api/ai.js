export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.MISTRAL_API_KEY;
  if(!key)return res.status(503).json({error:'MISTRAL_API_KEY is not configured for this Vercel deployment.'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const prompt=String(body.prompt||'').trim();
    if(!prompt)return res.status(400).json({error:'Prompt is required.'});
    const context=JSON.stringify(body.context||{}).slice(0,160000);
    const web=body.web===true;
    const system=[
      'You are the private AI agent for a personal UPSC CSE Prelims 2027 GS-I portal.',
      'Default response language: ENGLISH. Use Hindi or another language only when the user explicitly requests it.',
      'Be precise, concise and evidence-labelled. Never invent PYQs, answer keys, scores, study time, schedule facts, or user activity.',
      'Classify the user request internally as FACTUAL, DESCRIPTIVE/ANALYTICAL, PORTAL-OPERATIONS, or RESEARCH.',
      'For FACTUAL queries: answer with Definition/Answer, Key Facts, Prelims Keywords, and Current-Affairs Link only when relevant; do not add a full Mains answer unless the user asks for it.',
      'For DESCRIPTIVE/ANALYTICAL queries when the topic is in the supplied Mains syllabus data: add Demand, Intro, Core dimensions, examples/current linkage where relevant, and Conclusion/Way Forward, plus a brief Prelims takeaway.',
      'For PORTAL-OPERATIONS queries: use the local portal context first; report exact stored values, missing data, conflicts and next action.',
      'For RESEARCH/current-affairs queries: use web search when enabled, distinguish portal evidence from web evidence, and include source names/URLs when available.',
      'For performance or motivation: base statements only on recorded activity and give at most one concise motivation line when useful.',
      'Portal context follows. Treat its local records as authoritative for portal facts:\n'+context
    ].join('\n');
    const model=process.env.MISTRAL_MODEL||'mistral-small-2603';
    const cid=body.conversationId||null;
    const target=cid?`https://api.mistral.ai/v1/conversations/${encodeURIComponent(cid)}`:'https://api.mistral.ai/v1/conversations';
    const inputContent=`SYSTEM POLICY:\n${system}\n\nUSER REQUEST:\n${prompt}`;
    // Keep follow-ups on the same Mistral conversation, but never resend `tools` on append.
    // Web search is attached only when a new conversation is created.
    const payload={inputs:[{role:'user',content:inputContent}],stream:true,store:true,completion_args:{temperature:.2,max_tokens:3000}};
    if(!cid){
      payload.model=model;
      // Mistral built-in web_search belongs on the conversation start request.
      if(web)payload.tools=[{type:'web_search'}];
    }
    let r=await fetch(target,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!r.ok && !web && cid){
      // Retry a normal conversation append without changing conversation history shape.
      const txt=await r.text();
      return res.status(r.status).json({error:txt.slice(0,1200)});
    }
    if(!r.ok && !cid && !web){
      const fb={model,messages:[{role:'system',content:system},{role:'user',content:prompt}],stream:true,temperature:.2,max_tokens:2200};
      r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(fb)});
    }
    if(!r.ok){const txt=await r.text();return res.status(r.status).json({error:txt.slice(0,1200)});}
    res.statusCode=200;
    res.setHeader('Content-Type','text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('X-Accel-Buffering','no');
    const reader=r.body.getReader(),decoder=new TextDecoder();
    while(true){const {done,value}=await reader.read();if(done)break;res.write(decoder.decode(value,{stream:true}));}
    res.end();
  }catch(e){res.status(500).json({error:e.message||'AI proxy failed'});}
}
