/* ==========================================================================
   almacen.js — Beats, ventas y reproducciones.
   Los USUARIOS ya viven en Spring Boot (api.js). Los beats y las ventas
   todavía no tienen endpoints, así que se guardan en el navegador
   (localStorage) con las mismas operaciones de un CRUD. Cuando existan los
   endpoints, solo hay que reemplazar el cuerpo de estas funciones por fetch().
   ========================================================================== */
const Almacen = (function () {
  "use strict";

  const CLAVE_BEATS = "bm_beats";
  const CLAVE_VENTAS = "bm_ventas";

  /* Ventas de ejemplo para que las tablas no arranquen vacías */
  const VENTAS_BASE = [
    { id: "b1", beatId: 1, comprador: "jperez", licencia: "premium", fecha: "2026-10-02" },
    { id: "b2", beatId: 4, comprador: "jperez", licencia: "basica", fecha: "2026-10-09" },
    { id: "b3", beatId: 2, comprador: "marcela_r", licencia: "basica", fecha: "2026-10-11" },
    { id: "b4", beatId: 1, comprador: "dj_tomas", licencia: "basica", fecha: "2026-10-15" },
    { id: "b5", beatId: 6, comprador: "marcela_r", licencia: "premium", fecha: "2026-10-18" },
    { id: "b6", beatId: 5, comprador: "dj_tomas", licencia: "basica", fecha: "2026-10-20" }
  ];

  function leer(clave) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) {
      return null;
    }
  }

  function escribir(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento: no se conserva al recargar */ }
  }

  /* ---------- Beats ---------- */
  function registros() {
    let lista = leer(CLAVE_BEATS);
    if (!lista) {
      lista = OBRAS_BASE.map(function (o) {
        return { id: o.id, titulo: o.titulo, productor: o.productor, productorNombre: o.productorNombre, genero: o.genero, bpm: o.bpm, precio: o.precio, reproducciones: o.reproducciones, descripcion: o.frase };
      });
      escribir(CLAVE_BEATS, lista);
    }
    return lista;
  }

  function hidratar(r) {
    const base = OBRAS_BASE.find(function (o) { return o.id === r.id; });
    if (base && base.genero === r.genero) {
      return Object.assign({}, base, { titulo: r.titulo, productor: r.productor, productorNombre: r.productorNombre, bpm: r.bpm, precio: r.precio, reproducciones: r.reproducciones, frase: r.descripcion });
    }
    return obraDesdePlantilla(r);
  }

  function listarBeats() {
    return registros().map(hidratar);
  }

  function buscarBeat(id) {
    return listarBeats().find(function (b) { return b.id === id; });
  }

  function crearBeat(datos) {
    const lista = registros();
    const id = lista.reduce(function (m, r) { return Math.max(m, r.id); }, 0) + 1;
    const nuevo = Object.assign({ id: id, reproducciones: 0 }, datos);
    lista.push(nuevo);
    escribir(CLAVE_BEATS, lista);
    return nuevo;
  }

  function actualizarBeat(id, datos) {
    const lista = registros();
    const i = lista.findIndex(function (r) { return r.id === id; });
    if (i < 0) throw { estado: 404, mensaje: "El beat ya no existe." };
    lista[i] = Object.assign({}, lista[i], datos);
    escribir(CLAVE_BEATS, lista);
    return lista[i];
  }

  function eliminarBeat(id) {
    escribir(CLAVE_BEATS, registros().filter(function (r) { return r.id !== id; }));
  }

  function sumarEscucha(id) {
    const lista = registros();
    const r = lista.find(function (x) { return x.id === id; });
    if (r) {
      r.reproducciones = (r.reproducciones || 0) + 1;
      escribir(CLAVE_BEATS, lista);
    }
  }

  /* ---------- Ventas ---------- */
  function precioDe(beatId) {
    const r = registros().find(function (x) { return x.id === beatId; });
    if (r) return r.precio;
    const b = OBRAS_BASE.find(function (x) { return x.id === beatId; });
    return b ? b.precio : 0;
  }

  function ventas() {
    const propias = leer(CLAVE_VENTAS) || [];
    return VENTAS_BASE.concat(propias).map(function (v) {
      const lic = LICENCIAS.find(function (l) { return l.id === v.licencia; });
      const beat = registros().find(function (r) { return r.id === v.beatId; }) || OBRAS_BASE.find(function (o) { return o.id === v.beatId; });
      return Object.assign({}, v, {
        valor: v.valor || Math.round(precioDe(v.beatId) * lic.factor),
        titulo: beat ? beat.titulo : "Beat eliminado",
        productor: beat ? beat.productor : "",
        productorNombre: beat ? beat.productorNombre : ""
      });
    }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  }

  function registrarVenta(beatId, comprador, licenciaId) {
    const lista = leer(CLAVE_VENTAS) || [];
    const lic = LICENCIAS.find(function (l) { return l.id === licenciaId; });
    const venta = {
      id: "n" + Date.now(),
      beatId: beatId,
      comprador: comprador,
      licencia: licenciaId,
      fecha: new Date().toISOString().slice(0, 10),
      valor: Math.round(precioDe(beatId) * lic.factor)
    };
    lista.push(venta);
    escribir(CLAVE_VENTAS, lista);
    return venta;
  }

  function reiniciar() {
    try {
      localStorage.removeItem(CLAVE_BEATS);
      localStorage.removeItem(CLAVE_VENTAS);
    } catch (e) { /* nada */ }
  }

  return {
    listarBeats: listarBeats,
    buscarBeat: buscarBeat,
    crearBeat: crearBeat,
    actualizarBeat: actualizarBeat,
    eliminarBeat: eliminarBeat,
    sumarEscucha: sumarEscucha,
    ventas: ventas,
    registrarVenta: registrarVenta,
    reiniciar: reiniciar
  };
})();
