/* ==========================================================================
   audio.js — Sintetizador de fragmentos con la Web Audio API.
   No usa archivos de audio: cada obra se genera en el navegador a partir de
   su "partitura" (patrón de batería, acordes, bajo y melodía) en datos.js.
   ========================================================================== */
const MotorAudio = (function () {
  "use strict";

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const azar = (a, b) => a + Math.random() * (b - a);

  let ctx = null;        // AudioContext real (se crea al primer clic)
  let salida = null;     // entrada de la cadena final (compresor)
  let analizador = null; // para el visualizador
  let sesion = null;     // reproducción en curso

  /* ---------- Cadena final: compresor -> límite -> analizador -> altavoces ---------- */
  function cadenaFinal(c, conAnalizador) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    const limite = c.createGain();
    limite.gain.value = 0.8;
    comp.connect(limite);
    let an = null;
    if (conAnalizador) {
      an = c.createAnalyser();
      an.fftSize = 512;
      an.smoothingTimeConstant = 0.8;
      limite.connect(an);
      an.connect(c.destination);
    } else {
      limite.connect(c.destination);
    }
    return { entrada: comp, analizador: an };
  }

  function asegurarContexto() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const cadena = cadenaFinal(ctx, true);
      salida = cadena.entrada;
      analizador = cadena.analizador;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* ---------- Materiales: ruido, reverb, saturación ---------- */
  function bufferRuido(c) {
    const n = c.sampleRate * 2;
    const b = c.createBuffer(1, n, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function impulso(c, seg, caida) {
    const n = Math.floor(c.sampleRate * seg);
    const b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caida);
    }
    return b;
  }

  function curvaSaturacion(k) {
    const n = 1024;
    const curva = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curva[i] = Math.tanh(k * x);
    }
    return curva;
  }

  /* ---------- Sesión: todos los nodos de una reproducción ---------- */
  function crearSesion(c, beat, destino) {
    const s = { ctx: c, beat: beat, sonido: beat.sonido || {} };
    s.bus = c.createGain();
    s.tono = c.createBiquadFilter();
    s.tono.type = "lowpass";
    s.tono.frequency.value = s.sonido.tono || 16000;
    s.tono.Q.value = 0.5;
    s.bus.connect(s.tono);
    s.tono.connect(destino);
    s.ruido = bufferRuido(c);

    // Bajo saturado: el 808 puro casi no se oye en parlantes pequeños
    s.saturador = c.createWaveShaper();
    s.saturador.curve = curvaSaturacion(2.6);
    s.saturador.oversample = "2x";
    s.salidaBajo = c.createGain();
    s.salidaBajo.gain.value = 0.42;
    s.saturador.connect(s.salidaBajo);
    s.salidaBajo.connect(s.bus);

    // Eco sincronizado con el tempo (corchea con puntillo)
    s.eco = c.createGain();
    const retardo = c.createDelay(2);
    retardo.delayTime.value = (60 / beat.bpm) * 0.75;
    const retro = c.createGain();
    retro.gain.value = 0.36;
    const filtroEco = c.createBiquadFilter();
    filtroEco.type = "lowpass";
    filtroEco.frequency.value = 2600;
    s.eco.connect(retardo);
    retardo.connect(filtroEco);
    filtroEco.connect(retro);
    retro.connect(retardo);
    filtroEco.connect(s.bus);

    // Reverb
    s.reverb = c.createGain();
    const conv = c.createConvolver();
    conv.buffer = impulso(c, 2.4, 2.6);
    s.reverb.connect(conv);
    conv.connect(s.bus);
    return s;
  }

  function enviar(s, nodo, eco, rev) {
    nodo.connect(s.bus);
    if (eco) {
      const g = s.ctx.createGain();
      g.gain.value = eco;
      nodo.connect(g);
      g.connect(s.eco);
    }
    if (rev) {
      const g = s.ctx.createGain();
      g.gain.value = rev;
      nodo.connect(g);
      g.connect(s.reverb);
    }
  }

  function envolvente(g, t, pico, ataque, fin) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(pico, 0.0002), t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
  }

  /* ---------- Instrumentos ---------- */
  function bombo(s, t, vel) {
    const c = s.ctx, p = s.sonido;
    const largo = p.bomboLargo || 0.42;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(p.bomboInicio || 170, t);
    o.frequency.exponentialRampToValueAtTime(p.bomboFin || 46, t + 0.11);
    envolvente(g, t, 0.95 * vel, 0.004, largo);
    o.connect(g);
    g.connect(s.bus);
    o.start(t);
    o.stop(t + largo + 0.05);

    const r = c.createBufferSource();
    r.buffer = s.ruido;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 2200;
    const gr = c.createGain();
    envolvente(gr, t, 0.16 * vel, 0.001, 0.02);
    r.connect(f);
    f.connect(gr);
    gr.connect(s.bus);
    r.start(t, azar(0, 1.4));
    r.stop(t + 0.03);
  }

  function caja(s, t, vel) {
    const c = s.ctx, p = s.sonido;
    const r = c.createBufferSource();
    r.buffer = s.ruido;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = p.cajaBrillo || 1900;
    f.Q.value = 0.7;
    const g = c.createGain();
    envolvente(g, t, 0.55 * vel, 0.002, p.cajaLargo || 0.2);
    r.connect(f);
    f.connect(g);
    enviar(s, g, 0, p.cajaReverb || 0.12);
    r.start(t, azar(0, 1.4));
    r.stop(t + 0.32);

    const o = c.createOscillator();
    const go = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(p.cajaTono || 200, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.09);
    envolvente(go, t, 0.38 * vel, 0.002, 0.12);
    o.connect(go);
    go.connect(s.bus);
    o.start(t);
    o.stop(t + 0.16);
  }

  function hat(s, t, vel, abierto) {
    const c = s.ctx;
    const largo = abierto ? 0.24 : 0.045;
    const r = c.createBufferSource();
    r.buffer = s.ruido;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7200;
    const g = c.createGain();
    envolvente(g, t, 0.17 * vel, 0.001, largo);
    r.connect(f);
    f.connect(g);
    g.connect(s.bus);
    r.start(t, azar(0, 1.4));
    r.stop(t + largo + 0.02);
  }

  function bajo808(s, t, midi, dur, vel) {
    const c = s.ctx;
    const f0 = mtof(midi);
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f0 * 1.7, t);
    o.frequency.exponentialRampToValueAtTime(f0, t + 0.045);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.008);
    g.gain.setValueAtTime(0.9 * vel, t + Math.max(dur * 0.6, 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.14);
    o.connect(g);
    g.connect(s.saturador);
    o.start(t);
    o.stop(t + dur + 0.2);
  }

  function bajoSuave(s, t, midi, dur, vel) {
    const c = s.ctx;
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = mtof(midi);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = s.sonido.bajoFiltro || 480;
    const g = c.createGain();
    envolvente(g, t, 0.75 * vel, 0.012, dur + 0.1);
    o.connect(f);
    f.connect(g);
    g.connect(s.bus);
    o.start(t);
    o.stop(t + dur + 0.2);
  }

  function teclas(s, t, midi, dur, vel) {
    const c = s.ctx, p = s.sonido;
    const f = mtof(midi);
    const fin = dur + (p.teclasCola || 0.5);
    const g = c.createGain();
    envolvente(g, t, vel, 0.006, fin);
    const filtro = c.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = p.teclasBrillo || 2600;
    filtro.connect(g);

    const o1 = c.createOscillator();
    o1.type = p.teclasTipo || "sine";
    o1.frequency.value = f;
    o1.detune.value = azar(-4, 4);
    o1.connect(filtro);

    const o2 = c.createOscillator();
    o2.type = "sine";
    o2.frequency.value = f * 2;
    const g2 = c.createGain();
    envolvente(g2, t, 0.35, 0.003, 0.35);
    o2.connect(g2);
    g2.connect(filtro);

    const o3 = c.createOscillator();
    o3.type = "triangle";
    o3.frequency.value = f * 4;
    const g3 = c.createGain();
    envolvente(g3, t, 0.08, 0.002, 0.12);
    o3.connect(g3);
    g3.connect(filtro);

    [o1, o2, o3].forEach((o) => {
      o.start(t);
      o.stop(t + fin + 0.05);
    });
    enviar(s, g, p.ecoTeclas || 0.1, p.reverbTeclas || 0.15);
  }

  function campana(s, t, midi, dur, vel) {
    const c = s.ctx, p = s.sonido;
    const f = mtof(midi);
    const portadora = c.createOscillator();
    portadora.type = "sine";
    portadora.frequency.value = f;
    const mod = c.createOscillator();
    mod.type = "sine";
    mod.frequency.value = f * 3.5;
    const gm = c.createGain();
    gm.gain.setValueAtTime(f * 1.8, t);
    gm.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.6);
    mod.connect(gm);
    gm.connect(portadora.frequency);
    const g = c.createGain();
    const fin = 0.9 + dur * 0.1;
    envolvente(g, t, vel, 0.002, fin);
    portadora.connect(g);
    enviar(s, g, p.campanaEco || 0.35, p.campanaReverb || 0.3);
    portadora.start(t);
    mod.start(t);
    portadora.stop(t + fin + 0.05);
    mod.stop(t + fin + 0.05);
  }

  function neon(s, t, midi, dur, vel) {
    const c = s.ctx;
    const f = mtof(midi);
    const filtro = c.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.Q.value = 3;
    filtro.frequency.setValueAtTime(900, t);
    filtro.frequency.exponentialRampToValueAtTime(3200, t + 0.06);
    filtro.frequency.exponentialRampToValueAtTime(1800, t + dur);
    const g = c.createGain();
    envolvente(g, t, vel * 0.55, 0.012, dur + 0.14);
    filtro.connect(g);
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoG = c.createGain();
    lfoG.gain.value = f * 0.004;
    lfo.connect(lfoG);
    [-7, 7].forEach((cents) => {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = cents;
      lfoG.connect(o.frequency);
      o.connect(filtro);
      o.start(t);
      o.stop(t + dur + 0.2);
    });
    lfo.start(t);
    lfo.stop(t + dur + 0.2);
    enviar(s, g, s.sonido.neonEco || 0.3, 0.12);
  }

  function suave(s, t, midi, dur, vel) {
    const c = s.ctx;
    const f = mtof(midi);
    const g = c.createGain();
    envolvente(g, t, vel * 0.8, 0.03, dur + 0.25);
    const o1 = c.createOscillator();
    o1.type = "sine";
    o1.frequency.value = f;
    const o2 = c.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = f * 2;
    const g2 = c.createGain();
    g2.gain.value = 0.22;
    const lfo = c.createOscillator();
    lfo.frequency.value = 5;
    const lfoG = c.createGain();
    lfoG.gain.setValueAtTime(0, t);
    lfoG.gain.linearRampToValueAtTime(f * 0.006, t + 0.25);
    lfo.connect(lfoG);
    lfoG.connect(o1.frequency);
    o1.connect(g);
    o2.connect(g2);
    g2.connect(g);
    enviar(s, g, 0.25, 0.3);
    [o1, o2, lfo].forEach((o) => {
      o.start(t);
      o.stop(t + dur + 0.3);
    });
  }

  const LEADS = { teclas: teclas, campana: campana, neon: neon, suave: suave };

  /* ---------- Ambientes: crepitar de vinilo y lluvia ---------- */
  function ambiente(s, t0, total) {
    const c = s.ctx, p = s.sonido;
    function lazo(hp, lp, nivel) {
      const r = c.createBufferSource();
      r.buffer = s.ruido;
      r.loop = true;
      const a = c.createBiquadFilter();
      a.type = "highpass";
      a.frequency.value = hp;
      const b = c.createBiquadFilter();
      b.type = "lowpass";
      b.frequency.value = lp;
      const g = c.createGain();
      g.gain.value = nivel;
      r.connect(a);
      a.connect(b);
      b.connect(g);
      g.connect(s.bus);
      r.start(t0);
      r.stop(t0 + total);
    }
    function chasquido(t, nivel, freq) {
      const r = c.createBufferSource();
      r.buffer = s.ruido;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq;
      f.Q.value = 1.2;
      const g = c.createGain();
      envolvente(g, t, nivel, 0.0008, 0.012);
      r.connect(f);
      f.connect(g);
      g.connect(s.bus);
      r.start(t, azar(0, 1.4));
      r.stop(t + 0.03);
    }
    if (p.crepitar) {
      lazo(2500, 12000, p.crepitar);
      for (let i = 0; i < total * 5; i++) chasquido(t0 + azar(0, total), azar(0.02, 0.09), 3500);
    }
    if (p.lluvia) {
      lazo(1200, 9000, p.lluvia);
      for (let i = 0; i < total * 12; i++) chasquido(t0 + azar(0, total), azar(0.01, 0.035), azar(4000, 7000));
    }
  }

  /* ---------- Un compás completo ---------- */
  function programarCompas(s, n, t0) {
    const b = s.beat, p = b.patron, son = s.sonido;
    const paso = 60 / b.bpm / 4;
    const swing = (b.swing || 0) * paso;
    const i = n % b.acordes.length;
    const tp = (k) => t0 + k * paso + (k % 2 === 1 ? swing : 0);

    for (let k = 0; k < 16; k++) {
      const t = tp(k);
      const bo = p.bombo[k];
      if (bo === "x" || bo === "X") bombo(s, t, bo === "X" ? 1 : 0.82);
      const ca = p.caja[k];
      if (ca === "x") caja(s, t, 1);
      else if (ca === "g") caja(s, t, 0.3);
      const ha = (p.hat || "")[k];
      const hum = azar(-0.003, 0.003);
      if (ha === "x") hat(s, Math.max(t + hum, t0), azar(0.55, 0.85) * (k % 4 === 0 ? 1.15 : 1), false);
      else if (ha === "s") hat(s, t, azar(0.3, 0.45), false);
      else if (ha === "o") hat(s, t, 0.8, true);
      else if (ha === "r") for (let j = 0; j < 3; j++) hat(s, t + (j * paso) / 3, 0.45 + 0.13 * j, false);
    }

    (p.acorde || []).forEach(function (par) {
      b.acordes[i].forEach(function (m, idx) {
        teclas(s, tp(par[0]) + idx * 0.014, m, par[1] * paso, 0.15 - idx * 0.006);
      });
    });

    (p.bajo || []).forEach(function (par) {
      const midi = b.raices[i] + par[1];
      const t = tp(par[0]);
      if (son.bajo === "808") bajo808(s, t, midi, par[2] * paso, 0.9);
      else bajoSuave(s, t, midi, par[2] * paso, 0.9);
    });

    if (p.arpegio) {
      let cuenta = 0;
      for (let k = 0; k < 16; k++) {
        if (p.arpegio.pasos[k] === "x") {
          const nota = b.acordes[i][cuenta % b.acordes[i].length] + p.arpegio.octava;
          campana(s, tp(k), nota, paso, 0.13);
          cuenta++;
        }
      }
    }

    const lead = LEADS[son.lead] || teclas;
    (b.melodia[i] || []).forEach(function (nota) {
      lead(s, tp(nota[0]), nota[1], nota[2] * paso, 0.17);
    });
  }

  function prepararFinal(s, t0, total) {
    ambiente(s, t0, total + 1.4);
    s.bus.gain.setValueAtTime(1, t0 + total - 0.9);
    s.bus.gain.linearRampToValueAtTime(0.0001, t0 + total + 0.7);
  }

  /* ---------- API pública ---------- */
  function terminar(s, natural) {
    if (!s || !s.activa) return;
    s.activa = false;
    clearInterval(s.timer);
    cancelAnimationFrame(s.raf);
    const ahora = s.ctx.currentTime;
    s.bus.gain.cancelScheduledValues(ahora);
    s.bus.gain.setTargetAtTime(0.0001, ahora, 0.03);
    setTimeout(function () {
      try { s.bus.disconnect(); } catch (e) { /* ya desconectado */ }
    }, 300);
    if (sesion === s) sesion = null;
    if (natural && s.opc.alTerminar) s.opc.alTerminar();
  }

  function detener() {
    if (sesion) terminar(sesion, false);
  }

  function reproducir(beat, opciones) {
    const c = asegurarContexto();
    detener();
    const s = crearSesion(c, beat, salida);
    const durCompas = 240 / beat.bpm;
    const t0 = c.currentTime + 0.12;
    const total = beat.compases * durCompas;
    s.t0 = t0;
    s.total = total;
    s.proximo = 0;
    s.compasActual = -1;
    s.opc = opciones || {};
    s.activa = true;
    prepararFinal(s, t0, total);

    function planificar() {
      while (s.proximo < beat.compases && t0 + s.proximo * durCompas < c.currentTime + 1.2) {
        programarCompas(s, s.proximo, t0 + s.proximo * durCompas);
        s.proximo++;
      }
    }
    planificar();
    s.timer = setInterval(planificar, 60);
    sesion = s;

    function vigilar() {
      if (!s.activa) return;
      const t = c.currentTime - t0;
      const compas = Math.floor(t / durCompas);
      if (t >= 0 && compas !== s.compasActual && compas < beat.compases) {
        s.compasActual = compas;
        if (s.opc.alCompas) s.opc.alCompas(compas);
      }
      if (t >= total + 0.75) {
        terminar(s, true);
        return;
      }
      s.raf = requestAnimationFrame(vigilar);
    }
    s.raf = requestAnimationFrame(vigilar);
    return s;
  }

  function progreso() {
    if (!sesion || !ctx) return 0;
    return Math.min(1, Math.max(0, (ctx.currentTime - sesion.t0) / sesion.total));
  }

  /* Render sin altavoces: sirve para probar niveles y que no haya silencios */
  function renderizar(beat) {
    const durCompas = 240 / beat.bpm;
    const total = beat.compases * durCompas;
    const sr = 44100;
    const off = new OfflineAudioContext(2, Math.ceil(sr * (total + 1.6)), sr);
    const cadena = cadenaFinal(off, false);
    const s = crearSesion(off, beat, cadena.entrada);
    const t0 = 0.05;
    prepararFinal(s, t0, total);
    for (let n = 0; n < beat.compases; n++) programarCompas(s, n, t0 + n * durCompas);
    return off.startRendering();
  }

  return {
    reproducir: reproducir,
    detener: detener,
    progreso: progreso,
    renderizar: renderizar,
    estaSonando: function () { return !!sesion; },
    analizador: function () { return analizador; },
    duracion: function (beat) { return beat.compases * 240 / beat.bpm; }
  };
})();
