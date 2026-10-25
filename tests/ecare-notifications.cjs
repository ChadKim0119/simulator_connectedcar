const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf('async function distributeWarning('),html.indexOf('async function warnFlow('));
async function check(severe,cancel=false){
 const packets=[],events=[];const vep={id:'vep'},vdp={id:'vdp'},web={id:'web'},dms={id:'dms'};
 const ctx={token:1,NODE:{vep:{pos:vep},vdp:{pos:vdp}},CENTER:{top:web},PREF:{top:dms},carTop:()=>({id:'hu'}),phonePos:()=>({id:'app'}),
  diagStep(){},fNode(){},fEdge(){},flowSend(){},fCap:msg=>events.push(msg),addLog:msg=>events.push(msg),frameHop(){},mid:()=>()=>({}),
  packet:async(from,to)=>{packets.push([from.id,typeof to==='function'?to().id:to.id]);if(cancel)ctx.token=2;}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const result=await ctx.distributeWarning(1,severe);
 assert.deepStrictEqual(packets.slice(0,severe?3:2),severe?[['vep','vdp'],['vep','web'],['vep','dms']]:[['vep','vdp'],['vep','dms']]);
 assert(!packets.some(([from,to])=>from==='vep'&&['hu','app'].includes(to)),'customer delivery must never bypass VDP');
 if(cancel){assert.equal(result,false);assert(!packets.some(([from])=>from==='vdp'),'reset must stop customer delivery');}
 else {assert.equal(result,true);assert.deepStrictEqual(packets.slice(-2),[['vdp','hu'],['vdp','app']]);assert(events.some(s=>s.includes('VEP(TSP) → VDP(일본) → 고객 앱')));}
 console.log(`PASS: ${severe?'urgent':'maintenance'} ${cancel?'reset cancels customer hop':'VEP → VDP → HU/app, business systems direct'}`);
}
(async()=>{for(const severe of [true,false])for(const cancel of [false,true])await check(severe,cancel);})().catch(e=>{console.error(e);process.exitCode=1});
