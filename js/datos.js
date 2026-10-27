/* ==========================================================================
   datos.js — Beats de ejemplo, portadas generadas por código, licencias y permisos
   por rol. Cuando existan los endpoints de beat y compra en Spring, los
   beats se pedirán a la API en lugar de salir de este archivo.
   ========================================================================== */

const GENEROS = ["Boombap", "Trap", "Drill", "Lo-fi", "Dembow", "Jazz"];

const LICENCIAS = [
  { id: "basica", nombre: "Básica", factor: 1, incluye: ["Archivo MP3", "Un proyecto", "Hasta 10.000 reproducciones"] },
  { id: "premium", nombre: "Premium", factor: 2.4, incluye: ["WAV y pistas separadas", "Proyectos ilimitados", "Uso comercial"] },
  { id: "exclusiva", nombre: "Exclusiva", factor: 8, incluye: ["Derechos exclusivos del beat", "WAV y pistas separadas", "Uso comercial"] }
];

/* Secciones del menú lateral según el rol (el rol viene dentro del token JWT) */
const MENU_POR_ROL = {
  COMPRADOR: ["resumen", "catalogo", "compras"],
  PRODUCTOR: ["resumen", "catalogo", "misbeats", "ventas"],
  ADMIN: ["resumen", "catalogo", "beats", "usuarios"]
};

const TITULO_VISTA = {
  resumen: "Resumen",
  catalogo: "Catálogo",
  compras: "Mis compras",
  misbeats: "Mis beats",
  beats: "Beats",
  ventas: "Mis ventas",
  usuarios: "Usuarios"
};

const NOMBRE_ROL = { ADMIN: "Administrador", PRODUCTOR: "Productor", COMPRADOR: "Comprador" };

/* Usuarios de prueba que crea el DataSeeder del backend */
const MIRADAS = {
  COMPRADOR: {
    resumen: "Escucha fragmentos, compra licencias y revisa sus compras.",
    correo: "comprador@beatmarket.com",
    clave: "comprador123"
  },
  PRODUCTOR: {
    resumen: "Publica y administra sus beats y consulta sus ventas.",
    correo: "productor@beatmarket.com",
    clave: "productor123"
  },
  ADMIN: {
    resumen: "Administra usuarios y beats de todo el mercado.",
    correo: "admin@beatmarket.com",
    clave: "admin123"
  }
};

const PERMISOS = [
  { accion: "Escuchar fragmentos en el catálogo", ADMIN: true, PRODUCTOR: true, COMPRADOR: true },
  { accion: "Comprar licencias", ADMIN: false, PRODUCTOR: false, COMPRADOR: true },
  { accion: "Ver sus compras", ADMIN: false, PRODUCTOR: false, COMPRADOR: true },
  { accion: "Crear, editar y eliminar sus propios beats", ADMIN: false, PRODUCTOR: true, COMPRADOR: false },
  { accion: "Ver sus ventas", ADMIN: false, PRODUCTOR: true, COMPRADOR: false },
  { accion: "Crear, editar y eliminar cualquier beat", ADMIN: true, PRODUCTOR: false, COMPRADOR: false },
  { accion: "Crear, editar y eliminar usuarios", ADMIN: true, PRODUCTOR: false, COMPRADOR: false }
];

/* ---------- Beats de ejemplo ----------
   patron: 16 pasos por compás. bombo: x/X golpe. caja: x golpe, g fantasma.
   hat: x golpe, s suave, o abierto, r trino de tres. acorde: [paso, duración].
   bajo: [paso, semitonos sobre la raíz, duración]. melodia: un arreglo por
   compás del ciclo con [paso, nota MIDI, duración].                        */
const OBRAS_BASE = [
  {
    id: 1, titulo: "Madrugada en La Cumbre", productor: "granujabeats", productorNombre: "Granuja Beats",
    genero: "Boombap", bpm: 86, tono: "Re menor", precio: 60000, reproducciones: 1284, estado: "PUBLICADO",
    portada: "sol",
    paleta: { fondo: "#2b1b2e", a: "#ff7a59", b: "#7a2e3a", c: "#ffd9a8", tinta: "#140c14" },
    frase: "Un bombo que camina despacio por una calle mojada.",
    compases: 4, swing: 0.14,
    sonido: { tono: 9000, crepitar: 0.016, bajo: "suave", bajoFiltro: 420, teclasBrillo: 2200, teclasTipo: "sine", teclasCola: 0.5, ecoTeclas: 0.12, reverbTeclas: 0.18, lead: "teclas", bomboInicio: 160, bomboFin: 46, bomboLargo: 0.4, cajaBrillo: 1700 },
    patron: { bombo: "x.....x...x.....", caja: "....x.......x..g", hat: "x.x.x.x.x.x.x.x.", acorde: [[0, 6], [10, 4]], bajo: [[0, 0, 5], [6, 0, 3], [10, 7, 4]] },
    acordes: [[50, 53, 57, 60, 64], [55, 58, 62, 65, 69], [58, 62, 65, 69], [57, 61, 64, 67]],
    raices: [38, 43, 46, 45],
    melodia: [[[4, 69, 2], [8, 72, 2], [12, 74, 4]], [[2, 70, 2], [6, 69, 2], [10, 67, 4]], [[0, 74, 3], [6, 72, 2], [10, 69, 4]], [[4, 73, 2], [8, 76, 3], [12, 74, 4]]]
  },
  {
    id: 2, titulo: "Cemento y Mariposas", productor: "granujabeats", productorNombre: "Granuja Beats",
    genero: "Trap", bpm: 140, tono: "La menor", precio: 80000, reproducciones: 2310, estado: "PUBLICADO",
    portada: "alas",
    paleta: { fondo: "#d8d3c8", a: "#7a6cff", b: "#55555c", c: "#b9b2ff", tinta: "#17171a" },
    frase: "Concreto abajo, alas arriba.",
    compases: 8, swing: 0,
    sonido: { tono: 14000, bajo: "808", bomboInicio: 190, bomboFin: 50, bomboLargo: 0.36, cajaBrillo: 2600, cajaReverb: 0.2, campanaEco: 0.4, campanaReverb: 0.25 },
    patron: { bombo: "x..x..x...x.....", caja: "........x.......", hat: "x.x.x.x.x.x.x.rx", bajo: [[0, 0, 5], [6, 0, 3], [10, 12, 2], [13, 0, 3]], arpegio: { pasos: "x.x.x.xx.x.x.xx.", octava: 12 } },
    acordes: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
    raices: [33, 29, 36, 31],
    melodia: [[], [], [], []]
  },
  {
    id: 3, titulo: "Hielo en Cabecera", productor: "monolunar", productorNombre: "Mono Lunar",
    genero: "Drill", bpm: 142, tono: "Mi menor", precio: 75000, reproducciones: 957, estado: "PUBLICADO",
    portada: "hielo",
    paleta: { fondo: "#0d1f2e", a: "#8fe3ff", b: "#d6f4ff", c: "#2f6f8f", tinta: "#eaf9ff" },
    frase: "Un piano en un cuarto sin calefacción.",
    compases: 8, swing: 0,
    sonido: { tono: 12000, bajo: "808", bomboInicio: 170, bomboFin: 44, bomboLargo: 0.34, cajaBrillo: 3200, cajaReverb: 0.3, teclasTipo: "triangle", teclasBrillo: 3800, teclasCola: 0.25, ecoTeclas: 0.25, reverbTeclas: 0.4, lead: "teclas" },
    patron: { bombo: "x.....x..x...x..", caja: "........x.......", hat: "x.x.x.r.x.x.x.r.", acorde: [[0, 4]], bajo: [[0, 0, 6], [6, 0, 2], [9, 0, 4]] },
    acordes: [[64, 67, 71], [60, 64, 67], [62, 66, 69], [64, 67, 71]],
    raices: [40, 36, 38, 40],
    melodia: [[[2, 79, 2], [6, 76, 2], [10, 83, 4]], [[2, 79, 2], [6, 76, 2], [10, 72, 4]], [[2, 78, 2], [6, 74, 2], [10, 81, 4]], [[2, 76, 2], [6, 79, 2], [10, 71, 6]]]
  },
  {
    id: 4, titulo: "Domingo sin Plata", productor: "granujabeats", productorNombre: "Granuja Beats",
    genero: "Lo-fi", bpm: 72, tono: "Do mayor", precio: 45000, reproducciones: 1763, estado: "PUBLICADO",
    portada: "domingo",
    paleta: { fondo: "#f1e6cc", a: "#b9cc9f", b: "#dc8d62", c: "#52707e", tinta: "#2b2218" },
    frase: "También los domingos sin plata tienen banda sonora.",
    compases: 4, swing: 0.2,
    sonido: { tono: 3800, crepitar: 0.02, bajo: "suave", bajoFiltro: 380, teclasBrillo: 1800, teclasTipo: "sine", teclasCola: 0.8, ecoTeclas: 0.2, reverbTeclas: 0.25, lead: "teclas", bomboInicio: 130, bomboFin: 48, bomboLargo: 0.3, cajaBrillo: 1500, cajaLargo: 0.16 },
    patron: { bombo: "x.....x...x.....", caja: "....x.......x...", hat: "x.s.x.s.x.s.x.s.", acorde: [[0, 7], [10, 5]], bajo: [[0, 0, 6], [8, 7, 4]] },
    acordes: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
    raices: [41, 40, 38, 36],
    melodia: [[[4, 72, 3], [10, 76, 4]], [[4, 71, 3], [10, 74, 4]], [[4, 69, 3], [10, 72, 4]], [[4, 67, 3], [10, 71, 2], [12, 72, 4]]]
  },
  {
    id: 5, titulo: "Cumbia de Neón", productor: "paramo", productorNombre: "DJ Páramo",
    genero: "Dembow", bpm: 95, tono: "La menor", precio: 70000, reproducciones: 3042, estado: "PUBLICADO",
    portada: "neon",
    paleta: { fondo: "#17082a", a: "#ff4fa3", b: "#2ee6c8", c: "#ffd84a", tinta: "#ffffff" },
    frase: "Cadera primero, explicaciones después.",
    compases: 8, swing: 0,
    sonido: { tono: 14000, bajo: "808", bomboInicio: 150, bomboFin: 50, bomboLargo: 0.3, cajaBrillo: 2300, cajaLargo: 0.14, teclasTipo: "triangle", teclasBrillo: 2400, teclasCola: 0.1, ecoTeclas: 0.15, reverbTeclas: 0.1, lead: "neon", neonEco: 0.3 },
    patron: { bombo: "x...x...x...x...", caja: "...x..x....x..x.", hat: "x.x.x.x.x.x.x.x.", acorde: [[3, 2], [6, 2], [11, 2], [14, 2]], bajo: [[0, 0, 3], [3, 0, 3], [6, 0, 2], [8, 0, 3], [11, 0, 3], [14, 0, 2]] },
    acordes: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]],
    raices: [45, 43, 41, 40],
    melodia: [[[0, 76, 2], [3, 79, 2], [6, 81, 3], [10, 79, 2], [12, 76, 3]], [[0, 74, 2], [3, 79, 2], [6, 83, 3], [10, 79, 2], [12, 74, 3]], [[0, 72, 2], [3, 77, 2], [6, 81, 3], [10, 77, 2], [12, 72, 3]], [[0, 71, 2], [3, 76, 2], [6, 80, 3], [10, 76, 2], [12, 71, 4]]]
  },
  {
    id: 6, titulo: "Sábado de Lluvia", productor: "monolunar", productorNombre: "Mono Lunar",
    genero: "Jazz", bpm: 92, tono: "La menor", precio: 85000, reproducciones: 1120, estado: "PUBLICADO",
    portada: "lluvia",
    paleta: { fondo: "#1b2340", a: "#f2c14e", b: "#3b4a86", c: "#8fa0e0", tinta: "#e9ecff" },
    frase: "El contrabajo camina con paraguas.",
    compases: 4, swing: 0.18,
    sonido: { tono: 6500, lluvia: 0.05, crepitar: 0.01, bajo: "suave", bajoFiltro: 650, teclasBrillo: 2100, teclasTipo: "sine", teclasCola: 0.6, ecoTeclas: 0.2, reverbTeclas: 0.3, lead: "suave", bomboInicio: 140, bomboFin: 50, bomboLargo: 0.32, cajaBrillo: 2000 },
    patron: { bombo: "x.......x.x.....", caja: "....x.......x...", hat: "x.s.x.s.x.s.x.s.", acorde: [[0, 6], [10, 4]], bajo: [[0, 0, 3], [4, 7, 3], [8, 12, 3], [12, 7, 3]] },
    acordes: [[57, 60, 64, 67], [57, 60, 62, 65], [55, 59, 62, 65], [55, 59, 60, 64]],
    raices: [45, 38, 43, 36],
    melodia: [[[2, 72, 3], [6, 71, 2], [8, 69, 4]], [[2, 69, 3], [6, 72, 2], [8, 74, 4]], [[2, 71, 2], [5, 74, 2], [8, 77, 3], [12, 74, 3]], [[2, 76, 3], [6, 74, 2], [8, 71, 2], [10, 72, 6]]]
  }
];

/* Un beat nuevo toma el sonido y la portada de la plantilla de su género */
const PLANTILLA_POR_GENERO = { Boombap: 1, Trap: 2, Drill: 3, "Lo-fi": 4, Dembow: 5, Jazz: 6 };

function obraDesdePlantilla(r) {
  const base = OBRAS_BASE.find((o) => o.id === PLANTILLA_POR_GENERO[r.genero]) || OBRAS_BASE[0];
  const copia = JSON.parse(JSON.stringify(base));
  copia.id = r.id;
  copia.titulo = r.titulo;
  copia.productor = r.productor;
  copia.productorNombre = r.productorNombre;
  copia.genero = r.genero;
  copia.bpm = r.bpm;
  copia.precio = r.precio;
  copia.reproducciones = r.reproducciones || 0;
  copia.frase = r.descripcion || "";
  return copia;
}

/* ---------- Portadas generadas por código (una por obra, estable) ---------- */
function semilla(n) {
  let a = (n * 2654435761) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ARTE = {
  sol(p, r) {
    let s = `<rect width="400" height="500" fill="${p.fondo}"/>`;
    s += `<circle cx="200" cy="250" r="${116 + r() * 6}" fill="${p.a}"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="60" y="${262 + i * 18}" width="280" height="${4 + i * 2.2}" fill="${p.fondo}"/>`;
    s += `<rect y="362" width="400" height="140" fill="${p.b}"/><rect y="362" width="400" height="5" fill="${p.c}"/>`;
    [[24, 40, 96], [70, 34, 62], [298, 44, 118], [346, 36, 74]].forEach((e) => {
      const h = e[2] + r() * 14;
      s += `<rect x="${e[0]}" y="${362 - h}" width="${e[1]}" height="${h}" fill="${p.tinta}"/>`;
      for (let k = 0; k < 4; k++) s += `<rect x="${e[0] + 6 + (k % 2) * 16}" y="${362 - h + 10 + Math.floor(k / 2) * 18}" width="7" height="8" fill="${p.c}" opacity=".75"/>`;
    });
    for (let i = 0; i < 7; i++) s += `<rect x="${60 + r() * 120}" y="${382 + i * 15}" width="${50 + r() * 190}" height="2.5" fill="${p.c}" opacity=".4"/>`;
    s += `<path d="M130 120 q7 -8 14 0 q7 -8 14 0 M104 154 q6 -7 12 0 q6 -7 12 0 M286 130 q7 -8 14 0 q7 -8 14 0" stroke="${p.tinta}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    return s;
  },
  alas(p, r) {
    let s = `<rect width="400" height="500" fill="${p.fondo}"/>`;
    s += `<rect x="228" y="296" width="76" height="204" fill="${p.tinta}" opacity=".3"/><rect x="92" y="342" width="62" height="158" fill="${p.tinta}" opacity=".5"/>`;
    s += `<rect x="124" y="232" width="152" height="268" fill="${p.b}"/>`;
    for (let row = 0; row < 7; row++) for (let col = 0; col < 3; col++) s += `<rect x="${142 + col * 44}" y="${252 + row * 34}" width="22" height="20" fill="${p.fondo}" opacity="${r() > 0.35 ? 0.3 : 0.08}"/>`;
    const mar = (x, y, e, rot, col) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${e})" fill="${col}"><ellipse cx="-13" cy="-7" rx="15" ry="9.5" transform="rotate(-28 -13 -7)"/><ellipse cx="13" cy="-7" rx="15" ry="9.5" transform="rotate(28 13 -7)"/><ellipse cx="-9" cy="8" rx="9.5" ry="6" transform="rotate(25 -9 8)"/><ellipse cx="9" cy="8" rx="9.5" ry="6" transform="rotate(-25 9 8)"/><rect x="-1.6" y="-11" width="3.2" height="26" rx="1.6" fill="${p.tinta}"/></g>`;
    s += `<path d="M200 226 C 190 190, 230 160, 210 120 S 170 80, 190 40" stroke="${p.tinta}" stroke-width="1.4" stroke-dasharray="2 7" fill="none" opacity=".5"/>`;
    [[200, 196, 1.9, -8, p.a], [118, 150, 1.25, -26, p.a], [292, 116, 1.5, 16, p.c], [66, 236, 0.9, -42, p.c], [338, 214, 1, 30, p.a], [226, 58, 1.05, 8, p.c], [150, 82, 0.8, -14, p.a], [344, 60, 0.7, 26, p.c]].forEach((m) => {
      s += mar(m[0] + (r() - 0.5) * 8, m[1] + (r() - 0.5) * 8, m[2], m[3], m[4]);
    });
    return s;
  },
  hielo(p, r) {
    let s = `<rect width="400" height="500" fill="${p.fondo}"/>`;
    s += `<circle cx="276" cy="148" r="64" fill="${p.a}" opacity=".92"/><circle cx="276" cy="148" r="98" fill="none" stroke="${p.b}" stroke-width="1.2" opacity=".45"/>`;
    const colores = [p.c, p.b, p.a];
    for (let i = 0; i < 11; i++) {
      const x = -30 + i * 40 + r() * 16, w = 70 + r() * 54, h = 130 + r() * 220;
      const col = colores[i % 3];
      s += `<polygon points="${x},500 ${x + w / 2},${500 - h} ${x + w},500" fill="${col}" opacity="${0.5 + r() * 0.4}"/>`;
      s += `<polygon points="${x + w / 2},${500 - h} ${x + w},500 ${x + w / 2},500" fill="${p.tinta}" opacity=".16"/>`;
    }
    for (let i = 0; i < 26; i++) s += `<circle cx="${r() * 400}" cy="${r() * 430}" r="${0.8 + r() * 1.8}" fill="${p.tinta}" opacity="${0.35 + r() * 0.45}"/>`;
    return s;
  },
  domingo(p, r) {
    const arco = (x, y, w, h, col) => `<path d="M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z" fill="${col}"/>`;
    let s = `<rect width="400" height="500" fill="${p.fondo}"/>`;
    s += arco(66, 84, 268, 420, p.a) + arco(102, 122, 196, 382, p.b) + arco(138, 160, 124, 344, p.c) + arco(170, 192, 60, 312, p.fondo);
    s += `<circle cx="338" cy="62" r="${21 + r() * 3}" fill="${p.tinta}"/>`;
    s += `<rect y="466" width="400" height="34" fill="${p.tinta}"/>`;
    s += `<rect x="30" y="434" width="34" height="32" rx="3" fill="${p.b}"/><rect x="64" y="444" width="8" height="14" rx="4" fill="none" stroke="${p.b}" stroke-width="3"/>`;
    s += `<path d="M36 424 q4 -10 0 -18 M48 424 q4 -10 0 -18" stroke="${p.tinta}" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/>`;
    return s;
  },
  neon(p, r) {
    let s = `<rect width="400" height="500" fill="${p.fondo}"/>`;
    const cols = [p.a, p.b, p.c];
    for (let i = 0; i < 7; i++) s += `<circle cx="200" cy="236" r="${172 - i * 24}" fill="none" stroke="${cols[i % 3]}" stroke-width="11"/>`;
    s += `<circle cx="200" cy="236" r="20" fill="${p.tinta}"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${-40 + i * 76}" y="430" width="38" height="90" fill="${cols[i % 3]}" transform="skewX(-28)" opacity=".92"/>`;
    for (let i = 0; i < 18; i++) s += `<circle cx="${r() * 400}" cy="${r() * 410}" r="${0.9 + r() * 1.5}" fill="${p.tinta}" opacity="${0.4 + r() * 0.5}"/>`;
    return s;
  },
  lluvia(p, r) {
    let s = `<rect width="400" height="500" fill="${p.fondo}"/>`;
    s += `<circle cx="136" cy="128" r="62" fill="${p.a}"/><circle cx="166" cy="114" r="56" fill="${p.fondo}"/>`;
    [[0, 360, 70, 140], [66, 316, 54, 184], [124, 380, 66, 120], [240, 338, 62, 162], [298, 372, 58, 128], [350, 322, 60, 178]].forEach((e) => {
      s += `<rect x="${e[0]}" y="${e[1]}" width="${e[2]}" height="${e[3]}" fill="${p.b}"/>`;
      for (let k = 0; k < 5; k++) if (r() > 0.45) s += `<rect x="${e[0] + 8 + (k % 2) * 22}" y="${e[1] + 12 + Math.floor(k / 2) * 24}" width="9" height="11" fill="${p.a}" opacity=".85"/>`;
    });
    for (let i = 0; i < 80; i++) {
      const x = r() * 420, y = r() * 440, len = 16 + r() * 56;
      s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - len * 0.14).toFixed(1)}" y2="${(y + len).toFixed(1)}" stroke="${p.c}" stroke-width="1.3" opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 3; i++) s += `<ellipse cx="260" cy="${462 + i * 6}" rx="${28 + i * 34}" ry="${5 + i * 4}" fill="none" stroke="${p.a}" stroke-width="1.5" opacity="${0.8 - i * 0.22}"/>`;
    return s;
  }
};

function crearPortadaSVG(obra) {
  const dibujar = ARTE[obra.portada] || ARTE.sol;
  const r = semilla(obra.id * 97 + 13);
  return '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Portada de ' + obra.titulo + '" xmlns="http://www.w3.org/2000/svg">' + dibujar(obra.paleta, r) + "</svg>";
}

/* ---------- Formato ---------- */
const formatoCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const formatoNumero = new Intl.NumberFormat("es-CO");
function dinero(v) { return formatoCOP.format(v); }
function fechaCorta(iso) {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
function escapar(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* El usuario de prueba de cada rol hereda los beats y compras de ejemplo de este nombre */
const ALIAS_DEMO = {
  "productor@beatmarket.com": { usuario: "granujabeats", nombre: "Granuja Beats" },
  "comprador@beatmarket.com": { usuario: "jperez", nombre: "J. Pérez" }
};
