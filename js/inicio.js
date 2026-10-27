/* ==========================================================================
   inicio.js — Panel de la aplicación: menú por rol, vistas y CRUDs.
   Usuarios  -> API real de Spring Boot (JWT en cada petición).
   Beats     -> CRUD local (localStorage) hasta que existan sus endpoints.
   ========================================================================== */

const usuario = Sesion.usuario();

if (!Sesion.token() || !usuario) {
  window.location.replace("index.html");
} else {
  iniciar();
}

function iniciar() {
  "use strict";

  const rol = usuario.rol;
  const alias = ALIAS_DEMO[usuario.email];
  const identidad = alias ? alias.usuario : usuario.nombreUsuario;
  const nombrePublico = alias ? alias.nombre : usuario.nombre;
  const menu = MENU_POR_ROL[rol] || ["resumen", "catalogo"];

  const contenido = document.getElementById("contenido");
  const lateral = document.getElementById("lateral");

  const ICONOS = {
    resumen: '<path d="M4 13h6V4H4zM14 20h6V4h-6zM4 20h6v-3H4z"/>',
    catalogo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    compras: '<path d="M5 7h14l-1.5 12h-11zM9 7a3 3 0 0 1 6 0"/>',
    misbeats: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    beats: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    ventas: '<path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>'
  };

  /* ---------- Cabecera y menú ---------- */
  document.getElementById("nombreUsuario").textContent = usuario.nombre;
  const insigniaRol = document.getElementById("rolUsuario");
  insigniaRol.textContent = NOMBRE_ROL[rol] || rol;
  if (rol === "ADMIN") insigniaRol.classList.add("insignia--admin");

  document.getElementById("menu").innerHTML = menu.map(function (v) {
    return '<a class="menu__enlace" href="#' + v + '" data-vista="' + v + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[v] + "</svg>" + TITULO_VISTA[v] + "</a>";
  }).join("");

  document.getElementById("btnSalir").addEventListener("click", function () { MotorAudio.detener(); Sesion.cerrar(); });
  document.getElementById("btnMenu").addEventListener("click", function () { lateral.classList.toggle("abierto"); });
  lateral.addEventListener("click", function (e) { if (e.target.closest("a")) lateral.classList.remove("abierto"); });

  /* ---------- Utilidades ---------- */
  function insigniaLicencia(id) {
    const l = LICENCIAS.find(function (x) { return x.id === id; });
    const clase = id === "exclusiva" ? "insignia--admin" : id === "premium" ? "" : "insignia--gris";
    return '<span class="insignia ' + clase + '">' + (l ? l.nombre : id) + "</span>";
  }

  function celdaBeat(b) {
    return '<div class="celda-beat"><div class="celda-beat__arte">' + crearPortadaSVG(b) + "</div>" +
      "<div><strong>" + escapar(b.titulo) + "</strong><small>" + escapar(b.productorNombre) + "</small></div></div>";
  }

  function tablaSimple(columnas, filas, vacio) {
    if (!filas.length) return '<p class="vacio">' + vacio + "</p>";
    return '<div class="tabla-caja"><table class="tabla"><thead><tr>' +
      columnas.map(function (c) { return '<th class="' + (c.clase || "") + '">' + c.titulo + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      filas.map(function (f) {
        return "<tr>" + columnas.map(function (c) {
          return '<td class="' + (c.clase || "") + '" data-etiqueta="' + c.titulo + '">' + c.render(f) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  const COLUMNAS_VENTAS = {
    beat: { titulo: "Beat", render: function (v) { return "<strong>" + escapar(v.titulo) + "</strong>"; } },
    comprador: { titulo: "Comprador", render: function (v) { return escapar(v.comprador); } },
    productor: { titulo: "Productor", render: function (v) { return escapar(v.productorNombre || "—"); } },
    licencia: { titulo: "Licencia", render: function (v) { return insigniaLicencia(v.licencia); } },
    fecha: { titulo: "Fecha", render: function (v) { return fechaCorta(v.fecha); } },
    valor: { titulo: "Valor", clase: "num", render: function (v) { return dinero(v.valor); } }
  };

  function misCompras() { return Almacen.ventas().filter(function (v) { return v.comprador === identidad; }); }
  function misVentas() { return Almacen.ventas().filter(function (v) { return v.productor === identidad; }); }
  function suma(lista, campo) { return lista.reduce(function (t, x) { return t + (x[campo] || 0); }, 0); }

  function kpi(etiqueta, valor, nota, id) {
    return '<div class="kpi"><div class="kpi__etiqueta">' + etiqueta + '</div><div class="kpi__valor"' + (id ? ' id="' + id + '"' : "") + ">" + valor + "</div>" +
      (nota ? '<div class="kpi__nota">' + nota + "</div>" : "") + "</div>";
  }

  function encabezado(titulo, texto) {
    return '<div class="encabezado-vista"><h2>' + titulo + "</h2><p>" + texto + "</p></div>";
  }

  /* ==================== Reproductor ==================== */
  const repBoton = document.getElementById("repBoton");
  const repProgreso = document.getElementById("repProgreso");
  let beatActual = null;
  let animacion = 0;

  function sincronizarBotones() {
    const sonando = MotorAudio.estaSonando();
    repBoton.classList.toggle("sonando", sonando);
    document.querySelectorAll(".btn-play").forEach(function (b) {
      b.classList.toggle("sonando", sonando && beatActual && Number(b.dataset.play) === beatActual.id);
    });
  }

  function animar() {
    repProgreso.style.width = (MotorAudio.progreso() * 100).toFixed(1) + "%";
    if (MotorAudio.estaSonando()) animacion = requestAnimationFrame(animar);
  }

  function alternar(beat) {
    if (MotorAudio.estaSonando() && beatActual && beatActual.id === beat.id) {
      MotorAudio.detener();
      repProgreso.style.width = "0";
      sincronizarBotones();
      return;
    }
    beatActual = beat;
    document.getElementById("repArte").innerHTML = crearPortadaSVG(beat);
    document.getElementById("repTitulo").textContent = beat.titulo;
    document.getElementById("repSub").textContent = beat.productorNombre + " · " + beat.genero + " · " + beat.bpm + " BPM";
    repBoton.disabled = false;
    MotorAudio.reproducir(beat, {
      alTerminar: function () { repProgreso.style.width = "0"; sincronizarBotones(); }
    });
    Almacen.sumarEscucha(beat.id);
    sincronizarBotones();
    cancelAnimationFrame(animacion);
    animar();
  }

  repBoton.addEventListener("click", function () { if (beatActual) alternar(beatActual); });

  /* ==================== Vista: Resumen ==================== */
  function vistaResumen() {
    const beats = Almacen.listarBeats();
    let kpis = "";
    if (rol === "COMPRADOR") {
      const c = misCompras();
      kpis = kpi("Beats disponibles", beats.length, "En el catálogo") + kpi("Mis compras", c.length, "Licencias adquiridas") + kpi("Total invertido", dinero(suma(c, "valor")), "En todas tus compras");
    } else if (rol === "PRODUCTOR") {
      const mios = beats.filter(function (b) { return b.productor === identidad; });
      const v = misVentas();
      kpis = kpi("Mis beats", mios.length, "Publicados") + kpi("Ventas", v.length, "Licencias vendidas") + kpi("Ingresos", dinero(suma(v, "valor")), "Total acumulado") + kpi("Reproducciones", formatoNumero.format(suma(mios, "reproducciones")), "De tus beats");
    } else {
      const v = Almacen.ventas();
      kpis = kpi("Usuarios", "…", "Registrados en el sistema", "kpiUsuarios") + kpi("Beats en catálogo", beats.length, "De todos los productores") + kpi("Ventas", v.length, "En todo el mercado") + kpi("Ingresos del mercado", dinero(suma(v, "valor")), "Total acumulado");
    }

    const recientes = rol === "COMPRADOR" ? misCompras() : rol === "PRODUCTOR" ? misVentas() : Almacen.ventas();

    let html = encabezado("Hola, " + escapar(nombrePublico), "Este es el resumen de tu actividad como " + NOMBRE_ROL[rol].toLowerCase() + ".") +
      '<div class="kpis">' + kpis + "</div>" +
      '<div class="dos-columnas">' +
        '<section class="panel"><div class="panel__cab"><div><h2 class="panel__titulo">Actividad reciente</h2><p class="panel__desc">Últimas operaciones</p></div></div>' +
          tablaSimple([
            { titulo: "Beat", render: function (v) { return "<strong>" + escapar(v.titulo) + "</strong>"; } },
            { titulo: rol === "COMPRADOR" ? "Productor" : "Comprador", render: function (v) { return escapar(rol === "COMPRADOR" ? v.productorNombre : v.comprador); } },
            { titulo: "Licencia", render: function (v) { return insigniaLicencia(v.licencia); } },
            { titulo: "Valor", clase: "num", render: function (v) { return dinero(v.valor); } }
          ], recientes.slice(0, 5), "Todavía no hay operaciones.") +
        "</section>" +
        '<section class="panel"><div class="panel__cab"><div><h2 class="panel__titulo">Qué puede hacer tu rol</h2><p class="panel__desc">' + NOMBRE_ROL[rol] + "</p></div></div>" +
          '<div class="panel__cuerpo"><ul class="lista-permisos">' +
          PERMISOS.map(function (p) {
            return '<li class="' + (p[rol] ? "" : "permiso--no") + '"><span class="' + (p[rol] ? "marca-ok" : "marca-no") + '" aria-hidden="true">' + (p[rol] ? "✓" : "–") + "</span>" +
              "<span>" + p.accion + '<span class="sr-only">' + (p[rol] ? " (permitido)" : " (no permitido)") + "</span></span></li>";
          }).join("") + "</ul></div></section>" +
      "</div>";

    if (rol === "ADMIN") {
      html += '<section class="panel"><div class="panel__cab"><div><h2 class="panel__titulo">Qué ve cada rol</h2><p class="panel__desc">Matriz de permisos del sistema. El rol viaja dentro del token JWT y el backend lo valida en cada petición.</p></div></div>' +
        '<div class="tabla-caja"><table class="tabla tabla--permisos"><thead><tr><th>Acción</th><th>Administrador</th><th>Productor</th><th>Comprador</th></tr></thead><tbody>' +
        PERMISOS.map(function (p) {
          function celda(r) { return "<td>" + (p[r] ? '<span class="insignia insignia--ok">Sí</span>' : '<span class="insignia insignia--gris">No</span>') + "</td>"; }
          return "<tr><td>" + p.accion + "</td>" + celda("ADMIN") + celda("PRODUCTOR") + celda("COMPRADOR") + "</tr>";
        }).join("") + "</tbody></table></div></section>";
    }
    contenido.innerHTML = html;

    if (rol === "ADMIN") {
      llamar("/usuarios").then(function (lista) {
        document.getElementById("kpiUsuarios").textContent = lista.length;
      }).catch(function () {
        const el = document.getElementById("kpiUsuarios");
        if (el) el.textContent = "—";
      });
    }
  }

  /* ==================== Vista: Catálogo ==================== */
  function vistaCatalogo() {
    const beats = Almacen.listarBeats();
    let genero = "Todos";
    let texto = "";

    contenido.innerHTML = encabezado("Catálogo de beats", "Escucha un fragmento de cada beat" + (rol === "COMPRADOR" ? " y compra la licencia que necesites." : ".")) +
      '<div class="filtros" id="filtros"></div><div class="rejilla-beats" id="rejilla"></div>';

    const filtros = document.getElementById("filtros");
    const rejilla = document.getElementById("rejilla");

    function dibujar() {
      const visibles = beats.filter(function (b) {
        return (genero === "Todos" || b.genero === genero) &&
          (b.titulo + " " + b.productorNombre).toLowerCase().indexOf(texto) >= 0;
      });
      rejilla.innerHTML = visibles.length ? visibles.map(function (b) {
        return '<article class="tarjeta"><div class="tarjeta__arte">' + crearPortadaSVG(b) +
          '<button type="button" class="btn-play" data-play="' + b.id + '" aria-label="Escuchar fragmento de ' + escapar(b.titulo) + '">' +
          '<svg class="ico-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
          '<svg class="ico-pausa" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button></div>' +
          '<div class="tarjeta__cuerpo"><h3 class="tarjeta__titulo">' + escapar(b.titulo) + "</h3>" +
          '<p class="tarjeta__productor">' + escapar(b.productorNombre) + "</p>" +
          '<div class="tarjeta__etiquetas"><span class="insignia">' + escapar(b.genero) + '</span><span class="insignia insignia--gris">' + b.bpm + " BPM</span></div>" +
          '<div class="tarjeta__pie"><div class="precio">' + dinero(b.precio) + "<small>Licencia básica</small></div>" +
          (rol === "COMPRADOR" ? '<button type="button" class="btn btn--primario btn--chico" data-comprar="' + b.id + '">Comprar</button>' : "") +
          "</div></div></article>";
      }).join("") : '<p class="vacio">No hay beats que coincidan.</p>';
      sincronizarBotones();
    }

    filtros.innerHTML = ["Todos"].concat(GENEROS).map(function (g) {
      return '<button type="button" class="chip" data-genero="' + g + '" aria-pressed="' + (g === "Todos") + '">' + g + "</button>";
    }).join("") + '<input type="search" class="buscador" placeholder="Buscar beat o productor..." aria-label="Buscar beat o productor">';

    filtros.addEventListener("click", function (e) {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      genero = chip.dataset.genero;
      filtros.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      dibujar();
    });
    filtros.querySelector(".buscador").addEventListener("input", function (e) { texto = e.target.value.trim().toLowerCase(); dibujar(); });

    rejilla.addEventListener("click", function (e) {
      const play = e.target.closest("[data-play]");
      const comprar = e.target.closest("[data-comprar]");
      if (play) alternar(beats.find(function (b) { return b.id === Number(play.dataset.play); }));
      if (comprar) abrirCompra(beats.find(function (b) { return b.id === Number(comprar.dataset.comprar); }));
    });
    dibujar();
  }

  /* ---------- Compra ---------- */
  const dlgCompra = document.getElementById("dialogoCompra");
  let beatCompra = null;

  function abrirCompra(beat) {
    beatCompra = beat;
    document.getElementById("compraBeat").textContent = beat.titulo + " — " + beat.productorNombre;
    document.getElementById("licencias").innerHTML = LICENCIAS.map(function (l, i) {
      return '<label class="licencia"><input type="radio" name="licencia" value="' + l.id + '"' + (i === 0 ? " checked" : "") + ">" +
        '<div class="licencia__cuerpo"><div class="licencia__titulo"><span>' + l.nombre + "</span><span>" + dinero(Math.round(beat.precio * l.factor)) + "</span></div>" +
        "<ul>" + l.incluye.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul></div></label>";
    }).join("");
    dlgCompra.showModal();
  }
  document.getElementById("compraCancelar").addEventListener("click", function () { dlgCompra.close(); });
  document.getElementById("compraX").addEventListener("click", function () { dlgCompra.close(); });
  document.getElementById("formCompra").addEventListener("submit", function (e) {
    e.preventDefault();
    const id = document.querySelector('input[name="licencia"]:checked').value;
    Almacen.registrarVenta(beatCompra.id, identidad, id);
    dlgCompra.close();
    Aviso.mostrar("Compra registrada: " + beatCompra.titulo);
  });

  /* ==================== Vista: Mis compras ==================== */
  function vistaCompras() {
    const c = misCompras();
    contenido.innerHTML = encabezado("Mis compras", c.length + " licencias · " + dinero(suma(c, "valor")) + " invertidos") +
      '<section class="panel">' + tablaSimple([
        { titulo: "Beat", render: function (v) { return "<strong>" + escapar(v.titulo) + "</strong>"; } },
        COLUMNAS_VENTAS.productor, COLUMNAS_VENTAS.licencia, COLUMNAS_VENTAS.fecha, COLUMNAS_VENTAS.valor
      ], c, "Aún no has comprado ningún beat. Ve al catálogo y escucha uno.") + "</section>";
  }

  /* ==================== Vista: Mis ventas ==================== */
  function vistaVentas() {
    const v = misVentas();
    contenido.innerHTML = encabezado("Mis ventas", v.length + " ventas · " + dinero(suma(v, "valor")) + " en ingresos") +
      '<section class="panel">' + tablaSimple([COLUMNAS_VENTAS.beat, COLUMNAS_VENTAS.comprador, COLUMNAS_VENTAS.licencia, COLUMNAS_VENTAS.fecha, COLUMNAS_VENTAS.valor], v, "Todavía no has vendido ningún beat.") + "</section>";
  }

  /* ==================== Vista: CRUD de beats (Mis beats / Beats) ==================== */
  async function vistaBeats(esAdmin) {
    contenido.innerHTML = encabezado(esAdmin ? "Beats del mercado" : "Mis beats",
      esAdmin ? "Crea, edita o elimina cualquier beat del catálogo." : "Publica y administra tus beats.") + '<div id="crudBeats"></div>';

    /* Productores disponibles para el administrador */
    const dueños = { granujabeats: "Granuja Beats", monolunar: "Mono Lunar", paramo: "DJ Páramo" };
    if (esAdmin) {
      try {
        const lista = await llamar("/usuarios");
        lista.filter(function (u) { return u.rol === "PRODUCTOR"; }).forEach(function (u) { dueños[u.nombreUsuario] = u.nombre; });
      } catch (e) { /* si falla, quedan los productores de ejemplo */ }
    }

    const campos = [
      { clave: "titulo", etiqueta: "Título", requerido: true, max: 60, completo: true },
      { clave: "genero", etiqueta: "Género", tipo: "select", opciones: GENEROS, requerido: true },
      { clave: "bpm", etiqueta: "BPM", tipo: "number", min: 60, max: 170, requerido: true },
      { clave: "precio", etiqueta: "Precio licencia básica (COP)", tipo: "number", min: 10000, max: 5000000, paso: 1000, requerido: true },
      { clave: "descripcion", etiqueta: "Descripción", tipo: "textarea", max: 320, completo: true, placeholder: "Una o dos frases sobre el beat." }
    ];
    if (esAdmin) {
      campos.splice(1, 0, { clave: "productor", etiqueta: "Productor", tipo: "select", requerido: true,
        opciones: Object.keys(dueños).map(function (k) { return { valor: k, texto: dueños[k] }; }) });
    }

    montarCrud({
      contenedor: document.getElementById("crudBeats"),
      titulo: esAdmin ? "Todos los beats" : "Mis beats publicados",
      descripcion: "Los cambios se ven al instante en el catálogo.",
      singular: "beat",
      nuevoTexto: "Nuevo beat",
      valoresIniciales: { genero: GENEROS[0], bpm: 90, precio: 60000, productor: Object.keys(dueños)[0] },
      columnas: [
        { titulo: "Beat", render: celdaBeat },
        { titulo: "Género", render: function (b) { return '<span class="insignia">' + escapar(b.genero) + "</span>"; } },
        { titulo: "BPM", clase: "num", render: function (b) { return b.bpm; } },
        { titulo: "Precio", clase: "num", render: function (b) { return dinero(b.precio); } },
        { titulo: "Escuchas", clase: "num", render: function (b) { return formatoNumero.format(b.reproducciones || 0); } }
      ],
      campos: campos,
      aFormulario: function (b) { return { titulo: b.titulo, genero: b.genero, bpm: b.bpm, precio: b.precio, descripcion: b.frase, productor: b.productor }; },
      buscar: function (b) { return b.titulo + " " + b.genero + " " + b.productorNombre; },
      nombreDe: function (b) { return b.titulo; },
      cargar: function () {
        return Promise.resolve(Almacen.listarBeats().filter(function (b) { return esAdmin || b.productor === identidad; }));
      },
      crear: function (d) {
        const dueño = esAdmin ? d.productor : identidad;
        Almacen.crearBeat({ titulo: d.titulo, genero: d.genero, bpm: d.bpm, precio: d.precio, descripcion: d.descripcion,
          productor: dueño, productorNombre: esAdmin ? dueños[dueño] : nombrePublico });
        return Promise.resolve();
      },
      actualizar: function (fila, d) {
        const cambios = { titulo: d.titulo, genero: d.genero, bpm: d.bpm, precio: d.precio, descripcion: d.descripcion };
        if (esAdmin && d.productor !== fila.productor) { cambios.productor = d.productor; cambios.productorNombre = dueños[d.productor]; }
        Almacen.actualizarBeat(fila.id, cambios);
        return Promise.resolve();
      },
      eliminar: function (fila) {
        if (beatActual && beatActual.id === fila.id) MotorAudio.detener();
        Almacen.eliminarBeat(fila.id);
        return Promise.resolve();
      }
    });
  }

  /* ==================== Vista: CRUD de usuarios (API real) ==================== */
  function vistaUsuarios() {
    contenido.innerHTML = encabezado("Usuarios", "Administración de cuentas. Conectado al backend de Spring Boot: GET, POST, PUT y DELETE sobre /api/usuarios.") + '<div id="crudUsuarios"></div>';

    montarCrud({
      contenedor: document.getElementById("crudUsuarios"),
      titulo: "Usuarios registrados",
      descripcion: "Solo el administrador puede ver y modificar esta tabla.",
      singular: "usuario",
      nuevoTexto: "Nuevo usuario",
      valoresIniciales: { rol: "COMPRADOR", estado: "ACTIVO" },
      columnas: [
        { titulo: "ID", render: function (u) { return u.id; } },
        { titulo: "Nombre", render: function (u) { return "<strong>" + escapar(u.nombre) + "</strong><br><small style=\"color:var(--texto-suave)\">@" + escapar(u.nombreUsuario) + "</small>"; } },
        { titulo: "Correo", render: function (u) { return escapar(u.email); } },
        { titulo: "Rol", render: function (u) { return '<span class="insignia ' + (u.rol === "ADMIN" ? "insignia--admin" : "") + '">' + (NOMBRE_ROL[u.rol] || u.rol) + "</span>"; } },
        { titulo: "Estado", render: function (u) { return '<span class="insignia ' + (u.estado === "ACTIVO" ? "insignia--ok" : "insignia--gris") + '">' + escapar(u.estado || "") + "</span>"; } }
      ],
      campos: [
        { clave: "nombre", etiqueta: "Nombre completo", requerido: true },
        { clave: "nombreUsuario", etiqueta: "Nombre de usuario", requerido: true },
        { clave: "email", etiqueta: "Correo", tipo: "email", requerido: true },
        { clave: "password", etiqueta: "Contraseña", tipo: "password", requerido: true, largoMin: 6,
          ayuda: "Mínimo 6 caracteres.", ayudaEdicion: "El backend la exige al guardar: escribe la actual o una nueva." },
        { clave: "rol", etiqueta: "Rol", tipo: "select", requerido: true, opciones: [{ valor: "COMPRADOR", texto: "Comprador" }, { valor: "PRODUCTOR", texto: "Productor" }, { valor: "ADMIN", texto: "Administrador" }] },
        { clave: "estado", etiqueta: "Estado", tipo: "select", requerido: true, opciones: ["ACTIVO", "INACTIVO"] }
      ],
      aFormulario: function (u) { return { nombre: u.nombre, nombreUsuario: u.nombreUsuario, email: u.email, rol: u.rol, estado: u.estado || "ACTIVO" }; },
      buscar: function (u) { return u.nombre + " " + u.nombreUsuario + " " + u.email + " " + u.rol; },
      nombreDe: function (u) { return u.nombre; },
      cargar: function () { return llamar("/usuarios"); },
      crear: function (d) { return llamar("/usuarios", { method: "POST", body: JSON.stringify(d) }); },
      actualizar: function (fila, d) { return llamar("/usuarios/" + fila.id, { method: "PUT", body: JSON.stringify(d) }); },
      eliminar: function (fila) {
        if (fila.id === usuario.id) return Promise.reject({ mensaje: "No puedes eliminar tu propia cuenta mientras estás dentro." });
        return llamar("/usuarios/" + fila.id, { method: "DELETE" });
      }
    });
  }

  /* ==================== Router ==================== */
  const VISTAS = {
    resumen: vistaResumen,
    catalogo: vistaCatalogo,
    compras: vistaCompras,
    misbeats: function () { vistaBeats(false); },
    beats: function () { vistaBeats(true); },
    ventas: vistaVentas,
    usuarios: vistaUsuarios
  };

  function mostrar() {
    let vista = window.location.hash.replace("#", "");
    if (menu.indexOf(vista) < 0) vista = menu[0];
    document.getElementById("tituloVista").textContent = TITULO_VISTA[vista];
    document.title = "BeatMarket - " + TITULO_VISTA[vista];
    document.querySelectorAll(".menu__enlace").forEach(function (a) {
      if (a.dataset.vista === vista) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    VISTAS[vista]();
    sincronizarBotones();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", mostrar);
  mostrar();
}
