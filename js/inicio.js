const usuarioGuardado = sessionStorage.getItem("usuario");

if (!usuarioGuardado) {
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

document.getElementById("btnSalir").addEventListener("click", () => {
    sessionStorage.removeItem("usuario");
    window.location.href = "index.html";
});