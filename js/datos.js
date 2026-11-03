// Datos de juego por coche: color de acento, onomatopeya, física y ficha técnica (todo inventado).
export const DATA = {
  hayate: {
    accent: '#ffd23f', ono: 'ブォン', sfx: 'VROOM!', stage: 'STAGE 2', trucado: true,
    phys: { accel: 8.2, vmax: 55, grip: 6.6, drift: 1.25, nitro: 1.0 },
    bars: { Potencia: 0.45, Par: 0.35, Ligereza: 0.9, Agarre: 0.7, Drift: 1.0, Nitro: 0.5 },
    tech: [['Motor', 'SK-4A · 1.6 L DOHC 16V atmosférico'], ['Potencia', '165 CV a 7.800 rpm'], ['Par', '162 Nm a 6.400 rpm'], ['Corte', '8.400 rpm'], ['Peso', '940 kg · reparto 53/47'], ['Medidas', '4.180 × 1.720 × 1.330 mm'], ['Batalla', '2.400 mm'], ['Tracción', 'Trasera (FR)'], ['Cambio', 'Manual 5 · relaciones cerradas'], ['0-100 km/h', '6,9 s'], ['Punta', '198 km/h'], ['Peso/potencia', '5,7 kg/CV'], ['Neumáticos', '205/50 R15 semi-slick'], ['Frenos', 'Pinzas de 4 pistones'], ['Suspensión', 'Coilovers 12 kg/mm'], ['Diferencial', 'Autoblocante de 2 vías'], ['Nitro', '1 botella · 2,5 kg']],
    mods: ['Mariposas individuales', 'Escape 4-1 recto', 'Freno de mano hidráulico', 'Volante extraíble', 'Jaula de 6 puntos'],
  },
  kurogane: {
    accent: '#3cf2ff', ono: 'ドドド', sfx: 'BWAAH!', stage: 'STAGE 3', trucado: true,
    phys: { accel: 9.6, vmax: 68, grip: 6.9, drift: 1.0, nitro: 1.25 },
    bars: { Potencia: 0.85, Par: 0.8, Ligereza: 0.5, Agarre: 0.75, Drift: 0.7, Nitro: 0.85 },
    tech: [['Motor', 'KR-20T · 2.0 L turbo 4 cil.'], ['Potencia', '310 CV a 6.800 rpm'], ['Par', '392 Nm a 4.200 rpm'], ['Turbo', '1,4 bar · turbo de bolas'], ['Peso', '1.240 kg · reparto 52/48'], ['Medidas', '4.310 × 1.760 × 1.270 mm'], ['Batalla', '2.430 mm'], ['Tracción', 'Trasera (FR)'], ['Cambio', 'Manual 6'], ['0-100 km/h', '4,6 s'], ['Punta', '262 km/h'], ['Peso/potencia', '4,0 kg/CV'], ['Neumáticos', '235/40 R18'], ['Frenos', 'Pinzas de 6 pistones'], ['Suspensión', 'Coilovers 14 kg/mm'], ['Diferencial', 'Autoblocante de 1,5 vías'], ['Nitro', '2 botellas · 5 kg']],
    mods: ['Intercooler frontal', 'Centralita reprogramada', 'Aero de carbono', 'Alerón GT', 'Capó con salidas de aire'],
  },
  tsubame: {
    accent: '#7dff5a', ono: 'ガッ', sfx: 'KRAK!', stage: 'STAGE 2', trucado: true,
    phys: { accel: 9.2, vmax: 63, grip: 8.6, drift: 0.8, nitro: 1.1 },
    bars: { Potencia: 0.75, Par: 0.75, Ligereza: 0.45, Agarre: 1.0, Drift: 0.55, Nitro: 0.6 },
    tech: [['Motor', 'TB-20 · 2.0 L turbo 4 cil.'], ['Potencia', '280 CV a 6.500 rpm'], ['Par', '380 Nm a 4.000 rpm'], ['Turbo', '1,2 bar · antilag'], ['Peso', '1.280 kg · reparto 58/42'], ['Medidas', '4.400 × 1.740 × 1.420 mm'], ['Batalla', '2.520 mm'], ['Tracción', 'Total (4WD) · 40/60'], ['Cambio', 'Manual 6'], ['0-100 km/h', '4,9 s'], ['Punta', '245 km/h'], ['Peso/potencia', '4,6 kg/CV'], ['Neumáticos', '225/45 R17 de rally'], ['Frenos', 'Pinzas de 4 pistones'], ['Suspensión', 'Rally de tirada larga'], ['Diferencial', 'Central activo'], ['Nitro', '1 botella · 3 kg']],
    mods: ['Antilag', 'Protector de cárter', 'Faros auxiliares', 'Toma de capó', 'Faldillas de rally'],
  },
  sakura: {
    accent: '#ff6fb5', ono: 'キュン', sfx: 'SKRAASH!', stage: 'STAGE 2', trucado: true,
    phys: { accel: 8.8, vmax: 62, grip: 7.0, drift: 1.15, nitro: 1.15 },
    bars: { Potencia: 0.65, Par: 0.55, Ligereza: 0.75, Agarre: 0.75, Drift: 0.9, Nitro: 0.7 },
    tech: [['Motor', 'SK-2R · birrotor 1,3 L turbo'], ['Potencia', '245 CV a 7.500 rpm'], ['Par', '294 Nm a 5.500 rpm'], ['Corte', '9.000 rpm'], ['Peso', '1.050 kg · reparto 50/50'], ['Medidas', '4.290 × 1.690 × 1.270 mm'], ['Batalla', '2.430 mm'], ['Tracción', 'Trasera (FR)'], ['Cambio', 'Manual 5'], ['0-100 km/h', '5,3 s'], ['Punta', '238 km/h'], ['Peso/potencia', '4,3 kg/CV'], ['Neumáticos', '225/45 R16'], ['Frenos', 'Pinzas de 4 pistones'], ['Suspensión', 'Coilovers 10 kg/mm'], ['Diferencial', 'Autoblocante de 1,5 vías'], ['Nitro', '1 botella rosa · 3 kg']],
    mods: ['Lumbreras agrandadas', 'Escape doble', 'Faros escamoteables LED', 'Vinilo itasha', 'Pegatinas hechas a mano'],
  },
  pico: {
    accent: '#b46bff', ono: 'ブーン', sfx: 'BZZZT!', stage: 'STAGE 1', trucado: true,
    phys: { accel: 7.0, vmax: 48, grip: 7.6, drift: 1.3, nitro: 1.3 },
    bars: { Potencia: 0.2, Par: 0.2, Ligereza: 1.0, Agarre: 0.8, Drift: 0.95, Nitro: 0.4 },
    tech: [['Motor', 'PK-66 · 660 cc turbo 3 cil.'], ['Potencia', '92 CV a 7.000 rpm (de serie 64)'], ['Par', '108 Nm a 4.000 rpm'], ['Turbo', '1,0 bar'], ['Peso', '650 kg · reparto 60/40'], ['Medidas', '3.395 × 1.475 × 1.600 mm'], ['Batalla', '2.360 mm'], ['Tracción', 'Delantera (FF)'], ['Cambio', 'Manual 5'], ['0-100 km/h', '8,4 s'], ['Punta', '172 km/h'], ['Peso/potencia', '7,1 kg/CV'], ['Neumáticos', '165/55 R14'], ['Frenos', 'Pinzas de 2 pistones'], ['Suspensión', 'Muelles cortos'], ['Diferencial', 'Helicoidal'], ['Nitro', 'Mini botella · 1 kg']],
    mods: ['Turbo más grande', 'Baca con caja roja', 'Faros con cinta en X', 'Llantas de chapa', 'Pegatina de novato'],
  },
  onibi: {
    accent: '#ff7a1a', ono: 'ドカン', sfx: 'BOOM!', stage: 'STAGE 4', trucado: true, ilegal: true,
    phys: { accel: 11.0, vmax: 74, grip: 6.1, drift: 1.2, nitro: 1.4 },
    bars: { Potencia: 1.0, Par: 1.0, Ligereza: 0.55, Agarre: 0.6, Drift: 0.9, Nitro: 1.0 },
    tech: [['Motor', 'GN-30DT · 3.0 L 6 en línea biturbo'], ['Potencia', '520 CV a 7.200 rpm'], ['Par', '610 Nm a 4.800 rpm'], ['Turbo', '1,8 bar · biturbo'], ['Peso', '1.150 kg · reparto 54/46'], ['Medidas', '4.380 × 1.900 × 1.380 mm'], ['Batalla', '2.510 mm'], ['Tracción', 'Trasera (FR)'], ['Cambio', 'Secuencial 6'], ['0-100 km/h', '3,4 s'], ['Punta', '286 km/h'], ['Peso/potencia', '2,2 kg/CV'], ['Neumáticos', '265/35 R18 semi-slick'], ['Frenos', 'Pinzas de 6 pistones'], ['Suspensión', 'Coilovers 16 kg/mm'], ['Diferencial', 'Soldado'], ['Nitro', '2 botellas · 6 kg']],
    mods: ['Motor asomando por el capó', 'Biturbo rojo', 'Diferencial soldado', 'Escape cuádruple', 'Luneta de lamas', 'Óxido de fábrica'],
  },
};
export const PAINTS = ['#d8432b', '#ef8fb6', '#34435e', '#f2c230', '#5f8a55', '#e9dfc7', '#141416', '#f2efe6', '#7a4bd8', '#2bb3c9'];
// Rivales especiales de la historia
export const KUROISHI = { id: 'kuroishi', base: 'kurogane', name: 'Kuroishi Black', color: '#121214', roof: '#121214', lower: '#3a0d0d', sideStripes: [{ y: 0.4, h: 0.03, c: '#d0262a' }], number: '00', numBg: '#d0262a', numFg: '#121214', banner: 'KUROISHI  GROUP', stickers: [{ t: '黒石', x: -1.45, y: 0.62, h: 0.18, font: "'Yuji Syuku'", fg: '#d0262a' }], accent: '#ff2a3d' };
export const AKANE = { id: 'akane', base: 'sakura', name: 'Onibi Original', color: '#ff7a1a', roof: '#141414', lower: '#141414', sideStripes: [{ y: 0.395, h: 0.025, c: '#ffd23f' }], pattern: null, number: '1', numBg: '#141414', numFg: '#ff7a1a', banner: 'ONIBI', stickers: [{ t: '鬼火', x: 1.4, y: 0.62, h: 0.16, font: "'Yuji Syuku'", fg: '#141414' }], accent: '#ff7a1a' };
