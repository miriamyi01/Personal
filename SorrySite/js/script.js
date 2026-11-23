"use strict";

/* =========================================================
   CONFIGURACIÓN: aquí cambias textos, coche y premios
   ========================================================= */
const CONFIG = {
  // Foto real (PNG con fondo transparente) del Porsche.
  // "mira" = hacia dónde mira el coche en la imagen original: "izquierda" o "derecha".
  // Si lo ves de espaldas en la carretera, cambia este valor.
  coche: {
    img: "https://images.porsche.com/f/285489813253582/5000x1485/6db3418b7b/model-992850-2025-side-shot_f4ca4176a9fc4f82a7d87ee2969ef6e7.png",
    mira: "derecha"
  },

  consejosCarga: [
    "Preparando el motor del amor…",
    "Llenando el tanque de paciencia…",
    "Pintando el atardecer…",
    "Calentando las llantas…",
    "Buscando la mejor canción…"
  ],

  reglas: [
    "Son <b>5 misiones</b>, de la 1 a la 5, en orden. No hay atajos.",
    "En el examen hay <b>1 respuesta correcta</b> por pregunta. Si fallas, no avanzas.",
    "En la carrera empiezas con <b>3 vidas</b>. Si llegas a 0, vuelves a intentarlo.",
    "Cada misión te paga <b>de $5,000 a $25,000</b> en dinero de mentiritas.",
    "El premio final va <b>de 1 hasta 1,000 besos</b> y <b>de 1 hasta 500 abrazos</b>."
  ],

  frasesMantener: [
    "Fallé y lo reconozco, sin excusas.",
    "No quiero que lo nuestro termine así.",
    "Contigo aprendí a querer de verdad.",
    "Voy a cuidarte mejor, desde hoy.",
    "Aquí estoy, completa, para ti."
  ],

  mensajeFinal:
    "Eres lo más bonito que tengo, gracias por estar en mi vida. " +
    "De verdad, solo eres y serás siempre tú. Te amo.",

  premio: [
    "De 1 a 1,000 besos, tú decides cuándo",
    "De 1 a 500 abrazos de los largos",
    "Mimos sin límite hasta que digas basta"
  ],

  noRespuestas: [
    "Ese botón está bloqueado por amor.",
    "Mira cómo crece el sí.",
    "Esa respuesta no existe en este juego.",
    "Sigo intentando hasta que digas que sí.",
    "La policía del amor ya viene en camino.",
    "Casi no cabe el botón del no.",
    "Última oportunidad de ser razonable.",
    "Listo, ya no hay no. Solo queda un camino."
  ],

  examen: [
    {
      q: "¿Qué coche le gusta más a mi novio?",
      o: ["Un triciclo", "Un Porsche", "Un carrito de golf", "Una bicicleta"],
      ok: 1
    },
    {
      q: "¿Quién te quiere con todo el corazón?",
      o: ["Yo", "El señor del semáforo", "Un desconocido", "Nadie"],
      ok: 0
    },
    {
      q: "¿Cuántas veces al día te voy a querer?",
      o: ["Solo los domingos", "Una vez al mes", "Todos los días", "Ninguna"],
      ok: 2
    },
    {
      q: "¿Qué voy a hacer mejor a partir de hoy?",
      o: ["Hacerme la loca", "Escucharte y cuidarte", "Nada, así estoy bien", "Esconderme"],
      ok: 1
    },
    {
      q: "¿Qué es lo mejor que me ha pasado?",
      o: ["Ganar la lotería", "Un día sin tráfico", "Conocerte a ti", "Un helado gratis"],
      ok: 2
    }
  ],

  fallos: [
    "Mmm, esa no era. Piénsalo mejor.",
    "Casi, pero no.",
    "El semáforo se puso en rojo para esa respuesta.",
    "Ni tú te crees esa.",
    "Otra vez, que sé que te la sabes.",
    "Error de novio distraído. Intenta de nuevo."
  ],

  misiones: {
    m1: { pago: 5000,  premio: "10 abrazos guardados en el banco" },
    m2: { pago: 8000,  premio: "Tu Porsche ya está en el garage" },
    m3: { pago: 12000, premio: "Cero multas y toda la noche para ti" },
    m4: { pago: 18000, premio: "Aprobado con honores de novio" },
    m5: { pago: 25000, premio: "Corazón cargado al 100%" }
  }
};

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (id) => document.getElementById(id);
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (n) => "$" + n.toLocaleString("en-US");

const HEART = '<svg viewBox="0 0 100 100"><use href="#ico-heart"/></svg>';
const CONE = '<svg viewBox="0 0 60 70"><path d="M30 4L50 60H10Z" fill="#ff8a3d" stroke="#fff" stroke-width="3"/><rect x="4" y="58" width="52" height="8" rx="3" fill="#2a2540"/><path d="M19 34H41" stroke="#fff" stroke-width="5"/></svg>';
const GOLD = '<svg viewBox="0 0 100 100"><use href="#ico-gold"/></svg>';

/* =========================================================
   Estado y guardado (para continuar si recarga)
   ========================================================= */
const KEY = "sorrysite-progreso-v3";

const state = {
  stage: "cover",
  cash: 0,
  hearts: 0,
  mistakes: 0,
  preset: "original",
  hue: 0,
  plate: "JORGE",
  touched: false,
  sound: true
};

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin guardado */ }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    Object.assign(state, JSON.parse(raw));
    return true;
  } catch (e) {
    return false;
  }
}

/* =========================================================
   Audio: efectos y música sintetizada (sin archivos)
   ========================================================= */
let ac = null;
let master = null;
let musicTimer = null;
let musicStep = 0;

function audio() {
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = state.sound ? 1 : 0;
      master.connect(ac.destination);
    } catch (e) {
      ac = null;
    }
  }
  if (ac && ac.state === "suspended") ac.resume();
  return ac;
}

function tone(freq, dur = 0.12, type = "triangle", vol = 0.06, delay = 0) {
  const a = audio();
  if (!a || !state.sound) return;
  try {
    const o = a.createOscillator();
    const g = a.createGain();
    const t0 = a.currentTime + delay;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur);
  } catch (e) { /* ignorar */ }
}

const CHORDS = [
  [220, 262, 330],
  [175, 220, 262],
  [262, 330, 392],
  [196, 247, 294]
];

function startMusic() {
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (!state.sound) return;
    const chord = CHORDS[Math.floor(musicStep / 8) % CHORDS.length];
    const base = chord[musicStep % 3] * (musicStep % 8 === 0 ? 0.5 : 1);
    tone(base, 0.28, "sawtooth", 0.015);
    musicStep++;
  }, 240);
}

function jingle(ok = true) {
  const notes = ok ? [523, 659, 784, 1046] : [220, 196, 165];
  notes.forEach((f, i) => tone(f, 0.28, ok ? "triangle" : "sawtooth", 0.08, i * 0.12));
}

function setSound(on) {
  state.sound = on;
  $("soundBtn").classList.toggle("off", !on);
  if (master) master.gain.value = on ? 1 : 0;
  save();
}

$("soundBtn").addEventListener("click", () => setSound(!state.sound));

/* =========================================================
   Efectos visuales en canvas: confeti y fuegos artificiales
   ========================================================= */
const fxCanvas = $("fx");
const fx = fxCanvas.getContext("2d");
let confetti = [];
let sparks = [];
let rockets = [];
let fxRunning = false;
const COLORS = ["#ff2e93", "#19e3d2", "#ffd23f", "#ff8a3d", "#a855f7", "#ffffff"];

function fitCanvas() {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener("resize", fitCanvas);

function burst(x = window.innerWidth / 2, y = window.innerHeight / 2, n = 90) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(3, 10);
    confetti.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 3,
      w: rand(5, 9),
      c: pick(COLORS),
      life: 100
    });
  }
  ensureFx();
}

function firework(x = rand(0.15, 0.85) * window.innerWidth) {
  rockets.push({
    x,
    y: window.innerHeight,
    vy: -rand(9, 13),
    top: rand(0.12, 0.4) * window.innerHeight,
    color: pick(COLORS)
  });
  ensureFx();
}

function explode(r) {
  const n = 60;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = rand(2, 6);
    sparks.push({
      x: r.x, y: r.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      c: r.color,
      life: 70
    });
  }
  tone(rand(200, 420), 0.25, "square", 0.03);
}

function ensureFx() {
  if (fxRunning) return;
  fxRunning = true;
  requestAnimationFrame(fxLoop);
}

function fxLoop() {
  fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

  confetti = confetti.filter((p) => p.life > 0);
  confetti.forEach((p) => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.vx *= 0.99; p.life--;
    fx.globalAlpha = Math.max(p.life / 100, 0);
    fx.fillStyle = p.c;
    fx.fillRect(p.x, p.y, p.w, p.w * 0.6);
  });

  rockets = rockets.filter((r) => {
    r.y += r.vy;
    r.vy += 0.12;
    fx.globalAlpha = 1;
    fx.fillStyle = r.color;
    fx.fillRect(r.x, r.y, 3, 10);
    if (r.y <= r.top || r.vy >= -1) {
      explode(r);
      return false;
    }
    return true;
  });

  sparks = sparks.filter((s) => s.life > 0);
  sparks.forEach((s) => {
    s.x += s.vx; s.y += s.vy; s.vy += 0.06; s.vx *= 0.98; s.life--;
    fx.globalAlpha = Math.max(s.life / 70, 0);
    fx.fillStyle = s.c;
    fx.fillRect(s.x, s.y, 3, 3);
  });

  fx.globalAlpha = 1;
  if (confetti.length || sparks.length || rockets.length) {
    requestAnimationFrame(fxLoop);
  } else {
    fxRunning = false;
    fx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }
}

/* =========================================================
   Coche real (PNG): crear, orientar, pintar
   ========================================================= */
function makeCar(facingRight, extraClass = "") {
  const img = document.createElement("img");
  img.className = "pcar " + extraClass;
  img.src = CONFIG.coche.img;
  img.alt = "Porsche 911";
  img.draggable = false;
  img.referrerPolicy = "no-referrer";
  const nativeRight = CONFIG.coche.mira === "derecha";
  img.style.transform = nativeRight === facingRight ? "none" : "scaleX(-1)";
  return img;
}

// Si la imagen no carga, se muestra un recuadro en lugar de romper el juego
document.addEventListener("error", (e) => {
  const t = e.target;
  if (t && t.tagName === "IMG" && t.classList.contains("pcar")) {
    const box = document.createElement("div");
    box.className = "pcar-fallback";
    box.textContent = "911";
    t.replaceWith(box);
  }
}, true);

function paintFilter() {
  switch (state.preset) {
    case "negro": return "grayscale(1) brightness(0.35) contrast(1.25)";
    case "plata": return "grayscale(1) brightness(1.15)";
    case "color": return `hue-rotate(${state.hue}deg) saturate(1.3)`;
    default: return "none";
  }
}

function applyPaint(el) {
  const f = paintFilter();
  el.style.filter = f === "none" ? "drop-shadow(0 8px 8px rgba(0,0,0,.55))" : f + " drop-shadow(0 8px 8px rgba(0,0,0,.55))";
}

function renderHero() {
  const wrap = $("heroCar");
  wrap.innerHTML = "";
  const img = makeCar(true);
  applyPaint(img);
  wrap.appendChild(img);
  $("heroPlate").textContent = state.plate;
}

/* =========================================================
   Fondo y tráfico
   ========================================================= */
function buildBackground() {
  for (let i = 0; i < 50; i++) {
    const b = document.createElement("b");
    b.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;animation-delay:${rand(0, 3)}s`;
    $("stars").appendChild(b);
  }
  for (let i = 0; i < 20; i++) {
    const b = document.createElement("i");
    b.style.height = rand(25, 100) + "%";
    $("city").appendChild(b);
  }
}

function spawnTraffic() {
  const wrap = document.createElement("div");
  wrap.className = "tcar";
  const img = makeCar(false);
  img.style.filter = `hue-rotate(${Math.floor(rand(0, 360))}deg) drop-shadow(0 6px 6px rgba(0,0,0,.5))`;
  wrap.appendChild(img);
  $("traffic").appendChild(wrap);
  const anim = wrap.animate(
    [{ left: "105%" }, { left: "-35%" }],
    { duration: rand(5000, 8000), easing: "linear" }
  );
  anim.onfinish = () => wrap.remove();
}

/* =========================================================
   Navegación entre pantallas
   ========================================================= */
const ORDER = ["cover", "rules", "m1", "m2", "m3", "m4", "m5", "ask", "win"];
const TITLES = {
  rules: "Reglas",
  m1: "Misión 1 de 5",
  m2: "Misión 2 de 5",
  m3: "Misión 3 de 5",
  m4: "Misión 4 de 5",
  m5: "Misión 5 de 5",
  ask: "Misión final"
};

let cleanups = [];
const onLeave = (fn) => cleanups.push(fn);

const HOOKS = {
  cover: setupCover,
  rules: buildRules,
  m1: startM1,
  m2: startM2,
  m3: startRace,
  m4: startQuiz,
  m5: startHold,
  ask: startAsk,
  win: finale
};

function show(id) {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  ORDER.forEach((s) => $(s).classList.toggle("hidden", s !== id));
  $("passed").classList.add("hidden");
  $("hud").classList.toggle("hidden", id === "cover" || id === "win");
  $("mTitle").textContent = TITLES[id] || "";
  const done = Math.max(0, ORDER.indexOf(id) - 2);
  [...$("dots").children].forEach((d, i) => d.classList.toggle("on", i < done));
  if (id !== "cover" && id !== "win") {
    state.stage = id;
    save();
  }
  tone(660, 0.1);
  if (HOOKS[id]) HOOKS[id]();
}

function passed(from, next) {
  const m = CONFIG.misiones[from];
  state.cash += m.pago;
  save();
  $("cash").textContent = money(state.cash);
  $("pSub").textContent = m.premio;
  $("pPay").textContent = "+" + money(m.pago);
  $("passed").classList.remove("hidden");
  burst(window.innerWidth / 2, window.innerHeight * 0.4, 90);
  jingle(true);
  $("pBtn").onclick = () => show(next);
}

document.querySelectorAll("[data-next]").forEach((b) => {
  b.addEventListener("click", () => show(b.dataset.next));
});

/* =========================================================
   Pantalla de carga y portada
   ========================================================= */
function runBoot() {
  let p = 0;
  let tipIdx = 0;
  $("bootTip").textContent = CONFIG.consejosCarga[0];
  const tipTimer = setInterval(() => {
    tipIdx = (tipIdx + 1) % CONFIG.consejosCarga.length;
    $("bootTip").textContent = CONFIG.consejosCarga[tipIdx];
  }, 900);
  const t = setInterval(() => {
    p = Math.min(100, p + rand(4, 10));
    $("bootBar").style.width = p + "%";
    if (p >= 100) {
      clearInterval(t);
      clearInterval(tipTimer);
      setTimeout(() => {
        $("boot").classList.add("hidden");
        $("stage").classList.remove("hidden");
        show("cover");
      }, 300);
    }
  }, 130);
}

function setupCover() {
  const canContinue = ["m1", "m2", "m3", "m4", "m5", "ask"].includes(state.stage);
  $("btnContinue").classList.toggle("hidden", !canContinue);
}

$("btnStart").addEventListener("click", () => {
  audio();
  startMusic();
  state.cash = 0;
  state.hearts = 0;
  state.mistakes = 0;
  $("cash").textContent = money(0);
  show("rules");
});

$("btnContinue").addEventListener("click", () => {
  audio();
  startMusic();
  $("cash").textContent = money(state.cash);
  show(state.stage);
});

function buildRules() {
  $("rulesList").innerHTML = CONFIG.reglas.map((r) => `<li>${r}</li>`).join("");
}

/* =========================================================
   Misión 1: atrapar corazones
   ========================================================= */
let m1Points = 0;

function startM1() {
  m1Points = 0;
  $("c1").textContent = 0;
  $("bar1").style.width = "0";
  $("play").innerHTML = "";
  const timer = setInterval(spawnHeart, 600);
  onLeave(() => clearInterval(timer));
  spawnHeart();
}

function spawnHeart() {
  const area = $("play");
  if (m1Points >= 12) return;
  const gold = Math.random() < 0.16;
  const h = document.createElement("button");
  h.className = "heart" + (gold ? " gold" : "");
  h.setAttribute("aria-label", gold ? "corazón dorado" : "corazón");
  h.innerHTML = gold ? GOLD : HEART;
  h.style.left = rand(2, Math.max(10, area.clientWidth - 52)) + "px";
  area.appendChild(h);

  const fall = h.animate(
    [
      { transform: "translateY(0) rotate(-10deg)" },
      { transform: `translateY(${area.clientHeight + 70}px) rotate(10deg)` }
    ],
    { duration: rand(2600, 3800), easing: "linear" }
  );
  fall.onfinish = () => h.remove();

  h.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!h.isConnected || m1Points >= 12) return;
    const gain = gold ? 3 : 1;
    const left = h.offsetLeft;
    const top = e.clientY - area.getBoundingClientRect().top - 10;
    fall.cancel();
    h.remove();
    tone(600 + m1Points * 55, 0.1);
    const pop = document.createElement("div");
    pop.className = "pop";
    pop.textContent = "+" + gain;
    pop.style.cssText = `left:${left}px;top:${top}px`;
    area.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
    m1Points = Math.min(12, m1Points + gain);
    state.hearts += gain;
    $("c1").textContent = m1Points;
    $("bar1").style.width = (m1Points / 12) * 100 + "%";
    if (m1Points >= 12) setTimeout(() => passed("m1", "m2"), 400);
  });
}

/* =========================================================
   Misión 2: personalizar el Porsche
   ========================================================= */
let paintImg = null;

function startM2() {
  const stage = $("paintStage");
  if (paintImg) paintImg.remove();
  paintImg = makeCar(true);
  stage.insertBefore(paintImg, stage.firstChild);
  $("plate").value = state.plate;
  $("plateBadge").textContent = state.plate;
  $("hue").value = state.hue;
  syncPaintUI();
  $("m2Next").disabled = !canSaveCar();
}

const canSaveCar = () => state.touched && state.plate.trim().length >= 2;

function syncPaintUI() {
  if (paintImg) applyPaint(paintImg);
  document.querySelectorAll("#presets .chip").forEach((c) => {
    c.classList.toggle("sel", c.dataset.preset === state.preset);
  });
}

document.querySelectorAll("#presets .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    state.preset = chip.dataset.preset;
    state.touched = true;
    syncPaintUI();
    $("m2Next").disabled = !canSaveCar();
    tone(540, 0.1);
  });
});

$("hue").addEventListener("input", (e) => {
  state.hue = Number(e.target.value);
  state.preset = "color";
  state.touched = true;
  syncPaintUI();
  $("m2Next").disabled = !canSaveCar();
});

$("plate").addEventListener("input", (e) => {
  state.plate = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
  e.target.value = state.plate;
  $("plateBadge").textContent = state.plate || "—";
  $("m2Next").disabled = !canSaveCar();
});

$("m2Next").addEventListener("click", () => {
  renderHero();
  passed("m2", "m3");
});

/* =========================================================
   Misión 3: carrera de tres carriles con coches reales
   ========================================================= */
const TARGET_HEARTS = 10;
let raceToken = 0;
let race = null;

function livesText(n) {
  return "♥".repeat(n) + "♡".repeat(3 - n);
}

function startRace() {
  const box = $("race");
  box.innerHTML = "";
  const player = document.createElement("div");
  player.className = "rp";
  const pimg = makeCar(true);
  applyPaint(pimg);
  player.appendChild(pimg);
  box.appendChild(player);

  race = { lane: 1, hearts: 0, lives: 3, items: [], t: 0, mode: "count", player, last: 0 };
  $("c3").textContent = 0;
  $("lives").textContent = livesText(3);
  placePlayer();

  const token = ++raceToken;
  onLeave(() => { raceToken++; });
  runCountdown(token);
}

function placePlayer() {
  race.player.style.top = race.lane * 33.3 + 16.6 + "%";
}

function setLane(delta) {
  if (!race || race.mode !== "run") return;
  race.lane = Math.max(0, Math.min(2, race.lane + delta));
  placePlayer();
  tone(400, 0.05);
}

function overlay(title, text, btnLabel, onClick) {
  const o = document.createElement("div");
  o.className = "race-msg";
  o.innerHTML = `<div>${title}</div>` + (text ? `<p>${text}</p>` : "");
  if (btnLabel) {
    const b = document.createElement("button");
    b.className = "btn primary";
    b.textContent = btnLabel;
    b.onclick = () => { o.remove(); onClick(); };
    o.appendChild(b);
  }
  $("race").appendChild(o);
  return o;
}

async function runCountdown(token) {
  race.mode = "count";
  for (const n of ["3", "2", "1", "¡Ya!"]) {
    if (token !== raceToken) return;
    const o = overlay(n);
    tone(n === "¡Ya!" ? 880 : 440, 0.18, "square", 0.05);
    await wait(650);
    o.remove();
  }
  if (token !== raceToken) return;
  race.mode = "run";
  race.last = performance.now();
  requestAnimationFrame((t) => raceLoop(token, t));
}

function spawnRaceItem() {
  const box = $("race");
  const lane = Math.floor(rand(0, 3));
  const bad = Math.random() < 0.45;
  const el = document.createElement("div");
  el.className = "ri";
  let width = 11;
  if (bad) {
    width = 13;
    el.innerHTML = CONE;
  } else {
    el.innerHTML = HEART;
  }
  el.style.width = width + "%";
  el.style.top = lane * 33.3 + 16.6 + "%";
  el.style.left = "104%";
  box.appendChild(el);
  race.items.push({ el, lane, x: 104, w: width, bad });
}

function hitFlash() {
  const box = $("race");
  box.classList.remove("hit");
  void box.offsetWidth;
  box.classList.add("hit");
}

function raceLoop(token, now) {
  if (token !== raceToken || race.mode !== "run") return;
  const dt = Math.min(2.5, (now - race.last) / 16.67);
  race.last = now;
  race.t += dt;

  const speed = 0.62 + race.hearts * 0.05;
  if (race.t > 44 - race.hearts * 2) {
    race.t = 0;
    spawnRaceItem();
  }

  race.items = race.items.filter((it) => {
    it.x -= speed * dt;
    it.el.style.left = it.x + "%";
    const overlaps = it.x < 28 && it.x + it.w > 6 && it.lane === race.lane;
    if (overlaps) {
      it.el.remove();
      if (it.bad) {
        race.lives--;
        $("lives").textContent = livesText(race.lives);
        tone(160, 0.3, "sawtooth", 0.08);
        hitFlash();
      } else {
        race.hearts++;
        state.hearts++;
        $("c3").textContent = race.hearts;
        tone(700 + race.hearts * 60, 0.1);
      }
      return false;
    }
    if (it.x < -30) {
      it.el.remove();
      return false;
    }
    return true;
  });

  if (race.lives <= 0) {
    race.mode = "over";
    overlay("Te estrellaste", "Pisaste demasiados conos. Inténtalo otra vez.", "Reintentar", startRace);
    jingle(false);
    return;
  }
  if (race.hearts >= TARGET_HEARTS) {
    race.mode = "done";
    setTimeout(() => passed("m3", "m4"), 350);
    return;
  }
  requestAnimationFrame((t) => raceLoop(token, t));
}

$("up").addEventListener("click", () => setLane(-1));
$("down").addEventListener("click", () => setLane(1));

$("race").addEventListener("pointerdown", (e) => {
  if (!race || race.mode !== "run") return;
  const r = e.currentTarget.getBoundingClientRect();
  const laneCenter = (race.lane * 33.3 + 16.6) / 100;
  setLane(e.clientY - r.top < r.height * laneCenter ? -1 : 1);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setLane(-1);
  if (e.key === "ArrowDown") setLane(1);
});

/* =========================================================
   Misión 4: examen (solo avanza con la respuesta correcta)
   ========================================================= */
let qIndex = 0;
let lastFail = "";

function startQuiz() {
  qIndex = 0;
  renderQuestion();
}

function renderQuestion() {
  const d = CONFIG.examen[qIndex];
  $("qn").textContent = `Pregunta ${qIndex + 1} de ${CONFIG.examen.length}`;
  $("q").textContent = d.q;
  $("fb").textContent = "";
  const box = $("opts");
  box.innerHTML = "";
  d.o.forEach((text, i) => {
    const b = document.createElement("button");
    b.textContent = text;
    b.addEventListener("click", () => answer(b, i === d.ok));
    box.appendChild(b);
  });
}

function nextFail() {
  let f = pick(CONFIG.fallos);
  while (f === lastFail && CONFIG.fallos.length > 1) f = pick(CONFIG.fallos);
  lastFail = f;
  return f;
}

function answer(btn, correct) {
  if (correct) {
    btn.classList.add("ok");
    $("fb").textContent = "Correcto.";
    jingle(true);
    [...$("opts").children].forEach((b) => { b.disabled = true; });
    setTimeout(() => {
      qIndex++;
      if (qIndex >= CONFIG.examen.length) passed("m4", "m5");
      else renderQuestion();
    }, 900);
  } else {
    state.mistakes++;
    btn.classList.add("bad");
    btn.disabled = true;
    $("fb").textContent = nextFail();
    tone(170, 0.25, "sawtooth", 0.07);
    if (navigator.vibrate) navigator.vibrate(80);
  }
}

/* =========================================================
   Misión 5: mantener presionado
   ========================================================= */
let holdProg = 0;
let holding = false;
let holdRaf = 0;

function startHold() {
  holdProg = 0;
  holding = false;
  $("lines").innerHTML = CONFIG.frasesMantener.map((t) => `<p>${t}</p>`).join("");
  $("hold").style.setProperty("--p", 0);
  $("pct").textContent = "0%";
  cancelAnimationFrame(holdRaf);
  holdRaf = requestAnimationFrame(holdTick);
  onLeave(() => cancelAnimationFrame(holdRaf));
}

function holdTick() {
  holdProg = Math.max(0, Math.min(100, holdProg + (holding ? 0.75 : -1.4)));
  $("hold").style.setProperty("--p", holdProg);
  $("pct").textContent = Math.floor(holdProg) + "%";
  const n = CONFIG.frasesMantener.length;
  [...$("lines").children].forEach((p, i) => {
    p.classList.toggle("on", holdProg > ((i + 1) * 95) / (n + 1));
  });
  if (holding && Math.floor(holdProg) % 8 === 0) tone(280 + holdProg * 4, 0.05, "sine", 0.03);
  if (holdProg >= 100) {
    holding = false;
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    passed("m5", "ask");
    return;
  }
  holdRaf = requestAnimationFrame(holdTick);
}

$("hold").addEventListener("pointerdown", (e) => { e.preventDefault(); holding = true; });
["pointerup", "pointerleave", "pointercancel"].forEach((ev) => {
  $("hold").addEventListener(ev, () => { holding = false; });
});

/* =========================================================
   Pregunta final
   ========================================================= */
let noCount = 0;

function startAsk() {
  noCount = 0;
  $("status").textContent = "Última misión.";
  const yes = $("yes");
  const no = $("no");
  yes.classList.remove("mega");
  yes.style.flexBasis = "";
  yes.style.transform = "";
  yes.textContent = "Sí";
  no.style.display = "";
  no.style.flexBasis = "";
  no.style.opacity = "";
}

$("no").addEventListener("click", () => {
  noCount++;
  tone(180, 0.2, "sawtooth", 0.05);
  $("siren").classList.add("on");
  $("status").textContent = CONFIG.noRespuestas[Math.min(noCount - 1, CONFIG.noRespuestas.length - 1)];
  $("yes").style.flexBasis = Math.min(100, 40 + noCount * 14) + "%";
  $("yes").style.transform = `scale(${1 + noCount * 0.04})`;
  $("no").style.flexBasis = Math.max(12, 30 - noCount * 3) + "%";
  $("no").style.opacity = Math.max(0.25, 1 - noCount * 0.1);
  $("answers").classList.remove("shake");
  void $("answers").offsetWidth;
  $("answers").classList.add("shake");
  if (noCount >= 6) $("no").style.display = "none";
  if (noCount >= 8) {
    $("yes").classList.add("mega");
    $("yes").textContent = "SÍ";
  }
});

$("yes").addEventListener("click", () => {
  $("siren").classList.remove("on");
  $("yes").classList.remove("mega");
  show("win");
});

/* =========================================================
   Final: fuegos artificiales, mensaje y tarjeta para rascar
   ========================================================= */
async function finale() {
  const token = Symbol("win");
  finale.token = token;

  $("msg").textContent = "";
  $("hint").style.opacity = 1;
  $("sHearts").textContent = state.hearts;
  $("sCash").textContent = money(state.cash);
  $("sMist").textContent = state.mistakes;
  $("prizeList").innerHTML = CONFIG.premio.map((p) => `<li>${p}</li>`).join("");

  jingle(true);
  setTimeout(initScratch, 60);

  let n = 0;
  const fw = setInterval(() => {
    firework();
    if (++n > 14) clearInterval(fw);
  }, 700);
  const rain = setInterval(() => {
    const h = document.createElement("div");
    h.className = "fall";
    h.innerHTML = Math.random() < 0.15 ? GOLD : HEART;
    h.style.cssText = `left:${rand(0, 92)}%;width:${rand(22, 44)}px;animation-duration:${rand(5, 9)}s`;
    $("app").appendChild(h);
    setTimeout(() => h.remove(), 9000);
  }, 380);
  onLeave(() => { clearInterval(fw); clearInterval(rain); });

  for (const ch of CONFIG.mensajeFinal) {
    if (finale.token !== token) return;
    $("msg").textContent += ch;
    await wait(38);
  }
}

function initScratch() {
  const cv = $("cv");
  const box = $("scratch");
  const ctx = cv.getContext("2d");
  cv.width = box.clientWidth;
  cv.height = box.clientHeight;
  cv.style.opacity = 1;
  cv.style.transition = "none";

  const g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
  g.addColorStop(0, "#9aa0cf");
  g.addColorStop(1, "#d9dcf5");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#3a1170";
  ctx.font = "700 16px Rubik, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Rasca aquí", cv.width / 2, cv.height / 2 + 6);

  let drawing = false;
  let done = false;

  const scratch = (e) => {
    if (!drawing || done) return;
    const r = cv.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - r.left, e.clientY - r.top, 20, 0, Math.PI * 2);
    ctx.fill();
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let cleared = 0;
    let total = 0;
    for (let i = 3; i < d.length; i += 64) {
      total++;
      if (d[i] === 0) cleared++;
    }
    if (cleared / total > 0.5) {
      done = true;
      cv.style.transition = "opacity .6s";
      cv.style.opacity = 0;
      $("hint").style.opacity = 0;
      burst(window.innerWidth / 2, window.innerHeight * 0.5, 140);
      jingle(true);
    }
  };

  cv.onpointerdown = (e) => { drawing = true; scratch(e); };
  cv.onpointermove = scratch;
  cv.onpointerup = () => { drawing = false; };
  cv.onpointerleave = () => { drawing = false; };
}

$("btnShare").addEventListener("click", async () => {
  const data = { title: "Para ti", text: "Mira lo que te preparé", url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      $("btnShare").textContent = "Enlace copiado";
    }
  } catch (e) { /* cancelado */ }
});

$("again").addEventListener("click", () => {
  state.stage = "cover";
  state.cash = 0;
  state.hearts = 0;
  state.mistakes = 0;
  save();
  location.reload();
});

/* =========================================================
   Inicio
   ========================================================= */
load();
if (state.stage === "win") state.stage = "cover";
buildBackground();
renderHero();
setSound(state.sound);
$("cash").textContent = money(state.cash);
spawnTraffic();
setInterval(spawnTraffic, 2600);
runBoot();