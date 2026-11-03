// Initial Drift: menús, garaje, campeonato, modos, HUD, controles, guardado y bucle principal.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Renderer } from './render.js';
import { CARS, PAINTS, RIMS, RIM_COLORS, WINGS, LIVERIES, buildCar, animateCar } from './cars.js';
import { SCENES, SCENE_IDS, genTrack, createSky } from './world.js';
import { ghostEncode, ghostDecode } from './vehicle.js';
import { FX } from './fx.js';
import { Race } from './game.js';
import * as AU from './audio.js';
import { TECH, RIVALS } from './data.js';
import { clamp, tween, updateTweens, rng } from './util.js';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const yen = (n) => '¥' + Math.round(n).toLocaleString('es-ES');
const fmt = (t) => { if (!isFinite(t)) return '--:--.---'; const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`; };
const PRICE = { hayate: 0, pico: 0, sakura: 12000, tsubame: 15000, kurogane: 20000, onibi: 30000 };
const CUP_CAR = ['sakura', 'tsubame', 'kurogane', 'onibi'];
const COST = [2500, 5000, 9000];

// ---------------------------------------------------------------- guardado
const KEY = 'initial-drift-v2';
const DEF = { money: 3000, owned: { hayate: 1, pico: 1 }, car: 'hayate', cust: {}, up: {}, champ: {}, best: {}, ghosts: {}, drift: {}, opts: { manga: 0, q: TOUCH ? 'mid' : 'hi', music: 0.6, sfx: 0.8, ctl: 'btn', auto: 0, voice: 0 } };
let SV; try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); SV = { ...DEF, ...raw, opts: { ...DEF.opts, ...(raw.opts || {}) } }; } catch (e) { SV = structuredClone(DEF); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e) { /* lleno: quitamos fantasmas viejos */ SV.ghosts = {}; try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e2) {} } };
const custOf = (id) => SV.cust[id] || {};
function physOf(id) { const S = CARS.find((c) => c.id === id), P = { ...S.phys }, u = SV.up[id] || {}; P.accel *= 1 + 0.07 * (u.motor || 0); P.vmax *= 1 + 0.035 * (u.motor || 0); P.grip *= 1 + 0.06 * (u.agarre || 0); P.nitro *= 1 + 0.1 * (u.nitro || 0); return P; }

// ---------------------------------------------------------------- render y escenas
const R = new Renderer($('#gl')); R.setQuality(SV.opts.q); R.resize(innerWidth, innerHeight);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 2500);
const envTex = new THREE.PMREMGenerator(R.r).fromScene(new RoomEnvironment(), 0.04).texture;
const show = new THREE.Scene(); show.background = new THREE.Color('#efeee9'); show.environment = envTex;
const race = new THREE.Scene(); const sky = createSky(race); const fx = new FX(race);
const ghostMat = new THREE.MeshBasicMaterial({ color: '#7fd8ff', transparent: true, opacity: 0.28, depthWrite: false });
function buildShowroom() {
  show.add(new THREE.HemisphereLight('#ffffff', '#bdb6a8', 0.55));
  const sun = new THREE.DirectionalLight('#fff3e2', 1.7); sun.position.set(4, 9, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); sun.shadow.bias = -0.0004; show.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: '#efeee9', roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; show.add(floor);
  const dg = new THREE.PlaneGeometry(300, 300); dg.rotateX(-Math.PI / 2); dg.translate(150, 0.003, 0);
  const dark = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ color: '#16161a', roughness: 0.9 })); dark.rotation.y = 0.55; dark.position.set(-0.4, 0, 0.6); dark.receiveShadow = true; show.add(dark);
  const wood = new THREE.MeshStandardMaterial({ color: '#2c2c31', roughness: 0.8 });
  for (const z of [-0.8, 0.8]) { const b = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 0.62), wood); b.position.set(0, 0.06, z); b.castShadow = b.receiveShadow = true; show.add(b); for (const x of [-2.9, 2.9]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.62), wood); r.position.set(x, 0.05, z); r.rotation.z = x > 0 ? -0.12 : 0.12; r.receiveShadow = true; show.add(r); } }
  // banderas de pluma
  const flagM = new THREE.MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.7, side: THREE.DoubleSide }), stripeM = new THREE.MeshStandardMaterial({ color: '#d02a2a', roughness: 0.7, side: THREE.DoubleSide }), poleM = new THREE.MeshStandardMaterial({ color: '#9a9ca2', metalness: 0.5, roughness: 0.4 });
  for (let k = 0; k < 3; k++) { const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 6), poleM); pole.position.y = 1.6; g.add(pole);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 2.2); sh.quadraticCurveTo(0.55, 2.6, 0.7, 2.1); sh.lineTo(0.62, 0.1); sh.lineTo(0, 0); const f = new THREE.Mesh(new THREE.ShapeGeometry(sh), flagM); f.position.set(0.03, 0.9, 0); g.add(f);
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.9), stripeM); st.position.set(0.5, 1.95, 0.002); g.add(st);
    g.position.set(-1.6 + k * 1.3, 0, -2.2); g.rotation.y = 0.3; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); show.add(g); }
  // carteles con reloj
  const ck = document.createElement('canvas'); ck.width = ck.height = 128; const g = ck.getContext('2d'); g.fillStyle = '#efe7d6'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c9a14a'; g.beginPath(); g.arc(64, 64, 46, 0, 6.3); g.fill(); g.strokeStyle = '#16161a'; g.lineWidth = 7; g.stroke(); g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 34); g.moveTo(64, 64); g.lineTo(84, 74); g.stroke();
  const ckT = new THREE.CanvasTexture(ck); ckT.colorSpace = THREE.SRGBColorSpace; const signM = new THREE.MeshStandardMaterial({ map: ckT, roughness: 0.7 });
  for (const [x, z, ry] of [[2.3, -1.9, -0.4], [-2.9, 1.2, 0.6]]) { const s = new THREE.Group(); for (const a of [-0.32, 0.32]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.03), signM); p.position.set(0, 0.33, a * 0.36); p.rotation.x = a; s.add(p); } s.position.set(x, 0, z); s.rotation.y = ry; s.traverse((o) => { if (o.isMesh) o.castShadow = true; }); show.add(s); }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 10), new THREE.MeshStandardMaterial({ color: '#ff7a1a' })); cone.position.set(2.9, 0.25, -1.4); cone.castShadow = true; show.add(cone);
}
buildShowroom();
function disposeObj(o) { o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) { (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); } }); }
function makeCar(id, cust = custOf(id)) { const S = CARS.find((c) => c.id === id); const car = buildCar(S, { paint: cust.paint, livery: cust.livery, rims: cust.rims, wing: cust.wing }); car.traverse((o) => { if (o.isMesh && !Array.isArray(o.material) && o.material.isMeshStandardMaterial) o.material.envMap = envTex; if (o.isMesh && Array.isArray(o.material)) o.material.forEach((m) => (m.envMap = envTex)); }); return car; }
let showCar = null, showId = null;
function setShowCar(id, force = false) {
  if (!force && showId === id + JSON.stringify(custOf(id)) && showCar) return;
  if (showCar) { show.remove(showCar); disposeObj(showCar); }
  showCar = makeCar(id); showCar.position.y = 0.12; for (const f of showCar.userData.front) f.rotation.y = 0.28; show.add(showCar); showId = id + JSON.stringify(custOf(id));
}

// ---------------------------------------------------------------- cámaras del showroom
const CAMS = {
  title: { pos: [5.0, 0.75, 3.6], look: [0, 0.6, 0], fov: 36, off: 0.0, orbit: 0.05 },
  menu: { pos: [5.2, 1.6, 4.4], look: [0, 0.55, 0], fov: 34, off: -0.2, orbit: 0.03 },
  garage: { pos: [5.6, 2.6, 5.4], look: [0, 0.5, 0], fov: 33, off: 0.14, orbit: 0 },
  setup: { pos: [3.0, 6.5, 6.0], look: [0, 0.3, 0], fov: 40, off: 0, orbit: 0.02 },
  champ: { pos: [0.5, 9.0, 3.0], look: [0, 0, 0], fov: 45, off: 0, orbit: 0 },
};
const cam = { x: 5, y: 1, z: 4, lx: 0, ly: 0.5, lz: 0, fov: 36, off: 0, orbit: 0, ang: 0 };
function camTo(name, dur = 0.9) { const C = CAMS[name]; cam.orbit = C.orbit; cam.ang = ((cam.ang + Math.PI) % (Math.PI * 2)) - Math.PI; tween(cam, { x: C.pos[0], y: C.pos[1], z: C.pos[2], lx: C.look[0], ly: C.look[1], lz: C.look[2], fov: C.fov, off: C.off, ang: 0 }, dur, 'inOutCubic'); }
function showCamera(dt) {
  cam.ang += dt * cam.orbit; const ca = Math.cos(cam.ang), sa = Math.sin(cam.ang);
  camera.position.set(cam.x * ca - cam.z * sa, cam.y, cam.x * sa + cam.z * ca); camera.lookAt(cam.lx, cam.ly, cam.lz); camera.fov = cam.fov;
  const w = innerWidth, h = innerHeight; if (Math.abs(cam.off) > 0.001) camera.setViewOffset(w, h, w * cam.off, 0, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix();
  R.U.focus.value = camera.position.distanceTo(new THREE.Vector3(cam.lx, cam.ly, cam.lz)); R.U.dof.value = mode === 'champ' ? 1.2 : 0.35;
}

// ---------------------------------------------------------------- capa 2D: onomatopeyas y líneas cinéticas
const fxc = $('#fx2d'), g2 = fxc.getContext('2d'); let pops = [], speedAmt = 0;
function size2d() { const d = Math.min(2, devicePixelRatio); fxc.width = innerWidth * d; fxc.height = innerHeight * d; fxc.style.width = innerWidth + 'px'; fxc.style.height = innerHeight + 'px'; g2.setTransform(d, 0, 0, d, 0, 0); }
size2d();
function draw2d(dt) {
  const W = innerWidth, H = innerHeight; g2.clearRect(0, 0, W, H);
  if (speedAmt > 0.04 && mode === 'race') { const n = (30 + speedAmt * 70) | 0, cx = W / 2, cy = H * 0.5; g2.fillStyle = `rgba(255,255,255,${0.12 + speedAmt * 0.3})`; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r0 = Math.max(W, H) * (0.45 + Math.random() * 0.25) * (1.2 - speedAmt * 0.3), r1 = Math.max(W, H), w = 0.003 + Math.random() * 0.006; g2.beginPath(); g2.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7); g2.lineTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1); g2.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1); g2.fill(); } }
  for (const p of pops) {
    p.t += dt; const k = Math.min(1, p.t * 7), fade = p.t > p.life * 0.7 ? 1 - (p.t - p.life * 0.7) / (p.life * 0.3) : 1, sc = 0.6 + k * 0.4 + (k < 1 ? 0.3 * Math.sin(k * Math.PI) : 0);
    g2.save(); g2.globalAlpha = Math.max(0, fade); g2.translate(p.x * W, p.y * H - p.t * 30); g2.rotate(p.rot); g2.scale(sc, sc);
    const jp = /[぀-ヿ一-鿿]/.test(p.text); g2.font = jp ? `${p.size}px 'Dela Gothic One'` : `italic 900 ${p.size}px 'Kanit'`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
    g2.lineWidth = p.size * 0.16; g2.strokeStyle = '#16161a'; g2.strokeText(p.text, 0, 0); g2.fillStyle = p.color; g2.fillText(p.text, 0, 0); g2.restore();
  }
  pops = pops.filter((p) => p.t < p.life);
}
function pop(text, x, y, color = '#f6f4ef', size = Math.min(90, innerWidth * 0.07), life = 1.0) { pops.push({ text, x, y, color, size, life, t: 0, rot: (Math.random() - 0.5) * 0.35 }); }

// ---------------------------------------------------------------- HUD
let aberrSpike = 0;
const tach = $('#tach'), tg = tach.getContext('2d');
function drawTach(race) {
  const P = race.P, W = 240, c = W / 2; tg.clearRect(0, 0, W, W);
  const k = clamp(Math.abs(P.speed) / P.P.vmax, 0, 1), gears = 5, gi = Math.min(gears - 1, Math.floor(k * gears)), rpm = (0.25 + (k * gears - gi) * 0.75) * 9, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = (v) => a0 + (a1 - a0) * (v / 9);
  tg.fillStyle = 'rgba(22,22,26,.72)'; tg.beginPath(); tg.arc(c, c, 112, 0, 6.3); tg.fill();
  tg.lineWidth = 10; tg.strokeStyle = 'rgba(127,216,255,.25)'; tg.beginPath(); tg.arc(c, c, 104, a0, a1); tg.stroke(); tg.strokeStyle = '#7fd8ff'; tg.beginPath(); tg.arc(c, c, 104, a0, a0 + (a1 - a0) * P.nitro); tg.stroke();
  for (let v = 0; v <= 9; v++) { const a = ang(v); tg.strokeStyle = v >= 7 ? '#ff3d5a' : '#f6f4ef'; tg.lineWidth = 4; tg.beginPath(); tg.moveTo(c + Math.cos(a) * 80, c + Math.sin(a) * 80); tg.lineTo(c + Math.cos(a) * 94, c + Math.sin(a) * 94); tg.stroke(); tg.fillStyle = '#f6f4ef'; tg.font = "italic 700 18px 'Barlow Condensed'"; tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.fillText(v, c + Math.cos(a) * 66, c + Math.sin(a) * 66); }
  const na = ang(rpm); tg.strokeStyle = '#c6f432'; tg.lineWidth = 6; tg.lineCap = 'round'; tg.beginPath(); tg.moveTo(c, c); tg.lineTo(c + Math.cos(na) * 92, c + Math.sin(na) * 92); tg.stroke(); tg.fillStyle = '#16161a'; tg.beginPath(); tg.arc(c, c, 10, 0, 6.3); tg.fill();
  tg.fillStyle = '#f6f4ef'; tg.font = "italic 900 54px 'Kanit'"; tg.fillText(Math.round(Math.abs(P.speed) * 3.6), c + 2, c + 52); tg.font = "italic 700 14px 'Barlow Condensed'"; tg.fillText('KM/H', c, c + 84);
  tg.fillStyle = '#c6f432'; tg.font = "italic 900 30px 'Kanit'"; tg.fillText(P.vF < -0.5 ? 'R' : gi + 1, c + 44, c - 10);
}
const hud = {
  show() { $('#stageCard').innerHTML = ''; },
  count(t) { const el = $('#count'); el.textContent = t; el.classList.toggle('go', t === 'GO!'); el.style.transform = 'translate(-50%,-50%) scale(1.6)'; el.animate([{ transform: 'translate(-50%,-50%) scale(1.8)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 900, fill: 'forwards' }); },
  pop(t, x, y, col) { pop(t, x, y, col); },
  bank(pts, cmb) { pop('+' + pts.toLocaleString('es-ES'), 0.5, 0.3, '#c6f432', Math.min(80, innerWidth * 0.06), 1.3); if (pts > 3000) pop(pts > 8000 ? '神!!' : 'すごい!', 0.32, 0.22, '#ff2d8a', 90, 1.2); },
  lost(pts) { pop('-' + pts.toLocaleString('es-ES'), 0.6, 0.32, '#9a9aa0', 54, 1); },
  note(dir, sev) { const el = $('#note'); el.innerHTML = `<span class="brush lime">${dir > 0 ? 'DERECHA' : 'IZQUIERDA'} ${sev} ${dir > 0 ? '➜' : '⬅'}</span>`; el.classList.add('on'); clearTimeout(this.nt); this.nt = setTimeout(() => el.classList.remove('on'), 1600); if (SV.opts.voice && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(`${dir > 0 ? 'derecha' : 'izquierda'} ${sev}`); u.lang = 'es-ES'; u.rate = 1.35; speechSynthesis.cancel(); speechSynthesis.speak(u); } },
  toast(t) { const el = $('#toast'); el.innerHTML = `<span class="brush dark">${t}</span>`; clearTimeout(this.tt); this.tt = setTimeout(() => (el.innerHTML = ''), 1500); },
  finish(r) { pop(r.cfg.mode === 'duel' ? (r.win ? '勝利! WIN' : '敗北') : 'GOAL!', 0.5, 0.36, r.win ? '#c6f432' : '#f6f4ef', Math.min(140, innerWidth * 0.11), 2.4); },
  update(r) {
    const pp = clamp(r.P.progress(), 0, 1); $('#hPct').textContent = Math.round(pp * 100) + '%'; $('#hTime').textContent = fmt(r.t);
    const D = r.D, live = D.live > 0; $('#hDpts').textContent = live ? '+' + Math.round(D.live).toLocaleString('es-ES') : ''; $('#hDcmb').innerHTML = live ? `<span class="brush pink">x${D.combo} コンボ</span>` : '';
    $('#hDtot').textContent = r.cfg.mode === 'drift' || D.total > 0 ? `DERRAPE ${D.total.toLocaleString('es-ES')}` : '';
    let right = '';
    if (r.cfg.mode === 'duel' || r.cfg.mode === 'champ') right = `<div class="big">${r.pos}º</div><div class="lab">POSICIÓN · ${r.pos === 1 ? 'DELANTE' : 'DETRÁS'}</div>`;
    if (r.cfg.mode === 'time') { const best = SV.best[r.cfg.key]; right = `<div class="big">${best ? fmt(best).slice(0, 8) : '--'}</div><div class="lab">TU RÉCORD · 記録</div>`; }
    if (r.cfg.mode === 'drift') right = `<div class="big">${Math.max(0, Math.ceil(r.cfg.timeLimit - r.t))}s</div><div class="lab">TIEMPO RESTANTE</div>`;
    if (right !== this.lastR) { $('#hRight').innerHTML = right; this.lastR = right; }
    drawTach(r);
  },
};
const ctx = { R, camera, scene: race, sky, fx, hud, ghostMat, flash: (t) => { R.U.flash.value = t; }, aberr: (v) => { aberrSpike = Math.max(aberrSpike, v); }, speedFx: (v) => { speedAmt = v; } };

// ---------------------------------------------------------------- pantallas y transiciones
let mode = 'loading', RACE = null, setupCfg = null;
function screen(id) { $$('.scr').forEach((s) => s.classList.toggle('on', s.id === id || (id === 'race' && s.id === 'hud'))); $('#touch').classList.toggle('on', TOUCH && id === 'race'); }
function wipe(fn) { AU.sfx('swoosh'); const w = $('#wipe'); w.classList.remove('run'); void w.offsetWidth; w.classList.add('run'); aberrSpike = 24; setTimeout(fn, 300); setTimeout(() => w.classList.remove('run'), 700); }
function money() { $$('#mMoney, #gMoney, #cMoney').forEach((e) => (e.textContent = yen(SV.money))); }
function goTitle() { mode = 'title'; screen('title'); setShowCar(SV.car); camTo('title', 0.01); R.setGrade(SHOW_GRADE); }
let started = false;
function start() { if (started) return; started = true; AU.unlock(); AU.setVolumes(SV.opts.music, SV.opts.sfx); AU.playMusic('menu'); tryLandscape(); wipe(goMenu); }
function goMenu() { mode = 'menu'; screen('menu'); money(); setShowCar(SV.car); camTo('menu'); selMenu(menuSel); AU.playMusic('menu'); }
const SHOW_GRADE = { exposure: 0.82, sat: 1.1, contrast: 1.04, lift: [0.015, 0.015, 0.025], gain: [1, 1, 1], shadowTint: [0.8, 0.85, 1.0], hiTint: [1, 0.98, 0.95], gradAmt: 0, vignette: 0.16, grain: 0.03 };
let menuSel = 0; const menuItems = $$('.mi');
function selMenu(i) { menuSel = (i + menuItems.length) % menuItems.length; menuItems.forEach((m, k) => m.classList.toggle('sel', k === menuSel)); }
menuItems.forEach((m, i) => { m.addEventListener('pointerenter', () => { if (menuSel !== i) AU.sfx('hover'); selMenu(i); }); m.addEventListener('click', () => menuGo(m.dataset.go)); });
function menuGo(go) { AU.sfx('click'); wipe(() => { if (go === 'garage') goGarage(); else if (go === 'opts') goOpts(); else if (go === 'champ') goChamp(); else goSetup(go); }); }
function back() { if (mode === 'garage' || mode === 'setup' || mode === 'opts' || mode === 'champ') wipe(goMenu); }
$$('[data-back]').forEach((b) => b.addEventListener('click', () => { AU.sfx('click'); back(); }));
addEventListener('pointerdown', () => { if (mode === 'title') start(); });

// ---------------------------------------------------------------- logos de grafiti
const logoCache = {};
function graffitiLogo(S, big = true) {
  const k = S.id + big; if (logoCache[k]) return logoCache[k];
  const c = document.createElement('canvas'); c.width = big ? 900 : 420; c.height = big ? 340 : 160; const g = c.getContext('2d'), sc = big ? 1 : 0.46;
  g.scale(sc, sc); g.translate(450, 190); g.rotate(-0.06);
  g.font = "160px 'Permanent Marker'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 34; g.strokeStyle = '#16161a'; g.strokeText(S.name, 0, 0); g.fillStyle = '#f6f4ef'; g.fillText(S.name, 0, 0); g.lineWidth = 7; g.strokeStyle = '#16161a'; g.strokeText(S.name, 0, 0);
  const w = g.measureText(S.name).width; g.font = "italic 900 54px 'Kanit'"; g.fillStyle = '#7b4dff'; g.save(); g.translate(-w / 2 - 20, -84); g.rotate(-0.2); g.fillText('the', 0, 0); g.restore();
  g.fillStyle = '#16161a'; g.font = "italic 900 48px 'Kanit'"; g.fillText(S.year, w / 2 + 30, -70);
  g.font = "70px 'Permanent Marker'"; g.lineWidth = 12; g.strokeStyle = '#f6f4ef'; g.strokeText(S.tag, w / 2 + 70, 66); g.fillStyle = '#ff2d8a'; g.fillText(S.tag, w / 2 + 70, 66);
  g.font = "38px 'Dela Gothic One'"; g.fillStyle = '#16161a'; g.fillText(S.kana, -w / 2 + 70, 98);
  return (logoCache[k] = c.toDataURL());
}

// ---------------------------------------------------------------- garaje
let gIdx = Math.max(0, CARS.findIndex((c) => c.id === SV.car)), gTab = 'pintura', gPanel = '';
function goGarage() { mode = 'garage'; screen('garage'); money(); camTo('garage'); showGarage(gIdx); }
function showGarage(i) {
  gIdx = (i + CARS.length) % CARS.length; const S = CARS[gIdx], owned = !!SV.owned[S.id];
  setShowCar(S.id); $('#gLogo').src = graffitiLogo(S, true);
  $('#gStats').innerHTML = `<b>Tracción</b><span>${S.stats.drive}</span><b>Potencia</b><span>${S.stats.hp} CV</span><b>Peso</b><span>${S.stats.kg} KG</span><b>Cambio</b><span>${S.stats.gear}</span>`;
  $('#gList').innerHTML = CARS.map((c, k) => `<div class="it ${k === gIdx ? 'on' : ''} ${SV.owned[c.id] ? '' : 'lock'}" data-i="${k}"><img src="${graffitiLogo(c, false)}">${SV.owned[c.id] ? '' : `<span class="lk">${yen(PRICE[c.id])}</span>`}</div>`).join('');
  $$('#gList .it').forEach((d) => d.addEventListener('click', () => { AU.sfx('click'); showGarage(+d.dataset.i); }));
  $('#gGo').innerHTML = owned ? (SV.car === S.id ? '#EQUIPADO ✓' : '#ELEGIR <span class="key">⏎</span>') : `COMPRAR ${yen(PRICE[S.id])} <span class="key">⏎</span>`;
  $('#gCust').style.display = owned ? '' : 'none';
  aberrSpike = 14; renderPanel();
}
function garageAction() {
  const S = CARS[gIdx];
  if (!SV.owned[S.id]) { if (SV.money < PRICE[S.id]) { AU.sfx('lose'); toastMenu('NO TIENES DINERO SUFICIENTE'); return; } SV.money -= PRICE[S.id]; SV.owned[S.id] = 1; AU.sfx('win'); pop('¡NUEVO!', 0.3, 0.4, '#c6f432', 100, 1.4); }
  SV.car = S.id; save(); money(); showGarage(gIdx); AU.sfx('coin');
}
function toastMenu(t) { pop(t, 0.5, 0.86, '#ff2d8a', Math.min(40, innerWidth * 0.03), 1.6); }
$('#gGo').addEventListener('click', garageAction);
$('#gCust').addEventListener('click', () => { gPanel = gPanel === 'cust' ? '' : 'cust'; AU.sfx('click'); renderPanel(); });
$('#gTech').addEventListener('click', () => { gPanel = gPanel === 'tech' ? '' : 'tech'; AU.sfx('click'); renderPanel(); });
function renderPanel() {
  const el = $('#gPanel'), S = CARS[gIdx], id = S.id; el.classList.toggle('on', !!gPanel); if (!gPanel) return;
  if (gPanel === 'tech') {
    const T = TECH[id], P = physOf(id), bars = { POTENCIA: P.accel / 11.5, PUNTA: P.vmax / 76, AGARRE: P.grip / 9, DERRAPE: P.drift / 1.35, NITRO: P.nitro / 1.5, LIGEREZA: 1 - (S.phys.mass - 600) / 800 };
    el.innerHTML = `<h3>FICHA TÉCNICA · 仕様</h3><div class="bars">${Object.entries(bars).map(([k, v]) => `<div class="bar"><span>${k}</span><i><b style="width:${Math.round(clamp(v, 0.05, 1) * 100)}%"></b></i><em>${Math.round(clamp(v, 0, 1) * 100)}</em></div>`).join('')}</div>
      <table class="tech">${T.tech.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table><h3>TRUCADO · 改造</h3><div class="chips">${T.mods.map((m) => `<span class="chip">${m}</span>`).join('')}</div>`;
    return;
  }
  const cu = custOf(id), tabs = { pintura: 'PINTURA', deco: 'DECORACIÓN', llantas: 'LLANTAS', alerón: 'ALERÓN', mejoras: 'MEJORAS' };
  let body = '';
  if (gTab === 'pintura') body = `<div class="chips">${[S.color, ...PAINTS.filter((p) => p !== S.color)].map((p) => `<button class="chip sw ${(cu.paint || S.color) === p ? 'on' : ''}" data-paint="${p}" style="background:${p}"></button>`).join('')}</div>`;
  if (gTab === 'deco') body = `<div class="chips">${LIVERIES.map((l, k) => `<button class="chip ${(cu.livery ?? S.livery) === k ? 'on' : ''}" data-liv="${k}">${l}</button>`).join('')}</div>`;
  if (gTab === 'llantas') body = `<div class="chips">${RIMS.map((r) => `<button class="chip ${(cu.rims?.style || S.rims.style) === r ? 'on' : ''}" data-rim="${r}">${r.toUpperCase()}</button>`).join('')}</div><h3>COLOR</h3><div class="chips">${RIM_COLORS.map((c) => `<button class="chip sw ${(cu.rims?.color || S.rims.color) === c ? 'on' : ''}" data-rimc="${c}" style="background:${c}"></button>`).join('')}</div>`;
  if (gTab === 'alerón') body = `<div class="chips">${WINGS.map((w) => `<button class="chip ${(cu.wing || S.wing) === w ? 'on' : ''}" data-wing="${w}">${{ none: 'SIN ALERÓN', duck: 'COLA DE PATO', gt: 'GT', 'gt-tall': 'GT ALTO', big: 'GRUPO B' }[w]}</button>`).join('')}</div>`;
  if (gTab === 'mejoras') { const u = SV.up[id] || {}; body = [['motor', 'MOTOR', '+7% aceleración · +3,5% punta'], ['agarre', 'AGARRE', '+6% agarre lateral'], ['nitro', 'NITRO', '+10% empuje']].map(([k, n, d]) => { const lv = u[k] || 0; return `<div class="upg"><div>${n}<div style="font-size:12px;opacity:.6">${d}</div></div><div class="pips">${[0, 1, 2].map((j) => `<i class="${j < lv ? 'f' : ''}"></i>`).join('')}</div><button data-up="${k}" ${lv >= 3 || SV.money < COST[lv] ? 'disabled' : ''}>${lv >= 3 ? 'MÁX' : yen(COST[lv])}</button></div>`; }).join(''); }
  el.innerHTML = `<div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button data-tab="${k}" class="${gTab === k ? 'on' : ''}">${v}</button>`).join('')}</div>${body}`;
  const setC = (patch) => { SV.cust[id] = { ...custOf(id), ...patch }; save(); setShowCar(id, true); AU.sfx('click'); aberrSpike = 12; renderPanel(); };
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { gTab = b.dataset.tab; AU.sfx('click'); renderPanel(); }));
  el.querySelectorAll('[data-paint]').forEach((b) => b.addEventListener('click', () => setC({ paint: b.dataset.paint })));
  el.querySelectorAll('[data-liv]').forEach((b) => b.addEventListener('click', () => setC({ livery: +b.dataset.liv })));
  el.querySelectorAll('[data-rim]').forEach((b) => b.addEventListener('click', () => setC({ rims: { ...(custOf(id).rims || {}), style: b.dataset.rim } })));
  el.querySelectorAll('[data-rimc]').forEach((b) => b.addEventListener('click', () => setC({ rims: { ...(custOf(id).rims || {}), color: b.dataset.rimc } })));
  el.querySelectorAll('[data-wing]').forEach((b) => b.addEventListener('click', () => setC({ wing: b.dataset.wing })));
  el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.up, lv = (SV.up[id] || {})[k] || 0; if (lv >= 3 || SV.money < COST[lv]) return; SV.money -= COST[lv]; SV.up[id] = { ...(SV.up[id] || {}), [k]: lv + 1 }; save(); money(); AU.sfx('win'); pop('チューン!', 0.3, 0.45, '#c6f432', 90, 1.2); renderPanel(); }));
}

// ---------------------------------------------------------------- elección de tramo (1 vs 1, contrarreloj, derrape)
const sceneBg = (id) => { const S = SCENES[id]; return `linear-gradient(180deg, ${S.sky[0]} 0%, ${S.sky[1]} 55%, ${S.ground[0]} 56%, ${S.ground[1]} 100%)`; };
const stageKey = (sc, st, rev) => `${sc}-${st}-${rev ? 1 : 0}`;
function medalTime(t, ref) { return t <= ref * 1.04 ? 'g' : t <= ref * 1.14 ? 's' : t <= ref * 1.28 ? 'b' : 'n'; }
function medalDrift(p, len) { return p >= len * 14 ? 'g' : p >= len * 8 ? 's' : p >= len * 3.5 ? 'b' : 'n'; }
function goSetup(m) {
  mode = 'setup'; screen('setup'); camTo('setup'); setShowCar(SV.car);
  setupCfg = { mode: m, scene: setupCfg?.scene || 'kirisame', stage: setupCfg?.stage ?? 0, rev: false, diff: 1, rival: 'random' };
  $('#sTitle').innerHTML = { duel: 'CARRERA 1 VS 1<span class="jp">バトル</span>', time: 'CONTRARRELOJ<span class="jp">タイムアタック</span>', drift: 'DERRAPE<span class="jp">ドリフト</span>' }[m];
  renderSetup();
}
function renderSetup() {
  const c = setupCfg;
  $('#scenes').innerHTML = SCENE_IDS.map((id, k) => `<div class="card ${c.scene === id ? 'on' : ''}" data-sc="${id}" style="--r:${[-2, 1.5, -1, 2][k]}deg"><div class="ph" style="background:${sceneBg(id)}"><b>${SCENES[id].kana}</b></div><div class="cap">${SCENES[id].name}<small>${SCENES[id].place} · ${SCENES[id].surface}</small></div></div>`).join('');
  $$('#scenes .card').forEach((e) => e.addEventListener('click', () => { c.scene = e.dataset.sc; AU.sfx('click'); renderSetup(); }));
  const tk = [0, 1, 2].map((s) => { const key = stageKey(c.scene, s, c.rev); let md = ''; if (c.mode === 'time' && SV.best[key]) md = `<span class="md">${fmt(SV.best[key]).slice(0, 8)}</span>`; if (c.mode === 'drift' && SV.drift[key]) md = `<span class="md">${SV.drift[key].toLocaleString('es-ES')}</span>`; return `<div class="ticket ${c.stage === s ? 'on' : ''}" data-st="${s}">TRAMO ${s + 1}<small>${SCENES[c.scene].stages[s]}</small>${md}</div>`; }).join('');
  let extra = `<div class="opt"><label>SENTIDO</label><div class="seg" id="sRev"><button class="${c.rev ? '' : 'on'}" data-v="0">BAJADA</button><button class="${c.rev ? 'on' : ''}" data-v="1">SUBIDA</button></div></div>`;
  if (c.mode === 'duel') extra += `<div class="opt"><label>RIVAL</label><div class="seg" id="sRiv">${['random', ...CARS.map((x) => x.id)].map((r) => `<button class="${c.rival === r ? 'on' : ''}" data-v="${r}">${r === 'random' ? 'AL AZAR' : CARS.find((x) => x.id === r).name.toUpperCase()}</button>`).join('')}</div></div><div class="opt"><label>DIFICULTAD</label><div class="seg" id="sDif">${[[0.9, 'FÁCIL'], [1, 'NORMAL'], [1.08, 'DIFÍCIL']].map(([v, l]) => `<button class="${c.diff === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  $('#stageRow').innerHTML = tk + `<div style="display:flex;flex-direction:column;gap:8px;margin-left:12px">${extra}</div>`;
  $$('#stageRow .ticket').forEach((e) => e.addEventListener('click', () => { c.stage = +e.dataset.st; AU.sfx('click'); renderSetup(); }));
  const seg = (sel, fn) => $$(sel + ' button').forEach((b) => b.addEventListener('click', () => { fn(b.dataset.v); AU.sfx('click'); renderSetup(); }));
  seg('#sRev', (v) => (c.rev = v === '1')); seg('#sRiv', (v) => (c.rival = v)); seg('#sDif', (v) => (c.diff = +v));
}
$('#sGo').addEventListener('click', () => { const c = setupCfg; AU.sfx('go'); let rival = null; if (c.mode === 'duel') { const rid = c.rival === 'random' ? CARS.filter((x) => x.id !== SV.car)[(Math.random() * 5) | 0].id : c.rival; rival = { id: rid, skill: c.diff }; } startRace({ mode: c.mode, scene: c.scene, stage: c.stage, reverse: c.rev, rival }); });

// ---------------------------------------------------------------- campeonato (cuaderno)
let cupIdx = 0;
const cupState = (k) => SV.champ[SCENE_IDS[k]] || { stage: 0, pts: {} };
const cupOpen = (k) => k === 0 || cupState(k - 1).stage >= 3;
function trackMap(sc, st) { const T = genTrack(sc, st), c = document.createElement('canvas'); c.width = 260; c.height = 180; const g = c.getContext('2d'); let a = 1e9, b = -1e9, d = 1e9, e = -1e9; for (const s of T.S) { a = Math.min(a, s.p.x); b = Math.max(b, s.p.x); d = Math.min(d, s.p.z); e = Math.max(e, s.p.z); } const k = Math.min(230 / (b - a), 150 / (e - d)); g.fillStyle = '#fff'; g.fillRect(0, 0, 260, 180); g.strokeStyle = '#16161a'; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath(); T.S.forEach((s, i) => { const x = 15 + (s.p.x - a) * k, y = 15 + (s.p.z - d) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.fillStyle = '#c6f432'; const s0 = T.S[T.iStart]; g.beginPath(); g.arc(15 + (s0.p.x - a) * k, 15 + (s0.p.z - d) * k, 8, 0, 6.3); g.fill(); g.fillStyle = '#ff2d8a'; const s1 = T.S[T.iGoal]; g.beginPath(); g.arc(15 + (s1.p.x - a) * k, 15 + (s1.p.z - d) * k, 8, 0, 6.3); g.fill(); return { url: c.toDataURL(), len: T.iGoal - T.iStart }; }
const mapCache = {};
function goChamp() { mode = 'champ'; screen('champ'); money(); camTo('champ'); renderChamp(); }
function renderChamp() {
  const id = SCENE_IDS[cupIdx], SC = SCENES[id], st = cupState(cupIdx), open = cupOpen(cupIdx), done = st.stage >= 3, stage = Math.min(2, st.stage);
  const field = ['TÚ', ...RIVALS.slice(0, 5).map((r) => r.name)], pts = field.map((n) => [n, st.pts[n] || 0]).sort((a, b) => b[1] - a[1]);
  $('#pgL').innerHTML = `<div class="tape" style="left:20px;top:10px">COPA ${cupIdx + 1}/4 · ${SC.name}</div>
    <div class="polaroid" style="left:26px;top:52px;width:52%;height:46%;transform:rotate(-3deg)"><div class="ph" style="background:${sceneBg(id)};display:flex;align-items:flex-end;padding:8px"><b style="font:28px 'Dela Gothic One';color:#fff">${SC.kana}</b></div><div class="cap">${SC.place} · ${SC.surface}</div></div>
    <div style="position:absolute;left:62%;top:60px;font:italic 700 15px 'Barlow Condensed'">${SC.stages.map((n, k) => `<div style="margin:4px 0">${k < st.stage ? '✔' : k === st.stage ? '▶' : '·'} TRAMO ${k + 1}<br><small style="opacity:.6">${n}</small></div>`).join('')}</div>
    <div class="standings">${pts.map(([n, p], k) => `<div class="${n === 'TÚ' ? 'me' : ''}"><span>${k + 1}</span><span>${n}</span><span>${p} PT</span></div>`).join('')}</div>
    ${!open ? '<div class="stamp gray" style="left:30%;top:40%">BLOQUEADA</div>' : done ? '<div class="stamp" style="left:28%;top:38%">¡COPA GANADA!</div>' : ''}`;
  const mk = id + stage; if (!mapCache[mk]) mapCache[mk] = trackMap(id, stage);
  const rw = SV.owned[CUP_CAR[cupIdx]] ? 'YA ES TUYO' : CARS.find((c) => c.id === CUP_CAR[cupIdx]).name.toUpperCase();
  $('#pgR').innerHTML = `<div class="tape" style="right:24px;top:12px;background:#ff2d8a;color:#fff">TRAMO ${stage + 1} · ${SC.stages[stage]}</div>
    <div class="mapc" style="left:30px;top:60px"><img src="${mapCache[mk].url}" style="display:block;width:220px"><div style="font:italic 700 14px 'Barlow Condensed'">DISTANCIA · ${(mapCache[mk].len / 1000).toFixed(2)} KM</div></div>
    <div class="stamp" style="right:24px;top:96px">PREMIO</div>
    <div style="position:absolute;right:26px;top:150px;text-align:right;font:italic 800 18px 'Barlow Condensed'">COCHE: ${rw}<br>+${yen(10000)} AL GANAR LA COPA</div>
    <svg id="keyring" viewBox="0 0 70 120"><circle cx="35" cy="10" r="9" fill="none" stroke="#9aa0a8" stroke-width="4"/><rect x="12" y="22" width="46" height="80" rx="14" fill="#7a4e35"/><rect x="20" y="40" width="30" height="40" rx="6" fill="#c9ccd2"/><text x="35" y="66" font-size="14" text-anchor="middle" font-family="Kanit" font-style="italic" font-weight="900">${CARS.find((c) => c.id === SV.car).name.slice(0, 4).toUpperCase()}</text></svg>
    <div style="position:absolute;left:30px;bottom:20px;display:flex;gap:10px"><span class="brush dark ia" id="cPrev" style="cursor:pointer;pointer-events:auto">◀ COPA</span><span class="brush dark ia" id="cNext" style="cursor:pointer;pointer-events:auto">COPA ▶</span>${done ? '<span class="brush ia" id="cReset" style="cursor:pointer;pointer-events:auto">REPETIR COPA</span>' : ''}</div>`;
  $('#cPrev').onclick = () => { cupIdx = (cupIdx + 3) % 4; AU.sfx('click'); renderChamp(); }; $('#cNext').onclick = () => { cupIdx = (cupIdx + 1) % 4; AU.sfx('click'); renderChamp(); };
  if ($('#cReset')) $('#cReset').onclick = () => { SV.champ[id] = { stage: 0, pts: {} }; save(); renderChamp(); };
  $('#cGo').parentElement.style.display = open && !done ? '' : 'none';
}
$('#cGo').addEventListener('click', () => { const id = SCENE_IDS[cupIdx], st = cupState(cupIdx); if (!cupOpen(cupIdx) || st.stage >= 3) return; AU.sfx('go'); const r = RIVALS[(st.stage + cupIdx) % 5]; startRace({ mode: 'champ', scene: id, stage: st.stage, reverse: false, rival: { id: r.car === SV.car ? RIVALS[5].car : r.car, skill: [0.94, 0.99, 1.03, 1.07][cupIdx], name: r.name } }); });

// ---------------------------------------------------------------- opciones
function goOpts() { mode = 'opts'; screen('opts'); camTo('menu'); renderOpts(); }
function renderOpts() {
  const o = SV.opts, row = (label, key, vals) => `<div class="opt"><label>${label}</label><div class="seg" data-k="${key}">${vals.map(([v, l]) => `<button class="${o[key] === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  $('#optList').innerHTML = row('MANGA STYLE', 'manga', [[0, 'NO'], [1, 'SÍ · COCHE A COLOR, MUNDO EN B/N']]) + row('CALIDAD', 'q', [['hi', 'ALTA'], ['mid', 'MEDIA'], ['lo', 'BAJA']]) + row('MÚSICA', 'music', [[0, '0'], [0.3, '30'], [0.6, '60'], [1, '100']]) + row('EFECTOS', 'sfx', [[0, '0'], [0.4, '40'], [0.8, '80'], [1, '100']]) + row('CONTROL TÁCTIL', 'ctl', [['btn', 'BOTONES'], ['tilt', 'INCLINAR EL MÓVIL']]) + row('ACELERACIÓN AUTO', 'auto', [[0, 'NO'], [1, 'SÍ']]) + row('COPILOTO POR VOZ', 'voice', [[0, 'NO'], [1, 'SÍ']])
    + `<div class="opt"><label>TECLADO</label><span style="font:italic 600 16px 'Barlow Condensed'"><span class="key">↑ W</span>gas <span class="key">↓ S</span>freno/atrás <span class="key">← →</span>girar <span class="key">ESPACIO</span>derrape <span class="key">SHIFT</span>nitro <span class="key">C</span>cámara <span class="key">M</span>manga <span class="key">R</span>recolocar <span class="key">P</span>pausa · MANDO compatible</span></div>
    <div class="opt"><label>PARTIDA</label><span class="brush dark ia" id="oReset" style="cursor:pointer;pointer-events:auto">BORRAR PARTIDA</span></div>`;
  $$('#optList .seg').forEach((s) => s.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const k = s.dataset.k, raw = b.dataset.v; o[k] = isNaN(+raw) ? raw : +raw; save(); applyOpts(); AU.sfx('click'); renderOpts(); })));
  $('#oReset').onclick = (e) => { const b = e.currentTarget; if (b.textContent !== '¿SEGURO? PULSA OTRA VEZ') { b.textContent = '¿SEGURO? PULSA OTRA VEZ'; return; } const opts = SV.opts; SV = structuredClone(DEF); SV.opts = opts; save(); b.textContent = 'PARTIDA BORRADA'; AU.sfx('crash'); };
}
function applyOpts() { R.U.manga.value = SV.opts.manga; R.setQuality(SV.opts.q); AU.setVolumes(SV.opts.music, SV.opts.sfx); $('#pManga').textContent = SV.opts.manga ? 'SÍ' : 'NO'; }

// ---------------------------------------------------------------- carrera
let raceCfg = null;
function startRace(c) {
  raceCfg = c; wipe(() => {
    if (RACE) { RACE.dispose(); disposeObj(RACE.pc); if (RACE.rc) disposeObj(RACE.rc); if (RACE.gm) disposeObj(RACE.gm); RACE = null; }
    const key = stageKey(c.scene, c.stage, c.reverse), pm = makeCar(SV.car);
    const cfg = { ...c, key, playerMesh: pm, phys: physOf(SV.car), onFinish: (res) => onFinish(res) };
    if (c.rival) { const rs = CARS.find((x) => x.id === c.rival.id), pp = cfg.phys, rp = { ...rs.phys }; rp.vmax = rp.vmax * 0.4 + pp.vmax * 0.6; rp.accel = rp.accel * 0.4 + pp.accel * 0.6; cfg.rival = { mesh: makeCar(rs.id, {}), phys: rp, skill: c.rival.skill, name: c.rival.name || rs.name }; }
    if (c.mode === 'time' && SV.ghosts[key]) { const gd = ghostDecode(SV.ghosts[key]); if (gd) { cfg.ghost = gd; cfg.ghostMesh = makeCar(SV.car); } }
    mode = 'race'; screen('race'); camera.clearViewOffset();
    RACE = new Race(ctx, cfg); if (c.mode === 'drift') cfg.timeLimit = Math.round(RACE.T.refTime * 1.7);
    const SC = SCENES[c.scene]; $('#stageCard').innerHTML = `<div class="a">${SC.name}</div><div class="b"><span class="brush lime">${SC.kana} · TRAMO ${c.stage + 1} · ${SC.stages[c.stage]}${c.reverse ? ' · SUBIDA' : ''}</span></div>`;
    $('#count').textContent = ''; $('#hRight').innerHTML = ''; hud.lastR = ''; applyOpts();
  });
}
function onFinish(res) {
  const c = raceCfg, key = stageKey(c.scene, c.stage, c.reverse); let earn = 0, title = '', rows = [], medal = null, next = null;
  const isRec = isFinite(res.time) && (!SV.best[key] || res.time < SV.best[key]);
  if (isRec) { SV.best[key] = res.time; SV.ghosts[key] = ghostEncode(res.ghost); }
  if (c.mode === 'duel') { title = res.win ? '¡VICTORIA! · 勝利' : 'DERROTA · 敗北'; earn = (res.win ? 3000 : 800) + Math.round(res.drift / 20); rows = [['TU TIEMPO', fmt(res.time)], ['RIVAL', res.rivalT ? fmt(res.rivalT) : 'SIN TERMINAR'], ['DERRAPE', res.drift.toLocaleString('es-ES')]]; }
  if (c.mode === 'time') { medal = isFinite(res.time) ? medalTime(res.time, res.ref) : 'n'; title = { g: '¡ORO!', s: 'PLATA', b: 'BRONCE', n: 'SIN MEDALLA' }[medal]; earn = { g: 2500, s: 1500, b: 800, n: 300 }[medal] + (isRec ? 500 : 0); rows = [['TU TIEMPO', fmt(res.time) + (isRec ? ' · RÉCORD' : '')], ['ORO', fmt(res.ref * 1.04)], ['PLATA', fmt(res.ref * 1.14)], ['BRONCE', fmt(res.ref * 1.28)]]; }
  if (c.mode === 'drift') { const len = RACE.T.iGoal - RACE.T.iStart; medal = medalDrift(res.drift, len); const rec = !SV.drift[key] || res.drift > SV.drift[key]; if (rec) SV.drift[key] = res.drift; title = { g: '¡ORO!', s: 'PLATA', b: 'BRONCE', n: 'SIN MEDALLA' }[medal]; earn = { g: 2500, s: 1500, b: 800, n: 300 }[medal] + Math.round(res.drift / 40); rows = [['PUNTOS', res.drift.toLocaleString('es-ES') + (rec ? ' · RÉCORD' : '')], ['MEJOR DERRAPE', res.bestDrift.toLocaleString('es-ES')], ['ORO', (len * 14).toLocaleString('es-ES')], ['PLATA', (len * 8).toLocaleString('es-ES')]]; }
  if (c.mode === 'champ') {
    const id = c.scene, st = SV.champ[id] || { stage: 0, pts: {} }, r = rng(Date.now() & 0xffff), names = RIVALS.slice(0, 5).map((x) => x.name), pace = [1.0, 1.05, 1.1, 1.16, 1.24];
    const times = names.map((n, k) => [n, n === c.rival.name && res.rivalT ? res.rivalT : res.ref * pace[k] * (0.97 + r() * 0.06) * [1.02, 1, 0.98, 0.96][SCENE_IDS.indexOf(id)]]); times.push(['TÚ', res.time]); times.sort((a, b) => a[1] - b[1]);
    const PTS = [10, 8, 6, 5, 4, 3]; times.forEach(([n], k) => (st.pts[n] = (st.pts[n] || 0) + PTS[k])); const pos = times.findIndex((t) => t[0] === 'TÚ');
    st.stage++; SV.champ[id] = st; earn = [5000, 3500, 2500, 1500, 1000, 600][pos];
    title = `${pos + 1}º EN EL TRAMO`; rows = times.map(([n, t], k) => [`${k + 1}. ${n}`, fmt(t)]);
    if (st.stage >= 3) { const order = Object.entries(st.pts).sort((a, b) => b[1] - a[1]); if (order[0][0] === 'TÚ') { earn += 10000; const car = CUP_CAR[SCENE_IDS.indexOf(id)]; if (!SV.owned[car]) { SV.owned[car] = 1; rows.unshift(['¡COCHE NUEVO!', CARS.find((x) => x.id === car).name.toUpperCase()]); } title = '¡COPA GANADA! · 優勝'; } else title = `COPA TERMINADA · ${order.findIndex((o) => o[0] === 'TÚ') + 1}º`; }
    else next = { ...c, stage: st.stage, rival: { ...c.rival, name: RIVALS[(st.stage + SCENE_IDS.indexOf(id)) % 5].name, id: RIVALS[(st.stage + SCENE_IDS.indexOf(id)) % 5].car === SV.car ? RIVALS[5].car : RIVALS[(st.stage + SCENE_IDS.indexOf(id)) % 5].car } };
  }
  SV.money += earn; save();
  mode = 'results'; screen('results'); R.U.letterbox.value = 0.16;
  $('#resPanel').innerHTML = `<div class="stick"><div class="t">${medal ? `<span class="medal ${medal}">${{ g: '金', s: '銀', b: '銅', n: '–' }[medal]}</span>` : ''}${title}</div>${rows.map(([a, b]) => `<div class="r">${a} · <b>${b}</b></div>`).join('')}</div><br>
    <span class="brush purple" style="font:italic 900 30px 'Kanit';padding:6px 30px">+${yen(earn)}</span><br>
    <div class="btnrow">${next ? '<span class="brush lime" data-r="next">SIGUIENTE TRAMO ▶</span>' : ''}<span class="brush ${next ? '' : 'lime'}" data-r="retry">REPETIR</span><span class="brush dark" data-r="menu">MENÚ</span></div>`;
  $$('#resPanel [data-r]').forEach((b) => b.addEventListener('click', () => { AU.sfx('click'); R.U.letterbox.value = 0; const a = b.dataset.r; if (a === 'retry') startRace(c.mode === 'champ' ? { ...c } : c); if (a === 'next') startRace(next); if (a === 'menu') quitRace(c.mode === 'champ' ? goChamp : goMenu); }));
  if (c.mode === 'champ' && !next) { /* sin repetir dentro de la copa */ const rb = $('#resPanel [data-r="retry"]'); if (rb) rb.remove(); }
  if (c.mode === 'champ' && next) { const rb = $('#resPanel [data-r="retry"]'); if (rb) rb.remove(); }
  AU.playMusic('menu'); pop(earn > 3000 ? 'ヤバい!!' : 'ナイス!', 0.75, 0.3, '#c6f432', 100, 1.6);
}
function quitRace(then = goMenu) { wipe(() => { if (RACE) { RACE.dispose(); disposeObj(RACE.pc); if (RACE.rc) disposeObj(RACE.rc); if (RACE.gm) disposeObj(RACE.gm); RACE = null; } R.U.letterbox.value = 0; R.U.manga.value = SV.opts.manga; speedAmt = 0; pops = []; AU.playMusic('menu'); R.setGrade(SHOW_GRADE); then(); }); }
function pause(on) { if (on && mode === 'race') { mode = 'pause'; screen('pause'); $('#hud').classList.add('on'); AU.engineUpdate(0, 50, false, 0, false); } else if (!on && mode === 'pause') { mode = 'race'; screen('race'); } }
$$('[data-p]').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.p; AU.sfx('click'); if (a === 'go') pause(false); if (a === 'retry') startRace(raceCfg); if (a === 'quit') quitRace(raceCfg?.mode === 'champ' ? goChamp : goMenu); if (a === 'manga') { SV.opts.manga = SV.opts.manga ? 0 : 1; save(); applyOpts(); } if (a === 'cam' && RACE) RACE.camMode = (RACE.camMode + 1) % 3; }));
$('#pauseBtn').addEventListener('click', () => pause(true));

// ---------------------------------------------------------------- controles
const K = {}, TC = {}; let steerV = 0, tilt = 0, pad = null;
addEventListener('keydown', (e) => {
  K[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (e.repeat) return;
  if (mode === 'title') return start();
  if (mode === 'menu') { if (e.code === 'ArrowDown' || e.code === 'KeyS') { selMenu(menuSel + 1); AU.sfx('hover'); } if (e.code === 'ArrowUp' || e.code === 'KeyW') { selMenu(menuSel - 1); AU.sfx('hover'); } if (e.code === 'Enter' || e.code === 'Space') menuGo(menuItems[menuSel].dataset.go); return; }
  if (e.code === 'Escape' || e.code === 'Backspace') { if (mode === 'race') return pause(true); if (mode === 'pause') return pause(false); back(); }
  if (mode === 'garage') { if (e.code === 'ArrowRight' || e.code === 'KeyE') { showGarage(gIdx + 1); AU.sfx('click'); } if (e.code === 'ArrowLeft' || e.code === 'KeyQ') { showGarage(gIdx - 1); AU.sfx('click'); } if (e.code === 'Enter') garageAction(); if (e.code === 'KeyC' && SV.owned[CARS[gIdx].id]) $('#gCust').click(); if (e.code === 'KeyF') $('#gTech').click(); }
  if (mode === 'setup' && e.code === 'Enter') $('#sGo').click();
  if (mode === 'champ' && e.code === 'Enter') $('#cGo').click();
  if (mode === 'results' && e.code === 'Enter') $('#resPanel .brush.lime')?.click();
  if (mode === 'race') { if (e.code === 'KeyP') pause(true); if (e.code === 'KeyR' && RACE) RACE.P.respawn(); if (e.code === 'KeyC' && RACE) RACE.camMode = (RACE.camMode + 1) % 3; }
  if (mode === 'pause' && e.code === 'KeyP') pause(false);
  if (e.code === 'KeyM' && (mode === 'race' || mode === 'pause')) { SV.opts.manga = SV.opts.manga ? 0 : 1; save(); applyOpts(); hud.toast(SV.opts.manga ? 'MANGA STYLE · マンガ' : 'COLOR'); }
});
addEventListener('keyup', (e) => { K[e.code] = false; });
addEventListener('blur', () => { for (const k in K) K[k] = false; if (mode === 'race') pause(true); });
$$('.tb').forEach((b) => { const on = (v) => (e) => { e.preventDefault(); TC[b.dataset.k] = v; b.classList.toggle('down', v); if (v) b.setPointerCapture?.(e.pointerId); }; b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointercancel', on(false)); b.addEventListener('lostpointercapture', on(false)); });
addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; const land = Math.abs(window.orientation || screen.orientation?.angle || 0) === 90; const v = land ? (e.beta || 0) * ((window.orientation || screen.orientation?.angle) === -90 || (screen.orientation?.angle === 270) ? -1 : 1) : e.gamma; tilt = clamp(-v / 25, -1, 1); });
function readInput(dt) {
  pad = navigator.getGamepads ? [...navigator.getGamepads()].find((p) => p) : null;
  const pl = pad ? (Math.abs(pad.axes[0]) > 0.15 ? -pad.axes[0] : 0) : 0, left = K.ArrowLeft || K.KeyA || TC.left, right = K.ArrowRight || K.KeyD || TC.right;
  let tgt = (left ? 1 : 0) - (right ? 1 : 0); if (pl) tgt = pl; if (TOUCH && SV.opts.ctl === 'tilt' && !left && !right) tgt = tilt;
  steerV += (tgt - steerV) * Math.min(1, dt * (tgt === 0 ? 12 : Math.sign(tgt) !== Math.sign(steerV) ? 14 : 7));
  const brake = !!(K.ArrowDown || K.KeyS || TC.brake || (pad && pad.buttons[6]?.value > 0.2));
  const gas = !!(K.ArrowUp || K.KeyW || TC.gas || (pad && pad.buttons[7]?.value > 0.2) || (SV.opts.auto && !brake));
  if (pad && pad.buttons[9]?.pressed && !readInput.ps) { if (mode === 'race') pause(true); else if (mode === 'pause') pause(false); } readInput.ps = pad?.buttons[9]?.pressed;
  return { throttle: gas, brake, handbrake: !!(K.Space || TC.hb || (pad && pad.buttons[0]?.pressed)), nitro: !!(K.ShiftLeft || K.ShiftRight || TC.nitro || (pad && pad.buttons[1]?.pressed)), steer: steerV };
}
function tryLandscape() { if (!TOUCH) return; try { const el = document.documentElement; (el.requestFullscreen ? el.requestFullscreen() : Promise.resolve()).then(() => screen.orientation?.lock?.('landscape')).catch(() => {}); } catch (e) {} if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); }
for (const ev of ['pointerup', 'touchend', 'keydown']) addEventListener(ev, () => { if (started) AU.unlock(); }, { passive: true });

// ---------------------------------------------------------------- bucle
let last = performance.now(), ftAcc = 0, ftN = 0;
function dynRes(raw) { // resolución dinámica para ir fluido en gráficas modestas
  if (document.visibilityState !== 'visible' || raw > 0.1) return; ftAcc += raw; ftN++;
  if (ftAcc > 1.5) { const avg = ftAcc / ftN; ftAcc = 0; ftN = 0; let s = R.scale; if (avg > 0.0195 && s > 0.55) s = Math.max(0.55, s - 0.1); else if (avg < 0.0135 && s < 1) s = Math.min(1, s + 0.05); if (s !== R.scale) { R.scale = s; R.resize(innerWidth, innerHeight); } }
}
function loop(now) {
  const raw = (now - last) / 1000, dt = clamp(raw, 0, 0.05); last = now; updateTweens(dt); dynRes(raw);
  aberrSpike *= Math.pow(0.04, dt); R.U.aberr.value = 1.6 + aberrSpike; R.U.flash.value = Math.max(0, R.U.flash.value - dt * 1.5);
  let scene = show;
  if (mode === 'race' && RACE) { RACE.update(dt, readInput(dt)); scene = race; R.U.speedBlur.value = speedAmt * 0.5; }
  else if ((mode === 'pause' || mode === 'results') && RACE) { scene = race; if (mode === 'results') { RACE.update(dt, { throttle: false, brake: true, steer: 0 }); } }
  else { if (showCar) animateCar(showCar, dt, 0, 0.28); showCamera(dt); R.U.speedBlur.value = 0; }
  if (mode !== 'race') speedAmt = 0;
  if (scene === race) fx.update(dt);
  R.U.manga.value = scene === race ? SV.opts.manga : 0;
  R.render(scene, camera, dt); draw2d(dt);
}
addEventListener('resize', () => { R.resize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); size2d(); });

async function boot() {
  const fonts = ["40px 'Permanent Marker'", "italic 900 40px 'Kanit'", "italic 800 40px 'Kanit'", "40px 'Dela Gothic One'", "italic 600 40px 'Barlow Condensed'", "italic 800 40px 'Barlow Condensed'"];
  await Promise.race([Promise.all(fonts.map((f) => document.fonts.load(f, 'AZaz09¥峠ドリフト'))), new Promise((r) => setTimeout(r, 5000))]);
  applyOpts(); R.setGrade(SHOW_GRADE); goTitle(); $('#loading').remove();
  R.r.setAnimationLoop(loop);
}
boot();
window.__G = { R, get RACE() { return RACE; }, get mode() { return mode; }, SV, startRace, goGarage, goMenu, K, tick(n = 1, step = 1 / 60) { for (let i = 0; i < n; i++) { const now = performance.now(); last = now - step * 1000; loop(now); } return mode; }, stop() { R.r.setAnimationLoop(null); } };
