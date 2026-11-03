// Cielo, luz, niebla y clima: noche, día, nublado, lluvia, niebla y amanecer.
import * as THREE from 'three';

export const WEATHERS = {
  noche:    { label: 'NOCHE',    top: '#0b1022', hor: '#2a3556', sun: '#0', fog: '#1b2236', dens: 0.0105, hemi: 0.55, hemiSky: '#6b7cb0', hemiGr: '#1c2418', key: 0.55, keyC: '#9fb6ff', keyDir: [-0.4, 0.8, 0.3], stars: 1, lamps: true, rain: false, wet: false, grip: 1.0, exp: 1.15, mount: '#202a3a' },
  dia:      { label: 'DÍA',      top: '#5c95d6', hor: '#cfe2ef', sun: '#fff1c8', fog: '#c6d6e2', dens: 0.0042, hemi: 1.15, hemiSky: '#cfe0ff', hemiGr: '#4d5e3c', key: 2.6, keyC: '#fff1dc', keyDir: [-0.5, 0.9, 0.35], stars: 0, lamps: false, rain: false, wet: false, grip: 1.0, exp: 1.0, mount: '#6f8fa0' },
  nublado:  { label: 'NUBLADO',  top: '#7f8a96', hor: '#c3c8cc', sun: '#0', fog: '#a9b1b8', dens: 0.0075, hemi: 1.25, hemiSky: '#dfe4ea', hemiGr: '#4a5540', key: 0.9, keyC: '#e8ecf0', keyDir: [-0.3, 1, 0.2], stars: 0, lamps: false, rain: false, wet: false, grip: 0.97, exp: 1.05, mount: '#7d878f' },
  lluvia:   { label: 'LLUVIA',   top: '#3f4752', hor: '#7d868f', sun: '#0', fog: '#6b747d', dens: 0.012, hemi: 1.0, hemiSky: '#aeb7c2', hemiGr: '#2f3a2c', key: 0.6, keyC: '#cdd6e0', keyDir: [-0.3, 1, 0.2], stars: 0, lamps: true, rain: true, wet: true, grip: 0.82, exp: 1.1, mount: '#4c5560' },
  niebla:   { label: 'NIEBLA',   top: '#1a1e27', hor: '#59606b', sun: '#0', fog: '#4b525d', dens: 0.022, hemi: 0.75, hemiSky: '#8892a6', hemiGr: '#1f261c', key: 0.4, keyC: '#aab8d8', keyDir: [-0.4, 0.8, 0.3], stars: 0, lamps: true, rain: true, wet: true, grip: 0.85, exp: 1.2, mount: '#30363f' },
  amanecer: { label: 'AMANECER', top: '#3b4c86', hor: '#ffb27a', sun: '#ffcf8a', fog: '#d7a18a', dens: 0.0055, hemi: 0.9, hemiSky: '#ffd2b8', hemiGr: '#3c3a2c', key: 2.2, keyC: '#ffb07a', keyDir: [-0.9, 0.35, 0.2], stars: 0.25, lamps: false, rain: false, wet: false, grip: 1.0, exp: 1.05, mount: '#7a6a7c' },
};

export function createEnv(scene) {
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunC: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, stars: { value: 0 }, sunOn: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunC; uniform vec3 sunDir; uniform float stars; uniform float sunOn; varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){
        float y = clamp(vDir.y, -0.2, 1.0);
        vec3 c = mix(hor, top, pow(max(y, 0.0), 0.55));
        float sd = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        c += sunC * (pow(sd, 400.0) * 3.0 + pow(sd, 12.0) * 0.35) * sunOn;
        vec3 d = vDir * 220.0; vec3 cell = floor(d); vec3 f = fract(d) - 0.5;
        c += vec3(1.0) * step(0.987, h(cell)) * smoothstep(0.3, 0.05, length(f)) * smoothstep(0.05, 0.25, y) * stars;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 1); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 }); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  scene.fog = new THREE.FogExp2(0x000000, 0.01);
  // lluvia: segmentos que caen alrededor de la cámara
  const NR = 2200, rp = new Float32Array(NR * 6); for (let i = 0; i < NR; i++) { const x = (Math.random() - 0.5) * 60, y = Math.random() * 30, z = (Math.random() - 0.5) * 60; rp.set([x, y, z, x - 0.05, y - 0.7, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xbfd0e0, transparent: true, opacity: 0.45, fog: false })); rain.frustumCulled = false; rain.layers.set(1); scene.add(rain);
  const env = { sky, hemi, key, rain, W: null };
  env.set = (name, track) => {
    const W = WEATHERS[name] || WEATHERS.noche; env.W = W; env.name = name;
    skyMat.uniforms.top.value.set(W.top); skyMat.uniforms.hor.value.set(W.hor); skyMat.uniforms.stars.value = W.stars;
    skyMat.uniforms.sunOn.value = W.sun === '#0' ? 0 : 1; if (W.sun !== '#0') skyMat.uniforms.sunC.value.set(W.sun);
    skyMat.uniforms.sunDir.value.set(...W.keyDir).normalize();
    scene.fog.color.set(W.fog); scene.fog.density = W.dens;
    hemi.intensity = W.hemi; hemi.color.set(W.hemiSky); hemi.groundColor.set(W.hemiGr);
    key.intensity = W.key; key.color.set(W.keyC);
    rain.visible = W.rain;
    if (track) {
      for (const L of track.lamps) { L.sp.visible = L.pool.visible = W.lamps; L.head.material.emissiveIntensity = W.lamps ? 2.2 : 0.2; }
      track.roadMat.roughness = W.wet ? 0.25 : 0.85; track.roadMat.metalness = W.wet ? 0.25 : 0; track.roadMat.color.set(W.wet ? '#9aa0aa' : '#ffffff');
      if (track.mountains) track.mountains.material.color.set(W.mount);
    }
  };
  env.update = (dt, center) => {
    env.key.position.set(center.x + env.W.keyDir[0] * 60, center.y + env.W.keyDir[1] * 60, center.z + env.W.keyDir[2] * 60); env.key.target.position.copy(center);
    env.sky.position.copy(center);
    if (rain.visible) { rain.position.set(center.x, center.y - 5, center.z); const p = rg.attributes.position.array; for (let i = 0; i < NR; i++) { let y = p[i * 6 + 1] - 26 * dt; if (y < 0) y += 30; p[i * 6 + 1] = y; p[i * 6 + 4] = y - 0.7; } rg.attributes.position.needsUpdate = true; }
  };
  return env;
}
