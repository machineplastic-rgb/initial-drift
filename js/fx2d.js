// Capa 2D encima del 3D: onomatopeyas, líneas de velocidad, garabatos de rueda, glitch y VHS.
const rnd = Math.random;
export class FX2D {
  constructor(canvas) { this.c = canvas; this.g = canvas.getContext('2d'); this.pops = []; this.scribs = []; this.speed = 0; this.flashT = 0; this.flashC = '#fff'; this.glitchT = 0; this.vhs = null; this.t = 0; this.resize(); addEventListener('resize', () => this.resize()); }
  resize() { const d = Math.min(2, devicePixelRatio); this.W = innerWidth; this.H = innerHeight; this.c.width = this.W * d; this.c.height = this.H * d; this.c.style.width = this.W + 'px'; this.c.style.height = this.H + 'px'; this.g.setTransform(d, 0, 0, d, 0, 0); }
  pop(text, x, y, o = {}) { this.pops.push({ text, x, y, t: 0, life: o.life || 1.1, size: o.size || Math.min(140, this.W * 0.1), color: o.color || '#fff', stroke: o.stroke || '#141414', rot: o.rot ?? (rnd() - 0.5) * 0.5, comic: !!o.comic, shadow: o.shadow || null, vy: o.vy ?? -30 }); }
  scribble(x, y, color, size = 50) { this.scribs.push({ x, y, color, size }); }
  flash(color = '#fff', t = 0.25) { this.flashC = color; this.flashT = t; }
  glitch(t = 0.35) { this.glitchT = Math.max(this.glitchT, t); }
  draw(dt) {
    const g = this.g, W = this.W, H = this.H; this.t += dt; g.clearRect(0, 0, W, H);
    // líneas de velocidad (radiales, estilo cómic)
    if (this.speed > 0.05) { const n = Math.floor(40 + this.speed * 80), cx = W / 2, cy = H * 0.52; g.fillStyle = `rgba(255,255,255,${0.18 + this.speed * 0.4})`;
      for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, r0 = Math.max(W, H) * (0.42 + rnd() * 0.25) * (1.2 - this.speed * 0.35), r1 = Math.max(W, H) * 1.1, w = 0.004 + rnd() * 0.008; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7); g.lineTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1); g.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1); g.fill(); } }
    // garabatos en las ruedas
    for (const s of this.scribs) { g.save(); g.translate(s.x, s.y); g.strokeStyle = s.color; g.lineWidth = 2.5; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse((rnd() - 0.5) * 8, (rnd() - 0.5) * 8, s.size * (0.6 + k * 0.15), s.size * (0.85 + k * 0.1), 0.3, 0, 6.2); g.stroke(); } g.restore(); }
    this.scribs.length = 0;
    // onomatopeyas
    for (const p of this.pops) {
      p.t += dt; const k = Math.min(1, p.t * 7), fade = p.t > p.life * 0.75 ? 1 - (p.t - p.life * 0.75) / (p.life * 0.25) : 1; const j = ((this.t * 30) | 0) % 2 ? 2 : -2;
      g.save(); g.globalAlpha = Math.max(0, fade); g.translate(p.x + j, p.y + p.vy * p.t); g.rotate(p.rot); const sc = 0.5 + k * 0.5 + (k < 1 ? 0.25 * Math.sin(k * Math.PI) : 0); g.scale(sc, sc);
      g.font = `${p.size}px ${p.comic ? "'Permanent Marker'" : "'Dela Gothic One'"}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'miter';
      if (p.shadow) { g.fillStyle = p.shadow; g.fillText(p.text, 8, 8); }
      g.lineWidth = p.size * 0.12; g.strokeStyle = p.stroke; g.strokeText(p.text, 0, 0); g.fillStyle = p.color; g.fillText(p.text, 0, 0); g.restore();
    }
    this.pops = this.pops.filter((p) => p.t < p.life);
    if (this.flashT > 0) { this.flashT -= dt; g.fillStyle = this.flashC; g.globalAlpha = Math.max(0, this.flashT * 2); g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    // glitch: franjas desplazadas y barras de color
    if (this.glitchT > 0) { this.glitchT -= dt; const n = 6 + (rnd() * 8) | 0; for (let i = 0; i < n; i++) { const y = rnd() * H, h = 2 + rnd() * 18; g.fillStyle = ['rgba(255,0,90,.35)', 'rgba(0,240,255,.35)', 'rgba(255,255,255,.25)', 'rgba(20,20,20,.5)'][(rnd() * 4) | 0]; g.fillRect((rnd() - 0.5) * 60, y, W, h); } }
    // VHS: líneas, banda de ruido, PLAY y fecha
    if (this.vhs) { const v = this.vhs; g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      const by = ((this.t * 60) % (H + 80)) - 40; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, by, W, 26); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(rnd() * W, by + rnd() * 26, 2 + rnd() * 20, 1); }
      g.font = `${Math.min(34, W * 0.04)}px 'VT323', 'Courier New', monospace`; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,240,255,.8)'; g.shadowBlur = 6; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(v.label || 'PLAY ▶', 28, 24); g.textBaseline = 'bottom'; g.fillText(v.date || '', 28, H - 24); if (v.rec && ((this.t * 2) | 0) % 2) { g.fillStyle = '#ff2a3d'; g.beginPath(); g.arc(W - 70, 42, 9, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText('REC', W - 56, 43); } g.shadowBlur = 0; }
  }
}
