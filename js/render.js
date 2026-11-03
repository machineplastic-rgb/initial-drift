// Render con posproceso estilo #DRIVE: bloom, desenfoque por profundidad, aberración cromática radial,
// etalonaje de color por escenario, degradado de color, viñeta, grano y bandas de cine.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = `
#include <packing>
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float near; uniform float far; uniform float time;
uniform float exposure; uniform float aberr; uniform float focus; uniform float dof; uniform float grain; uniform float vignette;
uniform float sat; uniform float contrast; uniform vec3 lift; uniform vec3 gain; uniform vec3 shadowTint; uniform vec3 hiTint;
uniform vec3 gradCol; uniform float gradAmt; uniform vec2 gradDir; uniform float letterbox; uniform float flash; uniform vec3 flashCol; uniform float speedBlur; uniform float manga; uniform sampler2D tMask;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float viewZ(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c){
  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  c *= exposure / 0.6; c = I * c; c = RRTAndODTFit(c); c = O * c; return clamp(c, 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float edgeAt(vec2 uv, float z){ vec2 px = 1.4 / res; float a = viewZ(uv + vec2(px.x, 0.0)), b = viewZ(uv - vec2(px.x, 0.0)), c = viewZ(uv + vec2(0.0, px.y)), d = viewZ(uv - vec2(0.0, px.y));
  float e = (abs(a + b - 2.0 * z) + abs(c + d - 2.0 * z)) / max(z, 0.5); return smoothstep(0.035, 0.12, e) * (1.0 - smoothstep(90.0, 220.0, z)); }
vec3 mangaFx(vec3 o, vec2 uv, float z){
  float m = texture2D(tMask, uv).r; float L = pow(dot(o, vec3(0.299, 0.587, 0.114)), 0.62);
  vec2 fc = gl_FragCoord.xy; vec2 g = fract(mat2(0.7071, -0.7071, 0.7071, 0.7071) * fc / 5.0) - 0.5;
  float dark = clamp((0.86 - L) / 0.8, 0.0, 1.0); float rad = sqrt(dark) * 0.62; float dotv = 1.0 - smoothstep(rad - 0.1, rad + 0.1, length(g));
  vec3 paper = vec3(0.95, 0.94, 0.9), ink = vec3(0.07);
  float Lc = smoothstep(0.08, 0.92, L);
  vec3 bw = mix(paper, ink, dotv * 0.9); bw = mix(bw, ink, step(L, 0.12) * 0.85);
  float dark2 = clamp((0.45 - L) / 0.4, 0.0, 1.0); float dot2 = 1.0 - smoothstep(sqrt(dark2) * 0.55 - 0.1, sqrt(dark2) * 0.55 + 0.1, length(g));
  vec3 colr = mix(o * 1.08, o * 0.35, dot2 * 0.8);
  vec3 res2 = mix(bw, colr, smoothstep(0.3, 0.7, m));
  float e = edgeAt(uv, z); res2 = mix(res2, ink, e);
  return res2;
}
vec3 sampleCA(vec2 uv, vec2 off){ return vec3(texture2D(tColor, uv + off).r, texture2D(tColor, uv).g, texture2D(tColor, uv - off).b); }
void main(){
  vec2 uv = vUv; vec2 c = uv - 0.5; float asp = res.x / res.y; float r = length(c * vec2(asp, 1.0));
  vec2 caOff = c * (aberr * (0.25 + r * r * 2.2)) / res * 2.0;
  vec3 col = sampleCA(uv, caOff);
  // desenfoque: por profundidad (fuera de foco) y radial por velocidad
  float z = viewZ(uv);
  float coc = clamp(abs(z - focus) / max(focus, 1.0) * dof, 0.0, 1.0) + speedBlur * smoothstep(0.25, 0.75, r);
  if (coc > 0.02) {
    vec3 acc = col; float wsum = 1.0; float rad = coc * 9.0;
    for (int i = 0; i < 16; i++) {
      float fi = float(i); float a = fi * 2.39996; float rr = sqrt((fi + 0.5) / 16.0) * rad;
      vec2 o = vec2(cos(a), sin(a)) * rr / res;
      vec2 su = uv + o; float zs = viewZ(su);
      float w = (zs < z - 1.0) ? clamp(abs(zs - focus) / max(focus, 1.0) * dof * 3.0, 0.0, 1.0) : 1.0;
      acc += sampleCA(su, caOff) * w; wsum += w;
    }
    col = acc / wsum;
  }
  col = aces(col);
  // etalonaje
  col = col * gain + lift * (1.0 - col);
  float L = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, col * shadowTint * 1.6, (1.0 - smoothstep(0.0, 0.45, L)) * 0.35);
  col = mix(col, col * hiTint * 1.25, smoothstep(0.55, 1.0, L) * 0.25);
  col = mix(vec3(L), col, sat);
  col = (col - 0.5) * contrast + 0.5;
  // degradado de color de esquina (el rosa de #DRIVE)
  float gd = smoothstep(0.72, 1.25, dot(uv - 0.5, normalize(gradDir)) + 0.5);
  col = 1.0 - (1.0 - col) * (1.0 - gradCol * gd * gradAmt);
  // viñeta y grano
  col *= 1.0 - vignette * smoothstep(0.45, 1.05, r);
  col += (hash(uv * res + time * 61.0) - 0.5) * grain;
  col = mix(col, flashCol, flash);
  col = clamp(col, 0.0, 1.0);
  vec3 outc = toSRGB(col);
  if (manga > 0.5) outc = mangaFx(outc, uv, z);
  // bandas de cine
  float lb = letterbox * 0.5; if (uv.y < lb || uv.y > 1.0 - lb) outc = vec3(0.04);
  gl_FragColor = vec4(outc, 1.0);
}`;

export const GRADES = {
  neutro: { exposure: 1.0, sat: 1.08, contrast: 1.05, lift: [0.02, 0.02, 0.03], gain: [1, 1, 1], shadowTint: [0.75, 0.8, 1.0], hiTint: [1.0, 0.97, 0.9], gradCol: [1.0, 0.25, 0.6], gradAmt: 0.0, gradDir: [0.6, -1], vignette: 0.28, grain: 0.035 },
};

export class Renderer {
  constructor(canvas) {
    const r = (this.r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.q = 'hi'; this.ss = 1; this.scale = 1;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: { tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2() }, near: { value: 0.1 }, far: { value: 100 }, time: { value: 0 },
        exposure: { value: 1 }, aberr: { value: 2 }, focus: { value: 8 }, dof: { value: 0 }, grain: { value: 0.03 }, vignette: { value: 0.3 }, sat: { value: 1 }, contrast: { value: 1 },
        lift: { value: new THREE.Vector3() }, gain: { value: new THREE.Vector3(1, 1, 1) }, shadowTint: { value: new THREE.Vector3(1, 1, 1) }, hiTint: { value: new THREE.Vector3(1, 1, 1) },
        gradCol: { value: new THREE.Vector3(1, 0.3, 0.6) }, gradAmt: { value: 0 }, gradDir: { value: new THREE.Vector2(0.6, -1) }, letterbox: { value: 0 }, flash: { value: 0 }, flashCol: { value: new THREE.Vector3(1, 1, 1) }, speedBlur: { value: 0 }, manga: { value: 0 }, tMask: { value: null } },
    });
    this.quadScene = new THREE.Scene(); this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.55, 1.15);
    this.U = this.mat.uniforms; this.t = 0; this.white = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  }
  setQuality(q) { this.q = q; this.resize(this.w || innerWidth, this.h || innerHeight); }
  resize(w, h) {
    this.w = w; this.h = h; const r = this.r;
    const pr = (this.q === 'hi' ? Math.min(1.6, devicePixelRatio) : this.q === 'mid' ? Math.min(1.1, devicePixelRatio) : 0.8) * this.scale;
    r.setPixelRatio(pr); r.setSize(w, h);
    const W = Math.round(w * pr), H = Math.round(h * pr);
    this.rt?.dispose();
    const dt = new THREE.DepthTexture(W, H); dt.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthTexture: dt, samples: this.q === 'hi' ? 2 : 0 });
    this.bloom.setSize(Math.round(W / 4), Math.round(H / 4));
    this.maskRT?.dispose(); this.maskRT = new THREE.WebGLRenderTarget(Math.round(W / 2), Math.round(H / 2));
    this.U.res.value.set(W, H);
  }
  setGrade(gr) {
    const U = this.U, s = (k, v) => (Array.isArray(v) ? U[k].value.set(...v) : (U[k].value = v));
    for (const k in gr) if (U[k]) s(k, gr[k]);
  }
  render(scene, camera, dt = 0.016) {
    const r = this.r, U = this.U; this.t += dt; U.time.value = this.t % 100;
    if (U.manga.value > 0.5) { // máscara del coche principal (capa 2)
      const mask = camera.layers.mask, bg = scene.background, fog = scene.fog, au = r.shadowMap.autoUpdate; camera.layers.set(2); scene.overrideMaterial = this.white; scene.background = null; scene.fog = null; r.shadowMap.autoUpdate = false;
      r.setClearColor(0x000000, 1); r.setRenderTarget(this.maskRT); r.clear(); r.render(scene, camera);
      scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; r.shadowMap.autoUpdate = au; camera.layers.mask = mask; U.tMask.value = this.maskRT.texture;
    }
    r.setRenderTarget(this.rt); r.render(scene, camera);
    if (this.q !== 'lo') this.bloom.render(r, null, this.rt, dt, false);
    U.tColor.value = this.rt.texture; U.tDepth.value = this.rt.depthTexture; U.near.value = camera.near; U.far.value = camera.far;
    r.setRenderTarget(null); r.render(this.quadScene, this.quadCam);
  }
}
