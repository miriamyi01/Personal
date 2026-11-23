/* ====== PERSONALIZA AQUÍ ====== */
const CONFIG = {
  nombre: "Jorge",
  carta: "Sé que te fallé y no quiero que quede así. Me importas muchísimo y quiero arreglarlo contigo.",
  final: "Te amo, Jorge 💜"
};
/* ================================ */

const $ = id => document.getElementById(id);
const rand = (a,b) => Math.random()*(b-a)+a;
const pick = a => a[Math.floor(Math.random()*a.length)];
// Recursos públicos: Twemoji (CC-BY 4.0) servido desde jsDelivr
const tw = c => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${c}.svg`;
const img = (c,alt="") => `<img class="tw" src="${tw(c)}" alt="${alt}">`;
const CARS = ["1f3ce","1f697","1f699","1f695"], COP = "1f693";

/* ---- Audio simple (sin archivos) ---- */
let ac;
function beep(f=400,t=.15,type="square",v=.05){
  try{ ac = ac || new (window.AudioContext||window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(ac.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime+t); o.stop(ac.currentTime+t);
  }catch(e){}
}
const honk = () => { beep(330,.18); setTimeout(()=>beep(415,.22),90); };

/* ---- Intro ---- */
document.addEventListener("pointermove", e => {
  const g = $("glow"); g.style.left = e.clientX+"px"; g.style.top = e.clientY+"px";
  document.documentElement.style.setProperty("--mx", (e.clientX/innerWidth-.5).toFixed(3));
  document.documentElement.style.setProperty("--my", (e.clientY/innerHeight-.5).toFixed(3));
});
let p = 0;
const lt = setInterval(() => {
  p = Math.min(100, p + rand(3,9));
  $("loadBar").style.width = p+"%"; $("loadText").textContent = `Cargando… ${Math.floor(p)}%`;
  if(p >= 100){ clearInterval(lt); $("loadText").textContent = `Todo listo, ${CONFIG.nombre}`; $("startBtn").classList.remove("hidden"); }
}, 110);
$("startBtn").onclick = () => { honk(); $("intro").classList.add("hidden"); $("scene").classList.remove("hidden"); startScene(); };

/* ---- Construcción de la escena ---- */
function buildScene(){
  for(let i=0;i<70;i++){ const b=document.createElement("b"); b.style.cssText=`left:${rand(0,100)}%;top:${rand(0,100)}%;animation-delay:${rand(0,2.5)}s`; $("stars").appendChild(b); }
  for(let i=0;i<22;i++){ const b=document.createElement("i"); b.style.height=rand(30,100)+"%"; $("city").appendChild(b); }
  [[2,200],[16,130],[78,150],[90,220]].forEach(([l,w]) => {
    const d = document.createElement("div"); d.innerHTML = img("1f334","palmera");
    const im = d.firstChild; im.style.cssText=`left:${l}%;width:${w}px`; im.style.position="absolute"; im.style.animationDelay=rand(0,2)+"s";
    $("palms").appendChild(im);
  });
  $("wanted").innerHTML = Array.from({length:5},()=>`<div class="s">${img("2b50","estrella")}</div>`).join("");
}

/* ---- Autos ---- */
function drive(code, {dir=1, dur=6000, y=10, cop=false}={}){
  const el = document.createElement("div");
  el.className = "car"+(cop?" cop":""); el.style.bottom = y+"%"; el.innerHTML = img(code,"auto");
  el.firstChild.style.transform = dir>0 ? "scaleX(-1)" : "none";
  el.onclick = e => { honk(); el.classList.remove("jump"); void el.offsetWidth; el.classList.add("jump");
    toast(pick(["¡BEEP!","¡Vámonos!","¡Wooo!","💨"]), e.clientX, e.clientY); };
  $("lane").appendChild(el);
  const a = el.animate([{left: dir>0?"-160px":"105vw"},{left: dir>0?"105vw":"-160px"}],{duration:dur,easing:"linear"});
  a.onfinish = () => el.remove();
}
const traffic = () => drive(pick(CARS), {dir:Math.random()>.5?1:-1, dur:rand(4500,8500), y:Math.random()>.5?6:32});
function toast(t,x,y){ const d=document.createElement("div"); d.className="toast"; d.textContent=t; d.style.left=x+"px"; d.style.top=y+"px"; $("toasts").appendChild(d); setTimeout(()=>d.remove(),1100); }

/* ---- Carta con efecto máquina de escribir ---- */
function typeLetter(done){
  const el = $("letter"); let i = 0;
  const t = setInterval(() => {
    el.textContent = CONFIG.carta.slice(0, ++i);
    if(i % 3 === 0) beep(900,.03,"square",.015);
    if(i >= CONFIG.carta.length){ clearInterval(t); el.classList.add("done"); done(); }
  }, 38);
}

function startScene(){
  buildScene(); traffic(); setInterval(traffic, 1500);
  $("title").textContent = CONFIG.nombre;
  tilt();
  typeLetter(() => { $("ask").classList.remove("hidden"); $("buttons").classList.remove("hidden"); beep(660,.2,"triangle",.08); });
}

/* ---- Inclinación 3D de la tarjeta ---- */
function tilt(){
  const c = document.querySelector(".card-inner");
  document.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect(), x = (e.clientX-r.left)/r.width, y = (e.clientY-r.top)/r.height;
    c.style.transform = `rotateY(${(x-.5)*10}deg) rotateX(${(.5-y)*10}deg)`;
    c.style.setProperty("--gx", x*100+"%"); c.style.setProperty("--gy", y*100+"%");
  });
}

/* ---- Nivel de búsqueda (GTA) ---- */
let stars = 0, scale = 1, copTimer;
const STATUS = [
  "Nivel de búsqueda activado.",
  "La policía ya está en camino.",
  "Se suman más patrullas.",
  "Helicópteros en la zona.",
  "Último aviso: solo queda una salida."
];
const noBtn = $("noBtn"), yesBtn = $("yesBtn");

noBtn.addEventListener("click", e => {
  if(stars >= 5) return;
  stars++; beep(200,.3,"sawtooth",.06);
  document.querySelectorAll(".wanted .s").forEach((s,i) => s.classList.toggle("on", i < stars));
  $("status").textContent = STATUS[stars-1];
  $("siren").classList.add("on"); $("siren").style.setProperty("--si", .2+stars*.12);
  scale += .4; yesBtn.style.transform = `scale(${scale})`; yesBtn.style.margin = `${scale*9}px ${scale*16}px`;
  noBtn.style.transform = `scale(${Math.max(.5,1-stars*.1)})`;
  const card = document.querySelector(".card-inner"); card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  toast("★ "+stars, e.clientX, e.clientY);
  for(let i=0;i<stars;i++) setTimeout(() => drive(COP,{dir:Math.random()>.5?1:-1,dur:rand(1800,3000),y:Math.random()>.5?6:32,cop:true}), i*300);
  if(stars >= 2) noBtn.classList.add("run");
  if(stars === 5){ setTimeout(() => { yesBtn.classList.add("mega"); yesBtn.textContent = "SÍ 💖"; }, 600); }
});

/* El botón "No" huye del cursor desde el nivel 2 */
function dodge(){
  if(stars < 2 || !noBtn.classList.contains("run")) return;
  const b = $("buttons").getBoundingClientRect();
  noBtn.style.left = rand(0, Math.max(10,b.width-90))+"px"; noBtn.style.top = rand(-30, 40)+"px";
}
noBtn.addEventListener("pointerenter", dodge);
noBtn.addEventListener("pointerdown", e => { if(stars>=2 && Math.random()>.35){ e.preventDefault(); dodge(); } });

/* ---- Final ---- */
yesBtn.addEventListener("click", () => {
  clearInterval(copTimer); $("siren").classList.remove("on");
  document.querySelectorAll(".wanted .s").forEach(s => s.classList.remove("on"));
  yesBtn.classList.remove("mega"); $("card").classList.add("hidden");
  $("win").classList.remove("hidden");
  [523,659,784,1046].forEach((f,i) => setTimeout(() => beep(f,.35,"triangle",.09), i*140));
  let i = 0; const t = setInterval(() => { $("love").textContent = CONFIG.final.slice(0,++i); if(i>=CONFIG.final.length) clearInterval(t); }, 90);
  celebrate();
  for(let k=0;k<6;k++) setTimeout(() => drive(pick(CARS),{dir:1,dur:rand(3500,5500),y:k%2?6:32}), k*500);
});
$("replayBtn").onclick = () => location.reload();

function celebrate(){
  const fire = () => window.confetti && confetti({particleCount:90,spread:100,origin:{x:rand(.1,.9),y:rand(.1,.5)},colors:["#ff2e93","#19e3d2","#ffd23f","#ff8a3d"]});
  fire(); const f = setInterval(fire, 450); setTimeout(()=>clearInterval(f), 9000);
  setInterval(() => {
    const h = document.createElement("div"); h.className = "fall";
    h.style.cssText = `left:${rand(0,95)}%;width:${rand(26,60)}px;animation-duration:${rand(4,8)}s`;
    h.innerHTML = img(pick(["1f496","2764","1f49c","1f338"]));
    $("scene").appendChild(h); setTimeout(()=>h.remove(),8000);
  }, 220);
}