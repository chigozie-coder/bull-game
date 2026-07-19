import * as THREE from 'three';

const mount = document.querySelector('#game');
const scoreEl = document.querySelector('#score'), bestEl = document.querySelector('#best');
const energyEl = document.querySelector('#energyFill'), speedEl = document.querySelector('#speed');
const startScreen = document.querySelector('#startScreen'), gameOver = document.querySelector('#gameOver');
const finalScore = document.querySelector('#finalScore'), resultLine = document.querySelector('#resultLine');

const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x04050e, .024);
const camera = new THREE.PerspectiveCamera(61, innerWidth / innerHeight, .1, 240);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25; mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x78c8ff,0x080411,1.2));
const pink = new THREE.PointLight(0xff1857,35,42,2); pink.position.set(-7,5,3);scene.add(pink);
const blue = new THREE.PointLight(0x05e8ff,28,42,2);blue.position.set(8,7,-10);scene.add(blue);

const neonMat=(color,intensity=2)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.28,metalness:.65});
const blackMat=new THREE.MeshStandardMaterial({color:0x070912,roughness:.23,metalness:.92});
const darkMat=new THREE.MeshStandardMaterial({color:0x111426,roughness:.7,metalness:.32});
function mesh(geo,mat,pos,rot=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;return m}
function createBull(){
 const g=new THREE.Group(); g.position.set(0,0,3); const cyan=neonMat(0x0cf5ff,1.8), hot=neonMat(0xff1955,2.5);
 const body=mesh(new THREE.CapsuleGeometry(.68,1.45,7,12),blackMat,[0,1.55,0],[0,0,Math.PI/2],[1,1,1]);g.add(body);
 const hump=mesh(new THREE.SphereGeometry(.78,16,12),blackMat,[-.25,2.05,.02],[0,0,0],[1,.85,.8]);g.add(hump);
 const neck=mesh(new THREE.CylinderGeometry(.48,.6,1.2,12),blackMat,[.92,1.66,0],[0,0,Math.PI/2.7]);g.add(neck);
 const head=mesh(new THREE.BoxGeometry(.82,.72,.74),blackMat,[1.45,1.82,0],[0,0,.08]);g.add(head);
 const muzzle=mesh(new THREE.BoxGeometry(.32,.31,.64),darkMat,[1.83,1.61,0]);g.add(muzzle);
 const hornGeo=new THREE.ConeGeometry(.11,.86,8);[-1,1].forEach(s=>{const h=mesh(hornGeo,cyan,[1.37,2.25,s*.41],[s*.55,0,-.64]);g.add(h);});
 [-1,1].forEach(s=>{const eye=mesh(new THREE.SphereGeometry(.07,8,8),hot,[1.78,1.94,s*.36]);g.add(eye);});
 const legs=[]; [[-.65,-.45],[.48,-.45],[-.65,.45],[.48,.45]].forEach(([x,z],i)=>{const leg=new THREE.Group();leg.position.set(x,1.07,z);const upper=mesh(new THREE.CylinderGeometry(.18,.23,.75,8),blackMat,[0,-.38,0]);const hoof=mesh(new THREE.BoxGeometry(.29,.17,.27),darkMat,[0,-.79,0]);leg.add(upper,hoof);g.add(leg);legs.push(leg)});
 const tail=new THREE.Group();tail.position.set(-1.18,1.75,0);tail.rotation.z=-.7;tail.add(mesh(new THREE.CylinderGeometry(.05,.07,.78,7),blackMat,[0,-.38,0]),mesh(new THREE.SphereGeometry(.15,7,7),hot,[0,-.83,0]));g.add(tail);
 const core=mesh(new THREE.TorusGeometry(.33,.045,7,18),cyan,[.05,1.65,.73],[Math.PI/2,0,0]);g.add(core);
 g.userData={legs,tail,core};return g;
}
const bull=createBull();scene.add(bull);

const track=new THREE.Group();scene.add(track); const trackMat=new THREE.MeshStandardMaterial({color:0x080b17,roughness:.64,metalness:.3});
for(let z=-12;z>-230;z-=6){const slab=mesh(new THREE.BoxGeometry(12,.28,5.85),trackMat,[0,-.22,z]);track.add(slab);[-3,0,3].forEach(x=>track.add(mesh(new THREE.BoxGeometry(.045,.035,5.2),neonMat(x===0?0x18223e:0xff1955,1.4),[x,-.055,z])));[-6.1,6.1].forEach(x=>track.add(mesh(new THREE.BoxGeometry(.12,.22,5.9),neonMat(0x0cf5ff,1.6),[x,0,z])))}
// city silhouettes
for(let z=-10;z>-220;z-=10){[-1,1].forEach(side=>{let h=3+Math.random()*12,w=1+Math.random()*2;const b=mesh(new THREE.BoxGeometry(w,h,3+Math.random()*4),darkMat,[side*(8+Math.random()*10),h/2-1,z+Math.random()*5]);scene.add(b);if(Math.random()>.35){const light=mesh(new THREE.BoxGeometry(.08,h*.5,1),neonMat(side<0?0xff1955:0x0cf5ff,1.5),[b.position.x-side*(w/2+.06),h/2-1,z]);scene.add(light)}})}
const particles=new THREE.BufferGeometry(), p=[];for(let i=0;i<600;i++)p.push((Math.random()-.5)*70,Math.random()*30-2,-Math.random()*220);particles.setAttribute('position',new THREE.Float32BufferAttribute(p,3));scene.add(new THREE.Points(particles,new THREE.PointsMaterial({color:0x6ad8ff,size:.055,transparent:true,opacity:.75})));
const objects=[];function spawn(z){const lane=[-3,0,3][Math.floor(Math.random()*3)], isPower=Math.random()<.28;let group=new THREE.Group();if(isPower){let ring=mesh(new THREE.TorusGeometry(.48,.09,8,16),neonMat(0x0cf5ff,2.7),[lane,.85,z],[0,0,0]);group.add(ring);group.userData={type:'power',spin:Math.random()*6};}else{const type=Math.random()<.45?'wall':'crate';if(type==='wall'){group.add(mesh(new THREE.BoxGeometry(2.35,1.55,.48),darkMat,[lane,.62,z]));for(let x=-.85;x<=.85;x+=.85)group.add(mesh(new THREE.BoxGeometry(.12,1.6,.08),neonMat(0xff1955,2),[lane+x,.65,z+.29]));group.userData={type:'wall'};}else{group.add(mesh(new THREE.BoxGeometry(1.15,1.1,1.15),darkMat,[lane,.45,z]));group.add(mesh(new THREE.TorusGeometry(.34,.05,6,12),neonMat(0xff1955,1.8),[lane,.52,z+.59]));group.userData={type:'crate'};}}scene.add(group);objects.push(group)}
for(let z=-32;z>-205;z-=13+Math.random()*8)spawn(z);
let running=false, dead=false, distance=0, energy=0, lane=0, targetX=0, yVel=0, dash=false, shake=0, last=performance.now(), best=+localStorage.getItem('bullRunBest')||0;bestEl.textContent=String(best).padStart(6,'0');
function move(dir){if(!running)return;if(dir==='left')targetX=Math.max(-3,targetX-3);if(dir==='right')targetX=Math.min(3,targetX+3);if(dir==='jump'&&bull.position.y<.03)yVel=.34;if(dir==='dash'&&energy>18)dash=true}
function crash(){if(dash)return;dead=true;running=false;shake=.65;finalScore.textContent=Math.floor(distance);best=Math.max(best,Math.floor(distance));localStorage.setItem('bullRunBest',best);bestEl.textContent=String(best).padStart(6,'0');resultLine.textContent=distance>400?'The stampede has only just begun.':'Build momentum. The city does not slow down.';setTimeout(()=>gameOver.classList.remove('hidden'),700)}
addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))move('left');if(['ArrowRight','d','D'].includes(e.key))move('right');if(['ArrowUp','w','W'].includes(e.key))move('jump');if(e.code==='Space'){e.preventDefault();move('dash')}});document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',()=>move(b.dataset.action)));
function reset(){objects.forEach(o=>scene.remove(o));objects.length=0;for(let z=-32;z>-205;z-=13+Math.random()*8)spawn(z);distance=0;energy=0;lane=0;targetX=0;yVel=0;dash=false;dead=false;bull.position.set(0,0,3);gameOver.classList.add('hidden');startScreen.classList.add('hidden');running=true}
document.querySelector('#startButton').onclick=reset;document.querySelector('#restartButton').onclick=reset;
function loop(now){requestAnimationFrame(loop);let dt=Math.min(.035,(now-last)/16.67);last=now;const velocity=(.36+Math.min(distance/650,.48))*(dash?2.18:1);if(running){distance+=velocity*dt*1.45;energy=Math.max(0,energy-(dash?.7:.06)*dt);if(dash&&energy<1)dash=false;bull.position.x+= (targetX-bull.position.x)*.18*dt;bull.position.y+=yVel*dt;yVel-=.027*dt;if(bull.position.y<0){bull.position.y=0;yVel=0}bull.rotation.z=(targetX-bull.position.x)*-.08;bull.userData.legs.forEach((leg,i)=>leg.rotation.z=Math.sin(distance*.48+i*Math.PI)*.55*(dash?1.5:1));bull.userData.tail.rotation.y=Math.sin(distance*.25)*.4;bull.userData.core.material.emissiveIntensity=dash?6:1.8;objects.forEach((o,i)=>{o.position.z+=velocity*dt;if(o.userData.type==='power'){o.rotation.y+=.08*dt;let d=Math.hypot(o.position.z-bull.position.z,o.position.x-bull.position.x);if(d<.9){energy=Math.min(100,energy+32);scene.remove(o);objects.splice(i,1)}}else {let dx=Math.abs(o.position.x-bull.position.x),dz=Math.abs(o.position.z-bull.position.z);if(dz<1&&dx<1.05&&bull.position.y<.8){if(dash){scene.remove(o);objects.splice(i,1);energy=Math.min(100,energy+5)}else crash()}if(o.position.z>7){scene.remove(o);objects.splice(i,1);spawn(-205-Math.random()*20)}}});pink.intensity=dash?100:35;blue.intensity=dash?80:28;}camera.position.x+=(bull.position.x*.18-camera.position.x)*.07;camera.position.y+=(4.1+bull.position.y*.16-camera.position.y)*.08;camera.position.z=9.1;camera.lookAt(bull.position.x*.14,1.05+bull.position.y*.12,-11);if(shake>0){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake*=.86}scoreEl.textContent=String(Math.floor(distance)).padStart(6,'0');energyEl.style.width=energy+'%';speedEl.textContent=velocity.toFixed(1)+'x';renderer.render(scene,camera)}requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
