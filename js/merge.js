// Fusión de piezas para dibujar mucho menos: une mallas hijas que comparten material y,
// para el atrezo, hornea el color de cada material en colores de vértice.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function prep(g, matrix, keepUV, color = null) {
  g = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (keepUV) { if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); } else if (g.attributes.uv) g.deleteAttribute('uv');
  if (color) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = color.r; a[i * 3 + 1] = color.g; a[i * 3 + 2] = color.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  g.clearGroups(); g.applyMatrix4(matrix); return g;
}

// Une los hijos directos con el mismo material (sin tocar grupos animados ni mallas multimaterial).
export function mergeChildren(parent) {
  const by = new Map();
  for (const c of [...parent.children]) { if (!c.isMesh || c.isInstancedMesh || Array.isArray(c.material) || c.userData.keep) continue; c.updateMatrix(); if (!by.has(c.material)) by.set(c.material, []); by.get(c.material).push(c); }
  for (const [mat, list] of by) {
    if (list.length < 2) continue;
    const geos = list.map((m) => prep(m.geometry, m.matrix, !!mat.map)); const g = mergeGeometries(geos, false); geos.forEach((x) => x.dispose()); if (!g) continue;
    for (const m of list) parent.remove(m);
    const mm = new THREE.Mesh(g, mat); mm.castShadow = list.some((m) => m.castShadow); mm.receiveShadow = true; mm.renderOrder = list[0].renderOrder; parent.add(mm);
  }
}

// Atrezo estático: todo lo opaco sin textura ni emisión pasa a una malla con color por vértice.
export function mergeStatic(root) {
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), list = [];
  root.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep) return; const m = o.material; if (m.side === THREE.DoubleSide) return; if (!m.isMeshStandardMaterial || m.map || m.transparent || m.vertexColors || (m.emissiveIntensity > 0 && m.emissive && m.emissive.getHex() !== 0)) return; list.push(o); });
  if (list.length < 2) return;
  const geos = list.map((o) => prep(o.geometry, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), false, o.material.color));
  const g = mergeGeometries(geos, false); geos.forEach((x) => x.dispose()); if (!g) return;
  for (const o of list) o.parent.remove(o);
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.1, flatShading: true })); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
}
