/* ==========================================================================
   api.js — Conexión con el backend de Spring Boot y manejo del token JWT.
   Si cambias el puerto del backend, solo cambia API_URL.
   ========================================================================== */
const API_URL = "http://localhost:8080/api";

const Sesion = {
  guardar(respuesta) {
    sessionStorage.setItem("token", respuesta.token);
    sessionStorage.setItem("usuario", JSON.stringify(respuesta.usuario));
  },
  token() {
    return sessionStorage.getItem("token");
  },
  usuario() {
    try { return JSON.parse(sessionStorage.getItem("usuario")); } catch (e) { return null; }
  },
  cerrar() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    window.location.href = "index.html";
  }
};

/* Llama al backend. Si hay token, lo manda en la cabecera Authorization: Bearer ...
   Si falla, lanza un objeto { estado, mensaje } listo para mostrar al usuario. */
async function llamar(ruta, opciones) {
  const cabeceras = { "Content-Type": "application/json" };
  const token = Sesion.token();
  if (token) cabeceras["Authorization"] = "Bearer " + token;

  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, Object.assign({}, opciones, { headers: cabeceras }));
  } catch (e) {
    throw { estado: 0, mensaje: "No hay conexión con el servidor. Revisa que Spring Boot esté corriendo en el puerto 8080." };
  }

  let cuerpo = null;
  if (respuesta.status !== 204) {
    try { cuerpo = await respuesta.json(); } catch (e) { cuerpo = null; }
  }

  if (!respuesta.ok) {
    let mensaje = cuerpo && cuerpo.mensaje;
    if (!mensaje && cuerpo && cuerpo.errores) mensaje = Object.values(cuerpo.errores).join(". ");
    throw { estado: respuesta.status, mensaje: mensaje || "Ocurrió un error inesperado en el servidor." };
  }
  return cuerpo;
}
