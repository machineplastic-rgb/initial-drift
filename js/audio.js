// Audio con Web Audio: hip-hop en menús, phonk en carrera, motor, chirrido de ruedas y efectos.
let ctx = null, master = null, musicBus = null, sfxBus = null, noise = null;
const A = { on: true, music: null, engine: null };
function init() {
  if (ctx) return; ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master); sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export function unlock() { init(); if (ctx.state !== 'running') ctx.resume(); }
export function setOn(v) { A.on = v; if (master) master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.05); }
export const isOn = () => A.on;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const env = (g, t, a, peak, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
function osc(type, f, t, dur, peak, out, a = 0.005, filt = null) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); env(g, t, a, peak, dur); let n = o; if (filt) { const fl = ctx.createBiquadFilter(); fl.type = filt[0]; fl.frequency.value = filt[1]; if (filt[2]) fl.Q.value = filt[2]; o.connect(fl); n = fl; } n.connect(g); g.connect(out); o.start(t); o.stop(t + a + dur + 0.05); return o; }
function nz(t, dur, peak, out, type, f, q = 1) { const s = ctx.createBufferSource(); s.buffer = noise; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); env(g, t, 0.002, peak, dur); s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05); }

// ---------- música ----------
const SONGS = {
  // boom bap lo-fi para menús (88 BPM, Am7 Dm7 G7 Cmaj7)
  menu: { bpm: 88, swing: 0.18, steps(t, s, bar, SPB, out) {
    const CH = [[57, 60, 64, 67], [50, 57, 60, 65], [55, 59, 62, 65], [48, 55, 59, 64]], ch = CH[bar % 4];
    if ([0, 7, 10].includes(s) || (bar % 4 === 3 && s === 14)) { const o = osc('sine', 130, t, 0.32, 1.0, out); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); }
    if (s === 4 || s === 12) { nz(t, 0.18, 0.5, out, 'bandpass', 1900, 0.8); osc('triangle', 185, t, 0.09, 0.25, out); }
    nz(t, s === 14 ? 0.15 : 0.035, s === 14 ? 0.14 : 0.09, out, 'highpass', 7500);
    if (s === 0) { for (const m of ch.slice(1)) for (const det of [-6, 6]) { const o = osc('triangle', hz(m), t, SPB * 14, 0.045, out, 0.02, ['lowpass', 1400]); o.detune.value = det; } osc('sawtooth', hz(ch[0] - 24), t, SPB * 6, 0.4, out, 0.01, ['lowpass', 320]); }
    if (s === 10) osc('sawtooth', hz(ch[0] - 17), t, SPB * 3, 0.4, out, 0.01, ['lowpass', 320]);
    if (Math.random() < 0.3) nz(t + Math.random() * SPB, 0.01, 0.04, out, 'highpass', 3000);
  } },
  // drift phonk para carreras (132 BPM, cencerro, 808 y charles en tresillo)
  race: { bpm: 132, swing: 0, steps(t, s, bar, SPB, out) {
    const MEL = [[69, 72, 76, 74, 72, 69, 67, 69], [65, 69, 72, 71, 69, 65, 64, 65], [67, 71, 74, 72, 71, 67, 66, 67], [64, 67, 71, 69, 67, 64, 62, 64]], roots = [45, 41, 43, 40];
    if (s === 0 || s === 6 || s === 10 || (bar % 2 && s === 13)) { const o = osc('sine', 120, t, 0.6, 1.0, out); o.frequency.exponentialRampToValueAtTime(hz(roots[bar % 4] - 12), t + 0.08); const d = osc('sawtooth', hz(roots[bar % 4] - 12), t, 0.45, 0.15, out, 0.005, ['lowpass', 260]); }
    if (s === 4 || s === 12) { nz(t, 0.14, 0.6, out, 'bandpass', 1500, 0.7); nz(t + 0.012, 0.12, 0.4, out, 'bandpass', 1100, 0.7); }
    if (s % 2 === 0) { const m = MEL[bar % 4][s / 2]; for (const f of [1, 1.483]) osc('square', hz(m) * f, t, 0.12, 0.05, out, 0.002, ['bandpass', hz(m) * f, 3]); }
    nz(t, 0.03, 0.08, out, 'highpass', 8000); if (s % 4 === 3 && bar % 2) for (let k = 1; k < 3; k++) nz(t + (SPB / 3) * k, 0.02, 0.06, out, 'highpass', 8000);
  } },
};
export function playMusic(name) {
  init(); if (A.music && A.music.name === name) return; stopMusic(); const S = SONGS[name]; if (!S) return;
  const SPB = 60 / S.bpm / 4, M = { name, step: 0, next: ctx.currentTime + 0.08, gain: ctx.createGain() }; M.gain.gain.value = 0; M.gain.connect(musicBus); M.gain.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
  M.timer = setInterval(() => { while (M.next < ctx.currentTime + 0.15) { const s = M.step % 16, bar = Math.floor(M.step / 16); S.steps(M.next + (s % 2 ? SPB * S.swing : 0), s, bar, SPB, M.gain); M.next += SPB; M.step++; } }, 25);
  A.music = M;
}
export function stopMusic() { if (!A.music) return; const M = A.music; clearInterval(M.timer); M.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(() => M.gain.disconnect(), 1200); A.music = null; }

// ---------- motor y ruedas ----------
export function engineStart() {
  init(); if (A.engine) return; const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), sh = ctx.createWaveShaper(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
  o1.type = 'sawtooth'; o2.type = 'square'; const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3); } sh.curve = curve;
  lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.value = 0; o1.connect(sh); o2.connect(sh); sh.connect(lp); lp.connect(g); g.connect(sfxBus); o1.start(); o2.start();
  const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 2.5; const sg = ctx.createGain(); sg.gain.value = 0; s.connect(bp); bp.connect(sg); sg.connect(sfxBus); s.start();
  A.engine = { o1, o2, lp, g, sg, bp, s };
}
export function engineUpdate(speed, vmax, throttle, drift, nitro) {
  const E = A.engine; if (!E) return; const t = ctx.currentTime, gears = 5, k = Math.min(1, speed / vmax), gi = Math.min(gears - 1, Math.floor(k * gears)), within = k * gears - gi;
  const rpm = 0.25 + within * 0.75 * (0.8 + gi * 0.05), f = 38 + rpm * 120 + (nitro ? 25 : 0);
  E.o1.frequency.setTargetAtTime(f, t, 0.04); E.o2.frequency.setTargetAtTime(f * 0.5, t, 0.04); E.lp.frequency.setTargetAtTime(500 + rpm * 2200 * (throttle ? 1 : 0.5), t, 0.05);
  E.g.gain.setTargetAtTime(0.06 + (throttle ? 0.1 : 0.03) + (nitro ? 0.05 : 0), t, 0.05); E.sg.gain.setTargetAtTime(Math.min(0.32, drift * 0.35), t, 0.05); E.bp.frequency.setTargetAtTime(1400 + drift * 700, t, 0.05);
}
export function engineStop() { const E = A.engine; if (!E) return; const t = ctx.currentTime; E.g.gain.setTargetAtTime(0, t, 0.1); E.sg.gain.setTargetAtTime(0, t, 0.1); setTimeout(() => { try { E.o1.stop(); E.o2.stop(); E.s.stop(); } catch (e) {} }, 400); A.engine = null; }

// ---------- efectos ----------
export function sfx(name) {
  init(); const t = ctx.currentTime;
  if (name === 'click') osc('square', 880, t, 0.04, 0.12, sfxBus, 0.002, ['lowpass', 3000]);
  if (name === 'beep') osc('square', 660, t, 0.18, 0.18, sfxBus);
  if (name === 'go') { osc('square', 1320, t, 0.4, 0.2, sfxBus); osc('sawtooth', 660, t, 0.4, 0.1, sfxBus); }
  if (name === 'crash') { nz(t, 0.35, 0.9, sfxBus, 'lowpass', 900); osc('sine', 90, t, 0.25, 0.6, sfxBus); }
  if (name === 'nitro') { const s = ctx.createBufferSource(); s.buffer = noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3500, t + 0.5); const g = ctx.createGain(); env(g, t, 0.02, 0.6, 0.6); s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + 0.8); }
  if (name === 'glitch') { const o = osc('square', 200, t, 0.18, 0.12, sfxBus); o.frequency.exponentialRampToValueAtTime(2400, t + 0.15); nz(t, 0.1, 0.2, sfxBus, 'highpass', 4000); }
  if (name === 'pop') { const o = osc('sine', 300, t, 0.15, 0.25, sfxBus); o.frequency.exponentialRampToValueAtTime(900, t + 0.1); }
  if (name === 'win') [72, 76, 79, 84].forEach((m, i) => osc('square', hz(m), t + i * 0.12, 0.3, 0.15, sfxBus, 0.005, ['lowpass', 2500]));
  if (name === 'lose') [67, 63, 60].forEach((m, i) => osc('triangle', hz(m), t + i * 0.18, 0.4, 0.18, sfxBus));
}
