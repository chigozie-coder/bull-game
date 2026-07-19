import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'https://static.poly.pizza/5b8416e8-a83f-4fed-bd72-2c8099dc7a97.glb.br';
const $ = s => document.querySelector(s);
const mount = $('#game'), loading = $('#loading'), startScreen = $('#startScreen');
const gameOver = $('#gameOver'), hud = $('#hud'), touch = $('#touchControls');
const scoreEl = $('#score'), bestEl = $('#best'), energyEl = $('#energyFill');
const flash = $('#flash'), loadFill = $('#loadFill');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xb7a477, .0125);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 500);
camera.position.set(0, 5.3, 11.5);
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace; mount.appendChild(renderer.domElement);

// A layered physical sky rather than a flat scene colour.
const skyMat = new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{top:{value:new THREE.Color(0x596f73)},mid:{value:new THREE.Color(0xd18a5b)},low:{value:new THREE.Color(0xf5c479)}},vertexShader:`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 v;uniform vec3 top;uniform vec3 mid;uniform vec3 low;void main(){float h=normalize(v).y;vec3 c=mix(low,mid,smoothstep(-.15,.25,h));c=mix(c,top,smoothstep(.22,.8,h));gl_FragColor=vec4(c,1.);}`});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(260,24,16),skyMat));
scene.add(new THREE.HemisphereLight(0xffe7b8,0x27351e,2.1));
const sun = new THREE.DirectionalLight(0xffd7a1,4.4); sun.position.set(-18,30,20); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-8; scene.add(sun);
const sunDisk = new THREE.Mesh(new THREE.SphereGeometry(4,20,12),new THREE.MeshBasicMaterial({color:0xffd292}));sunDisk.position.set(-55,30,-150);scene.add(sunDisk);

const world = new THREE.Group(); scene.add(world);
const moving = [], obstacles = [], pickups = [], dust = [];
const dirtMat = new THREE.MeshStandardMaterial({color:0x755137,roughness:1});
const grassMat = new THREE.MeshStandardMaterial({color:0x38462c,roughness:1});
const grass2Mat = new THREE.MeshStandardMaterial({color:0x53613a,roughness:.95});
const barkMat = new THREE.MeshStandardMaterial({color:0x3c2a1d,roughness:1});
const leafMats = [0x34462b,0x4d6135,0x627344].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.9}));
const stoneMat = new THREE.MeshStandardMaterial({color:0x77766d,roughness:.98});
const hayMat = new THREE.MeshStandardMaterial({color:0xaa7b34,roughness:1});
const neonMat = new THREE.MeshStandardMaterial({color:0xff4b19,emissive:0xff2600,emissiveIntensity:4,roughness:.25,metalness:.35});

function mesh(geo,mat,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;return m}
function seeded(n){return (Math.sin(n*127.1)*43758.5453)%1}

// Mountains and mesas on the horizon.
for(let i=0;i<24;i++){
  const h=12+Math.abs(seeded(i))*30,w=14+Math.abs(seeded(i+9))*25;
  const mountain=mesh(new THREE.ConeGeometry(w,h,5),new THREE.MeshStandardMaterial({color:i%2?0x545a45:0x6a674d,roughness:1}),[(i-12)*20,-3,-150-Math.abs(seeded(i+2))*70],[0,seeded(i+4),0],[1,1,.7]);
  mountain.receiveShadow=true;scene.add(mountain);
}

function makeTree(seed=1){
 const g=new THREE.Group(); const h=4.5+Math.abs(seeded(seed))*4;
 g.add(mesh(new THREE.CylinderGeometry(.24,.42,h,7),barkMat,[0,h/2,0],[0,0,seeded(seed+2)*.08]));
 const crown=new THREE.Group(); crown.position.y=h*.78;
 for(let i=0;i<5;i++){const r=1.3+Math.abs(seeded(seed+i+4))*.9; crown.add(mesh(new THREE.IcosahedronGeometry(r,1),leafMats[(seed+i)%leafMats.length],[(seeded(seed+i*3)-.5)*1.4,(seeded(seed+i*4+2)-.4)*1.2,(seeded(seed+i*5+3)-.5)*1.4],[0,seeded(seed+i),0],[1,1.15,1]));}
 g.add(crown); return g;
}
function makeRock(seed=1,big=false){
 const g=new THREE.Group();const count=big?5:2;
 for(let i=0;i<count;i++){const s=(big?.65:.38)+Math.abs(seeded(seed+i))*1.2;g.add(mesh(new THREE.DodecahedronGeometry(s,0),stoneMat,[(seeded(seed+i*2)-.5)*(big?2.2:.8),s*.45,(seeded(seed+i*4)-.5)*(big?1.2:.6)],[seeded(seed+i),seeded(seed+i+2),seeded(seed+i+5)],[1,.7+Math.abs(seeded(seed+i+8))*.6,1]));}return g;
}
function makeFence(){
 const g=new THREE.Group();[-1,1].forEach(x=>g.add(mesh(new THREE.CylinderGeometry(.12,.15,2.3,6),barkMat,[x,1,0],[0,0,.03*x])));[-.45,.55].forEach(y=>g.add(mesh(new THREE.CylinderGeometry(.09,.12,2.5,6),barkMat,[0,1+y,0],[0,0,Math.PI/2])));return g;
}
function makeRuin(seed){
 const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:0x8b8878,roughness:1});
 const h=5+Math.abs(seeded(seed))*6;g.add(mesh(new THREE.BoxGeometry(2.2,h,2.2),mat,[0,h/2,0],[0,seeded(seed)*.3,0]));
 for(let y=.8;y<h-1;y+=1.2)for(let x=-.65;x<=.65;x+=1.3)g.add(mesh(new THREE.BoxGeometry(.42,.6,.08),new THREE.MeshBasicMaterial({color:0x231d17}),[x,y,1.14]));return g;
}
function makeHay(){const g=new THREE.Group();for(let i=0;i<3;i++){const b=mesh(new THREE.CylinderGeometry(.58,.58,1.2,12),hayMat,[(i-1)*.9,.58,0],[Math.PI/2,0,0]);g.add(b);g.add(mesh(new THREE.TorusGeometry(.6,.035,5,16),barkMat,[(i-1)*.9,.58,.61]));}return g}
function makeLog(){const g=new THREE.Group();const log=mesh(new THREE.CylinderGeometry(.38,.46,3.2,10),barkMat,[0,.42,0],[0,0,Math.PI/2]);g.add(log);[-1.1,1.1].forEach(x=>g.add(mesh(new THREE.TorusGeometry(.39,.06,6,12),new THREE.MeshStandardMaterial({color:0x231711}),[x,.42,0],[0,Math.PI/2,0])));return g}

// Recycled physical ground slabs create continuous forward travel.
for(let i=0;i<8;i++){
 const z=-i*32+12;const group=new THREE.Group();group.position.z=z;
 group.add(mesh(new THREE.BoxGeometry(34,.45,32),grassMat,[0,-.35,0]));
 group.add(mesh(new THREE.BoxGeometry(9,.14,32),dirtMat,[0,-.08,0]));
 [-3,3].forEach(x=>group.add(mesh(new THREE.BoxGeometry(.18,.03,31),new THREE.MeshStandardMaterial({color:0x4f3828,roughness:1}),[x,.005,0])));
 // Grass tufts make the surface read as land, not a flat plane.
 for(let j=0;j<42;j++){const side=j%2?-1:1;const x=side*(5+Math.abs(seeded(i*80+j))*10);const tuft=new THREE.Group();for(let k=0;k<3;k++)tuft.add(mesh(new THREE.ConeGeometry(.035,.5+Math.abs(seeded(j+k))*.45,4),grass2Mat,[(k-1)*.11,.25,0],[0,0,(k-1)*.22]));tuft.position.set(x,0,(seeded(j*7+i)-.5)*30);group.add(tuft)}
 world.add(group);moving.push({o:group,type:'ground'});
}

// Dense, recognizable scenery on both sides of the run.
for(let i=0;i<54;i++){
 const side=i%2?-1:1;const obj=i%11===0?makeRuin(i):i%7===0?makeRock(i,true):i%9===0?makeFence():makeTree(i);
 obj.position.set(side*(7+Math.abs(seeded(i))*13),0,-10-i*5.2);obj.rotation.y=seeded(i+3)*.4;world.add(obj);moving.push({o:obj,type:'scenery'});
}

// Bull: a genuine GLB animal mesh, normalized automatically regardless of source scale.
const bullRig=new THREE.Group();bullRig.position.set(0,0,4);scene.add(bullRig);
const bullVisual=new THREE.Group();bullRig.add(bullVisual);
const aura=new THREE.Group();bullRig.add(aura);
const ringGeo=new THREE.TorusGeometry(1.25,.035,6,40);
for(let i=0;i<4;i++){const r=mesh(ringGeo,neonMat,[0,1.4,-.4-i*.25],[Math.PI/2,0,0],[1+i*.18,1+i*.18,1]);r.material=r.material.clone();r.material.opacity=0;r.material.transparent=true;aura.add(r)}
let bullReady=false,bullMesh=null,modelFacingFix=0;
loadFill.style.width='28%';
new GLTFLoader().load(MODEL_URL,gltf=>{
 bullMesh=gltf.scene;const initial=new THREE.Box3().setFromObject(bullMesh),size=initial.getSize(new THREE.Vector3());
 const height=Math.max(size.y,.001),scale=2.65/height;bullMesh.scale.setScalar(scale);
 // Align the longest animal axis with the direction of travel.
 if(size.x>size.z*1.15)modelFacingFix=Math.PI/2;bullMesh.rotation.y=modelFacingFix;
 const box=new THREE.Box3().setFromObject(bullMesh),center=box.getCenter(new THREE.Vector3());
 bullMesh.position.sub(center);bullMesh.position.y+=box.getSize(new THREE.Vector3()).y/2+.04;
 bullMesh.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;const old=o.material;o.material=new THREE.MeshStandardMaterial({color:0x080b09,roughness:.24,metalness:.72,emissive:0x0b241e,emissiveIntensity:.55,normalMap:old?.normalMap||null,map:old?.map||null});const edges=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,24),new THREE.LineBasicMaterial({color:0x25ffd7,transparent:true,opacity:.38}));o.add(edges)}});
 bullVisual.add(bullMesh);bullReady=true;loadFill.style.width='100%';setTimeout(()=>{loading.classList.add('hidden');startScreen.classList.remove('hidden')},450);
},xhr=>{if(xhr.total)loadFill.style.width=(28+xhr.loaded/xhr.total*65)+'%'},()=>{
 // Failure remains explicit: the game does not silently substitute geometry and pretend it is a bull.
 loading.querySelector('p').textContent='BULL MODEL COULD NOT LOAD';loadFill.style.background='#d33';
});

const shadow=mesh(new THREE.CircleGeometry(1.35,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}),[0,.015,4],[-Math.PI/2,0,0],[1,.55,1]);scene.add(shadow);

function spawnObstacle(z=-150){
 const lanes=[-3,0,3],lane=lanes[Math.floor(Math.random()*3)],kind=Math.floor(Math.random()*3);const g=kind===0?makeLog():kind===1?makeHay():makeRock(Math.random()*99,true);
 g.position.set(lane,0,z);g.userData={lane,kind,hit:false};world.add(g);obstacles.push(g);
}
for(let i=0;i<9;i++)spawnObstacle(-38-i*18-Math.random()*6);
function spawnPickup(z=-155){const g=new THREE.Group();g.add(mesh(new THREE.OctahedronGeometry(.48,0),neonMat,[0,1.25,0],[0,0,Math.PI/4]));const halo=mesh(new THREE.TorusGeometry(.72,.045,6,22),neonMat,[0,1.25,0]);g.add(halo);g.position.set([-3,0,3][Math.floor(Math.random()*3)],0,z);world.add(g);pickups.push(g)}
for(let i=0;i<8;i++)spawnPickup(-27-i*23);

const dustGeo=new THREE.SphereGeometry(.13,6,5),dustMat=new THREE.MeshBasicMaterial({color:0xc49a6c,transparent:true,opacity:.4,depthWrite:false});
for(let i=0;i<34;i++){const d=mesh(dustGeo,dustMat.clone(),[0,-10,0]);scene.add(d);dust.push({o:d,life:0,vel:new THREE.Vector3()})}
let dustCursor=0;function puff(power=1){for(let n=0;n<2;n++){const d=dust[dustCursor++%dust.length];d.life=1;d.o.position.set(bullRig.position.x+(Math.random()-.5)*1.1,.2,4.6+Math.random()*.6);d.o.scale.setScalar(.5+Math.random()*power);d.vel.set((Math.random()-.5)*.05,.025+Math.random()*.035,.08+Math.random()*.05);d.o.material.opacity=.35}}

let running=false,dead=false,distance=0,energy=22,targetX=0,yVel=0,dashing=false,shake=0,last=performance.now();
let best=Number(localStorage.getItem('wildBullBest')||0);bestEl.textContent=String(best).padStart(4,'0');
function action(name){if(!running)return;if(name==='left')targetX=Math.max(-3,targetX-3);if(name==='right')targetX=Math.min(3,targetX+3);if(name==='jump'&&bullRig.position.y<.06)yVel=.35;if(name==='dash'&&energy>=24){dashing=true;setTimeout(()=>dashing=false,950)}}
addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))action('left');if(['ArrowRight','d','D'].includes(e.key))action('right');if(['ArrowUp','w','W'].includes(e.key))action('jump');if(e.code==='Space'){e.preventDefault();action('dash')}});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',()=>action(b.dataset.action)));
let swipeX=0,swipeY=0;addEventListener('touchstart',e=>{swipeX=e.touches[0].clientX;swipeY=e.touches[0].clientY},{passive:true});addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-swipeX,dy=e.changedTouches[0].clientY-swipeY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))action(dx>0?'right':'left');else if(dy<-55)action('jump')},{passive:true});
function reset(){distance=0;energy=22;targetX=0;yVel=0;dashing=false;dead=false;bullRig.position.set(0,0,4);obstacles.forEach((o,i)=>{o.position.z=-38-i*18-Math.random()*7;o.position.x=[-3,0,3][Math.floor(Math.random()*3)]});pickups.forEach((o,i)=>{o.position.z=-27-i*23;o.position.x=[-3,0,3][Math.floor(Math.random()*3)]});startScreen.classList.add('hidden');gameOver.classList.add('hidden');hud.classList.remove('hidden');touch.classList.remove('hidden');running=true}
$('#startButton').onclick=()=>bullReady&&reset();$('#restartButton').onclick=reset;
function endRun(){if(dead)return;dead=true;running=false;shake=.8;flash.style.opacity=.5;setTimeout(()=>flash.style.opacity=0,120);best=Math.max(best,Math.floor(distance));localStorage.setItem('wildBullBest',best);bestEl.textContent=String(best).padStart(4,'0');$('#finalScore').textContent=Math.floor(distance);$('#resultLine').textContent=distance>500?'That was a proper stampede.':'The wild rewards rhythm. Read the trail and charge again.';setTimeout(()=>{gameOver.classList.remove('hidden');hud.classList.add('hidden');touch.classList.add('hidden')},650)}

function animate(now){requestAnimationFrame(animate);const dt=Math.min(2,(now-last)/16.667);last=now;const t=now*.001;let speed=.42+Math.min(distance/850,.44);if(dashing)speed*=2.05;
 if(running){
  distance+=speed*dt*1.32;energy=Math.max(0,Math.min(100,energy+(dashing?-.95:.045)*dt));if(energy<2)dashing=false;
  bullRig.position.x+=(targetX-bullRig.position.x)*.17*dt;bullRig.position.y+=yVel*dt;yVel-=.026*dt;if(bullRig.position.y<0){bullRig.position.y=0;yVel=0}
  const stride=Math.sin(distance*.72);bullVisual.position.y=Math.abs(stride)*.13;bullVisual.rotation.x=-.06+Math.sin(distance*.72+1)*.035;bullVisual.rotation.z=(targetX-bullRig.position.x)*-.08+Math.sin(distance*.36)*.018;
  bullVisual.scale.set(1,1+Math.abs(stride)*.025,1-Math.abs(stride)*.02);shadow.position.x=bullRig.position.x;shadow.scale.setScalar(Math.max(.45,1-bullRig.position.y*.18));
  if(distance%1.4<speed*dt*1.5)puff(dashing?2:1);
  moving.forEach(m=>{m.o.position.z+=speed*dt;if(m.type==='ground'&&m.o.position.z>35)m.o.position.z-=256;if(m.type==='scenery'&&m.o.position.z>28)m.o.position.z-=281});
  obstacles.forEach(o=>{o.position.z+=speed*dt;if(o.position.z>17){o.position.z-=170+Math.random()*25;o.position.x=[-3,0,3][Math.floor(Math.random()*3)];o.userData.hit=false}const dx=Math.abs(o.position.x-bullRig.position.x),dz=Math.abs(o.position.z-4);if(!o.userData.hit&&dx<1.15&&dz<1.2&&bullRig.position.y<.85){o.userData.hit=true;if(dashing){o.rotation.x+=.8;o.rotation.z+=(Math.random()-.5)*1.4;shake=.42;energy=Math.min(100,energy+7);flash.style.opacity=.22;setTimeout(()=>flash.style.opacity=0,90)}else endRun()}});
  pickups.forEach(p=>{p.position.z+=speed*dt;p.rotation.y+=.045*dt;p.children[0].rotation.y+=.08*dt;if(p.position.z>17){p.position.z-=185+Math.random()*18;p.position.x=[-3,0,3][Math.floor(Math.random()*3)]}if(Math.abs(p.position.x-bullRig.position.x)<.9&&Math.abs(p.position.z-4)<1){energy=Math.min(100,energy+28);p.position.z-=190;flash.style.opacity=.16;setTimeout(()=>flash.style.opacity=0,90)}});
 }
 aura.children.forEach((r,i)=>{r.rotation.z=t*(1.2+i*.25);r.scale.setScalar(1+i*.15+Math.sin(t*5+i)*.05);r.material.opacity=dashing?.58:0});
 dust.forEach(d=>{if(d.life>0){d.life-=.018*dt;d.o.position.addScaledVector(d.vel,dt);d.o.scale.multiplyScalar(1+.025*dt);d.o.material.opacity=Math.max(0,d.life*.34)}});
 camera.position.x+=(bullRig.position.x*.33-camera.position.x)*.07*dt;camera.position.y+=(5.1+bullRig.position.y*.2-camera.position.y)*.06*dt;camera.position.z=11.6;camera.lookAt(bullRig.position.x*.18,1.35+bullRig.position.y*.12,-6);
 if(shake>.005){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake*=.84}
 scoreEl.textContent=String(Math.floor(distance)).padStart(4,'0');energyEl.style.width=energy+'%';renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
