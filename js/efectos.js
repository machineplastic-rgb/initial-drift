// Efectos 3D: humo de color con contorno, chispas, marcas de neumático y llamas de nitro.
import * as THREE from 'three';

const puffCache = {};
export function puffTex(color) {
  if (puffCache[color]) return puffCache[color];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const blobs = [[64, 70, 40], [40, 62, 26], [88, 60, 28], [62, 40, 26], [80, 84, 22], [46, 86, 22]];
  g.fillStyle = '#141414'; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y, r + 5, 0, 6.3); g.fill(); }
  const col = new THREE.Color(color), dark = col.clone().multiplyScalar(0.62), light = col.clone().lerp(new THREE.Color('#ffffff'), 0.35);
  g.fillStyle = '#' + dark.getHexString(); for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
  g.fillStyle = '#' + col.getHexString(); for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - r * 0.18, y - r * 0.22, r * 0.78, 0, 6.3); g.fill(); }
  g.fillStyle = '#' + light.getHexString(); for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - r * 0.35, y - r * 0.38, r * 0.35, 0, 6.3); g.fill(); }
  g.strokeStyle = 'rgba(20,20,20,.55)'; g.lineWidth = 2.5; for (const [x, y, r] of blobs) for (let k = 0; k < 3; k++) { const a = 0.5 + k * 0.32; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); g.lineTo(x + Math.cos(a) * r * 0.88, y + Math.sin(a) * r * 0.88); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; puffCache[color] = t; return t;
}

export class Effects {
  constructor(scene) {
    this.scene = scene; this.smoke = []; this.sparks = [];
    // marcas de neumático: búfer circular de quads
    this.MAXQ = 1400; const P = new Float32Array(this.MAXQ * 4 * 3), I = [];
    for (let q = 0; q < this.MAXQ; q++) { const b = q * 4; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I);
    this.skid = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x141416, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    this.skid.frustumCulled = false; this.skid.layers.set(1); scene.add(this.skid); this.q = 0; this.last = {};
    // chispas
    this.NS = 260; const sp = new Float32Array(this.NS * 6), scol = new Float32Array(this.NS * 6);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(scol, 3));
    this.sparkMesh = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.sparkMesh.frustumCulled = false; this.sparkMesh.layers.set(1); scene.add(this.sparkMesh);
    for (let i = 0; i < this.NS; i++) this.sparks.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), c: new THREE.Color() });
    this.flames = [];
  }
  clear() { for (const s of this.smoke) this.scene.remove(s.sp); this.smoke = []; this.skid.geometry.attributes.position.array.fill(0); this.skid.geometry.attributes.position.needsUpdate = true; this.last = {}; for (const s of this.sparks) s.life = 0; }
  puff(pos, color, size = 1, vel = null) {
    if (this.smoke.length > 220) { const old = this.smoke.shift(); this.scene.remove(old.sp); }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(color), transparent: true, depthWrite: false, rotation: Math.random() * 6.28 }));
    sp.position.copy(pos); sp.layers.set(1); this.scene.add(sp);
    this.smoke.push({ sp, life: 0, max: 1.1 + Math.random() * 0.6, s0: 0.6 * size, v: vel ? vel.clone() : new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.5) });
  }
  spark(pos, dir, n = 6, colA = '#ffe27a', colB = '#ff6fb5') {
    for (let k = 0; k < n; k++) { const s = this.sparks.find((x) => x.life <= 0); if (!s) return; s.life = 0.25 + Math.random() * 0.35; s.p.copy(pos); s.v.set(dir.x * (4 + Math.random() * 8) + (Math.random() - 0.5) * 6, 2 + Math.random() * 5, dir.z * (4 + Math.random() * 8) + (Math.random() - 0.5) * 6); s.c.set(Math.random() < 0.6 ? colA : colB); }
  }
  skidAt(key, p, side) {
    const prev = this.last[key]; this.last[key] = p.clone();
    if (!prev || prev.distanceToSquared(p) > 9 || prev.distanceToSquared(p) < 0.04) return;
    const a = this.skid.geometry.attributes.position.array, b = this.q * 12, dx = p.x - prev.x, dz = p.z - prev.z, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * 0.12, nz = (dx / l) * 0.12;
    a.set([prev.x + nx, prev.y + 0.03, prev.z + nz, prev.x - nx, prev.y + 0.03, prev.z - nz, p.x + nx, p.y + 0.03, p.z + nz, p.x - nx, p.y + 0.03, p.z - nz], b);
    this.q = (this.q + 1) % this.MAXQ; this.skid.geometry.attributes.position.needsUpdate = true;
  }
  breakSkid(key) { delete this.last[key]; }
  update(dt) {
    for (const s of this.smoke) { s.life += dt; const k = s.life / s.max; s.sp.position.addScaledVector(s.v, dt); s.v.multiplyScalar(Math.pow(0.4, dt)); const sc = s.s0 * (1 + k * 3.2); s.sp.scale.set(sc, sc, 1); s.sp.material.opacity = (k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3)) * (this.cam ? Math.min(1, Math.max(0, (s.sp.position.distanceTo(this.cam.position) - sc * 0.6 - 0.8) / 3.5)) : 1); }
    while (this.smoke.length && this.smoke[0].life > this.smoke[0].max) { const o = this.smoke.shift(); this.scene.remove(o.sp); o.sp.material.dispose(); }
    const pa = this.sparkMesh.geometry.attributes.position.array, ca = this.sparkMesh.geometry.attributes.color.array;
    this.sparks.forEach((s, i) => {
      if (s.life > 0) { s.life -= dt; s.v.y -= 14 * dt; s.p.addScaledVector(s.v, dt); }
      const on = s.life > 0 ? 1 : 0, b = i * 6; pa[b] = s.p.x; pa[b + 1] = s.p.y; pa[b + 2] = s.p.z; pa[b + 3] = s.p.x - s.v.x * 0.03 * on; pa[b + 4] = s.p.y - s.v.y * 0.03 * on; pa[b + 5] = s.p.z - s.v.z * 0.03 * on;
      for (let k = 0; k < 2; k++) { ca[b + k * 3] = s.c.r * on; ca[b + k * 3 + 1] = s.c.g * on; ca[b + k * 3 + 2] = s.c.b * on; }
    });
    this.sparkMesh.geometry.attributes.position.needsUpdate = true; this.sparkMesh.geometry.attributes.color.needsUpdate = true;
  }
}

// Llamas de nitro y escape pegadas al coche
export function addFlames(car) {
  const S = car.userData.S, B = Math.min(...S.body.map((p) => p[0]));
  const mat = new THREE.MeshBasicMaterial({ color: '#7fd0ff', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const inner = new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const g = new THREE.Group(); const zs = S.exhaust === 'quad' ? [S.W / 2 - 0.32, S.W / 2 - 0.46, -(S.W / 2 - 0.32), -(S.W / 2 - 0.46)] : S.exhaust === 'dual' ? [S.W / 2 - 0.4, -(S.W / 2 - 0.4)] : [S.W / 2 - 0.4];
  for (const z of zs) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.7, 8), mat); c.rotation.z = Math.PI / 2; c.position.set(B - 0.6, 0.22, z); g.add(c); const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.4, 6), inner); c2.rotation.z = Math.PI / 2; c2.position.set(B - 0.45, 0.22, z); g.add(c2); }
  g.traverse((o) => o.layers.set(1)); g.visible = false; car.add(g); car.userData.flames = g; return g;
}
