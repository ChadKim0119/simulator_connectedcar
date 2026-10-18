const fs=require('fs'),vm=require('vm'),assert=require('assert');const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
class V2{constructor(x=0,y=0){this.x=x;this.y=y}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y)}copy(v){this.x=v.x;this.y=v.y;return this}lerp(v,k){this.x+=(v.x-this.x)*k;this.y+=(v.y-this.y)*k;return this}}
const ctx={Math,THREE:{Vector2:V2},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,k)=>a+(b-a)*k};vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('class Mover{'),src.indexOf('const LOOP='))+'\nthis.MoverClass=Mover;',ctx);
const obj={position:{set(x,y,z){Object.assign(this,{x,y,z})}},rotation:{}};ctx.carM=new ctx.MoverClass(obj,{points:[[-30,30],[0,30]],loop:false});
vm.runInContext(src.slice(src.indexOf('function nextRoamPoint'),src.indexOf('const ringMat=')),ctx);
let seed=7,random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),prev=[-30,30],cur=[0,30],central=0,turns=new Set();
for(let i=0;i<3000;i++){const p=ctx.nextRoamPoint(prev,cur,random);assert(Math.abs(p[0]-cur[0])+Math.abs(p[1]-cur[1])===30);assert(p.every(n=>n>=-30&&n<=30&&n%30===0));assert(p[0]!==prev[0]||p[1]!==prev[1]);if(p[0]===0||p[1]===0)central++;turns.add(p.join(','));prev=cur;cur=p;}
assert(central>600);assert(turns.size===9);
ctx.startRoaming();const car=ctx.carM;car.speed=car.target=10;
for(let i=0;i<1000;i++){car.s+=15;const before=car.at(car.s);ctx.extendRoaming();const after=car.at(car.s);assert(Math.hypot(before.x-after.x,before.z-after.z)<1e-6);assert(car.pts.length<20);assert(car.remaining()>=160);assert.equal(car.speed,10);}
car.setPath([[0,0],[30,0]],false);assert.equal(car.roaming,false);
vm.runInContext(src.slice(src.indexOf('function roadsterTurn('),src.indexOf('function resetRoadsterEffects')),ctx);
const m=(x,z,hx,hz,speed=10)=>({active:true,speed,s:0,obj:{position:{x,z}},at:()=>({hx,hz})});
const a=m(0,0,1,0),b=m(12,3.6,-1,0);assert(ctx.approaching(a,b));assert(!ctx.approaching(a,m(12,3.6,1,0)));assert(!ctx.approaching(a,m(-12,3.6,-1,0)));assert(!ctx.approaching(a,m(12,8,-1,0)));assert(!ctx.approaching(a,m(12,3.6,-1,0,0)));assert(ctx.approaching(a,m(8,-8,0,1)));assert(!ctx.approaching(a,m(8,8,0,1)));b.jump={};assert(!ctx.approaching(a,b));
console.log('PASS: 3000 road choices, central park roads, no U-turns, 1000 path extensions without teleport/unbounded growth, service route exit, head-on jump boundaries');
ctx.addTag=()=>({});ctx.removeTag=()=>{};ctx.canLand=()=>true;ctx.canChangeHeight=()=>true;let gasBursts=0;ctx.emitColdGas=()=>gasBursts++;ctx.gasPuffs=[];ctx.PROJECT='ecare';ctx.carM.active=false;
const route=[[-30,0],[0,0],[30,0],[30,30],[0,30],[-30,30]];
ctx.roadsters=[0,1].map(i=>{const object={position:{set(x,y,z){Object.assign(this,{x,y,z})}},rotation:{}};const v=new ctx.MoverClass(object,{points:i?[...route].reverse():route,loop:true,s:i?72:12,lane:1.8});v.speed=v.target=10;v.roadster={jets:Array.from({length:4},()=>({visible:false}))};v.jump=null;v.jumpCooldown=0;return v});ctx.npcs=ctx.roadsters;
vm.runInContext(src.slice(src.indexOf('function updateRoadsterEffects'),src.indexOf('function roadPoint')),ctx);
let peak=0,sawFlight=false,sawLanding=false;
for(let frame=0;frame<1200;frame++){for(const v of ctx.roadsters)v.update(1/60);ctx.updateRoadsterEffects(1/60);for(const v of ctx.roadsters){peak=Math.max(peak,v.obj.position.y);if(v.jump)sawFlight=true;if(sawFlight&&!v.jump&&v.obj.position.y===0)sawLanding=true;}}
assert(peak>6);assert(gasBursts>10);assert(sawFlight&&sawLanding);assert(ctx.roadsters.every(v=>Number.isFinite(v.obj.position.y)));
console.log('PASS: moving sports cars trigger cold gas, clear six metres, land, and respect cooldown');
// Exercise the real yielding loop together with the player's central-park route.
const distanceTo=function(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)};
ctx.carM.obj.position.distanceTo=distanceTo;ctx.carM.active=true;ctx.carM.lane=2.1;ctx.startRoaming();ctx.carM.speed=ctx.carM.target=10;ctx.hero={g:ctx.carM.obj};ctx.phase='drive';ctx.truckM=new ctx.MoverClass({position:{x:1000,y:0,z:1000,set(x,y,z){Object.assign(this,{x,y,z})}},rotation:{}},{points:[[990,990],[1000,990]],loop:false});ctx.truckM.active=false;
ctx.roadsters.forEach((v,i)=>{v.obj.position.distanceTo=distanceTo;v.s=i?72:12;v.speed=v.target=v.cruiseSpeed=10;v.jump=null;v.jumpCooldown=0;v.place(true)});gasBursts=0;
vm.runInContext(src.slice(src.indexOf('function roadPoint'),src.indexOf('/* ================= 3D tags')),ctx);
for(let frame=0;frame<360;frame++){ctx.extendRoaming();ctx.carM.update(1/60);ctx.updateTraffic(1/60);ctx.updateRoadsterEffects(1/60);}
assert(gasBursts>0,'yielding must not suppress every stunt when the hero approaches the parks');
console.log('PASS: player route + traffic yielding + gas jump work together in the same update loop');
const rotation=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})}}),person=()=>({rotation:rotation(),userData:{limbs:Array.from({length:4},()=>({rotation:rotation()}))}});
const baseball={type:'baseball',cx:-15,cz:15,dad:person(),son:person(),bat:{visible:false},glove:{visible:true},ball:{position:{set(x,y,z){Object.assign(this,{x,y,z})}}}};
ctx.parkActors=[baseball];ctx.ease=x=>x*x*(3-2*x);vm.runInContext(src.slice(src.indexOf('function animateParks'),src.indexOf('const BLK=')),ctx);
ctx.animateParks(5);assert(!baseball.bat.visible&&baseball.glove.visible);ctx.animateParks(20);assert(baseball.bat.visible&&!baseball.glove.visible);const x1=baseball.ball.position.x;ctx.animateParks(21);assert(baseball.ball.position.x!==x1);assert(Number.isFinite(baseball.son.rotation.y));ctx.animateParks(36);assert(!baseball.bat.visible&&baseball.glove.visible);assert.equal(baseball.son.userData.limbs[3].rotation.z,0);
console.log('PASS: catch/batting alternate, bat and glove switch, struck ball moves, swing resets');
const player=()=>({...person(),position:{set(x,y,z){Object.assign(this,{x,y,z})}}});const football={cx:15,cz:-15,kids:Array.from({length:6},player),ball:{position:{set(x,y,z){Object.assign(this,{x,y,z})}},rotation:{}}};
vm.runInContext(src.slice(src.indexOf('function animateFootball'),src.indexOf('function animateParks')),ctx);
let sawShot=false;for(let t=0;t<20;t+=.05){ctx.animateFootball(football,t);assert(Math.abs(football.ball.position.x-football.cx)<7.5);assert(Math.abs(football.ball.position.z-football.cz)<3);sawShot||=football.ball.position.x-football.cx>7;for(const kid of football.kids)assert(Math.abs(kid.position.x-football.cx)<=6&&Math.abs(kid.position.z-football.cz)<=4);}
assert(sawShot);console.log('PASS: football passing and shots, six players remain inside the pitch');
const turnCar=ctx.roadsters[0];turnCar.jump={time:.4,gas:0};turnCar.jumpCooldown=1;turnCar.rot=0;turnCar.at=()=>({hx:0,hz:1});turnCar.speed=10;turnCar.roadster.sideJets=[-1,1].flatMap(x=>[-1,1].map(side=>({visible:false,userData:{x,side}})));ctx.roadsters=[turnCar];ctx.npcs=[turnCar];ctx.carM.active=false;ctx.truckM.active=false;ctx.canLand=ctx.canChangeHeight=()=>true;let sideBursts=0;ctx.emitColdGas=(m,turn)=>{if(turn)sideBursts++;};
ctx.updateRoadsterEffects(.05);assert.equal(turnCar.roadster.sideJets.filter(j=>j.visible).length,2);assert(sideBursts>0);turnCar.rot=-Math.PI/2;ctx.updateRoadsterEffects(.05);assert(turnCar.roadster.sideJets.every(j=>!j.visible));turnCar.jump.time=1.64;ctx.updateRoadsterEffects(.05);assert.equal(turnCar.jump,null);assert(turnCar.roadster.sideJets.every(j=>!j.visible));console.log('PASS: opposite front/rear side jets fire during airborne turns and stop on straight flight/landing');
