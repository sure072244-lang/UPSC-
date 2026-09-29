const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=__dirname+'/..';
let now=Date.now();
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{},createElement:()=>({}),documentElement:{requestFullscreen:async()=>{},},fullscreenElement:null,exitFullscreen:async()=>{}};
const navigator={onLine:true,serviceWorker:{register:async()=>({})}};
const context={console,localStorage,navigator,document,URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},FileReader:function(){},Image:function(){},Blob:function(){},Date:class extends Date{static now(){return now}},setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,clearTimeout:()=>{},alert:()=>{},prompt:()=>null,window:null};
context.window=context;context.addEventListener=()=>{};vm.createContext(context);
let src=fs.readFileSync(root+'/app.js','utf8');
// Disable app boot render/live loops; retain all functions for direct behavioral tests.
src=src.replace(/setInterval\(\(\)=>\{const e=engineState\(\).*?\},1000\);/s,'');
src=src.replace(/setInterval\(\(\)=>\{finalHRecovery\(\);gUpdateLiveClock\(\);updateNetworkState\(\)},1000\);/s,'');
src=src.replace(/render\(\);if\('serviceWorker' in navigator\)navigator\.serviceWorker\.register\('\.\/sw\.js'\)\.catch\(\(\)=>\{\}\);/s,'');
src += `\nfunction __noopRender(){}; render=__noopRender; globalThis.__qa={state,scoreAttempt,startDday,beginCountdown,tickTimer,pauseTimer,startTimer,finishRound1,finishDday,engineState,evalState,gRunActions,gNavigate,gPrefs,saveGPrefs,gModules,saveModules,recordVersion,gVersions};\n`;
vm.runInContext(src,context,{filename:'app.js'});
const q=context.__qa;
assert.equal(q.scoreAttempt, q.scoreAttempt);
// Scoring: 2 correct, 1 wrong, 97 blank => 4 - 1/3 = 3.67
q.state.evaluation={tests:true,attempts:[],queue:[],answerKeys:{},manualAnswers:{},omr:{}};
q.state.evaluation.answerKeys[1]=Object.fromEntries(Array.from({length:100},(_,i)=>[i+1,'A']));
q.state.evaluation.manualAnswers[1]={1:'A',2:'B',3:'A'};
let r=q.scoreAttempt(1); assert.equal(r.correct,2);assert.equal(r.wrong,1);assert.equal(r.blank,97);assert.equal(r.score,3.67);
// 50-test engine and exact code
let e=q.engineState();assert.equal(e.tests.length,50);const t=e.tests[0];assert.equal(q.startDday(1,t.paperCode,true).ok,true);assert.equal(q.startDday(1,'BAD',true).ok,false);
// Countdown -> running -> pause -> resume; paused seconds must not inflate elapsed/round time.
q.beginCountdown(); now+=120000; q.tickTimer(); assert.equal(e.run.state,'RUNNING'); assert.equal(e.run.elapsed,0);
now+=10000; q.tickTimer(); assert.equal(e.run.elapsed,10);assert.equal(e.run.round1.elapsed,10);
q.pauseTimer(); now+=30000; q.startTimer(); now+=5000; q.tickTimer(); assert.equal(e.run.elapsed,15);assert.equal(e.run.round1.elapsed,15);
q.finishRound1(); assert.ok(e.run.round2.start); now+=7000; q.tickTimer(); assert.equal(e.run.round2.elapsed,7);q.finishDday();assert.equal(e.run.state,'COMPLETED');
// Navigation + controlled AI action
q.gNavigate('Study Command');assert.equal(q.state.view,'studyCommand');
let before=q.gModules().length;q.gRunActions({actions:[{action:'addModule',module:{title:'QA Module',kind:'note',content:'ok'}},{action:'navigate',value:'AI Command Center'}]});assert.equal(q.gModules().length,before+1);assert.equal(q.state.view,'ai');
// Training unlock defaults to open
assert.notEqual(q.gPrefs().trainingUnlocked,false);
console.log('PHASE H BEHAVIORAL QA: PASS');
console.log('score=',r.score,'tests=',e.tests.length,'timer=',e.run.elapsed,'round1=',e.run.round1.elapsed,'round2=',e.run.round2.elapsed,'modules=',q.gModules().length,'view=',q.state.view);
