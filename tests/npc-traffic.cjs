// v0.3.0 NPC 교통 검사: 내 차 · 긴급출동 차량이 한 번도 막히지 않는지, 차체 겹침 · 옆 미끄러짐 · 교착이 없는지 확인
// 실행: node tests/npc-traffic.cjs   (TRAFFIC_SEED=7 처럼 다른 무작위 경로로도 검사)
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
class V2{constructor(x=0,y=0){this.x=x;this.y=y}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y)}copy(v){this.x=v.x;this.y=v.y;return this}lerp(v,k){this.x+=(v.x-this.x)*k;this.y+=(v.y-this.y)*k;return this}}
class Stub{constructor(){this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z},copy(){return this},addScaledVector(){return this},clone(){return {add(){return this}}}};this.rotation={x:0,y:0,z:0};this.scale={setScalar(){}};this.material={};}clone(){return new Stub()}updateMatrixWorld(){}localToWorld(v){return v}}
const THREE=new Proxy({Vector2:V2},{get:(t,k)=>t[k]||Stub});
let seed=Number(process.env.TRAFFIC_SEED||42);const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const car=()=>({g:new Stub()}),roadster=()=>({g:new Stub(),jets:[{visible:false}],sideJets:[]});
const ctx={Math:math,THREE,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,k)=>a+(b-a)*k,V3:(x=0,y=0,z=0)=>({x,y,z,set(a,b,c){this.x=a;this.y=b;this.z=c;return this},copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this},clone(){return {...this}},add(){return this},addScaledVector(){return this}}),
  PROJECT:'ecare',phase:'drive',ROAD:[-60,-30,0,30,60],DEPOT:{x:45,z:-30},glowTex:{},scene:{add(){}},addTag:()=>({}),removeTag(){},
  makeHeroCar:car,makeTruck:car,makeCybertruck:car,makePrius:car,makeRoadster:roadster};
vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('/* ================= movers ================= */'),src.indexOf('/* ================= 3D tags'))+'\nthis.api={pathFrom,carM,truckM,npcs,allVehicles,vehiclePose,bodiesOverlap,startRoaming,extendRoaming,updateTraffic,resetTraffic,corridorHit,buildCorridors,roadPath:typeof roadPath==="function"?roadPath:null};',ctx);
vm.runInContext(src.slice(src.indexOf('function snap(p)'),src.indexOf('/* ================= movers ================= */'))+'\nthis.api.roadPath=roadPath;',ctx);
const {pathFrom,carM,truckM,npcs,allVehicles,vehiclePose,bodiesOverlap,startRoaming,extendRoaming,updateTraffic,resetTraffic,roadPath}=ctx.api;
const DT=.05;
function frame(){extendRoaming();carM.update(DT);truckM.update(DT);updateTraffic(DT);}
const prevPos=new Map();let slide=0,overlaps=0,heroBlocked=0,truckBlocked=0;
function check(tag,i){
  const all=allVehicles();
  for(let a=0;a<all.length;a++)for(let b=a+1;b<all.length;b++)if(bodiesOverlap(vehiclePose(all[a]),vehiclePose(all[b]))){overlaps++;assert.fail(`${tag} overlap frame ${i}: ${all[a].kind||'priority'} / ${all[b].kind||'priority'}`);}
  if(carM.active&&carM.target>.2&&carM.blockedTime>0){heroBlocked++;assert.fail(`${tag}: customer car blocked at frame ${i}`);}
  if(truckM.target>.2&&truckM.blockedTime>0){truckBlocked++;assert.fail(`${tag}: rescue truck blocked at frame ${i}`);}
  for(const m of npcs){const p=m.obj.position,q=prevPos.get(m);
    if(q&&!m.jump){const dx=p.x-q.x,dz=p.z-q.z,move=Math.hypot(dx,dz),side=Math.abs(-dx*Math.sin(m.rot)-dz*Math.cos(m.rot));
      if(move>1e-4&&side>.12*move+.02){slide++;assert.fail(`${tag}: ${m.kind} slid sideways ${side.toFixed(3)} / ${move.toFixed(3)} at frame ${i}`);}}
    prevPos.set(m,{x:p.x,z:p.z});}
}
// 1) 8분 자유 주행 + 중간 정차/재출발
resetTraffic();startRoaming();carM.speed=carM.target=10;
const travelled=npcs.map(()=>0),last=npcs.map(m=>m.s);let heroDist=0,prev=carM.center(),jumps=0,evades=0,clears=0,runs=0;
for(let i=0;i<9600;i++){
  if(i===3000){carM.target=0;carM.lane=4.6;} if(i===3400){carM.lane=2.1;carM.target=10;}
  frame();check('roam',i);
  const now=carM.center();heroDist+=Math.hypot(now.x-prev.x,now.z-prev.z);prev=now;
  npcs.forEach((m,n)=>{if(i>=8400)travelled[n]+=Math.abs(m.s-last[n]);last[n]=m.s;if(m.jump&&m.jump.t<DT*1.01)(m.jump.mode==='show'?jumps++:evades++);if(m.mode==='clear')clears++;if(m.mode==='run')runs++;});
}
assert(heroDist>3500,`customer car only travelled ${heroDist}`);
assert(travelled.every(d=>d>40),`NPC gridlock in the final minute: ${travelled.map(Math.round)}`);
console.log(`PASS: 8분 자유 주행 — NPC 6대, 겹침 0 · 내 차 막힘 0 · 옆 미끄러짐 0, 내 차 ${Math.round(heroDist)} 이동, 회피(후진/양보 ${clears} 프레임, 앞으로 비켜 달림 ${runs} 프레임, 로드스터 수직 회피 ${evades}회 · 점프 ${jumps}회)`);
// 2) 긴급출동: 정차한 고객 차량으로 출동 → 견인 차량이 서비스센터로 (각 출발 위치 여러 곳)
let rescues=0;
for(const [cx,cz,ax] of [[-12,30,'h'],[0,-14,'v'],[18,0,'h'],[30,22,'v'],[-30,-8,'v']]){
  resetTraffic();prevPos.clear();carM.active=true;
  const path=ax==='h'?[[cx-10,cz],[cx,cz]]:[[cx,cz-10],[cx,cz]];carM.setPath(path,false);carM.s=10;carM.lane=4.6;carM.speed=carM.target=0;carM.place(true);
  for(let i=0;i<200;i++){frame();check('pre-rescue',i);}
  truckM.setPath(pathFrom(truckM,carM.center()),false,8.5);truckM.speed=0;truckM.target=13;truckM.place(true);ctx.phase='dispatch';
  let arrived=false;for(let i=0;i<4000&&!arrived;i++){frame();check(`dispatch@${cx},${cz}`,i);arrived=truckM.remaining()<.01;}
  assert(arrived,`truck must reach the customer at ${cx},${cz}`);
  carM.active=false;truckM.setPath(pathFrom(truckM,{x:-45,z:30}),false);truckM.speed=0;truckM.target=13;truckM.place(true);
  arrived=false;for(let i=0;i<4000&&!arrived;i++){frame();check(`tow@${cx},${cz}`,i);arrived=truckM.remaining()<.01;}
  assert(arrived,'tow must reach the dealer');rescues++;
  truckM.setPath([[45,-30],[44,-30]],false);truckM.target=truckM.speed=0;truckM.place(true);
}
console.log(`PASS: 긴급출동 · 견인 ${rescues}개 경로 — 출동/견인 차량 막힘 0, 차체 겹침 0`);
// 3) 정비 예약: 고객 차량이 주행 중 서비스센터로 경로 변경
for(const d of [{x:-45,z:30},{x:45,z:30},{x:-15,z:-60}]){
  resetTraffic();prevPos.clear();startRoaming();carM.active=true;carM.lane=2.1;carM.speed=carM.target=10;
  for(let i=0;i<400;i++){frame();check('pre-service',i);}
  carM.setPath(pathFrom(carM,d),false);carM.target=10;let arrived=false;
  for(let i=0;i<4000&&!arrived;i++){frame();check(`service→${d.x},${d.z}`,i);arrived=carM.remaining()<.01;}
  assert(arrived,'customer must reach the dealer');
}
console.log('PASS: 정비 예약 3개 딜러 경로 — 고객 차량 막힘 0, 차체 겹침 0');
