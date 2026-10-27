# BeatMarket — Frontend

HTML + CSS + JavaScript puro. Se abre con **Live Server** (puerto 5500) en VS Code.

## Cómo correrlo
1. Arranca MariaDB y el backend Spring Boot (puerto 8080).
2. En VS Code abre esta carpeta, clic derecho en `index.html` -> *Open with Live Server*.
3. Si tu backend usa otro puerto, cambia `API_URL` en `js/api.js`.

## Usuarios de prueba (los crea el DataSeeder del backend)
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@beatmarket.com | admin123 |
| Productor | productor@beatmarket.com | productor123 |
| Comprador | comprador@beatmarket.com | comprador123 |

## Qué ve cada rol
- **Comprador:** Resumen, Catálogo (escucha y compra), Mis compras.
- **Productor:** Resumen, Catálogo, **Mis beats (CRUD)**, Mis ventas.
- **Administrador:** Resumen (con matriz de permisos), Catálogo, **Beats (CRUD)**, **Usuarios (CRUD)**.

## Qué es real y qué es de ejemplo
- **Login + JWT + CRUD de Usuarios:** conectados al backend (`/api/auth/login`, `/api/usuarios`). El token va en `sessionStorage` y se envía como `Authorization: Bearer ...`.
- **Beats, compras y ventas:** todavía no tienen endpoints; se guardan en `localStorage` con las mismas operaciones de un CRUD (`js/almacen.js`). Cuando existan los endpoints solo se reemplaza el cuerpo de esas funciones por `llamar(...)`.
- Para reiniciar los datos de ejemplo ejecuta `Almacen.reiniciar()` en la consola del navegador.
- El audio es un sintetizador (Web Audio API): no hay archivos de sonido.

## Nota sobre editar usuarios
El backend exige `password` (mínimo 6) también en el PUT, por el `@Valid` + `@NotBlank`. Por eso el formulario de edición pide contraseña. Si quieres que sea opcional, quita `@NotBlank` del campo en `Usuario` y valida solo al crear.

## Archivos
`index.html` login · `inicio.html` panel · `js/crud.js` componente CRUD reutilizable · `js/inicio.js` vistas por rol · `js/api.js` conexión + JWT · `js/almacen.js` datos locales · `js/audio.js` sonido · `js/datos.js` catálogo de ejemplo.
