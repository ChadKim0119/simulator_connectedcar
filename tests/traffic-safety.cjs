const fs=require('fs'),vm=require('vm'),assert=require('assert');const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
class V2{constructor(x=0,y=0){this.x=x;this.y=y}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y)}copy(v){this.x=v.x;this.y=v.y;return this}lerp(v,k){this.x+=(v.x-this.x)*k;this.y+=(v.y-this.y)*k;return this}}
function object(){return {position:{x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})},distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}},rotation:{y:0,z:0}}}
let seed=Number(process.env.TRAFFIC_SEED||42);const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const ctx={Math:math,THREE:{Vector2:V2},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,k)=>a+(b-a)*k,PROJECT:'ecare',phase:'drive',Map,addTag:()=>({}),removeTag(){},gasPuffs:[],emitColdGas(){}};vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('class Mover{'),src.indexOf('const LOOP='))+'\nthis.MoverClass=Mover;',ctx);
function mover(points,loop,s,speed,lane=2.1){const m=new ctx.MoverClass(object(),{points,loop,s,lane});m.speed=m.target=m.cruiseSpeed=speed;return m;}
ctx.carM=mover([[-30,30],[0,30],[0,0]],false,18,10);ctx.truckM=mover([[45,-30],[44,-30]],false,0,0,2.2);
vm.runInContext(src.slice(src.indexOf('function nextRoamPoint'),src.indexOf('const ringMat=')),ctx);ctx.startRoaming();
const ring=[[-30,-30],[0,-30],[30,-30],[30,0],[30,30],[0,30],[-30,30],[-30,0]],outer=[[-60,-60],[60,-60],[60,60],[-60,60]],stunt=[[-30,0],[0,0],[30,0],[30,30],[0,30],[-30,30]];
ctx.npcs=Array.from({length:7},(_,i)=>mover(i<2?ring:outer,true,i<2?i*120:(i-2)*96,i<2?6.5:9));
ctx.roadsters=[0,1].map(i=>{const m=mover(i?[...stunt].reverse():stunt,true,i?72:12,10,1.8);m.roadster={jets:Array.from({length:4},()=>({visible:false}))};m.jump=null;m.jumpCooldown=0;ctx.npcs.push(m);return m});
vm.runInContext(src.slice(src.indexOf('function roadsterTurn('),src.indexOf('function resetRoadsterEffects')),ctx);
vm.runInContext(src.slice(src.indexOf('function updateRoadsterEffects'),src.indexOf('function roadPoint')),ctx);
vm.runInContext(src.slice(src.indexOf('function roadPoint'),src.indexOf('/* ================= 3D tags')),ctx);
const npcRecent=ctx.npcs.map(()=>0),npcPrevious=ctx.npcs.map(m=>m.s);
let advanced=0,recentTravel=0,jumps=0,waiting=0,waitRun=0,maxWait=0,prev=ctx.carM.center();
for(let i=0;i<6000;i++){
 if(i===1200)ctx.carM.target=0;if(i===1500)ctx.carM.target=10;
 ctx.extendRoaming();ctx.updateRoadsterEffects(.05);ctx.carM.update(.05);ctx.truckM.update(.05);ctx.updateTraffic(.05);
 const all=ctx.allVehicles();for(let a=0;a<all.length;a++)for(let b=a+1;b<all.length;b++)assert(!ctx.bodiesOverlap(ctx.vehiclePose(all[a]),ctx.vehiclePose(all[b])),`overlap at frame ${i}: ${all[a].trafficId}/${all[b].trafficId}`);
 const now=ctx.carM.center();const moved=Math.hypot(now.x-prev.x,now.z-prev.z);advanced+=moved;if(i>=5000)recentTravel+=moved;prev=now;assert(Math.abs(now.x)<=30&&Math.abs(now.z)<=30,'hero left the park roads');
 waitRun=ctx.carM.target>.5&&ctx.carM.speed<.5?waitRun+.05:0;maxWait=Math.max(maxWait,waitRun);
 ctx.npcs.forEach((m,n)=>{if(i>=5000)npcRecent[n]+=Math.max(0,m.s-npcPrevious[n]);npcPrevious[n]=m.s;});
 jumps+=ctx.roadsters.filter(m=>m.jump).length;waiting+=ctx.npcs.filter(m=>m.speed<.1).length;
}
assert(advanced>200,`hero gridlocked after ${advanced} units`);assert(recentTravel>30,`late gridlock: only ${recentTravel} units in final 50 seconds`);assert(jumps>0);assert(waiting>0);assert(maxWait<15,`customer waited ${maxWait}s`);
assert(npcRecent.every(d=>d>10),`traffic gridlock in final 50 seconds: ${npcRecent}`);
// Ground-level overlap is blocked; a high car can pass, and landing is held until clear.
const a={x:0,z:0,y:0,yaw:0,length:3,width:1.5,height:3},b={...a,x:1};assert(ctx.bodiesOverlap(a,b));assert(!ctx.bodiesOverlap(a,{...b,y:5}));assert(!ctx.bodiesOverlap(a,{...b,x:12}));
console.log(`PASS: 5 minutes with 11 vehicles, no body overlaps, park bounds, stop/restart, yielding and jumps; hero travelled ${Math.round(advanced)} units; longest unplanned stop ${maxWait.toFixed(1)}s`);

// In the actual rescue flow the customer is stopped before dispatch, not roaming through the rescue destination.
vm.runInContext('junctionOwners.clear()',ctx);ctx.carM.setPath([[-10,0],[0,0],[10,0]],false);ctx.carM.s=10;ctx.carM.lane=4.4;ctx.carM.target=ctx.carM.speed=0;ctx.carM.place(true);
ctx.npcs.forEach((m,i)=>{m.s=i<2?i*120:i<7?(i-2)*96:i===7?12:72;m.jump=null;m.flightHeight=0;m.jumpCooldown=0;m.blockedTime=0;m.speed=m.target=m.cruiseSpeed;m.place(true)});
ctx.truckM.setPath([[45,-30],[30,-30],[30,0],[0,0]],false,8.5);ctx.truckM.lane=2.2;ctx.truckM.speed=0;ctx.truckM.target=11;ctx.truckM.place(true);ctx.phase='dispatch';let arrived=false;
for(let i=0;i<3000;i++){
 ctx.updateRoadsterEffects(.05);ctx.carM.update(.05);ctx.truckM.update(.05);ctx.updateTraffic(.05);
 const all=ctx.allVehicles();for(let a=0;a<all.length;a++)for(let b=a+1;b<all.length;b++)assert(!ctx.bodiesOverlap(ctx.vehiclePose(all[a]),ctx.vehiclePose(all[b])),`rescue overlap ${i}: ${all[a].trafficId}/${all[b].trafficId}`);
 if(ctx.truckM.remaining()<.001){arrived=true;ctx.phase='arrived';}
}
assert(arrived,'rescue truck must reach the stopped customer');console.log('PASS: separate rescue scenario reaches parked customer without overlaps');
