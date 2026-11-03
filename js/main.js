// Initial Drift: pantallas, carrera, garaje, historia y guardado.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CARS, buildCar, setCarStyle } from './coche.js';
import { Ink } from './tinta.js';
import { buildTrack } from './pista.js';
import { createEnv, WEATHERS } from './entorno.js';
import { DATA, PAINTS, KUROISHI, AKANE } from './datos.js';
import { Player, Rival } from './fisica.js';
import { Effects, addFlames } from './efectos.js';
import { FX2D } from './fx2d.js';
import * as AU from './audio.js';
import { PILOTS, chapter, CHAPTERS, RIVAL_NAMES, drawPilot, MangaPage } from './historia.js';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = Math.random, pick = (a) => a[(rnd() * a.length) | 0];
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const yen = (n) => '¥' + Math.round(n).toLocaleString('es-ES', { useGrouping: true });
const fmtT = (t) => { if (!isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
PILOTS.kuroishi = { name: 'KUROISHI', full: 'Grupo Kuroishi', kanji: '黒', hair: 'slick', role: 'El coche negro' };
PILOTS.akane = { name: 'AKANE', full: 'Akane Hoshino', kanji: '茜', hair: 'long', role: 'La leyenda Onibi' };

// ---------- guardado ----------
const KEY = 'initial-drift-save-v1';
const DEF = { money: 2000, up: {}, paint: {}, story: {}, gp: false, best: {}, trama: 'liso', snd: true, vhs: true, q: TOUCH ? 'lo' : 'hi', auto: TOUCH, car: 'hayate', seen: {} };
let SV; try { SV = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { SV = { ...DEF }; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e) {} };

// ---------- render ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const ink = new Ink(renderer, { lineW: 0, dots: 0, exposure: 1.05, grain: 0, supersample: 1 });
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 1700);
const fx = new FX2D($('#fx')), manga = new MangaPage($('#manga'));
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
let aberr = 0, shake = 0, mode = 'boot';

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(SV.q === 'hi' ? Math.min(2, devicePixelRatio) : Math.min(1, devicePixelRatio)); ink.ssWanted = SV.q === 'hi' ? 1.5 : 1;
  renderer.setSize(w, h); ink.setSize(w, h); camera.aspect = w / h; viewOffset(); if (manga.on) manga.resize();
  const sz = SV.q === 'hi' ? 2048 : 1024; for (const L of [env.key, gKey]) if (L.shadow.mapSize.x !== sz) { L.shadow.mapSize.set(sz, sz); L.shadow.map?.dispose(); L.shadow.map = null; }
}
function viewOffset() {
  const w = innerWidth, h = innerHeight;
  if (mode === 'garage') { const narrow = w < 820 || h > w; if (narrow) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.setViewOffset(w, h, w * 0.17, h * 0.02, w, h); } else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

// ---------- escena del garaje ----------
const gar = new THREE.Scene(); gar.background = new THREE.Color('#f3f2ee');
gar.add(new THREE.HemisphereLight(0xffffff, 0xc9c4b8, 1.3));
const gKey = new THREE.DirectionalLight(0xfff4e6, 2.3); gKey.position.set(4, 10, -5); gKey.castShadow = true;
Object.assign(gKey.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); gKey.shadow.bias = -0.0006; gar.add(gKey);
const GM = { liso: { w: new THREE.MeshStandardMaterial({ color: '#f3f2ee', roughness: 0.95 }), b: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.85 }), r: new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.8 }), rl: new THREE.MeshStandardMaterial({ color: '#46464c', roughness: 0.8 }) },
  toon: { w: new THREE.MeshToonMaterial({ color: '#f3f2ee' }), b: new THREE.MeshToonMaterial({ color: '#151517' }), r: new THREE.MeshToonMaterial({ color: '#2a2a2e' }), rl: new THREE.MeshToonMaterial({ color: '#46464c' }) } };
const floorW = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), GM.liso.w); floorW.rotation.x = -Math.PI / 2; floorW.receiveShadow = true; gar.add(floorW);
const fbG = new THREE.PlaneGeometry(600, 600); fbG.rotateX(-Math.PI / 2); fbG.translate(300, 0.002, 0);
const floorB = new THREE.Mesh(fbG, GM.liso.b); floorB.position.set(0.4, 0, 0); floorB.rotation.y = 0.45; floorB.receiveShadow = true; gar.add(floorB);
const RAMP = 0.16, rampParts = [];
const rb = new THREE.Mesh(new THREE.BoxGeometry(5.2, RAMP, 2.6), GM.liso.r); rb.position.y = RAMP / 2; rb.castShadow = rb.receiveShadow = true; gar.add(rb);
for (const z of [-0.78, 0.78]) { const s = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.02, 0.5), GM.liso.rl); s.position.set(0, RAMP + 0.01, z); s.receiveShadow = true; gar.add(s); rampParts.push([s, 'rl']); }
for (const x of [-2.8, 2.8]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 2.6), GM.liso.r); w.position.set(x, 0.05, 0); w.rotation.z = x > 0 ? -0.13 : 0.13; w.receiveShadow = true; gar.add(w); rampParts.push([w, 'r']); }
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.minDistance = 2.8; controls.maxDistance = 14; controls.maxPolarAngle = 1.62; controls.enablePan = false; controls.enabled = false; controls.autoRotateSpeed = 0.6;

// ---------- escena de carrera ----------
const race = new THREE.Scene();
const env = createEnv(race); env.set('noche');
const effects = new Effects(race); effects.cam = camera;
const headL = new THREE.SpotLight(0xfff1d0, 0, 70, 0.55, 0.55, 1.2); race.add(headL, headL.target);
let track = null;

// ---------- coches ----------
const RIV = { kuroishi: KUROISHI, akane: AKANE };
function spec(id) { if (RIV[id]) { const R = RIV[id]; return { ...CARS.find((c) => c.id === R.base), ...R }; } const S = CARS.find((c) => c.id === id), p = SV.paint[id]; return p ? { ...S, color: p } : S; }
const accent = (id) => (DATA[id] ? DATA[id].accent : RIV[id].accent);
const carName = (id) => (RIV[id] ? RIV[id].name : CARS.find((c) => c.id === id).name);
const physOf = (id) => (DATA[id] ? { ...DATA[id].phys } : id === 'kuroishi' ? { ...DATA.kurogane.phys, vmax: 70, accel: 10.2 } : { ...DATA.onibi.phys, vmax: 73 });
const nameOf = (id) => RIVAL_NAMES[id] || `${PILOTS[id].name} · ${carName(id)}`;
const COST = [2500, 5000, 9000];
function physUp(id) { const P = physOf(id), u = SV.up[id] || {}; P.accel *= 1 + 0.07 * (u.motor || 0); P.vmax *= 1 + 0.035 * (u.motor || 0); P.grip *= 1 + 0.06 * (u.agarre || 0); P.nitro *= 1 + 0.1 * (u.nitro || 0); return P; }
const carCache = new Map(); let envK = 0.6;
function getCar(id) { const S = spec(id), k = id + '|' + S.color; let c = carCache.get(k); if (!c) { c = buildCar(S); addFlames(c); carCache.set(k, c); } c.userData.cid = id; styleCar(c); return c; }
function styleCar(c) {
  setCarStyle(c, SV.trama);
  if (SV.trama === 'liso') for (const m of Object.values(c.userData.MS)) if (m.envMap !== envTex || m.envMapIntensity !== envK) { m.envMap = envTex; m.envMapIntensity = envK; m.needsUpdate = true; }
}
function pose(c) { c.rotation.set(0, 0, 0); c.userData.inner.rotation.set(0, 0, 0); if (c.userData.flames) c.userData.flames.visible = false; for (const f of c.userData.front) f.rotation.y = 0; c.updateMatrixWorld(true); }

// ---------- trama sí / no ----------
function applyTrama() {
  const t = SV.trama === 'toon', U = ink.mat.uniforms;
  U.lineW.value = t ? 1.25 : 0; U.dots.value = t ? 0.42 : 0; U.grain.value = t ? 0.02 : 0;
  const m = GM[SV.trama]; floorW.material = m.w; floorB.material = m.b; rb.material = m.r; for (const [o, k] of rampParts) o.material = m[k];
  gar.environment = t ? null : envTex;
  for (const c of carCache.values()) if (c.parent) styleCar(c);
  $$('.seg.trama button').forEach((b) => b.classList.toggle('on', b.dataset.s === SV.trama)); save();
}
function setTrama(s) { SV.trama = s; applyTrama(); aberr = 20; fx.glitch(0.25); AU.sfx('glitch'); if (mode === 'race' || mode === 'pause') banner(s === 'toon' ? 'CON TRAMA · トーン' : 'SIN TRAMA', 1); }
$$('.seg.trama button').forEach((b) => b.addEventListener('click', () => setTrama(b.dataset.s)));

// ---------- clima ----------
const ENVK = { noche: 0.16, niebla: 0.18, lluvia: 0.28, nublado: 0.42, amanecer: 0.38, dia: 0.6 };
function setWeather(w) { env.set(w, track); envK = ENVK[w] ?? 0.4; ink.mat.uniforms.exposure.value = WEATHERS[w].exp; headL.intensity = WEATHERS[w].lamps ? 160 : 0; }

// ---------- pantallas ----------
function screen(id) { $$('.scr').forEach((s) => s.classList.toggle('on', s.id === id || (id === 'race' && s.id === 'hud'))); $('#touch').classList.toggle('on', TOUCH && id === 'race'); controls.enabled = mode === 'garage'; viewOffset(); }
function vhs(on, osdOn = true) { const v = on && SV.vhs; $('#vhs').classList.toggle('on', v); $$('.osd').forEach((o) => (o.style.display = v && osdOn ? '' : 'none')); }
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
let tc = 0; function osd(dt) { tc += dt; if (((tc * 4) | 0) !== (((tc - dt) * 4) | 0)) { const s = tc | 0; $('#osdR').textContent = `SP ${String((s / 3600) | 0)}:${String(((s / 60) | 0) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; } }
{ const d = new Date(); $('#osdB').textContent = `${MONTHS[d.getMonth()]}. ${d.getDate()} ${d.getFullYear()}  ${d.getHours() >= 12 ? 'PM' : 'AM'} ${String(d.getHours() % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
let bannerT = 0; function banner(txt, t = 1.6) { $('#banner').innerHTML = `<div>${txt}</div>`; bannerT = t; }

// ---------- título y demo ----------
let started = false, demo = null;
function clearRace() { for (const c of carCache.values()) if (c.parent === race) race.remove(c); effects.clear(); demo = null; RC = null; }
function startDemo() {
  clearRace(); const id = pick(CARS).id; setWeather(pick(['noche', 'amanecer', 'dia', 'lluvia', 'nublado', 'noche']));
  const car = getCar(id); pose(car); race.add(car);
  const R = new Rival(car, track, { skill: 1.08, vmax: physOf(id).vmax, lat: 0 }); R.u = 0.08 + rnd() * 0.55; R.speed = 24;
  demo = { id, car, R, shot: -1, shotT: 0, fixed: new THREE.Vector3() };
}
function goTitle() {
  mode = 'title'; screen('title'); vhs(true); controls.enabled = false; viewOffset(); if (!demo) startDemo();
  $('#press').style.display = started ? 'none' : ''; $('#mainMenu').classList.toggle('on', started); $('#title').classList.toggle('menu', started); if (started) AU.playMusic('menu');
}
function pressStart() {
  if (started || mode !== 'title' || !track) return; started = true; AU.unlock(); AU.setOn(SV.snd); AU.playMusic('menu'); AU.sfx('go');
  fx.pop('ドンッ!', innerWidth * 0.5, innerHeight * 0.32, { size: Math.min(180, innerWidth * 0.16), color: '#ffd23f', shadow: '#ff2a6d' }); fx.glitch(0.4); aberr = 30; $('#logo').classList.add('shake');
  $('#press').style.display = 'none'; $('#mainMenu').classList.add('on'); $('#title').classList.add('menu'); selMenu(0);
}
addEventListener('pointerdown', (e) => { if (mode === 'title' && !started) { e.preventDefault(); pressStart(); } });
for (const ev of ['pointerup', 'touchend', 'keydown']) addEventListener(ev, () => { if (started) AU.unlock(); }, { passive: true });
let menuSel = 0; const menuItems = $$('.mi');
function selMenu(i) { menuSel = (i + menuItems.length) % menuItems.length; menuItems.forEach((m, k) => m.classList.toggle('sel', k === menuSel)); }
menuItems.forEach((m, i) => { m.addEventListener('pointerenter', () => selMenu(i)); m.addEventListener('click', () => menuGo(m.dataset.go)); });
function menuGo(go) {
  AU.sfx('click'); fx.glitch(0.2); aberr = 16;
  if (go === 'story') goStory(); if (go === 'free') goFree(); if (go === 'garage') goGarage(); if (go === 'opts') goOpts();
}
function demoCam(dt) {
  const D = demo, R = D.R, c = D.car; R.update(dt, R.progress(), true);
  if (R.done || R.u > 0.985) { startDemo(); return demoCam(0); }
  const fwd = new THREE.Vector3(Math.cos(R.h), 0, -Math.sin(R.h)), side = new THREE.Vector3(fwd.z, 0, -fwd.x);
  D.shotT -= dt;
  if (D.shotT <= 0) {
    D.shot = (D.shot + 1) % 3; D.shotT = 4.5 + rnd() * 2; if (dt > 0) { aberr = 22; fx.glitch(0.22); }
    if (D.shot === 1) { const a = track.at(Math.min(0.99, R.u + 55 / track.len), (rnd() < 0.5 ? -1 : 1) * 4.6); D.fixed.copy(a.pos).add(new THREE.Vector3(0, 0.5 + rnd() * 1.4, 0)); }
  }
  const look = c.position.clone().add(new THREE.Vector3(0, 0.7, 0));
  if (D.shot === 0) { camera.position.copy(c.position).addScaledVector(fwd, -6.2).addScaledVector(side, 1.2).add(new THREE.Vector3(0, 2.0, 0)); look.addScaledVector(fwd, 3); camera.fov = 58; }
  if (D.shot === 1) { camera.position.copy(D.fixed); camera.fov = 38; if (camera.position.distanceTo(c.position) > 70 && D.shotT < 3.5) D.shotT = 0; }
  if (D.shot === 2) { camera.position.copy(c.position).addScaledVector(fwd, 5.6).addScaledVector(side, -2.2).add(new THREE.Vector3(0, 0.55, 0)); camera.fov = 52; }
  camera.updateProjectionMatrix(); camera.lookAt(look);
  carFx(c, 'demo', R.slip * 1.2, R.speed, false, accent(D.id), dt, 0.8);
  env.update(dt, c.position);
}

// ---------- garaje ----------
let gi = 0, garCar = null, wipe = null, boil = 0, boilT = 0;
function goGarage(i) {
  mode = 'garage'; screen('garage'); vhs(true); controls.enabled = true; controls.autoRotate = true;
  camera.fov = 50; camera.position.set(4.1, 1.05, -4.0).multiplyScalar(innerWidth < 820 || innerHeight > innerWidth ? (innerHeight > innerWidth ? 2.1 : 1.3) : 1); controls.target.set(-0.15, 0.62, 0); controls.update(); viewOffset();
  showGarCar(i ?? CARS.findIndex((c) => c.id === SV.car), false); $('#money').textContent = yen(SV.money);
}
function showGarCar(i, withFx = true) {
  gi = (i + CARS.length) % CARS.length; const S = CARS[gi], id = S.id, D = DATA[id], acc = D.accent;
  if (garCar) gar.remove(garCar); garCar = getCar(id); pose(garCar); garCar.position.set(0, RAMP, 0); for (const f of garCar.userData.front) f.rotation.y = 0.22; gar.add(garCar);
  document.documentElement.style.setProperty('--acc', acc);
  $('#gName').textContent = S.name; $('#gKana').textContent = S.kana; $('#gOwner').textContent = `PILOTO · ${PILOTS[id].full.toUpperCase()} · ${PILOTS[id].age} AÑOS`;
  $('#gStamp').textContent = D.ilegal ? 'ILEGAL · 違法' : 'TRUCADO · 改'; $('#gQuote').textContent = `«${PILOTS[id].quote}»`;
  $('#gList').innerHTML = CARS.map((c, k) => `<div data-i="${k}" class="${k === gi ? 'on' : ''}">${c.name}</div>`).join('');
  $$('#gList div').forEach((d) => d.addEventListener('click', () => showGarCar(+d.dataset.i)));
  renderSheet(); SV.car = id; save();
  if (withFx) { aberr = 26; wipe = { t: 0, acc, parts: makeSmoke(), sparks: makeSparks() }; fx.pop(D.ono, innerWidth * 0.3, innerHeight * 0.32, { size: Math.min(150, innerWidth * 0.11), rot: -0.15, vy: 0 }); AU.sfx('glitch'); }
}
function renderSheet() {
  const id = CARS[gi].id, D = DATA[id], u = SV.up[id] || {}, S = CARS[gi];
  const bars = { ...D.bars }; bars.Potencia = Math.min(1, bars.Potencia + 0.05 * (u.motor || 0)); bars.Par = Math.min(1, bars.Par + 0.05 * (u.motor || 0)); bars.Agarre = Math.min(1, bars.Agarre + 0.05 * (u.agarre || 0)); bars.Nitro = Math.min(1, bars.Nitro + 0.06 * (u.nitro || 0));
  const UP = [['motor', 'MOTOR', '+7% aceleración · +3,5% punta'], ['agarre', 'AGARRE', '+6% agarre lateral'], ['nitro', 'NITRO', '+10% empuje de la botella']];
  const best = SV.best[id + '|0'], bestR = SV.best[id + '|1'];
  $('#sheet').innerHTML = `<h3>FICHA TÉCNICA <span>${D.stage}${D.ilegal ? ' · ILEGAL' : ''}</span></h3>
    ${Object.entries(bars).map(([k, v]) => `<div class="bar"><span>${k.toUpperCase()}</span><i style="--v:${Math.round(v * 100)}%"><b></b></i><em>${Math.round(v * 100)}</em></div>`).join('')}
    <table class="tech">${D.tech.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}
    <tr><td>Récord bajada</td><td>${best ? fmtT(best) : '—'}</td></tr><tr><td>Récord subida</td><td>${bestR ? fmtT(bestR) : '—'}</td></tr></table>
    <h3 style="margin-top:16px">TRUCADO · 改造</h3><div class="chips">${D.mods.map((m) => `<span>${m}</span>`).join('')}</div>
    <h3 style="margin-top:16px">MEJORAS · チューン <span>${yen(SV.money)}</span></h3>
    ${UP.map(([k, n, d]) => { const lv = u[k] || 0, cost = COST[lv]; return `<div class="upg"><div>${n}<div style="font:700 10px 'Zen Kaku Gothic New';color:#a9a49a;letter-spacing:.04em">${d}</div></div><div class="pips">${[0, 1, 2].map((j) => `<i class="${j < lv ? 'f' : ''}"></i>`).join('')}</div><button data-up="${k}" ${lv >= 3 || SV.money < cost ? 'disabled' : ''}>${lv >= 3 ? 'MÁX' : yen(cost)}</button></div>`; }).join('')}
    <h3 style="margin-top:16px">PINTURA · 塗装</h3><div class="paints"><i data-paint="" title="Original" style="background:${S.color}" class="${!SV.paint[id] ? 'on' : ''}"></i>${PAINTS.filter((p) => p !== S.color).map((p) => `<i data-paint="${p}" style="background:${p}" class="${SV.paint[id] === p ? 'on' : ''}"></i>`).join('')}</div>`;
  $$('#sheet [data-up]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.up, lv = (SV.up[id] || {})[k] || 0; if (lv >= 3 || SV.money < COST[lv]) return; SV.money -= COST[lv]; SV.up[id] = { ...(SV.up[id] || {}), [k]: lv + 1 }; save(); renderSheet(); $('#money').textContent = yen(SV.money); AU.sfx('win'); aberr = 24; fx.pop('チューン!', innerWidth * 0.32, innerHeight * 0.5, { size: 90, color: accent(id) }); fx.pop('UPGRADE!', innerWidth * 0.36, innerHeight * 0.62, { size: 60, comic: true, color: '#fff' }); }));
  $$('#sheet [data-paint]').forEach((b) => b.addEventListener('click', () => { const p = b.dataset.paint || null; if (p) SV.paint[id] = p; else delete SV.paint[id]; save(); showGarCar(gi); fx.pop('シュー!', innerWidth * 0.3, innerHeight * 0.55, { size: 80, color: p || S.color }); }));
}
$('#gPrev').addEventListener('click', () => showGarCar(gi - 1)); $('#gNext').addEventListener('click', () => showGarCar(gi + 1));
$('#gGo').addEventListener('click', () => { SV.car = CARS[gi].id; save(); goFree(); });
// grafitis del garaje sobre el lienzo 2D
function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; };
function makeSmoke() { const r = rng((Date.now() & 0xffff) + 1), W = innerWidth, H = innerHeight; return Array.from({ length: 26 }, () => ({ x: W * (1.1 + r() * 0.5), y: H * (0.62 + r() * 0.4), r: 40 + r() * 90, v: 0.9 + r() * 0.6 })); }
function makeSparks() { const r = rng(7), W = innerWidth, H = innerHeight; return Array.from({ length: 34 }, () => ({ x: W * 0.42, y: H * 0.78, vx: (r() - 0.3) * 900, vy: -200 - r() * 600, c: r() < 0.5 ? '#fff6c2' : '#ffd23f' })); }
const proj = (v) => { const p = v.clone().project(camera); return [((p.x + 1) / 2) * innerWidth, ((1 - p.y) / 2) * innerHeight, p.z]; };
function scribble(g, pts, r, col, w) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + (r() - 0.5) * 3, y + (r() - 0.5) * 3) : g.moveTo(x, y))); g.strokeStyle = col; g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.stroke(); }
function star(g, x, y, s, r, col) { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.45 : s; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } scribble(g, p, r, col, 3); }
function garageDoodles(dt) {
  const g = fx.g; boilT += dt; if (boilT > 0.12) { boil = (boil + 1) % 3; boilT = 0; }
  if (garCar) {
    const S = garCar.userData.S, acc = accent(CARS[gi].id), r = rng(1000 + boil), n = S.cab.length;
    const roof = proj(new THREE.Vector3((S.cab[1][0] + S.cab[n - 4][0]) / 2, RAMP + S.cab[2][1] + 0.35, 0).applyMatrix4(garCar.matrixWorld));
    const rear = proj(new THREE.Vector3(Math.min(...S.body.map((p) => p[0])) - 0.2, RAMP + 1.2, 0).applyMatrix4(garCar.matrixWorld));
    const front = proj(new THREE.Vector3(Math.max(...S.body.map((p) => p[0])) + 0.3, RAMP + 0.7, 0).applyMatrix4(garCar.matrixWorld));
    const cw = 70; scribble(g, [[roof[0] - cw, roof[1]], [roof[0] - cw * 1.1, roof[1] - 60], [roof[0] - cw * 0.45, roof[1] - 25], [roof[0], roof[1] - 75], [roof[0] + cw * 0.45, roof[1] - 25], [roof[0] + cw * 1.1, roof[1] - 60], [roof[0] + cw, roof[1]], [roof[0] - cw, roof[1]]], r, acc, 5);
    star(g, rear[0] - 40, rear[1] - 30, 22, r, acc); star(g, front[0] + 30, front[1] - 120, 16, r, '#141414'); star(g, roof[0] + 150, roof[1] + 40, 12, r, acc);
    for (let k = 0; k < 40; k++) { g.fillStyle = k % 3 ? acc : '#141414'; g.beginPath(); g.arc(front[0] + 60 + r() * 140, front[1] - 80 + r() * 160, r() * 3.5, 0, 6.3); g.fill(); }
    const narrow = innerWidth < 820 || innerHeight > innerWidth; g.save(); g.translate(narrow ? innerWidth * 0.55 : innerWidth * 0.38, narrow ? innerHeight * 0.16 : innerHeight * 0.13); g.font = "34px 'Dela Gothic One'"; g.fillStyle = 'rgba(20,20,20,.16)'; [...S.kana.split(' ')[0]].forEach((ch, i) => g.fillText(ch, 0, i * 38)); g.restore();
  }
  if (wipe) {
    wipe.t += dt; const t = wipe.t, W = innerWidth, acc = wipe.acc;
    for (const p of wipe.parts) { p.x -= W * 1.7 * p.v * dt; p.r *= 1 + dt * 0.25; }
    const alive = wipe.parts.filter((p) => p.x > -p.r * 2);
    g.fillStyle = '#141414'; for (const p of alive) { g.beginPath(); g.arc(p.x, p.y, p.r + 6, 0, 6.3); g.fill(); }
    g.fillStyle = shade(acc, 0.72); for (const p of alive) { g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); }
    g.fillStyle = acc; for (const p of alive) { g.beginPath(); g.arc(p.x - p.r * 0.25, p.y - p.r * 0.25, p.r * 0.62, 0, 6.3); g.fill(); }
    for (const s of wipe.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 1400 * dt; if (t < 0.9) { g.strokeStyle = s.c; g.lineWidth = 3; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); g.stroke(); } }
    if (t > 1.6) wipe = null;
  }
}

// ---------- foto del coche para las viñetas ----------
const shots = {};
function carShot(id) {
  const k = id + '|' + spec(id).color; if (shots[k]) return shots[k];
  const c = getCar(id), prevParent = c.parent; pose(c); c.position.set(0, RAMP, 0); for (const f of c.userData.front) f.rotation.y = 0.3; gar.add(c);
  const pp = camera.position.clone(), pq = camera.quaternion.clone(), pf = camera.fov;
  camera.clearViewOffset(); camera.fov = 34; camera.position.set(4.6, 0.75, -4.4); camera.updateProjectionMatrix(); camera.lookAt(-0.1, 0.55, 0);
  const keepBg = gar.background, ab = ink.mat.uniforms.aberr.value; ink.mat.uniforms.aberr.value = 0; ink.render(gar, camera); ink.mat.uniforms.aberr.value = ab;
  const cv = document.createElement('canvas'); cv.width = 900; cv.height = 560; const g = cv.getContext('2d'), src = renderer.domElement;
  const sa = src.width / src.height, ta = 900 / 560; let sw = src.width, sh = src.height; if (sa > ta) sw = sh * ta; else sh = sw / ta; sw *= 0.92; sh *= 0.92;
  g.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, 900, 560);
  gar.remove(c); if (prevParent && prevParent !== gar) prevParent.add(c); if (garCar === c) gar.add(c);
  camera.position.copy(pp); camera.quaternion.copy(pq); camera.fov = pf; viewOffset(); gar.background = keepBg;
  shots[k] = cv; return cv;
}

// ---------- historia ----------
let storyCid = null;
function goStory() {
  mode = 'story'; screen('story'); vhs(true);
  $('#cards').innerHTML = CARS.map((c, i) => { const d = SV.story[c.id] || 0; return `<div class="card" data-id="${c.id}" style="--c:${accent(c.id)};--r:${[-2, 1.5, -1, 2, -1.5, 1][i]}deg"><canvas width="240" height="220"></canvas><div class="nm">${PILOTS[c.id].name}</div><div class="cr">${c.name.toUpperCase()} · ${PILOTS[c.id].role.toUpperCase()}</div><div class="pg">${Math.min(d, 4)}/4${d >= 5 ? ' ★' : ''}</div>${d >= 4 ? '<div class="done">SUPERADO</div>' : ''}</div>`; }).join('');
  $$('#cards .card').forEach((el) => { drawCard(el.querySelector('canvas'), el.dataset.id); el.addEventListener('click', () => { MangaPage.askGyro(); AU.sfx('click'); goChapters(el.dataset.id); }); });
}
function drawCard(cv, id) {
  const g = cv.getContext('2d'), acc = accent(id); g.fillStyle = acc; g.fillRect(0, 0, 240, 220);
  g.fillStyle = 'rgba(20,20,20,.22)'; for (let y = 0; y < 220; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 240; x += 8) { g.beginPath(); g.arc(x, y, 1.6 + (y / 220) * 1.4, 0, 6.3); g.fill(); }
  g.strokeStyle = 'rgba(20,20,20,.5)'; g.lineWidth = 2; for (let k = 0; k < 36; k++) { const a = (k / 36) * 6.283; g.beginPath(); g.moveTo(120 + Math.cos(a) * 95, 100 + Math.sin(a) * 95); g.lineTo(120 + Math.cos(a) * 220, 100 + Math.sin(a) * 220); g.stroke(); }
  drawPilot(g, 120, 104, 0.66, id, '#efebe1');
  g.font = "26px 'Dela Gothic One'"; g.fillStyle = '#141414'; g.save(); g.translate(12, 30); g.rotate(-0.08); g.fillText(DATA[id].ono, 0, 0); g.restore();
}
function goChapters(cid) {
  storyCid = cid; mode = 'chapters'; screen('chapters'); vhs(true); document.documentElement.style.setProperty('--acc', accent(cid));
  const done = SV.story[cid] || 0; $('#chName').textContent = `${PILOTS[cid].name} · ${carName(cid)}`;
  $('#chList').innerHTML = [0, 1, 2, 3, 4].map((n) => { const ch = chapter(cid, n), lock = n > done || (n === 4 && done < 4); return `<div class="chap ${lock ? 'lock' : ''}" data-n="${n}" style="--c:${accent(cid)}"><div class="n">${n < 4 ? n + 1 : '+'}</div><div><div class="t">${lock ? '???' : ch.title}</div><div class="s">${lock ? (n === 4 ? 'Supera la historia para abrir el GAME+' : 'Bloqueado') : `${WEATHERS[ch.weather].label} · ${ch.reverse ? 'SUBIDA' : 'BAJADA'} · rival: ${nameOf(ch.rival)}${n === 1 ? ' · no hace falta ganar' : ''}`}</div></div>${n < done ? '<div class="ok">✓ HECHO</div>' : !lock ? '<div class="ok">NUEVO ▶</div>' : ''}</div>`; }).join('');
  $$('#chList .chap').forEach((el) => el.addEventListener('click', () => { if (el.classList.contains('lock')) { AU.sfx('lose'); return; } AU.sfx('go'); startChapter(cid, +el.dataset.n); }));
}
function startChapter(cid, n) { const ch = chapter(cid, n); showManga([introPage(cid, ch)], () => startRace({ car: cid, rival: ch.rival, weather: ch.weather, reverse: ch.reverse, skill: ch.skill, story: { cid, n, ch } })); }
function introPage(cid, ch) {
  const acc = accent(cid), racc = accent(ch.rival);
  return { vhs: ch.vhs ? (ch.n === 1 ? 'NOCHE DE NIEBLA · REC ●' : 'CINTA · BAJADA DEL AMANECER 2016 ◀◀') : null, panels: [
    { lines: true, title: ch.n < 4 ? `CAP. ${ch.n + 1}` : 'GAME+', sub: `${ch.title} · ${WEATHERS[ch.weather].label}`, accent: acc, narr: ch.narr },
    { tone: 'rgba(20,20,20,.28)', pilot: cid, accent: acc, pilotX: 0.72, say: ch.me, sayX: 0.04, sayY: 0.08 },
    { bg: '#2a2a2e', tone: 'rgba(255,255,255,.1)', pilot: ch.rival, accent: racc, pilotX: 0.28, say: ch.them, sayX: 0.4, sayY: 0.08 },
    { img: carShot(cid), cover: true, sfx: DATA[cid].ono, sfxC: acc } ] };
}
const WIN_LINE = { hayate: 'Y ni he llegado tarde al reparto.', kurogane: 'Esto no lo ha comprado mi apellido.', tsubame: 'Con cabeza. Siempre con cabeza.', sakura: 'Firmado. Con humo rosa.', pico: '¡¿Lo habéis visto?! ¡Un kei! ¡UN KEI!', onibi: 'Los neumáticos se acordaban.' };
const FINAL_LINE = { hayate: 'Papá, la he terminado. Tu línea.', kurogane: 'Ahora sí puedo mirar a este puerto a la cara.', tsubame: 'Ya no me tiemblan las manos.', sakura: 'Mamá, mira: ahora firmo con mi nombre.', pico: '¡Pequeño pero matón, os lo dije!', onibi: 'Por ti, Akane. Diez años después.' };
const EPI = {
  hayate: 'Kai cruza la meta con el sol en la cara. Ya no reparte de noche: los sábados enseña a los críos del barrio a bajar el puerto. La línea de su padre sigue viva.',
  kurogane: 'Ren entrega la cinta a la policía. El Grupo Kuroishi se hunde. Se queda con un coche negro y un apellido que ahora tendrá que ganarse.',
  sakura: 'Mika pinta el último tag en la meta: 鬼火. Y debajo, por primera vez, su propio nombre.',
  tsubame: 'Daichi cuenta lo que vio hace diez años. Esa misma tarde vuelve a correr bajo la lluvia, solo por gusto.',
  pico: 'La cinta de Yuto sale en todas las noticias. El kei amarillo lleva una pegatina nueva: 伝説, leyenda.',
  onibi: 'Gen vuelve a abrir el taller. En la persiana alguien ha pintado: «Diez años después, el fuego sigue».',
};
function outcomePage(cid, ch, win) {
  const acc = accent(cid), racc = accent(ch.rival);
  if (ch.n === 1) return { vhs: 'NOCHE DE NIEBLA · REC ●', panels: [
    { lines: true, sfx: 'ガシャン!!', sfxC: '#ff2a3d', narr: 'El volante se queda muerto en plena curva. Humo negro, chispas y el quitamiedos. Esa noche el puerto se queda en silencio.' },
    { tone: 'rgba(20,20,20,.55)', pilot: cid, accent: acc, pilotX: 0.7, say: 'No... así no... ¿quién ha tocado mi coche?', sayX: 0.04, sayY: 0.06 },
    { bg: '#141414', pilot: 'kuroishi', accent: '#ff2a3d', pilotX: 0.3, say: 'En Kirisame manda Kuroishi. Acostúmbrate.', sayX: 0.38, sayY: 0.06 },
    { bg: '#141414', tone: 'rgba(255,255,255,.1)', title: 'CAÍDA', sub: 'CONTINUARÁ... 続く', accent: '#ff2a3d' } ] };
  if (ch.n === 3) return { panels: [
    { bg: '#ffd9b0', lines: true, sfx: '夜明け', sfxC: '#ffb27a', narr: EPI[cid] },
    { tone: 'rgba(255,178,122,.45)', pilot: cid, accent: acc, pilotX: 0.72, say: FINAL_LINE[cid], sayX: 0.04, sayY: 0.08 },
    { bg: '#2a2a2e', pilot: 'kuroishi', accent: '#ff2a3d', pilotX: 0.28, say: 'Imposible... Kuroishi... ha perdido.', sayX: 0.4, sayY: 0.08 },
    { img: carShot(cid), cover: true, title: 'FIN · 完', sub: 'GAME+ ABIERTO: LA SUBIDA', accent: acc } ] };
  if (ch.n === 4) return { panels: [
    { lines: true, sfx: '鬼火', sfxC: '#ff7a1a', narr: 'Akane baja del coche naranja y se quita el casco. Sonríe por primera vez en diez años.' },
    { bg: '#2a2a2e', pilot: 'akane', accent: '#ff7a1a', pilotX: 0.28, say: 'El Kirisame vuelve a tener dueños. Cuidádmelo.', sayX: 0.4, sayY: 0.08 },
    { tone: 'rgba(20,20,20,.28)', pilot: cid, accent: acc, pilotX: 0.72, say: 'Prometido.', sayX: 0.06, sayY: 0.1 },
    { img: carShot(cid), cover: true, title: 'LEYENDA', sub: 'TRUE END · 真エンド', accent: acc } ] };
  return { panels: [
    { lines: true, sfx: '勝!', sfxC: acc, narr: `${PILOTS[cid].name} cruza la meta primero. El humo de color aún flota en la última curva.` },
    { tone: 'rgba(20,20,20,.28)', pilot: cid, accent: acc, pilotX: 0.72, say: WIN_LINE[cid], sayX: 0.04, sayY: 0.08 },
    { bg: '#2a2a2e', tone: 'rgba(255,255,255,.1)', pilot: ch.rival, accent: racc, pilotX: 0.28, say: ch.n === 0 ? 'Tch... la próxima no tendrás tanta suerte.' : 'Ya estás listo. Nos vemos al amanecer.', sayX: 0.4, sayY: 0.08 },
    { img: carShot(cid), cover: true, title: 'CONTINUARÁ', sub: 'SIGUIENTE CAPÍTULO · 続く', accent: acc } ] };
}
let MQ = null;
function showManga(pages, done) { mode = 'manga'; screen(null); vhs(true, false); $('#manga').style.display = 'block'; $('#mangaTap').style.display = 'block'; MQ = { pages, i: 0, done }; manga.show(pages[0]); AU.sfx('pop'); fx.glitch(0.3); }
function mangaNext() {
  if (!MQ || manga.t < 0.6) return; MQ.i++; AU.sfx('pop');
  if (MQ.i < MQ.pages.length) { manga.show(MQ.pages[MQ.i]); return; }
  manga.hide(); $('#manga').style.display = 'none'; $('#mangaTap').style.display = 'none'; const d = MQ.done; MQ = null; d();
}
$('#mangaTap').addEventListener('click', mangaNext);

// ---------- carrera libre ----------
function segPick(el, items, cur, onPick) {
  el.innerHTML = items.map(([v, l, dis]) => `<button data-v="${v}" class="${v === cur ? 'on' : ''}" ${dis ? 'disabled style="opacity:.4"' : ''}>${l}</button>`).join('');
  el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { if (b.disabled) return; el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); AU.sfx('click'); onPick?.(b.dataset.v); }));
}
const segVal = (sel) => $(sel + ' button.on')?.dataset.v;
function goFree() {
  mode = 'free'; screen('free'); vhs(true);
  segPick($('#fCar'), CARS.map((c) => [c.id, c.name.toUpperCase()]), SV.car, (v) => { SV.car = v; save(); });
  const rivals = [['random', 'AL AZAR'], ...CARS.map((c) => [c.id, PILOTS[c.id].name]), ['kuroishi', 'KUROISHI'], ['akane', SV.gp ? 'AKANE' : '???', !SV.gp]];
  segPick($('#fRival'), rivals, 'random');
  segPick($('#fWeather'), [['random', 'AL AZAR'], ...Object.entries(WEATHERS).map(([k, w]) => [k, w.label])], 'random');
  segPick($('#fDir'), [['0', 'BAJADA'], ['1', SV.gp ? 'SUBIDA (GAME+)' : 'SUBIDA 🔒', !SV.gp]], '0');
  segPick($('#fSkill'), [['0.88', 'CHILL'], ['1', 'CALLE'], ['1.12', 'LEYENDA']], '1');
}
$('#fGo').addEventListener('click', () => {
  const car = segVal('#fCar') || 'hayate'; let rival = segVal('#fRival'); if (rival === 'random' || rival === car) rival = pick(CARS.filter((c) => c.id !== car)).id;
  let w = segVal('#fWeather'); if (w === 'random') w = pick(Object.keys(WEATHERS));
  AU.sfx('go'); startRace({ car, rival, weather: w, reverse: segVal('#fDir') === '1', skill: +segVal('#fSkill') || 1, story: null });
});

// ---------- opciones ----------
function goOpts() {
  mode = 'opts'; screen('opts'); vhs(true); applyTrama();
  segPick($('#oSnd'), [['1', 'SÍ'], ['0', 'NO']], SV.snd ? '1' : '0', (v) => { SV.snd = v === '1'; AU.setOn(SV.snd); save(); });
  segPick($('#oVhs'), [['1', 'SÍ'], ['0', 'NO']], SV.vhs ? '1' : '0', (v) => { SV.vhs = v === '1'; vhs(true); save(); });
  segPick($('#oQ'), [['hi', 'ALTA'], ['lo', 'RÁPIDA']], SV.q, (v) => { SV.q = v; save(); resize(); });
  segPick($('#oAuto'), [['1', 'SÍ'], ['0', 'NO']], SV.auto ? '1' : '0', (v) => { SV.auto = v === '1'; save(); });
  $('#oReset').textContent = 'BORRAR PARTIDA';
}
$('#oReset').addEventListener('click', () => { const b = $('#oReset'); if (b.textContent !== '¿SEGURO? PULSA OTRA VEZ') { b.textContent = '¿SEGURO? PULSA OTRA VEZ'; return; } const keep = { trama: SV.trama, snd: SV.snd, vhs: SV.vhs, q: SV.q, auto: SV.auto }; SV = { ...DEF, ...keep, up: {}, paint: {}, story: {}, best: {}, seen: {} }; save(); b.textContent = 'PARTIDA BORRADA'; AU.sfx('crash'); fx.glitch(0.5); });

// ---------- volver ----------
function back() {
  AU.sfx('click');
  if (mode === 'chapters') return goStory();
  if (['story', 'free', 'opts', 'garage'].includes(mode)) { if (mode === 'garage' && garCar) { gar.remove(garCar); garCar = null; } controls.enabled = false; startDemo(); return goTitle(); }
}
$$('[data-back]').forEach((b) => b.addEventListener('click', back));

// ---------- controles ----------
const K = {}, TC = {}; let steerV = 0, camFar = false;
addEventListener('keydown', (e) => {
  K[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (mode === 'title') { if (!started) return pressStart(); if (e.code === 'ArrowDown' || e.code === 'KeyS') selMenu(menuSel + 1); if (e.code === 'ArrowUp' || e.code === 'KeyW') selMenu(menuSel - 1); if (e.code === 'Enter' || e.code === 'Space') menuGo(menuItems[menuSel].dataset.go); return; }
  if (mode === 'manga' && ['Enter', 'Space', 'ArrowRight'].includes(e.code)) return mangaNext();
  if (e.code === 'KeyT') setTrama(SV.trama === 'toon' ? 'liso' : 'toon');
  if (e.code === 'KeyM') { SV.snd = !SV.snd; AU.setOn(SV.snd); save(); }
  if (mode === 'garage') { if (e.code === 'ArrowRight') showGarCar(gi + 1); if (e.code === 'ArrowLeft') showGarCar(gi - 1); }
  if (e.code === 'Escape' && ['story', 'chapters', 'free', 'opts', 'garage'].includes(mode)) back();
  if (mode === 'race' && (e.code === 'Escape' || e.code === 'KeyP')) return pause(true);
  if (mode === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) return pause(false);
  if (mode === 'race' && e.code === 'KeyR') respawn();
  if (mode === 'race' && e.code === 'KeyC') camFar = !camFar;
  if (mode === 'results' && e.code === 'Enter') $('#resBox .big')?.click();
});
addEventListener('keyup', (e) => { K[e.code] = false; });
addEventListener('blur', () => { for (const k in K) K[k] = false; if (mode === 'race') pause(true); });
$$('.tb').forEach((b) => {
  const on = (v) => (e) => { e.preventDefault(); TC[b.dataset.k] = v; b.classList.toggle('down', v); if (v) b.setPointerCapture?.(e.pointerId); };
  b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointercancel', on(false)); b.addEventListener('lostpointercapture', on(false));
});
function readInput(dt) {
  const left = K.ArrowLeft || K.KeyA || TC.left, right = K.ArrowRight || K.KeyD || TC.right, tgt = (left ? 1 : 0) - (right ? 1 : 0);
  steerV += (tgt - steerV) * Math.min(1, dt * (tgt === 0 ? 12 : Math.sign(tgt) !== Math.sign(steerV) ? 14 : 7));
  const brake = !!(K.ArrowDown || K.KeyS || TC.brake);
  return { throttle: !!(K.ArrowUp || K.KeyW || TC.gas || (SV.auto && !brake)), brake, handbrake: !!(K.Space || TC.hb), nitro: !!(K.ShiftLeft || K.ShiftRight || TC.nitro || K.KeyN), steer: steerV };
}
$('#pauseBtn').addEventListener('click', () => pause(true));

// ---------- carrera ----------
const ONO_DRIFT = ['ギャアア', 'キュイイ', 'ズサァッ', 'ギュルル', 'シュバッ'], ONO_CRASH = [['ガシャン!', 0], ['ドガッ!', 0], ['KRASH!', 1], ['BOOM!', 1], ['バキッ!', 0]], ONO_NITRO = [['ゴオオッ!', 0], ['NOS!', 1], ['BOOST!', 1], ['ドンッ!', 0]];
let RC = null;
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function wheelPos(car, front, side, out) { const S = car.userData.S; out.set(front ? S.wx[0] : S.wx[1], 0.06, side * (S.W / 2 - 0.12)); return car.localToWorld(out); }
function carFx(car, key, slip, speed, nitroOn, col, dt, dens = 1) {
  const sl = Math.abs(slip), on = sl > 0.2 && speed > 6;
  for (const s of [1, -1]) {
    const p = wheelPos(car, false, s, _v);
    if (on) { effects.skidAt(key + s, p); if (rnd() < dt * (4 + sl * 14) * dens) effects.puff(p.clone().setY(p.y + 0.3), col, 0.55 + Math.min(sl, 1) * 0.9, _w.set((rnd() - 0.5) * 2, 0.5 + rnd(), (rnd() - 0.5) * 2)); }
    else effects.breakSkid(key + s);
  }
  const fl = car.userData.flames; if (fl) { fl.visible = nitroOn; if (nitroOn) fl.scale.set(0.7 + rnd() * 0.7, 1, 1); }
  if (nitroOn && rnd() < dt * 12) { const p = wheelPos(car, false, 0, _v); p.y += 0.2; const h = car.rotation.y; effects.spark(p, _w.set(-Math.cos(h), 0, Math.sin(h)), 2, '#7fd0ff', '#ffffff'); }
}
function startRace(cfg) {
  clearRace(); setWeather(cfg.weather); controls.enabled = false;
  const pc = getCar(cfg.car), rc = getCar(cfg.rival); pose(pc); pose(rc); race.add(pc, rc);
  const P = new Player(pc, track, physUp(cfg.car), { reverse: cfg.reverse, lat: -1.8 });
  const R = new Rival(rc, track, { reverse: cfg.reverse, skill: cfg.skill, vmax: physOf(cfg.rival).vmax, lat: 1.8 });
  RC = { cfg, P, R, t: 0, state: 'count', count: 3.9, lastC: 4, pos: 2, prevPos: 2, win: false, rivalT: null, endT: 0, playerT: null, sab: 0, hitCd: 0, nitroWas: false, ono: 0,
    D: { live: 0, combo: 1, t: 0, calm: 0, total: 0, best: 0 }, len: (P.iGoal - P.iStart) * track.ds * P.dir, camYaw: P.h, fov: 62 };
  RC.len = Math.abs(RC.len);
  mode = 'race'; screen('race'); vhs(false); viewOffset(); document.documentElement.style.setProperty('--acc', accent(cfg.car));
  $('#prog').innerHTML = `<i style="background:${accent(cfg.rival)}"></i><i style="background:${accent(cfg.car)}"></i>`;
  $('#banner').innerHTML = ''; AU.playMusic('race'); AU.engineStart(); steerV = 0;
  banner(`${nameOf(cfg.car)}  VS  ${nameOf(cfg.rival)}`, 2.6); raceCam(0, true);
}
function respawn() {
  const P = RC.P, s = track.S[P.hint]; P.pos.copy(s.p).addScaledVector(s.l, clamp(P.lat, -2.5, 2.5) * 0.5); P.vx = P.vz = 0; P.w = 0; const f = s.t.clone().multiplyScalar(P.dir); P.h = Math.atan2(-f.z, f.x); P.place(); banner('RECOLOCADO', 0.8); fx.glitch(0.3);
}
function pause(on) {
  if (on && mode === 'race') { mode = 'pause'; screen('pause'); $('#hud').classList.add('on'); AU.engineUpdate(0, 50, false, 0, false); vhs(true); }
  else if (!on && mode === 'pause') { mode = 'race'; screen('race'); vhs(false); }
}
$$('[data-p]').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.p; AU.sfx('click'); if (a === 'go') pause(false); if (a === 'retry') startRace(RC.cfg); if (a === 'quit') quitRace(); }));
function quitRace() { AU.engineStop(); const st = RC?.cfg.story; clearRace(); startDemo(); if (st) { goChapters(st.cid); AU.playMusic('menu'); } else goTitle(); }

function raceCam(dt, init = false) {
  const P = RC.P, vAng = P.speed > 3 ? Math.atan2(-P.vz, P.vx) : P.h, tgt = P.h + angDiff(vAng, P.h) * 0.6;
  RC.camYaw = init ? tgt : RC.camYaw + angDiff(tgt, RC.camYaw) * Math.min(1, dt * 4.5);
  const k = clamp(P.speed / 50, 0, 1), por = innerHeight > innerWidth ? 1 : 0, dist = (camFar ? 8.6 : 5.3 + por * 3.2) + k * 1.1, hgt = (camFar ? 3.2 : 1.75 + por * 1.1) + k * 0.25, fx_ = Math.cos(RC.camYaw), fz = -Math.sin(RC.camYaw);
  const x = P.pos.x - fx_ * dist, z = P.pos.z - fz * dist; let y = P.pos.y + hgt; y = Math.max(y, track.groundY(x, z) + 0.9);
  camera.position.set(x, init ? y : camera.position.y + (y - camera.position.y) * Math.min(1, dt * 10), z);
  if (shake > 0) { camera.position.x += (rnd() - 0.5) * shake; camera.position.y += (rnd() - 0.5) * shake; shake = Math.max(0, shake - dt * 2.5); }
  camera.lookAt(P.pos.x + fx_ * 3.2, P.pos.y + 0.9, P.pos.z + fz * 3.2);
  RC.fov += (62 + por * 16 + k * 11 + (P.nitroOn ? 9 : 0) - RC.fov) * Math.min(1, dt * 3); camera.fov = RC.fov; camera.updateProjectionMatrix();
}
function screenOf(car, dy = 1.2) { _v.copy(car.position); _v.y += dy; const p = proj(_v); return p; }
function updateRace(dt) {
  const { P, R, D, cfg } = RC; let I = readInput(dt);
  RC.hitCd -= dt; RC.ono -= dt;
  if (RC.state === 'count') {
    RC.count -= dt; const c = Math.ceil(RC.count - 0.9);
    if (c !== RC.lastC && c >= 0 && c <= 3) { RC.lastC = c; const W = innerWidth, H = innerHeight;
      if (c > 0) { AU.sfx('beep'); fx.pop(String(c), W / 2, H * 0.38, { size: Math.min(240, W * 0.22), color: accent(cfg.car), rot: 0, vy: 0, life: 0.9 }); fx.pop(['', 'イチ', 'ニ', 'サン'][c], W / 2 + 140, H * 0.5, { size: 54, rot: -0.2, vy: 0, life: 0.9 }); aberr = 10; }
      else { AU.sfx('go'); fx.pop('GO!', W / 2, H * 0.38, { size: Math.min(260, W * 0.24), color: '#ffd23f', comic: true, rot: -0.1, shadow: '#ff2a6d', vy: 0 }); fx.pop('ゴー!', W / 2 + 160, H * 0.54, { size: 64, vy: 0 }); fx.flash('#fff', 0.2); fx.glitch(0.35); aberr = 26; RC.state = 'race'; if ((SV.seen.tut || 0) < 3) { SV.seen.tut = (SV.seen.tut || 0) + 1; save(); banner(TOUCH ? 'GIRA + DERRAPE PARA DERRAPAR · EL NITRO SE CARGA DERRAPANDO' : 'GIRA + ESPACIO = DERRAPE · SHIFT = NITRO (SE CARGA DERRAPANDO)', 3.5); } } }
    AU.engineUpdate(I.throttle ? 30 + rnd() * 6 : 6, 55, I.throttle, 0, false); R.update(dt, 0, false); P.place(); env.update(dt, P.pos); raceCam(dt); hud(); return;
  }
  if (RC.state === 'race') RC.t += dt;
  if (RC.state === 'done') I = { throttle: false, brake: P.speed > 8, handbrake: false, nitro: false, steer: 0 };
  // capítulo de la caída: sabotaje
  const st = cfg.story;
  if (st && st.n === 1 && RC.state === 'race') {
    const pr = P.progress(); if (pr > 0.18) I.steer = clamp(I.steer + 0.16 * Math.sin(RC.t * 1.9), -1, 1);
    if (pr > 0.52 && !RC.sab) { RC.sab = 1; P.P.accel *= 0.42; P.P.vmax *= 0.6; P.P.grip *= 0.85; AU.sfx('crash'); fx.glitch(0.9); fx.flash('#ff2a3d', 0.35); aberr = 40; shake = 0.6; banner('¡SABOTAJE! 妨害', 2.5); const [sx, sy] = screenOf(P.car); fx.pop('ガシャン!!', sx, sy - 40, { size: 120, color: '#ff2a3d' }); }
    if (RC.sab && rnd() < dt * 18) effects.puff(P.car.position.clone().add(_w.set(0, 1, 0)), '#2a2a2e', 1.4);
  }
  const hit = P.update(dt, I, env.W.grip);
  R.update(dt, P.progress(), true);
  if (R.done && RC.rivalT == null) { RC.rivalT = RC.t; if (RC.playerT == null) banner(`${nameOf(cfg.rival)} LLEGA PRIMERO`, 2); }
  // choque con el rival
  const dx = P.pos.x - R.pos.x, dz = P.pos.z - R.pos.z, d = Math.hypot(dx, dz);
  if (d < 2.2 && d > 0.01) { const push = 2.2 - d; P.pos.x += (dx / d) * push; P.pos.z += (dz / d) * push; P.vx *= 0.97; P.vz *= 0.97; R.speed *= 0.985; P.place();
    if (RC.hitCd <= 0) { RC.hitCd = 0.6; AU.sfx('crash'); shake = 0.25; aberr = 18; const [sx, sy] = screenOf(P.car); fx.pop(pick(['ガッ!', 'ゴツッ!', 'BUMP!']), sx, sy - 30, { size: 80, color: accent(cfg.rival) }); effects.spark(P.pos.clone().lerp(R.pos, 0.5).setY(P.pos.y + 0.4), _w.set(dx / d, 0, dz / d), 14, '#ffe27a', accent(cfg.rival)); } }
  // choque con el muro
  if (hit > 4 && RC.hitCd <= 0) {
    RC.hitCd = 0.5; AU.sfx('crash'); shake = clamp(hit / 20, 0.15, 0.7); aberr = 18 + hit; fx.glitch(0.3); const [sx, sy] = screenOf(P.car); const o = pick(ONO_CRASH); fx.pop(o[0], sx, sy - 30, { size: 90 + hit * 3, color: '#ff2a3d', comic: !!o[1] });
    effects.spark(P.pos.clone().setY(P.pos.y + 0.4), _w.set(0, 0, 0), 22, '#ffe27a', '#ff7a1a');
    if (D.live > 0) { fx.pop(`-${Math.round(D.live)}`, sx + 70, sy + 30, { size: 46, color: '#888', vy: 40 }); D.live = 0; D.t = 0; D.combo = 1; }
  }
  // derrape y puntos
  const sl = Math.abs(P.slip), drifting = sl > 0.22 && P.speed > 8 && RC.state === 'race';
  if (drifting) {
    D.t += dt; D.calm = 0; const cmb = Math.min(5, 1 + Math.floor(D.t / 1.5)); if (cmb > D.combo) { D.combo = cmb; AU.sfx('pop'); const [sx, sy] = screenOf(P.car, 2); fx.pop(`x${cmb}`, sx + 90, sy - 20, { size: 64, color: '#ff2a6d', comic: true }); }
    D.live += dt * P.speed * Math.min(sl, 1.2) * 40 * D.combo; P.nitro = Math.min(1, P.nitro + dt * 0.12 * Math.min(sl, 1.1));
    if (RC.ono <= 0) { RC.ono = 0.9 + rnd() * 0.7; const [sx, sy] = screenOf(P.car, 1.5); fx.pop(pick(ONO_DRIFT), sx + (rnd() - 0.5) * 200, sy - 40 - rnd() * 60, { size: 70 + sl * 50, color: '#fff', shadow: accent(cfg.car) }); }
    const wp = proj(wheelPos(P.car, false, P.slip > 0 ? -1 : 1, _v)); if (wp[2] < 1) fx.scribble(wp[0], wp[1], accent(cfg.car), 26 + sl * 18);
  } else if (D.t > 0) { D.calm += dt; if (D.calm > 0.45 || RC.state !== 'race') bankDrift(); }
  // nitro
  if (P.nitroOn && !RC.nitroWas) { AU.sfx('nitro'); aberr = 30; fx.glitch(0.25); const o = pick(ONO_NITRO), [sx, sy] = screenOf(P.car); fx.pop(o[0], sx - 120, sy, { size: 80, color: '#7fd0ff', comic: !!o[1] }); }
  RC.nitroWas = P.nitroOn;
  // posición
  if (RC.state === 'race') {
    RC.pos = R.done && RC.playerT == null ? 2 : P.progress() >= R.progress() ? 1 : 2;
    if (RC.pos !== RC.prevPos && RC.t > 2) { const [sx, sy] = screenOf(P.car, 2); if (RC.pos === 1) { AU.sfx('pop'); fx.pop(pick(['ヒュン!', 'PASS!', 'シュン!']), sx, sy - 60, { size: 96, color: '#ffd23f', comic: true }); banner('¡ADELANTAMIENTO! 抜いた', 1.2); } else banner('TE PASAN · 抜かれた', 1.2); }
    RC.prevPos = RC.pos;
    if (P.progress() >= 1) { RC.playerT = RC.t; RC.win = RC.rivalT == null; RC.state = 'done'; RC.endT = 2.6; bankDrift(); const W = innerWidth, H = innerHeight;
      if (RC.win) { AU.sfx('win'); fx.pop('勝利!', W / 2, H * 0.36, { size: Math.min(220, W * 0.2), color: '#ffd23f', shadow: '#ff2a6d', vy: 0, life: 2.4, rot: -0.08 }); fx.pop('WINNER', W / 2 + 60, H * 0.56, { size: 80, comic: true, vy: 0, life: 2.4 }); fx.flash('#fff', 0.3); }
      else { AU.sfx('lose'); fx.pop('敗北', W / 2, H * 0.38, { size: Math.min(200, W * 0.18), color: '#9a9a9a', vy: 0, life: 2.4 }); }
      aberr = 30; fx.glitch(0.5); }
    if (RC.rivalT != null && RC.t - RC.rivalT > 25) { RC.playerT = Infinity; RC.win = false; RC.state = 'done'; RC.endT = 1.2; bankDrift(); banner('FUERA DE TIEMPO', 1.5); }
  } else if (RC.state === 'done') { RC.endT -= dt; if (RC.endT <= 0) return showResults(); }
  // efectos y sonido
  carFx(P.car, 'p', P.slip, P.speed, P.nitroOn, accent(cfg.car), dt); carFx(R.car, 'r', Math.abs(R.slip) > 0.3 ? R.slip : 0, R.speed, false, accent(cfg.rival), dt, 0.5);
  AU.engineUpdate(P.speed, P.P.vmax, I.throttle, drifting ? Math.min(1, sl) : 0, P.nitroOn);
  const k = P.speed / P.P.vmax; fx.speed = clamp((k - 0.62) / 0.38, 0, 1) * 0.7 + (P.nitroOn ? 0.45 : 0);
  if (P.nitroOn) aberr = Math.max(aberr, 7);
  headL.position.copy(P.car.localToWorld(_v.set(1.6, 0.9, 0))); headL.target.position.copy(P.car.localToWorld(_v.set(14, -0.5, 0)));
  env.update(dt, P.pos); raceCam(dt); hud();
}
function bankDrift() {
  const D = RC.D; if (D.live > 60) { const pts = Math.round(D.live); D.total += pts; D.best = Math.max(D.best, pts); const [sx, sy] = screenOf(RC.P.car, 2.2);
    fx.pop(`+${pts.toLocaleString('es-ES')}`, sx, sy - 70, { size: 54 + Math.min(40, pts / 120), color: '#ffd23f', comic: true });
    if (pts > 2500) { fx.pop(pts > 6000 ? '神!!' : 'すごい!', sx - 120, sy - 140, { size: 90, color: '#ff2a6d', shadow: '#141414' }); AU.sfx('win'); aberr = 20; } else AU.sfx('pop'); }
  D.live = 0; D.t = 0; D.calm = 0; D.combo = 1;
}
function hud() {
  const { P, R, D } = RC;
  $('#spd .v').textContent = Math.round(P.speed * 3.6); const nb = $('#nitro'); nb.firstElementChild.style.width = `${Math.round(P.nitro * 100)}%`; nb.classList.toggle('full', P.nitro > 0.98);
  $('#pos .p').innerHTML = `${RC.pos}<sup>º</sup>`; const gap = Math.round((P.progress() - R.progress()) * RC.len); $('#pos .gap').textContent = `${gap >= 0 ? '+' : ''}${gap} m`;
  $('#time').textContent = fmtT(RC.t);
  const live = D.live > 0; $('#drift').classList.toggle('live', live); $('#drift .pts').textContent = live ? '+' + Math.round(D.live).toLocaleString('es-ES') : ''; $('#drift .cmb').textContent = live ? `x${D.combo} コンボ` : ''; $('#drift .cmb').style.display = live ? '' : 'none';
  $('#drift .tot').textContent = `DRIFT ${D.total.toLocaleString('es-ES')}`;
  const m = $$('#prog i'); if (m.length === 2) { m[0].style.left = `${clamp(R.progress(), 0, 1) * 100}%`; m[1].style.left = `${clamp(P.progress(), 0, 1) * 100}%`; }
}
function showResults() {
  mode = 'results'; AU.engineStop(); screen('results'); vhs(true); $('#touch').classList.remove('on');
  const { cfg, D, P } = RC, st = cfg.story, win = RC.win, tot = D.total;
  const advance = st && (win || !st.ch.mustWin), sab = st && st.n === 1;
  const rank = win ? (tot >= 20000 ? 'S' : tot >= 9000 ? 'A' : 'B') : tot >= 9000 ? 'C' : 'D';
  const money = (win ? 3500 : 1000) + Math.round(tot / 4 / 50) * 50 + (advance ? 2500 : 0); SV.money += money;
  const bk = cfg.car + '|' + (cfg.reverse ? 1 : 0); let rec = false; if (isFinite(RC.playerT) && RC.playerT != null && (!SV.best[bk] || RC.playerT < SV.best[bk])) { SV.best[bk] = RC.playerT; rec = true; }
  if (advance) { SV.story[st.cid] = Math.max(SV.story[st.cid] || 0, st.n + 1); if (st.n === 3 && !SV.gp) { SV.gp = true; } }
  save();
  const title = sab ? 'SABOTEADO · 妨害' : win ? '¡VICTORIA! · 勝利' : 'DERROTA · 敗北';
  const btns = st ? (advance ? `<div class="big" data-r="story">SEGUIR LA HISTORIA ▶</div><div class="big alt" data-r="retry">REPETIR</div>` : `<div class="big" data-r="retry">REINTENTAR ▶</div><div class="big alt" data-r="chap">CAPÍTULOS</div>`) : `<div class="big" data-r="retry">REVANCHA ▶</div><div class="big alt" data-r="garage">GARAJE</div><div class="big alt" data-r="menu">MENÚ</div>`;
  $('#resBox').innerHTML = `<div class="rk">${rank}</div><div class="w" style="color:${win ? accent(cfg.car) : '#141414'}">${title}</div>
    ${st && !advance ? '<p style="font-weight:900;margin:8px 0 0">Para seguir la historia tienes que ganar esta carrera.</p>' : ''}
    <table><tr><td>Tu tiempo</td><td>${fmtT(RC.playerT ?? Infinity)}${rec ? ' <b style="color:#ff2a6d">RÉCORD</b>' : ''}</td></tr><tr><td>${nameOf(cfg.rival)}</td><td>${RC.rivalT != null ? fmtT(RC.rivalT) : 'sin terminar'}</td></tr>
    <tr><td>Puntos de drift</td><td>${tot.toLocaleString('es-ES')}</td></tr><tr><td>Mejor derrape</td><td>${D.best.toLocaleString('es-ES')}</td></tr><tr><td>Ganancias</td><td>+${yen(money)} <small style="color:#666">(total ${yen(SV.money)})</small></td></tr></table>
    <div class="btns">${btns}</div>`;
  $$('#resBox [data-r]').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.r; AU.sfx('click');
    if (a === 'retry') return startRace(cfg);
    if (a === 'menu') { clearRace(); startDemo(); return goTitle(); }
    if (a === 'garage') { clearRace(); startDemo(); return goGarage(CARS.findIndex((c) => c.id === cfg.car)); }
    if (a === 'chap') { clearRace(); startDemo(); AU.playMusic('menu'); return goChapters(st.cid); }
    if (a === 'story') { AU.playMusic('menu'); const page = outcomePage(st.cid, st.ch, win); clearRace(); startDemo(); showManga([page], () => { goChapters(st.cid); if (st.n === 3) banner('', 0); }); }
  }));
  aberr = 24; fx.glitch(0.4); if (win) fx.pop(rank === 'S' ? 'ヤバい!!' : 'ナイス!', innerWidth * 0.2, innerHeight * 0.22, { size: 110, color: accent(cfg.car), vy: 0, life: 1.6 });
}
function resultsCam(dt) { const P = RC.P, s = track.S[P.hint]; RC.orb = (RC.orb ?? 0) + dt; const f = s.t.clone().multiplyScalar(P.dir), lat = Math.sin(RC.orb * 0.35) * 2.6; camera.position.set(P.pos.x + f.x * 6.2 + s.l.x * lat, P.pos.y + 1.5, P.pos.z + f.z * 6.2 + s.l.z * lat); camera.lookAt(P.pos.x, P.pos.y + 0.55, P.pos.z); camera.fov = 42; camera.updateProjectionMatrix(); env.update(dt, P.pos); }

// ---------- bucle ----------
let last = performance.now();
function loop(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now; osd(dt);
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('#banner').innerHTML = ''; }
  let scene = race;
  if (['title', 'story', 'chapters', 'free', 'opts'].includes(mode) && demo) demoCam(dt);
  else if (mode === 'garage') { scene = gar; controls.update(); }
  else if (mode === 'race') updateRace(dt);
  else if (mode === 'pause') { scene = race; }
  else if (mode === 'results' && RC) resultsCam(dt);
  if (mode !== 'pause') effects.update(dt);
  aberr *= Math.pow(0.03, dt);
  if (mode !== 'manga') { ink.mat.uniforms.aberr.value = aberr + (SV.trama === 'liso' ? 0.6 : 0.2) + (mode === 'race' ? 0 : 0.8); ink.render(scene, camera); }
  if (mode !== 'race') fx.speed = 0;
  fx.draw(mode === 'pause' ? 0 : dt);
  if (mode === 'garage') garageDoodles(dt);
  if (mode === 'manga') manga.draw(dt);
}

// ---------- arranque ----------
addEventListener('resize', resize);
async function boot() {
  $('#press').textContent = 'CARGANDO CINTA...'; screen('title'); $('#title').classList.add('on');
  const fonts = ['Permanent Marker', 'Dela Gothic One', 'Yuji Syuku', 'Zen Kaku Gothic New', 'VT323'];
  const specs = [...fonts.map((f) => `40px '${f}'`), "500 40px 'Zen Kaku Gothic New'", "700 40px 'Zen Kaku Gothic New'", "900 40px 'Zen Kaku Gothic New'"];
  await Promise.race([Promise.all(specs.map((f) => document.fonts.load(f, 'AZaz09¿¡áé峠ドリフト'))), new Promise((r) => setTimeout(r, 5000))]);
  await new Promise((r) => setTimeout(r, 30));
  track = buildTrack(); race.add(track.group);
  applyTrama(); resize(); startDemo(); goTitle();
  $('#press').textContent = TOUCH ? 'TOCA PARA EMPEZAR' : 'PULSA PARA EMPEZAR';
  renderer.setAnimationLoop(loop);
}
boot();
window.__ID = { race, gar, ink, env, stop() { renderer.setAnimationLoop(null); }, tick(n = 1, step = 1 / 60, inp) { if (inp) Object.assign(K, inp); for (let i = 0; i < n; i++) { const now = performance.now(); last = now - step * 1000; loop(now); } return mode; }, K, get RC() { return RC; }, SV, startRace, goGarage, goStory, showManga, introPage, chapter, get mode() { return mode; }, camera, setTrama };
