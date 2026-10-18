const fs=require('fs'),vm=require('vm'),assert=require('assert');const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}clone(){return new V(this.x,this.y,this.z)}add(b){this.x+=b.x;this.y+=b.y;this.z+=b.z;return this}multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this}addScaledVector(b,k){this.x+=b.x*k;this.y+=b.y*k;this.z+=b.z*k;return this}copy(b){Object.assign(this,b);return this}setY(y){this.y=y;return this}distanceTo(b){return Math.hypot(this.x-b.x,this.y-b.y,this.z-b.z)}dot(b){return this.x*b.x+this.y*b.y+this.z*b.z}}
const V3=(x,y,z)=>new V(x,y,z);
const ctx={V3,Math,PROJECT:'ecare',phase:'dispatch',S:{beacon:true,dealer:{top:V3(45,12,45)}},muted:false,T:1};vm.createContext(ctx);
vm.runInContext(src.slice(src.indexOf('function roadPoint'),src.indexOf('function vehicleSize')),ctx);
function mover(x,z,dx,dz,speed=9){return {s:0,lane:0,speed,active:true,obj:{position:V3(x,0,z)},at:s=>({x:x+dx*s,z:z+dz*s,hx:dx,hz:dz})}}
assert(ctx.shouldYield(mover(-15,0,1,0),mover(0,-12,0,1,10)));assert(!ctx.shouldYield(mover(70,0,1,0),mover(0,-12,0,1,10)));assert(!ctx.shouldYield(mover(-15,0,1,0),mover(0,-12,0,1,0)));assert(!ctx.shouldYield(mover(-15,22,1,0),mover(0,-12,0,-1,10)));
assert(!ctx.shouldYield(mover(10,0,1,0),mover(0,0,1,0)),'a leading car must not stop for a following car');
let created=0,stopped=0;ctx.AC={state:'running',currentTime:1,destination:{},createOscillator(){created++;return {frequency:{setTargetAtTime(){}},connect(){},start(){},stop(){stopped++},disconnect(){}}},createGain(){return {gain:{},connect(){},disconnect(){}}}};
vm.runInContext(src.slice(src.indexOf('let rescueSiren=null;'),src.indexOf("$('#btnSound').addEventListener")),ctx);
for(let i=0;i<200;i++)ctx.updateRescueSiren();assert.equal(created,1);ctx.phase='arrived';ctx.updateRescueSiren();assert.equal(stopped,1);ctx.phase='dispatch';ctx.muted=true;ctx.updateRescueSiren();assert.equal(created,1);ctx.muted=false;ctx.updateRescueSiren();assert.equal(created,2);ctx.S.beacon=false;ctx.updateRescueSiren();assert.equal(stopped,2);
ctx.view={yaw:Math.PI/4,pitch:.6};ctx.CP={open:true};ctx.scenario='severe';ctx.CENTER={top:V3(-45,44,-45)};ctx.carTop=()=>V3(30,3,30);ctx.cam={position:V3(),lookAt(t){this.target=t.clone()},updateProjectionMatrix(){},updateMatrixWorld(){}};ctx.stage={getBoundingClientRect:()=>({left:0,right:ctx.W,top:0,bottom:ctx.H})};let paneW=0;ctx.$=()=>({classList:{contains:()=>false},getBoundingClientRect:()=>({left:0,right:paneW,top:0,bottom:ctx.H})});
vm.runInContext(src.slice(src.indexOf('function fitConversation'),src.indexOf('const obstructionRay')),ctx);
for(const [w,h,p] of [[1400,800,380],[730,500,380],[390,500,380],[600,900,0]]){ctx.W=w;ctx.H=h;paneW=p;ctx.fitConversation();assert(Number.isFinite(ctx.cam.right)&&ctx.cam.right>0);const r=V3(Math.cos(ctx.view.yaw),0,-Math.sin(ctx.view.yaw)),u=V3(-Math.sin(.6)*Math.sin(Math.PI/4),Math.cos(.6),-Math.sin(.6)*Math.cos(Math.PI/4));for(const pt of [ctx.carTop(),ctx.CENTER.top]){const delta=pt.clone().addScaledVector(ctx.cam.target,-1);const x=w/2+delta.dot(r)/(ctx.cam.right*2)*w,y=h/2-delta.dot(u)/(ctx.cam.top*2)*h;assert(x>=0&&x<=w&&y>=0&&y<=h);if(p<w*.7)assert(x>p);}}
console.log('PASS: crossing traffic yields and resumes, stationary/distant traffic boundaries, continuous siren lifecycle/mute, call framing at four viewport sizes');
// A shared building material must remain unchanged when only one building blocks the car.
V.prototype.sub=function(b){return this.addScaledVector(b,-1)};V.prototype.length=function(){return Math.hypot(this.x,this.y,this.z)};V.prototype.normalize=function(){return this.multiplyScalar(1/(this.length()||1))};
let rayHits=[];ctx.THREE={Raycaster:class{set(){}intersectObjects(){return rayHits.map(object=>({object}))}}};
const material=()=>({color:{copy(){}},emissiveIntensity:1,opacity:1,clone(){return material()},dispose(){this.disposed=true}});
const shared=material(),wall={material:shared,userData:{},castShadow:true},roof={material:material(),userData:{},castShadow:true},other={material:shared,userData:{},castShadow:true};
ctx.cityBuildings=[[wall,roof],[other]];ctx.scene={updateMatrixWorld(){}};ctx.hero={g:{position:V3(0,0,0)}};ctx.S.status='severe';ctx.S.load=null;ctx.PROJECT='ecare';
vm.runInContext(src.slice(src.indexOf('const obstructionRay'),src.indexOf('const carPos=')),ctx);
rayHits=[wall];ctx.updateBuildingVisibility(.05);assert(wall.material!==shared);assert(roof.material.opacity<1);assert.equal(other.material,shared);assert.equal(shared.opacity,1);
rayHits=[];for(let i=0;i<30;i++)ctx.updateBuildingVisibility(.05);assert.equal(wall.material,shared);assert.equal(wall.castShadow,true);
console.log('PASS: occluding building and roof fade together, shared materials stay intact, opacity/shadows restore');
