/* login.js — Valida el formulario, llama a POST /api/auth/login y guarda el token JWT */

// Si ya hay una sesión abierta, pasa directo al panel
if (Sesion.token()) window.location.href = "inicio.html";

const formulario = document.getElementById("formLogin");
const campoCorreo = document.getElementById("email");
const campoClave = document.getElementById("password");
const botonEntrar = document.getElementById("btnEntrar");
const mensaje = document.getElementById("mensaje");
const lista = document.getElementById("listaRoles");

/* Mosaico decorativo con portadas */
document.getElementById("mosaico").innerHTML = OBRAS_BASE.map(function (o) {
    return '<div class="mosaico__pieza">' + crearPortadaSVG(o) + "</div>";
}).join("");

/* Roles de prueba: llenan el formulario */
["COMPRADOR", "PRODUCTOR", "ADMIN"].forEach(function (rol) {
    const li = document.createElement("li");
    li.innerHTML =
        '<button type="button" class="rol-demo" data-rol="' + rol + '">' +
        "<strong>" + NOMBRE_ROL[rol] + "</strong><span>" + MIRADAS[rol].resumen + "</span></button>";
    lista.appendChild(li);
});

lista.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".rol-demo");
    if (!boton) return;
    const m = MIRADAS[boton.dataset.rol];
    campoCorreo.value = m.correo;
    campoClave.value = m.clave;
    mensaje.textContent = "";
    lista.querySelectorAll(".rol-demo").forEach(function (b) { b.classList.toggle("activo", b === boton); });
    botonEntrar.focus();
});

formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    mensaje.textContent = "";

    const email = campoCorreo.value.trim();
    const password = campoClave.value;
    if (!email || !password) {
        mensaje.textContent = "Escribe tu correo y tu contraseña para entrar.";
        return;
    }

    botonEntrar.disabled = true;
    botonEntrar.textContent = "Entrando...";
    try {
        const respuesta = await llamar("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: email, password: password })
        });
        Sesion.guardar(respuesta);
        window.location.href = "inicio.html";
    } catch (error) {
        mensaje.textContent = error.mensaje;
        botonEntrar.disabled = false;
        botonEntrar.textContent = "Entrar";
    }
});
