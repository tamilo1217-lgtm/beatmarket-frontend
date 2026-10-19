const API_URL = "http://localhost:8080/api";

const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensaje.textContent = "";

    const credenciales = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        const respuesta = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credenciales)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            sessionStorage.setItem("usuario", JSON.stringify(datos));
            window.location.href = "inicio.html";
        } else {
            mensaje.textContent = datos.mensaje || "No se pudo iniciar sesión";
        }
    } catch (error) {
        mensaje.textContent = "No se pudo conectar con el servidor. ¿Está corriendo Spring Boot?";
    }
});