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

function setup(kind,roadster,parallel=true){
 vm.runInContext('junctionOwners.clear()',ctx);
 ctx.phase=kind==='truck'?'dispatch':'drive';
 ctx.carM.active=kind!=='truck';ctx.truckM.active=kind==='truck';
 const priority=kind==='truck'?ctx.truckM:ctx.carM;
 priority.setPath([[-60,0],[60,0]],false);priority.s=parallel?22:38;priority.lane=2.1;priority.speed=0;priority.target=10;priority.place(true);
 const m=mover(parallel?[[-60,0],[60,0],[60,30],[-60,30]]:[[0,-60],[0,60],[30,60],[30,-60]],true,parallel?40:58,8);
 m.travelGuard=ctx.safeVehicleMove;m.trafficId=2;
 if(roadster){m.roadster={jets:Array.from({length:4},()=>({visible:false}))};m.jump=null;m.jumpCooldown=8;}
 ctx.npcs=[m];ctx.roadsters=roadster?[m]:[];
 return {priority,m};
}
for(const kind of ['car','truck'])for(const parallel of [true,false])for(const stunt of [false,true]){
 const {priority,m}=setup(kind,stunt,parallel);const start=m.s;let reversed=false,jumped=false,landed=false,maxStop=0,stop=0;
 assert(ctx.priorityConflict(m,priority),'reserve path while priority starts from rest');
 for(let i=0;i<600;i++){
  ctx.updateRoadsterEffects(.05);priority.update(.05);ctx.updateTraffic(.05);
  assert(!ctx.bodiesOverlap(ctx.vehiclePose(m),ctx.vehiclePose(priority)),`${kind}: collision`);
  reversed ||=m.s<start-.2;jumped ||=!!m.jump;landed ||=jumped&&!m.jump;
  stop=priority.speed<.5&&priority.remaining()>1?stop+.05:0;maxStop=Math.max(maxStop,stop);
  if(i===0&&stunt){assert(m.jump,'priority bypasses stunt cooldown');if(parallel)assert.equal(m.jump.direction,-1,'jump away instead of following');}
 }
 assert(priority.remaining()<.01,`${kind}: priority blocked (${priority.remaining()})`);
 assert(maxStop<3,`${kind}: priority waited ${maxStop}s`);
 if(stunt){assert(jumped&&landed,'evasion must complete and land');if(parallel)assert(reversed,'roadster must actually move backwards');}
 else assert(reversed,'ordinary traffic must retreat');
 console.log(`PASS: ${kind}, ${parallel?'same lane':'crossing'}, ${stunt?'roadster jumps and lands':'ordinary vehicle retreats'}, max wait ${maxStop.toFixed(2)}s`);
}

// A jump started for another car must also stop pacing an arriving priority vehicle.
for(const kind of ['car','truck']){
 const {priority,m}=setup(kind,true,true);m.jump={time:.4,gas:0,direction:1};m.flightHeight=4.5;m.obj.position.y=4.5;
 ctx.updateRoadsterEffects(.05);assert.equal(m.jump.direction,-1,'airborne roadster must change to rearward evasion');
 console.log(`PASS: ${kind}, already airborne roadster switches away from forward pursuit`);
}

// Two stopped cars cannot share one shoulder: the car nearest the customer
// must be able to choose the opposite edge instead of trapping all three.
{
 const {priority}=setup('car',false);priority.setPath([[60,30],[-60,30]],false);priority.s=41.275;priority.place(true);
 const a=mover([[60,30],[-60,30]],true,47.795,0,2.75),b=mover([[60,30],[-60,30]],true,49.6575,0,6.5);
 for(const [i,m] of [a,b].entries()){m.normalLane=2.1;m.lane=6.5;m.cruiseSpeed=6.5;m.trafficId=i+2;m.travelGuard=ctx.safeVehicleMove;}
 ctx.npcs=[a,b];ctx.roadsters=[];let switched=false;
 for(let i=0;i<400;i++){
  priority.update(.05);ctx.updateTraffic(.05);switched ||=a.yieldSide===-1;
  const all=ctx.allVehicles();for(let j=0;j<all.length;j++)for(let k=j+1;k<all.length;k++)assert(!ctx.bodiesOverlap(ctx.vehiclePose(all[j]),ctx.vehiclePose(all[k])),'crowded shoulder collision');
 }
 assert(a.s>60&&b.s>60,'yielding cars must resume after customer passes');
 assert(switched,'blocked shoulder must choose the opposite road edge');assert(priority.remaining()<.01,'customer must pass crowded shoulders');
 console.log('PASS: crowded shoulder uses the opposite edge, no overlap or customer gridlock');
}
