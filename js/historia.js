// Historia: personajes, capítulos por ruta y páginas de manga con parallax de giroscopio.
export const PILOTS = {
  hayate: { name: 'KAI', full: 'Kai Arata', kanji: '疾風', age: 19, hair: 'spiky', role: 'Repartidor nocturno', quote: 'No corro para ganar. Corro porque es lo único que sé hacer.' },
  kurogane: { name: 'REN', full: 'Ren Kuroishi', kanji: '鉄', age: 21, hair: 'slick', role: 'Heredero del Grupo Kuroishi', quote: 'En Kuroishi no se pierde. Nunca.' },
  tsubame: { name: 'DAICHI', full: 'Daichi Mori', kanji: '燕', age: 20, hair: 'cap', role: 'Piloto de rally de la montaña', quote: 'La montaña no perdona. Por eso yo tampoco fallo.' },
  sakura: { name: 'MIKA', full: 'Mika Hoshino', kanji: '桜', age: 19, hair: 'buns', role: 'Grafitera y piloto', quote: 'Cada curva es un lienzo. Yo firmo con humo.' },
  pico: { name: 'YUTO', full: 'Yuto Sato', kanji: '軽', age: 17, hair: 'beanie', role: 'El novato de la pegatina verde', quote: '¡Que es un kei, no un juguete!' },
  onibi: { name: 'GEN', full: 'Gen Takeda', kanji: '鬼火', age: 46, hair: 'long', role: 'Mecánico de la vieja escuela', quote: 'Diez años sin bajar el Kirisame. Los neumáticos aún se acuerdan.' },
};
const R1 = { hayate: 'kurogane', kurogane: 'hayate', sakura: 'onibi', tsubame: 'pico', pico: 'sakura', onibi: 'tsubame' };
const R3 = { hayate: 'onibi', kurogane: 'sakura', sakura: 'pico', tsubame: 'hayate', pico: 'kurogane', onibi: 'hayate' };
const L = {
  hayate: [
    ['Monte Kirisame. 2:14 de la madrugada. Kai entrega el último pedido... y se encuentra a medio puerto esperándole.', '¿Una bajada? Vale. Pero no me hagas perder la hora del reparto.', 'Ese trasto era de tu padre, ¿no? Dicen que se rajó la noche de Onibi.'],
    ['Noche de Niebla. La carrera ilegal de Kuroishi. Las apuestas, los focos, el coche negro.', 'Alguien ha tocado mi coche. El volante tira solo...', 'Kuroishi no compite. Kuroishi decide quién gana.'],
    ['Tres días después. El Hayate es un amasijo en el taller de Gen. Yuto trae una cinta VHS.', 'Mi padre no se rajó... intentó sacarla del barranco.', 'Arréglalo, chaval. Y luego corre la línea que tu padre no pudo terminar.'],
    ['Amanecer. Seis coches en la salida. Kuroishi quiere cerrar el puerto para siempre.', 'Esta línea es de mi padre. Y ahora es mía.', 'Kuroishi Black. Sin piedad.'],
    ['La Subida. Alguien ha pintado un tag naranja en la meta... desde dentro de un coche que nadie había visto en diez años.', '¿Onibi...? ¿Estás viva?', 'Si quieres la verdad, Kai, súbeme el Kirisame.'],
  ],
  kurogane: [
    ['Ren baja del ático de Kuroishi a medianoche. Su padre le ha dado una orden: humillar a los locales.', 'Esto acaba en dos curvas.', 'Llevo diez años bajando este puerto, niño rico.'],
    ['Noche de Niebla. Ren descubre a los mecánicos de su padre tocando los coches rivales.', '¿Qué estáis haciendo con ese coche?', 'Órdenes del señor Kuroishi. Tú solo gana.'],
    ['Ren ve la cinta de Yuto. El coche que saboteó a Onibi tenía el logo de su familia.', 'Mi padre... fue él.', 'Entonces demuéstranos de qué lado estás.'],
    ['Amanecer. Ren se quita la chaqueta de Kuroishi. Hoy corre con la crew.', 'Hoy no compito por un apellido.', 'Traidor. Te voy a sacar del mapa.'],
    ['La Subida. Akane está viva, y busca al hijo del hombre que la sacó de la carretera.', 'No soy mi padre. Déjame demostrarlo.', 'Eso se demuestra cuesta arriba.'],
  ],
  sakura: [
    ['Mika pinta un tag naranja, 鬼火, en el muro de la curva 7. Un rat-rod oxidado frena a su lado.', 'Oye, viejo, ¿te gusta mi arte?', 'Ese tag no es tuyo, niña. Era de alguien que se perdió aquí.'],
    ['Noche de Niebla. Redada. A Mika le requisan los botes de spray... y el Sakura.', '¡Ese coche es lo único que me queda de ella!', 'Kuroishi ha pagado a la policía. Corre si puedes.'],
    ['En el taller de Gen, Mika abre la guantera de un coche viejo. Hay una foto de su madre al volante.', 'Onibi... era mi madre.', 'Por eso pintas su firma. Nunca la dejaste irse.'],
    ['Amanecer. Todo el puerto está cubierto de tags naranjas. Mika ha despertado la leyenda.', 'Hoy el Kirisame lleva nuestra firma.', 'Pinta lo que quieras. Ganaré igual.'],
    ['La Subida. Un coche naranja con faros escamoteables aparece en la niebla. Lleva la misma firma.', '¿Mamá...?', 'Has crecido, Mika. Ahora enséñame cómo conduces.'],
  ],
  tsubame: [
    ['Daichi baja de los pueblos de la montaña. Le reta el crío del kei amarillo.', 'Vale. Pero vamos con cabeza.', '¡Cabeza la mía! ¡Te como en las horquillas!'],
    ['Noche de Niebla. Lluvia, barro y un coche negro que embiste a Daichi contra el quitamiedos.', 'No veo nada... ¡no veo nada!', 'La lluvia te queda grande, chico de pueblo.'],
    ['Daichi sale del hospital. Le tiemblan las manos con la lluvia. Kai le ofrece una bajada amistosa.', 'Si vuelvo a chocar...', 'No vas a chocar. Vamos juntos.'],
    ['Amanecer. Recuerda la noche de hace diez años: él iba en el coche de su tío y vio el sabotaje.', 'Yo lo vi. Y hoy lo voy a contar con el pie derecho.', 'Un testigo menos, eso es lo que serás.'],
    ['La Subida. El tío de Daichi era el copiloto de Akane. Ella le espera en la salida.', 'Mi tío nunca dejó de buscarte.', 'Lo sé. Súbelo por él.'],
  ],
  pico: [
    ['Yuto le apuesta un bote de ramen a la chica del coche rosa a que gana.', '¡Que es un kei, no un juguete!', 'Qué mono. Prepárate para llorar.'],
    ['Noche de Niebla. Yuto se apuesta el kei con los de Kuroishi... y lo pierde.', 'No... mi Pico no...', 'Un juguete más para el desguace.'],
    ['En el desván de su abuelo, Yuto encuentra unas cintas VHS: "Kirisame · Bajada del Amanecer · 2016".', 'Lo grabó todo... ¡el sabotaje está en la cinta!', 'Esa cinta vale más que todos nuestros coches juntos.'],
    ['Amanecer. Gen le devuelve el Pico, tuneado de arriba abajo.', 'Pequeño pero matón. ¡Vamos!', 'Te vas a quedar sin juguete otra vez.'],
    ['La Subida. Akane conoce a Yuto: "Tú eres el de la cinta". Quiere verle conducir.', '¿Yo? ¿Contra la leyenda?', 'Los pequeños suben mejor las cuestas.'],
  ],
  onibi: [
    ['Gen saca el Onibi del taller por primera vez en diez años. Un chaval de rally le mira con respeto.', 'Una bajada. Solo una. Por los viejos tiempos.', 'Será un honor, maestro.'],
    ['Noche de Niebla. Gen ve el mismo coche negro de hace diez años. Las manos le sudan.', 'Otra vez no. Otra vez no...', 'Te acuerdas de mí, ¿eh, mecánico?'],
    ['Yuto pone la cinta. Gen ve el momento exacto: no fue su reglaje. Fue un corte en los frenos.', 'Diez años culpándome... para nada.', 'Ahora que lo sabes, ¿vas a seguir escondido?'],
    ['Amanecer. Gen cierra la persiana del taller y sube al Onibi. Una última bajada.', 'Esta es por Akane. Y por todos vosotros.', 'Los viejos deberían quedarse en el taller.'],
    ['La Subida. Akane vuelve y le pide a Gen lo único que nunca pudo pagarle: una revancha.', 'Te he guardado el sitio diez años.', 'Pues súbemelo, Gen.'],
  ],
};
export const CHAPTERS = ['SUBIDA', 'CAÍDA', 'LEVANTAMIENTO', 'LA BAJADA DEL AMANECER', 'GAME+ · LA SUBIDA'];
const WEATHER = { 0: 'noche', 1: 'niebla', 2: 'nublado', 3: 'amanecer', 4: 'dia' };
export function chapter(carId, n) {
  const l = L[carId][n];
  const rival = n === 0 ? R1[carId] : n === 2 ? R3[carId] : n === 4 ? 'akane' : 'kuroishi';
  return {
    n, title: CHAPTERS[n], narr: l[0], me: l[1], them: l[2], rival,
    weather: carId === 'tsubame' && n === 2 ? 'lluvia' : WEATHER[n], reverse: n === 4,
    skill: [0.86, 1.0, 0.9, 1.06, 1.12][n], mustWin: n !== 1, vhs: n === 1 || n === 2,
  };
}
export const RIVAL_NAMES = { kuroishi: 'KUROISHI BLACK', akane: 'AKANE · ONIBI' };

// ---------- silueta de personaje (sin ilustración: sombra con ojos y luz de borde) ----------
export function drawPilot(g, x, y, s, id, accent) {
  const P = PILOTS[id] || { hair: 'long', kanji: '?' }, hair = P.hair, K = '#141414', D = '#2c2c31';
  const path = (pts, close = true) => { g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); if (close) g.closePath(); };
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = g.lineCap = 'round';
  // pelo largo por detrás (Gen, Akane)
  if (hair === 'long') { g.fillStyle = K; path([[-50, -40], [-62, 60], [-40, 92], [40, 92], [62, 60], [50, -40]]); g.fill(); }
  // cuerpo: chaqueta con cuello y solapas
  g.fillStyle = K; g.beginPath(); g.moveTo(-98, 140); g.quadraticCurveTo(-94, 46, -34, 30); g.lineTo(34, 30); g.quadraticCurveTo(94, 46, 98, 140); g.closePath(); g.fill();
  g.strokeStyle = D; g.lineWidth = 4;
  if (id === 'onibi') { g.fillStyle = '#d9d4c7'; path([[-30, 34], [-22, 140], [22, 140], [30, 34], [14, 52], [-14, 52]]); g.fill(); g.fillStyle = K; g.fillRect(-36, 34, 8, 106); g.fillRect(28, 34, 8, 106); }
  else { g.beginPath(); g.moveTo(-30, 32); g.lineTo(-6, 92); g.moveTo(30, 32); g.lineTo(6, 92); g.moveTo(0, 92); g.lineTo(0, 140); g.stroke(); }
  if (id === 'tsubame') { g.strokeStyle = '#efebe1'; g.lineWidth = 6; g.beginPath(); g.moveTo(-96, 104); g.lineTo(-40, 96); g.moveTo(96, 104); g.lineTo(40, 96); g.stroke(); }
  // cuello y cabeza
  g.fillStyle = K; g.fillRect(-14, 18, 28, 22);
  if (id === 'kuroishi') {
    g.beginPath(); g.ellipse(0, -16, 54, 60, 0, 0, 6.3); g.fill();
    g.fillStyle = accent; path([[-46, -22], [48, -26], [44, 6], [-42, 8]]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; path([[-30, -18], [-4, -20], [-14, -8], [-34, -6]]); g.fill();
    g.strokeStyle = accent; g.lineWidth = 4; g.beginPath(); g.moveTo(-50, 26); g.quadraticCurveTo(0, 40, 50, 26); g.stroke();
  } else { g.beginPath(); g.ellipse(0, -10, 42, 50, 0, 0, 6.3); g.fill(); }
  // pelo y gorros
  g.fillStyle = K; g.beginPath();
  if (hair === 'spiky') { g.moveTo(-46, 4); for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.95 + (i / 10) * Math.PI * 1.1, r = i % 2 ? 54 : 74; g.lineTo(Math.cos(a) * r, -22 + Math.sin(a) * r * 0.95); } g.lineTo(46, 4); g.lineTo(30, -20); g.lineTo(10, -8); g.lineTo(-6, -24); g.lineTo(-26, -6); }
  if (hair === 'slick') { g.moveTo(-44, 0); g.quadraticCurveTo(-56, -64, 10, -66); g.quadraticCurveTo(66, -60, 50, -10); g.lineTo(34, -30); g.quadraticCurveTo(0, -40, -40, -24); }
  if (hair === 'cap') { g.ellipse(0, -34, 48, 30, 0, Math.PI, 0); g.rect(-48, -38, 96, 10); g.moveTo(-40, -32); g.lineTo(-86, -24); g.lineTo(-84, -14); g.lineTo(-38, -20); }
  if (hair === 'buns') { g.ellipse(0, -30, 48, 34, 0, Math.PI, 0); g.moveTo(-24, -66); g.arc(-44, -66, 20, 0, 6.3); g.moveTo(64, -66); g.arc(44, -66, 20, 0, 6.3); g.rect(-50, -32, 14, 60); g.rect(36, -32, 14, 60); }
  if (hair === 'beanie') { g.ellipse(0, -36, 48, 40, 0, Math.PI, 0); g.rect(-51, -38, 102, 18); }
  if (hair === 'long') { g.ellipse(0, -28, 52, 36, 0, Math.PI, 0); g.moveTo(-50, -26); g.lineTo(-10, -26); g.lineTo(-30, 2); }
  if (id !== 'kuroishi') g.fill();
  // detalles por personaje
  const W = '#efebe1';
  if (id === 'hayate') { // cascos al cuello y cicatriz
    g.strokeStyle = accent; g.lineWidth = 7; g.beginPath(); g.arc(0, 26, 40, 0.15, Math.PI - 0.15); g.stroke();
    g.fillStyle = accent; g.fillRect(-48, 22, 16, 24); g.fillRect(32, 22, 16, 24);
    g.strokeStyle = W; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 30); g.lineTo(14, 36); g.stroke();
  }
  if (id === 'kurogane') { // mechón plateado y cadena de oro
    g.strokeStyle = '#c9ccd2'; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -50); g.quadraticCurveTo(10, -66, 44, -40); g.stroke();
    g.strokeStyle = '#e0b23a'; g.lineWidth = 3; g.setLineDash([4, 3]); g.beginPath(); g.arc(0, 30, 30, 0.3, Math.PI - 0.3); g.stroke(); g.setLineDash([]);
  }
  if (id === 'tsubame') { // barro en la mejilla y broche de la gorra
    g.fillStyle = '#7a5a3a'; g.beginPath(); g.ellipse(22, 10, 9, 5, -0.3, 0, 6.3); g.fill();
    g.fillStyle = accent; g.fillRect(-6, -44, 12, 8);
  }
  if (id === 'sakura') { // mechas rosas, aros, pegatina de estrella y spray
    g.strokeStyle = accent; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -58); g.quadraticCurveTo(-14, -40, -36, -10); g.moveTo(28, -58); g.quadraticCurveTo(16, -40, 38, -10); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(-42, 18, 8, 0, 6.3); g.moveTo(50, 18); g.arc(42, 18, 8, 0, 6.3); g.stroke();
    g.fillStyle = accent; path(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4 : 10; return [24 + Math.cos(a) * r, 12 + Math.sin(a) * r]; })); g.fill();
    g.save(); g.translate(74, 60); g.rotate(0.35); g.fillStyle = '#d9d4c7'; g.fillRect(-12, -30, 24, 56); g.fillStyle = accent; g.fillRect(-12, -14, 24, 16); g.fillStyle = K; g.fillRect(-5, -40, 10, 10); g.restore();
  }
  if (id === 'pico') { g.strokeStyle = accent; g.lineWidth = 6; g.beginPath(); g.moveTo(-50, -26); g.lineTo(50, -26); g.stroke(); }
  if (id === 'onibi') { // canas, barba de tres días y palillo
    g.strokeStyle = '#9a978f'; g.lineWidth = 3; for (const dx of [-30, -12, 16]) { g.beginPath(); g.moveTo(dx, -58); g.quadraticCurveTo(dx - 10, -36, dx - 22, -20); g.stroke(); }
    g.fillStyle = '#5a5a5a'; for (let i = 0; i < 26; i++) g.fillRect(-22 + ((i * 37) % 44), 18 + ((i * 13) % 14), 2, 2);
    g.strokeStyle = '#c9a36a'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 26); g.lineTo(30, 20); g.stroke();
  }
  if (id === 'akane') { // mechón naranja y cicatriz en la ceja
    g.strokeStyle = accent; g.lineWidth = 6; g.beginPath(); g.moveTo(20, -60); g.quadraticCurveTo(46, -30, 50, 40); g.stroke();
    g.strokeStyle = W; g.lineWidth = 2; g.beginPath(); g.moveTo(-26, -24); g.lineTo(-10, -12); g.stroke();
  }
  // luz de borde
  g.strokeStyle = accent; g.lineWidth = 5; g.beginPath(); if (id === 'kuroishi') g.ellipse(0, -16, 56, 62, 0, -1.2, 0.6); else g.ellipse(0, -10, 44, 52, 0, -1.2, 0.6); g.stroke();
  g.beginPath(); g.moveTo(40, 34); g.quadraticCurveTo(90, 44, 96, 140); g.stroke();
  // ojos y boca
  if (id !== 'kuroishi') {
    g.fillStyle = W;
    if (id === 'pico') { // gafas redondas, pecas y sonrisa
      g.strokeStyle = W; g.lineWidth = 3; g.beginPath(); g.arc(-17, -6, 11, 0, 6.3); g.moveTo(29, -6); g.arc(18, -6, 11, 0, 6.3); g.moveTo(-6, -6); g.lineTo(7, -6); g.stroke();
      g.fillRect(-19, -8, 4, 4); g.fillRect(16, -8, 4, 4);
      g.fillStyle = '#c98a5a'; for (const [a, b] of [[-26, 10], [-20, 13], [24, 10], [18, 13]]) g.fillRect(a, b, 3, 3);
      g.fillStyle = W; g.beginPath(); g.ellipse(0, 26, 10, 7, 0, 0, Math.PI); g.fill();
    } else {
      const tilt = id === 'kurogane' ? 0.28 : id === 'tsubame' ? 0.02 : 0.15;
      g.save(); g.translate(-16, -6); g.rotate(tilt); g.fillRect(-12, -3, 22, 6); g.restore(); g.save(); g.translate(18, -6); g.rotate(-tilt); g.fillRect(-10, -3, 22, 6); g.restore();
      g.strokeStyle = W; g.lineWidth = 2.5; g.beginPath();
      if (id === 'sakura' || id === 'akane') { g.moveTo(-10, 22); g.quadraticCurveTo(2, 30, 14, 20); } else if (id === 'kurogane') { g.moveTo(-8, 24); g.lineTo(12, 21); } else { g.moveTo(-8, 24); g.lineTo(10, 24); }
      g.stroke();
    }
  }
  // kanji en el pecho
  g.fillStyle = accent; g.font = "bold 44px 'Yuji Syuku'"; g.textAlign = 'center'; g.fillText(P.kanji, id === 'onibi' ? 52 : 0, 118);
  g.restore();
}

// ---------- página de manga ----------
export class MangaPage {
  constructor(canvas) { this.c = canvas; this.g = canvas.getContext('2d'); this.tilt = { x: 0, y: 0 }; this.t = 0; this.on = false;
    addEventListener('deviceorientation', (e) => { if (e.gamma == null) return; this.tilt.x = Math.max(-1, Math.min(1, e.gamma / 30)); this.tilt.y = Math.max(-1, Math.min(1, (e.beta - 40) / 30)); });
    addEventListener('mousemove', (e) => { if (!this.on) return; this.tilt.x = (e.clientX / innerWidth - 0.5) * 2; this.tilt.y = (e.clientY / innerHeight - 0.5) * 2; });
  }
  static askGyro() { try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) {} }
  show(page) { this.page = page; this.t = 0; this.on = true; this.resize(); }
  hide() { this.on = false; }
  resize() { const d = Math.min(2, devicePixelRatio); this.W = innerWidth; this.H = innerHeight; this.c.width = this.W * d; this.c.height = this.H * d; this.g.setTransform(d, 0, 0, d, 0, 0); }
  draw(dt) {
    if (!this.on) return; this.t += dt; const g = this.g, W = this.W, H = this.H, P = this.page, tx = this.tilt.x, ty = this.tilt.y;
    g.fillStyle = '#efebe1'; g.fillRect(0, 0, W, H);
    const m = Math.min(W, H) * 0.025, gut = Math.min(W, H) * 0.018, portrait = H > W;
    const panels = portrait
      ? [[[m, m], [W - m, m], [W - m, H * 0.3], [m, H * 0.34]], [[m, H * 0.34 + gut], [W * 0.55, H * 0.3 + gut * 1.4], [W * 0.5, H * 0.66], [m, H * 0.66]], [[W * 0.55 + gut, H * 0.3 + gut * 1.4], [W - m, H * 0.3 + gut], [W - m, H * 0.66], [W * 0.5 + gut, H * 0.66]], [[m, H * 0.66 + gut], [W - m, H * 0.66 + gut], [W - m, H - m], [m, H - m]]]
      : [[[m, m], [W * 0.62, m], [W * 0.58, H * 0.48], [m, H * 0.5]], [[W * 0.62 + gut, m], [W - m, m], [W - m, H * 0.46], [W * 0.58 + gut, H * 0.48]], [[m, H * 0.5 + gut], [W * 0.44, H * 0.5 + gut], [W * 0.41, H - m], [m, H - m]], [[W * 0.44 + gut, H * 0.5 + gut], [W - m, H * 0.46 + gut], [W - m, H - m], [W * 0.41 + gut, H - m]]];
    const bbox = (p) => { const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; };
    panels.forEach((pp, i) => {
      const [bx, by, bw, bh] = bbox(pp), k = Math.min(1, Math.max(0, (this.t - i * 0.18) * 3)); if (k <= 0) return;
      g.save(); g.beginPath(); pp.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); g.globalAlpha = k;
      const pan = P.panels[i]; this.panel(g, pan, bx, by, bw, bh, tx, ty, i); g.restore();
      g.lineWidth = 5; g.strokeStyle = '#141414'; g.beginPath(); pp.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
    });
    if (P.vhs) { g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); g.font = `${Math.min(30, W * 0.04)}px 'VT323', monospace`; g.fillStyle = '#fff'; g.shadowColor = '#0ff'; g.shadowBlur = 6; g.textAlign = 'right'; g.fillText('PLAY ▶', W - m * 2, m * 2 + 20); g.textAlign = 'left'; g.fillText(P.vhs, m * 2, H - m * 2); g.shadowBlur = 0; }
    if (this.t > 1.2 && ((this.t * 2) | 0) % 2) { g.font = "900 14px 'Zen Kaku Gothic New'"; g.fillStyle = '#141414'; g.textAlign = 'right'; g.fillText('TOCA PARA SEGUIR ▶', W - m * 1.5, H - m * 0.6); g.textAlign = 'left'; }
  }
  panel(g, pan, x, y, w, h, tx, ty, i) {
    const off = (d) => [tx * 18 * d, ty * 12 * d];
    // fondo
    g.fillStyle = pan.bg || '#efebe1'; g.fillRect(x - 40, y - 40, w + 80, h + 80);
    if (pan.tone) { const [ox, oy] = off(0.3); g.fillStyle = pan.tone; for (let yy = y - 20; yy < y + h + 20; yy += 9) for (let xx = x - 20 + ((yy / 9) % 2) * 4.5; xx < x + w + 20; xx += 9) { g.beginPath(); g.arc(xx + ox, yy + oy, 1.8, 0, 6.3); g.fill(); } }
    if (pan.lines) { const [ox, oy] = off(0.5); const cx = x + w * 0.5 + ox, cy = y + h * 0.5 + oy; g.fillStyle = '#141414'; for (let k = 0; k < 90; k++) { const a = (k / 90) * Math.PI * 2 + Math.sin(k * 7.3), r0 = Math.max(w, h) * (0.32 + ((k * 37) % 10) / 40), r1 = Math.max(w, h); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7); g.lineTo(cx + Math.cos(a - 0.012) * r1, cy + Math.sin(a - 0.012) * r1); g.lineTo(cx + Math.cos(a + 0.012) * r1, cy + Math.sin(a + 0.012) * r1); g.fill(); } }
    if (pan.img) { const [ox, oy] = off(1); const im = pan.img, sc = (pan.cover ? Math.max : Math.min)((w * (pan.imgScale || 1.05)) / im.width, (h * (pan.imgScale || 1.05)) / im.height); const iw = im.width * sc, ih = im.height * sc; g.drawImage(im, x + (w - iw) / 2 + ox + (pan.imgDx || 0) * w, y + (h - ih) / 2 + oy + (pan.imgDy || 0) * h, iw, ih); }
    if (pan.pilot) { const [ox, oy] = off(1.2); drawPilot(g, x + w * (pan.pilotX || 0.72) + ox, y + h * 0.42 + oy, Math.min(w, h) / 300, pan.pilot, pan.accent || '#ffd23f'); }
    if (pan.sfx) { const [ox, oy] = off(1.6); g.save(); g.translate(x + w * 0.5 + ox, y + h * 0.5 + oy); g.rotate(-0.12); const s = Math.min(w, h) * 0.38; g.font = `${s}px 'Dela Gothic One'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = s * 0.12; g.strokeStyle = '#141414'; g.strokeText(pan.sfx, 0, 0); g.fillStyle = pan.sfxC || '#fff'; g.fillText(pan.sfx, 0, 0); g.restore(); }
    if (pan.title) { const [ox, oy] = off(0.8); g.save(); g.translate(x + w * 0.06 + ox, y + h * 0.55 + oy); g.rotate(-0.05); g.font = `${Math.min(w * 0.16, 96)}px 'Permanent Marker'`; g.lineWidth = 8; g.strokeStyle = '#141414'; g.fillStyle = pan.accent || '#ffd23f'; g.strokeText(pan.title, 0, 0); g.fillText(pan.title, 0, 0); if (pan.sub) { const fs2 = Math.min(w * 0.035, 18); g.font = `900 ${fs2}px 'Zen Kaku Gothic New'`; const sw = g.measureText(pan.sub).width; g.fillStyle = '#141414'; g.fillRect(-4, Math.min(w * 0.08, 40) - fs2, sw + 16, fs2 * 1.45); g.fillStyle = '#efebe1'; g.fillText(pan.sub, 4, Math.min(w * 0.08, 40)); } g.restore(); }
    const [tx2, ty2] = off(0.45);
    if (pan.narr) this.box(g, pan.narr, x + 14 + tx2, y + 14 + ty2, Math.min(w * 0.8, 520), 'narr');
    if (pan.say) this.box(g, pan.say, x + w * (pan.sayX ?? 0.06) + tx2, y + h * (pan.sayY ?? 0.62) + ty2, Math.min(w * 0.62, 420), 'say');
  }
  box(g, text, x, y, maxW, kind) {
    const fs = Math.max(13, Math.min(19, maxW / 22)); g.font = `${kind === 'say' ? 700 : 900} ${fs}px 'Zen Kaku Gothic New'`; const words = text.split(' '), lines = []; let cur = '';
    for (const wd of words) { const tt = cur ? cur + ' ' + wd : wd; if (g.measureText(tt).width > maxW - 28) { lines.push(cur); cur = wd; } else cur = tt; } if (cur) lines.push(cur);
    const bw = Math.min(maxW, Math.max(...lines.map((l) => g.measureText(l).width)) + 30), bh = lines.length * fs * 1.35 + 22; if (kind === 'say') { x += bw * 0.1; y += bh * 0.18; }
    g.fillStyle = '#f7f4ec'; g.strokeStyle = '#141414'; g.lineWidth = 3;
    if (kind === 'say') { g.beginPath(); g.ellipse(x + bw / 2, y + bh / 2, bw * 0.58, bh * 0.66, 0, 0, 6.3); g.fill(); g.stroke(); } else { g.fillRect(x, y, bw, bh); g.strokeRect(x, y, bw, bh); }
    g.fillStyle = '#141414'; g.textBaseline = 'top'; lines.forEach((l, i) => g.fillText(l, x + 15, y + 11 + i * fs * 1.35)); g.textBaseline = 'alphabetic';
  }
}
