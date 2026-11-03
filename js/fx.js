// Efectos: humo y polvo de dibujo (bolas low poly opacas a dos tonos, como en #DRIVE), chispas,
// marcas de neumático y llamas del nitro.
import * as THREE from 'three';

const grad = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 255, 255, 255, 255]), 2, 1, THREE.RGBAFormat); grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const rnd = Math.random;

export class FX {
  constructor(scene) {
    this.scene = scene;
    // humo: bolas opacas que crecen, suben y encogen
    this.NP = 360; const geo = new THREE.IcosahedronGeometry(1, 1);
    this.puffs = new THREE.InstancedMesh(geo, new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: grad }), this.NP);
    this.puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.puffs.frustumCulled = false; this.puffs.castShadow = true; scene.add(this.puffs);
    this.P = []; for (let i = 0; i < this.NP; i++) this.P.push({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 1, c: new THREE.Color() });
    this.pi = 0; this.dmy = new THREE.Object3D(); const zero = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < this.NP; i++) { this.puffs.setMatrixAt(i, zero); this.puffs.setColorAt(i, new THREE.Color(1, 1, 1)); }
    // chispas
    this.NS = 220; const sp = new Float32Array(this.NS * 6), sc = new Float32Array(this.NS * 6), sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    this.sparkMesh = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.sparkMesh.frustumCulled = false; scene.add(this.sparkMesh);
    this.S = []; for (let i = 0; i < this.NS; i++) this.S.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), c: new THREE.Color() });
    // marcas de neumático
    this.MAXQ = 1600; const P = new Float32Array(this.MAXQ * 12), I = []; for (let q = 0; q < this.MAXQ; q++) { const b = q * 4; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I);
    this.skid = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    this.skid.frustumCulled = false; this.skid.renderOrder = 1; scene.add(this.skid); this.q = 0; this.last = {};
  }
  clear() { for (const p of this.P) p.life = 0; for (const s of this.S) s.life = 0; this.skid.geometry.attributes.position.array.fill(0); this.skid.geometry.attributes.position.needsUpdate = true; this.last = {}; }
  puff(pos, color, size = 1, vel = null, life = 1.3) {
    const p = this.P[this.pi]; this.pi = (this.pi + 1) % this.NP;
    p.life = life * (0.8 + rnd() * 0.4); p.max = p.life; p.p.copy(pos); p.s = size; p.c.set(color).offsetHSL(0, 0, (rnd() - 0.5) * 0.06);
    if (vel) p.v.copy(vel); else p.v.set((rnd() - 0.5) * 1.6, 0.6 + rnd() * 0.9, (rnd() - 0.5) * 1.6);
  }
  spark(pos, dir, n = 8, a = '#ffe27a', b = '#ff8a3d') {
    for (let k = 0; k < n; k++) { const s = this.S.find((x) => x.life <= 0); if (!s) return; s.life = 0.25 + rnd() * 0.35; s.p.copy(pos); s.v.set(dir.x * (4 + rnd() * 8) + (rnd() - 0.5) * 6, 2 + rnd() * 5, dir.z * (4 + rnd() * 8) + (rnd() - 0.5) * 6); s.c.set(rnd() < 0.6 ? a : b); }
  }
  skidAt(key, p) {
    const prev = this.last[key]; this.last[key] = p.clone(); if (!prev || prev.distanceToSquared(p) > 9 || prev.distanceToSquared(p) < 0.04) return;
    const a = this.skid.geometry.attributes.position.array, b = this.q * 12, dx = p.x - prev.x, dz = p.z - prev.z, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * 0.13, nz = (dx / l) * 0.13;
    a.set([prev.x + nx, prev.y + 0.04, prev.z + nz, prev.x - nx, prev.y + 0.04, prev.z - nz, p.x + nx, p.y + 0.04, p.z + nz, p.x - nx, p.y + 0.04, p.z - nz], b);
    this.q = (this.q + 1) % this.MAXQ; this.skid.geometry.attributes.position.needsUpdate = true;
  }
  breakSkid(key) { delete this.last[key]; }
  update(dt) {
    const d = this.dmy;
    for (let i = 0; i < this.NP; i++) {
      const p = this.P[i]; if (p.life <= 0) continue; p.life -= dt; const k = 1 - Math.max(0, p.life) / p.max;
      p.p.addScaledVector(p.v, dt); p.v.multiplyScalar(Math.pow(0.35, dt)); p.v.y += 0.4 * dt;
      const sc = p.life <= 0 ? 0 : p.s * (0.35 + Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.5) * 1.4) * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
      d.position.copy(p.p); d.scale.setScalar(Math.max(0, sc)); d.rotation.set(i, i * 0.7, 0); d.updateMatrix(); this.puffs.setMatrixAt(i, d.matrix); this.puffs.setColorAt(i, p.c);
    }
    this.puffs.instanceMatrix.needsUpdate = true; if (this.puffs.instanceColor) this.puffs.instanceColor.needsUpdate = true;
    const pa = this.sparkMesh.geometry.attributes.position.array, ca = this.sparkMesh.geometry.attributes.color.array;
    this.S.forEach((s, i) => {
      if (s.life > 0) { s.life -= dt; s.v.y -= 14 * dt; s.p.addScaledVector(s.v, dt); }
      const on = s.life > 0 ? 1 : 0, b = i * 6; pa[b] = s.p.x; pa[b + 1] = s.p.y; pa[b + 2] = s.p.z; pa[b + 3] = s.p.x - s.v.x * 0.03 * on; pa[b + 4] = s.p.y - s.v.y * 0.03 * on; pa[b + 5] = s.p.z - s.v.z * 0.03 * on;
      for (let k = 0; k < 2; k++) { ca[b + k * 3] = s.c.r * on; ca[b + k * 3 + 1] = s.c.g * on; ca[b + k * 3 + 2] = s.c.b * on; }
    });
    this.sparkMesh.geometry.attributes.position.needsUpdate = true; this.sparkMesh.geometry.attributes.color.needsUpdate = true;
  }
}

// Llamas del nitro en el escape (se ven a tirones)
export function addFlames(car) {
  const S = car.userData.S, xmin = -S.L / 2, hw = S.W / 2;
  const outer = new THREE.MeshBasicMaterial({ color: '#5fb8ff', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const core = new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const g = new THREE.Group(); const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.9, 8), outer); c1.rotation.z = Math.PI / 2; c1.position.set(xmin - 0.55, S.clr + 0.06, -(hw - 0.42)); g.add(c1);
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.5, 6), core); c2.rotation.z = Math.PI / 2; c2.position.set(xmin - 0.35, S.clr + 0.06, -(hw - 0.42)); g.add(c2);
  g.visible = false; car.add(g); car.userData.flames = g; return g;
}
