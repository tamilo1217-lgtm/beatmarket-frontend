/* ==========================================================================
   crud.js — Componente genérico de CRUD: tabla + buscador + ventana para
   crear/editar + confirmación para eliminar. Se usa para Usuarios (API real)
   y para Beats (datos locales). Cada vista solo describe columnas y campos.
   ========================================================================== */

const Aviso = {
  mostrar: function (texto, tipo) {
    let caja = document.getElementById("avisos");
    if (!caja) {
      caja = document.createElement("div");
      caja.id = "avisos";
      caja.className = "avisos";
      caja.setAttribute("role", "status");
      caja.setAttribute("aria-live", "polite");
      document.body.appendChild(caja);
    }
    const a = document.createElement("div");
    a.className = "aviso aviso--" + (tipo || "ok");
    a.textContent = texto;
    caja.appendChild(a);
    setTimeout(function () { a.classList.add("aviso--sale"); }, 3200);
    setTimeout(function () { a.remove(); }, 3600);
  }
};

function montarCrud(cfg) {
  const permisos = Object.assign({ crear: true, editar: true, eliminar: true }, cfg.permisos || {});
  let filas = [];
  let filaEditando = null;

  cfg.contenedor.innerHTML =
    '<div class="panel">' +
      '<div class="panel__cab">' +
        '<div><h2 class="panel__titulo">' + escapar(cfg.titulo) + '</h2>' +
        (cfg.descripcion ? '<p class="panel__desc">' + escapar(cfg.descripcion) + '</p>' : '') + '</div>' +
        (permisos.crear ? '<button type="button" class="btn btn--primario" data-accion="nuevo">+ ' + escapar(cfg.nuevoTexto || "Nuevo") + '</button>' : '') +
      '</div>' +
      '<div class="barra-tabla">' +
        '<input type="search" class="buscador" placeholder="Buscar..." aria-label="Buscar en la tabla">' +
        '<span class="contador" aria-live="polite"></span>' +
      '</div>' +
      '<div class="tabla-caja"></div>' +
    '</div>' +
    '<dialog class="dialogo dialogo--form"></dialog>' +
    '<dialog class="dialogo dialogo--confirmar"></dialog>';

  const caja = cfg.contenedor.querySelector(".tabla-caja");
  const buscador = cfg.contenedor.querySelector(".buscador");
  const contador = cfg.contenedor.querySelector(".contador");
  const dlgForm = cfg.contenedor.querySelector(".dialogo--form");
  const dlgConfirmar = cfg.contenedor.querySelector(".dialogo--confirmar");

  /* ---------- Tabla ---------- */
  function dibujar() {
    const texto = buscador.value.trim().toLowerCase();
    const visibles = filas.filter(function (f) {
      if (!texto) return true;
      return (cfg.buscar ? cfg.buscar(f) : JSON.stringify(f)).toLowerCase().indexOf(texto) >= 0;
    });
    contador.textContent = visibles.length + " de " + filas.length + " registros";

    if (!visibles.length) {
      caja.innerHTML = '<p class="vacio">' + (filas.length ? "Ningún registro coincide con la búsqueda." : "Todavía no hay registros.") + "</p>";
      return;
    }

    const hayAcciones = permisos.editar || permisos.eliminar;
    let html = '<table class="tabla"><thead><tr>';
    cfg.columnas.forEach(function (c) { html += '<th class="' + (c.clase || "") + '">' + escapar(c.titulo) + "</th>"; });
    if (hayAcciones) html += '<th class="col-acciones">Acciones</th>';
    html += "</tr></thead><tbody>";
    visibles.forEach(function (f) {
      html += '<tr data-id="' + escapar(String(f.id)) + '">';
      cfg.columnas.forEach(function (c) {
        const valor = c.render ? c.render(f) : escapar(String(f[c.clave] == null ? "" : f[c.clave]));
        html += '<td class="' + (c.clase || "") + '" data-etiqueta="' + escapar(c.titulo) + '">' + valor + "</td>";
      });
      if (hayAcciones) {
        html += '<td class="col-acciones">';
        if (permisos.editar) html += '<button type="button" class="btn btn--chico" data-accion="editar">Editar</button>';
        if (permisos.eliminar) html += '<button type="button" class="btn btn--chico btn--peligro" data-accion="eliminar">Eliminar</button>';
        html += "</td>";
      }
      html += "</tr>";
    });
    html += "</tbody></table>";
    caja.innerHTML = html;
  }

  async function recargar() {
    caja.innerHTML = '<p class="vacio">Cargando...</p>';
    try {
      filas = await cfg.cargar();
      dibujar();
    } catch (error) {
      caja.innerHTML = '<div class="vacio vacio--error"><p>' + escapar(error.mensaje || "No se pudieron cargar los datos.") +
        '</p><button type="button" class="btn" data-accion="reintentar">Reintentar</button></div>';
    }
  }

  /* ---------- Formulario crear / editar ---------- */
  function campoHtml(c, valor, editando) {
    const id = "f_" + c.clave;
    const requerido = c.requerido && !(editando && c.soloCrear) ? " required" : "";
    const etiqueta = '<label for="' + id + '">' + escapar(c.etiqueta) + (c.requerido ? ' <span class="oblig">*</span>' : "") + "</label>";
    let control;
    if (c.tipo === "select") {
      control = '<select id="' + id + '" name="' + c.clave + '"' + requerido + ">" +
        c.opciones.map(function (o) {
          const v = typeof o === "object" ? o.valor : o;
          const t = typeof o === "object" ? o.texto : o;
          return '<option value="' + escapar(String(v)) + '"' + (String(v) === String(valor) ? " selected" : "") + ">" + escapar(String(t)) + "</option>";
        }).join("") + "</select>";
    } else if (c.tipo === "textarea") {
      control = '<textarea id="' + id + '" name="' + c.clave + '" rows="3"' + (c.max ? ' maxlength="' + c.max + '"' : "") + requerido + ">" + escapar(String(valor == null ? "" : valor)) + "</textarea>";
    } else {
      control = '<input id="' + id + '" name="' + c.clave + '" type="' + (c.tipo || "text") + '"' +
        (c.tipo === "password" ? "" : ' value="' + escapar(String(valor == null ? "" : valor)) + '"') +
        (c.min != null ? ' min="' + c.min + '"' : "") +
        (c.max != null ? ' max="' + c.max + '"' : "") +
        (c.paso ? ' step="' + c.paso + '"' : "") +
        (c.largoMin ? ' minlength="' + c.largoMin + '"' : "") +
        (c.tipo === "password" ? ' autocomplete="new-password"' : "") +
        (c.placeholder ? ' placeholder="' + escapar(c.placeholder) + '"' : "") +
        requerido + ">";
    }
    const ayuda = (editando && c.ayudaEdicion) || c.ayuda;
    return '<div class="campo' + (c.completo ? " campo--completo" : "") + '">' + etiqueta + control +
      (ayuda ? '<small class="campo__ayuda">' + escapar(ayuda) + "</small>" : "") + "</div>";
  }

  function abrirForm(fila) {
    filaEditando = fila || null;
    const editando = !!fila;
    const valores = fila ? (cfg.aFormulario ? cfg.aFormulario(fila) : fila) : (cfg.valoresIniciales || {});
    dlgForm.innerHTML =
      '<form novalidate>' +
        '<header class="dialogo__cab"><h2>' + (editando ? "Editar " : "Nuevo ") + escapar(cfg.singular) + "</h2>" +
        '<button type="button" class="dialogo__cerrar" data-accion="cerrar" aria-label="Cerrar">&times;</button></header>' +
        '<div class="dialogo__cuerpo"><div class="rejilla-campos">' +
          cfg.campos.filter(function (c) { return !(editando && c.soloCrear); }).map(function (c) { return campoHtml(c, valores[c.clave], editando); }).join("") +
        "</div>" +
        '<p class="error-form" role="alert"></p></div>' +
        '<footer class="dialogo__pie">' +
          '<button type="button" class="btn" data-accion="cerrar">Cancelar</button>' +
          '<button type="submit" class="btn btn--primario">' + (editando ? "Guardar cambios" : "Crear") + "</button>" +
        "</footer>" +
      "</form>";
    dlgForm.showModal();
    const primero = dlgForm.querySelector("input, select, textarea");
    if (primero) primero.focus();
  }

  function leerForm(form, editando) {
    const datos = {};
    const errores = [];
    cfg.campos.forEach(function (c) {
      if (editando && c.soloCrear) return;
      const el = form.elements[c.clave];
      let v = el.value;
      if (c.tipo !== "password") v = v.trim();
      if (c.requerido && v === "") { errores.push(c.etiqueta + " es obligatorio."); return; }
      if (c.largoMin && v !== "" && v.length < c.largoMin) { errores.push(c.etiqueta + " debe tener mínimo " + c.largoMin + " caracteres."); return; }
      if (c.tipo === "email" && v !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { errores.push("El correo no tiene un formato válido."); return; }
      if (c.tipo === "number") {
        v = Number(v);
        if (isNaN(v) || (c.min != null && v < c.min) || (c.max != null && v > c.max)) {
          errores.push(c.etiqueta + " debe estar entre " + c.min + " y " + c.max + ".");
          return;
        }
      }
      datos[c.clave] = v;
    });
    return { datos: datos, errores: errores };
  }

  dlgForm.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const form = evento.target;
    const error = form.querySelector(".error-form");
    const editando = !!filaEditando;
    const res = leerForm(form, editando);
    if (res.errores.length) { error.textContent = res.errores[0]; return; }

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    error.textContent = "";
    try {
      if (editando) await cfg.actualizar(filaEditando, res.datos);
      else await cfg.crear(res.datos);
      dlgForm.close();
      Aviso.mostrar(cfg.singular.charAt(0).toUpperCase() + cfg.singular.slice(1) + (editando ? " actualizado." : " creado."));
      await recargar();
      if (cfg.alCambiar) cfg.alCambiar();
    } catch (e) {
      error.textContent = e.mensaje || "No se pudo guardar.";
      boton.disabled = false;
    }
  });

  /* ---------- Confirmar eliminación ---------- */
  function pedirEliminar(fila) {
    const nombre = cfg.nombreDe ? cfg.nombreDe(fila) : "este registro";
    dlgConfirmar.innerHTML =
      "<form>" +
        '<header class="dialogo__cab"><h2>Eliminar ' + escapar(cfg.singular) + "</h2></header>" +
        '<div class="dialogo__cuerpo"><p>¿Seguro que quieres eliminar <strong>' + escapar(nombre) + "</strong>? Esta acción no se puede deshacer.</p>" +
        '<p class="error-form" role="alert"></p></div>' +
        '<footer class="dialogo__pie">' +
          '<button type="button" class="btn" data-accion="cerrar">Cancelar</button>' +
          '<button type="submit" class="btn btn--peligro-lleno">Sí, eliminar</button>' +
        "</footer>" +
      "</form>";
    dlgConfirmar.querySelector("form").addEventListener("submit", async function (evento) {
      evento.preventDefault();
      const error = dlgConfirmar.querySelector(".error-form");
      try {
        await cfg.eliminar(fila);
        dlgConfirmar.close();
        Aviso.mostrar(cfg.singular.charAt(0).toUpperCase() + cfg.singular.slice(1) + " eliminado.", "ok");
        await recargar();
        if (cfg.alCambiar) cfg.alCambiar();
      } catch (e) {
        error.textContent = e.mensaje || "No se pudo eliminar.";
      }
    });
    dlgConfirmar.showModal();
  }

  /* ---------- Eventos ---------- */
  cfg.contenedor.addEventListener("click", function (evento) {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    const accion = boton.dataset.accion;
    if (accion === "nuevo") abrirForm(null);
    else if (accion === "reintentar") recargar();
    else if (accion === "cerrar") boton.closest("dialog").close();
    else {
      const tr = boton.closest("tr");
      const fila = tr && filas.find(function (f) { return String(f.id) === tr.dataset.id; });
      if (!fila) return;
      if (accion === "editar") abrirForm(fila);
      if (accion === "eliminar") pedirEliminar(fila);
    }
  });
  buscador.addEventListener("input", dibujar);

  recargar();
  return { recargar: recargar };
}
