# BeatMarket

Proyecto de la materia de desarrollo con Spring Boot UTS, ...

BeatMarket es una tienda de beats ...

- **Autor:** Yesid Camilo Manrique Rueda
- **Backend:** [github.com/tamilo1217-lgtm/beatmarket](https://github.com/tamilo1217-lgtm/beatmarket)
- **Frontend:** [github.com/tamilo1217-lgtm/beatmarket-frontend](https://github.com/tamilo1217-lgtm/beatmarket-frontend)

## Qué hace hoy

- Login con correo y contraseña. El backend responde con un token JWT.
- Tres roles: administrador, productor y comprador. Cada uno ve un menú distinto.
- CRUD completo de usuarios contra la base de datos (solo el administrador).
- Catálogo de beats con vista previa de sonido, compra de licencias y panel por rol en el frontend.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Backend | Java 17, Spring Boot 3.3.4, Maven |
| Seguridad | Spring Security, JWT (jjwt 0.12.6), BCrypt |
| Base de datos | MariaDB, Spring Data JPA / Hibernate |
| Frontend | HTML, CSS y JavaScript sin frameworks (Live Server en VS Code) |

## Estructura del backend

```
com.beatmarket.backend
├── modelo        Entidades (Usuario, Rol)
├── repositorio   Acceso a datos (JpaRepository)
├── servicio      Lógica: interfaz con I y su clase
├── controlador   Endpoints REST
├── seguridad     Filtro y utilidad de JWT
├── config        Seguridad, CORS y datos de prueba
└── excepcion     Manejo de errores en JSON
```

## Cómo correrlo

1. Tener MariaDB corriendo en el puerto 3306 (usuario `root`, sin contraseña, o ajusta `application.properties`).
2. Abrir el backend en Eclipse/STS y ejecutar `BackendApplication`. La base `beatmarketDB` y la tabla `usuario` las crea Spring solas (`ddl-auto=update`). El servidor queda en `http://localhost:8080`.
3. Abrir la carpeta del frontend en VS Code y arrancar `index.html` con Live Server (puerto 5500).

Al arrancar se crean tres usuarios de prueba:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@beatmarket.com | admin123 |
| Productor | productor@beatmarket.com | productor123 |
| Comprador | comprador@beatmarket.com | comprador123 |

## Seguridad (JWT)

1. El cliente hace `POST /api/auth/login` con su correo y contraseña.
2. El backend revisa la contraseña contra el hash BCrypt y devuelve un token firmado que lleva el correo y el rol.
3. En cada petición el cliente manda el token en la cabecera `Authorization: Bearer <token>`.
4. Un filtro (`JwtFilter`) valida el token antes de llegar al controlador. No se guarda sesión en el servidor.
5. Sin token la respuesta es **401**. Con token pero sin el rol necesario es **403**.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Inicia sesión y devuelve el token |
| GET | `/api/usuarios` | Admin | Lista los usuarios |
| GET | `/api/usuarios/{id}` | Admin | Busca un usuario |
| POST | `/api/usuarios` | Admin | Crea un usuario |
| PUT | `/api/usuarios/{id}` | Admin | Actualiza un usuario |
| DELETE | `/api/usuarios/{id}` | Admin | Elimina un usuario |

Ejemplo de login:

```json
{ "email": "admin@beatmarket.com", "password": "admin123" }
```

Ejemplo de usuario para crear:

```json
{
  "nombre": "Laura Gómez",
  "nombreUsuario": "laurag",
  "email": "laura@correo.com",
  "password": "123456",
  "rol": "COMPRADOR",
  "estado": "ACTIVO"
}
```


Los errores se devuelven en JSON, por ejemplo `{ "status": 400, "error": "...", "mensaje": "..." }`. Si falla una validación, se indica el campo con su mensaje.

## CRUD del integrante

Como el proyecto es individual, el CRUD es el de **Usuario**: crear, consultar, actualizar y eliminar usuarios con su rol, validado con JWT. Se puede probar desde Postman o desde la pantalla "Usuarios" del frontend (entrando como administrador).

## Base de datos

El diseño completo está en la carpeta `docs`:

- `docs/diagrama-er.png`: modelo entidad-relación.
- `docs/script-base-de-datos.sql`: script con las tablas.

Solo la tabla `usuario` está implementada en el backend. Las tablas `genero`, `licencia`, `beat`, `compra` y `resena` son el diseño de la siguiente fase.

## Lo que falta

- Endpoints y tablas de beats, compras y reseñas. Mientras tanto, el frontend guarda los beats, compras y ventas en el navegador (localStorage), con las mismas operaciones de un CRUD, para poder mostrar el flujo completo.
- Subida del archivo MP3 de cada beat. Hoy el frontend genera un sonido de vista previa según el género y los BPM.
- Al editar un usuario hay que enviar también la contraseña, porque la validación del backend la exige.
