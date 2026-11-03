// Pase de tinta en tiempo real: contorno por profundidad y normales, tono ACES, trama manga en las sombras y grano de papel.
import * as THREE from 'three';

const FRAG = `
#include <packing>
uniform sampler2D tColor; uniform sampler2D tNormal; uniform sampler2D tDepth;
uniform vec2 res; uniform float near; uniform float far; uniform float lineW; uniform float ss;
uniform vec3 ink; uniform float dots; uniform float exposure; uniform float grain; uniform float aberr;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y); }
float lin(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c){
  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  c *= exposure / 0.6; c = I * c; c = RRTAndODTFit(c); c = O * c; return clamp(c, 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec2 px = 1.0 / res; vec2 fc = gl_FragCoord.xy;
  vec2 uv = vUv + (vec2(noise(fc * 0.015), noise(fc * 0.015 + 31.7)) - 0.5) * px * 1.5 * ss;
  float w = lineW * ss * (0.75 + 0.5 * noise(fc * 0.03 / ss));
  float d0 = lin(uv); vec3 n0 = nrm(uv); float eD = 0.0; float eN = 0.0;
  for (int i = 0; i < 4; i++) {
    float a = float(i) * 0.7853982; vec2 o = vec2(cos(a), sin(a)) * w * px;
    eD = max(eD, abs(lin(uv + o) + lin(uv - o) - 2.0 * d0) / max(d0, 0.05));
    eN = max(eN, max(1.0 - dot(n0, nrm(uv + o)), 1.0 - dot(n0, nrm(uv - o))));
  }
  float fade = 1.0 - smoothstep(60.0, 220.0, d0);
  float edge = max(smoothstep(0.02, 0.05, eD), smoothstep(0.28, 0.5, eN)) * fade;
  vec2 ab = vec2(aberr * ss, aberr * 0.25 * ss) * px;
  vec3 hdr = vec3(texture2D(tColor, vUv + ab).r, texture2D(tColor, vUv).g, texture2D(tColor, vUv - ab).b);
  vec3 col = toSRGB(aces(hdr));
  col *= 1.0 - 0.1 * step(0.5, fract(fc.y / (3.0 * ss))) * clamp(aberr / 12.0, 0.0, 1.0);
  float L = dot(col, vec3(0.299, 0.587, 0.114));
  vec2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071) * (fc / ss) / 4.5; vec2 g = fract(r) - 0.5;
  float t = clamp((0.34 - L) / 0.3, 0.0, 1.0); float rad = sqrt(t) * 0.62;
  float dt = t > 0.01 ? 1.0 - smoothstep(rad - 0.12, rad + 0.12, length(g)) : 0.0;
  col = mix(col, ink, dt * dots);
  col = mix(col, ink, edge);
  col *= 1.0 - grain + grain * 2.0 * noise(fc * 0.7 / ss);
  gl_FragColor = vec4(col, 1.0);
}`;

export class Ink {
  constructor(renderer, { lineW = 1.3, ink = '#141414', dots = 0.4, exposure = 1.0, grain = 0.02, supersample = 2 } = {}) {
    this.r = renderer; this.ssWanted = supersample;
    this.normalMat = new THREE.MeshNormalMaterial();
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: null }, tNormal: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2() }, near: { value: 0.1 }, far: { value: 200 }, lineW: { value: lineW }, ss: { value: 1 }, ink: { value: new THREE.Color(ink) }, dots: { value: dots }, exposure: { value: exposure }, grain: { value: grain }, aberr: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FRAG, depthTest: false, depthWrite: false,
    });
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
  }
  setSize(w, h) {
    const dpr = this.r.getPixelRatio(); const ss = dpr >= 2 ? 1 : this.ssWanted; const W = Math.round(w * dpr * ss), H = Math.round(h * dpr * ss);
    this.rt?.dispose(); this.rtN?.dispose();
    const dt = new THREE.DepthTexture(W, H); dt.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthTexture: dt });
    this.rtN = new THREE.WebGLRenderTarget(W, H);
    this.mat.uniforms.res.value.set(W, H); this.mat.uniforms.ss.value = dpr * ss;
  }
  render(scene, camera) {
    const r = this.r, U = this.mat.uniforms;
    r.shadowMap.needsUpdate = true;
    const mask = camera.layers.mask; camera.layers.enable(1);
    r.setRenderTarget(this.rt); r.render(scene, camera); camera.layers.set(0);
    const bg = scene.background, sh = r.shadowMap.autoUpdate, fog = scene.fog;
    if (U.lineW.value > 0) { // sin líneas no hace falta el pase de normales
      scene.background = null; scene.fog = null; r.shadowMap.autoUpdate = false;
      scene.overrideMaterial = this.normalMat; r.setClearColor(0x8080ff, 1); r.setRenderTarget(this.rtN); r.clear(); r.render(scene, camera);
      scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; r.shadowMap.autoUpdate = sh; r.setClearColor(0x000000, 0);
    }
    camera.layers.mask = mask;
    U.tColor.value = this.rt.texture; U.tDepth.value = this.rt.depthTexture; U.tNormal.value = this.rtN.texture; U.near.value = camera.near; U.far.value = camera.far;
    r.setRenderTarget(null); r.render(this.scene, this.cam);
  }
}
