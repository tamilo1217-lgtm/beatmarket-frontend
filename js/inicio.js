const API_URL = "http://localhost:8080/api";

const usuarioGuardado = sessionStorage.getItem("usuario");
const token = sessionStorage.getItem("token");

if (!usuarioGuardado || !token) {
    window.location.href = "index.html";
} else {
    const usuario = JSON.parse(usuarioGuardado);

    document.getElementById("nombre").textContent = usuario.nombre;
    document.getElementById("rol").textContent = usuario.rol;

    const descripciones = {
        ADMIN: "Puedes administrar usuarios, géneros y licencias del marketplace.",
        PRODUCTOR: "Puedes publicar y vender tus beats.",
        COMPRADOR: "Puedes explorar y comprar beats."
    };
    document.getElementById("descripcion").textContent = descripciones[usuario.rol] || "";
}

function cerrarSesion() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    window.location.href = "index.html";
}

document.getElementById("btnSalir").addEventListener("click", cerrarSesion);

document.getElementById("btnProbar").addEventListener("click", async () => {
    const salida = document.getElementById("resultado");
    salida.textContent = "";

    try {
        const respuesta = await fetch(`${API_URL}/usuarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (respuesta.ok) {
            const usuarios = await respuesta.json();
            salida.textContent = `Acceso permitido: hay ${usuarios.length} usuarios registrados.`;
        } else if (respuesta.status === 401) {
            cerrarSesion();
        } else if (respuesta.status === 403) {
            salida.textContent = "Acceso denegado: tu rol no tiene permiso para ver esta información.";
        } else {
            salida.textContent = "Ocurrió un error inesperado.";
        }
    } catch (error) {
        salida.textContent = "No se pudo conectar con el servidor.";
    }
});