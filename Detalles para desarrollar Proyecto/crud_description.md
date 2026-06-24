# Descripción Completa del Sistema CRUD — Gestión de Usuarios

## Objetivo
Implementar un sistema CRUD (Create, Read, Update, Delete) completo para gestión de usuarios con sincronización dual entre MySQL y MongoDB. El frontend es un archivo HTML estático con vanilla JS, y el backend es una API REST con Node.js/Express.

---

## Arquitectura General

```
proyecto/
├── frontend/
│   └── index.html          ← Archivo único (HTML + CSS + JS inline)
└── backend/
    ├── server.js            ← Servidor Express, middlewares, inicio
    ├── package.json         ← Dependencias npm
    ├── .env                 ← Variables de entorno (puertos, credenciales DB)
    ├── db/
    │   ├── mysql.js         ← Pool de conexión MySQL (mysql2/promise)
    │   └── mongo.js         ← Conexión Mongoose a MongoDB
    └── routes/
        └── formulario.js    ← Todas las rutas CRUD + modelo Mongoose
```

---

## Stack Tecnológico

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **MySQL**: `mysql2/promise` con connection pool
- **MongoDB**: `mongoose` 9.x con schema tipado
- **Middlewares**: `cors` (permitir requests cross-origin), `express.json()` (parsear body JSON), `dotenv` (variables de entorno)
- **Dev**: `nodemon` vía `npx -y nodemon server.js` para hot-reload

### Frontend
- **HTML5 + CSS3 + JavaScript vanilla** (todo en un solo archivo `index.html`)
- **Tipografía**: Google Fonts — Inter (400, 500, 600, 700)
- **Diseño**: Dark mode con CSS custom properties (variables)
- **Sin frameworks JS** — comunicación con API vía `fetch()`

---

## Variables de Entorno (.env)

```env
# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=registro_usuarios

# MongoDB
MONGO_URI=mongodb://localhost:27017/registro_usuarios

# Servidor
PORT=3000
```

---

## Base de Datos

### MySQL — Tabla `usuarios`
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(10) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MongoDB — Colección `usuarios`
Schema Mongoose:
```javascript
{
    mysql_id:       Number,       // FK que referencia al id de MySQL
    nombre:         String,
    apellido:       String,
    correo:         String,
    telefono:       String,
    fecha_registro: { type: Date, default: Date.now }
}
```

**Regla de sincronización**: Cada operación CRUD se ejecuta primero en MySQL, luego se replica en MongoDB. El `mysql_id` se usa como clave de enlace.

---

## API REST — Endpoints

Todas las rutas están bajo el prefijo `/api`.

### 1. CREATE — `POST /api/registrar`
- **Body**: `{ nombre, apellido, correo, telefono }` (JSON)
- **Validación server-side**: Campos requeridos, email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, teléfono exactamente 10 dígitos numéricos
- **Proceso**: INSERT en MySQL → obtener `insertId` → guardar documento en MongoDB con ese `mysql_id`
- **Respuesta éxito**: `201 { mensaje: "Usuario registrado correctamente", mysql_id }`
- **Respuesta error validación**: `400 { mensaje: "errores separados por coma" }`
- **Respuesta error servidor**: `500 { mensaje: "Error al registrar usuario" }`

### 2. READ ALL — `GET /api/usuarios`
- **Proceso**: `SELECT * FROM usuarios ORDER BY fecha_registro DESC`
- **Respuesta**: Array JSON de usuarios
- **Respuesta error**: `500 { mensaje: "Error al obtener usuarios" }`

### 3. READ BY ID — `GET /api/usuarios/:id`
- **Proceso**: `SELECT * FROM usuarios WHERE id=?`
- **Respuesta éxito**: Objeto JSON del usuario
- **Respuesta no encontrado**: `404 { mensaje: "Usuario no encontrado" }`
- **Respuesta error**: `500 { mensaje: "Error al buscar usuario" }`

### 4. UPDATE — `PUT /api/usuarios/:id`
- **Body**: `{ nombre, apellido, correo, telefono }` (JSON)
- **Validación server-side**: Misma que CREATE
- **Proceso**: UPDATE en MySQL → si `affectedRows === 0` retorna 404 → `findOneAndUpdate` en MongoDB por `mysql_id`
- **Respuesta éxito**: `200 { mensaje: "Usuario actualizado correctamente" }`
- **Respuesta no encontrado**: `404 { mensaje: "Usuario no encontrado" }`

### 5. DELETE — `DELETE /api/usuarios/:id`
- **Proceso**: DELETE en MySQL → si `affectedRows === 0` retorna 404 → `findOneAndDelete` en MongoDB por `mysql_id`
- **Respuesta éxito**: `200 { mensaje: "Usuario eliminado correctamente" }`
- **Respuesta no encontrado**: `404 { mensaje: "Usuario no encontrado" }`

---

## Frontend — Diseño y Funcionalidad

### Diseño Visual
- **Tema**: Dark mode profesional
- **Paleta de colores (CSS custom properties)**:
  - `--bg: #0f1117` (fondo principal)
  - `--surface: #1a1d27` (cards)
  - `--accent: #6c5ce7` (púrpura — acento principal)
  - `--success: #00b894`, `--danger: #e74c3c`, `--warning: #f39c12`
- **Layout**: CSS Grid con 2 columnas — formulario (380px) a la izquierda, tabla (1fr) a la derecha
- **Responsive**: Colapsa a 1 columna en `≤ 840px`
- **Tipografía**: Inter de Google Fonts
- **Cards**: Fondo oscuro con borde sutil (`1px solid #2a2e3b`), border-radius 12px, box-shadow
- **Inputs**: Fondo `--bg`, borde que cambia a `--accent` con glow al hacer focus
- **Botones**: Con hover que mueve -1px en Y, estados disabled con opacity 0.5

### Componentes UI

#### 1. Panel del Formulario (lado izquierdo)
- **Título dinámico**: Muestra "Nuevo Usuario" o "Editando #ID" según el estado
- **Buscar por ID**: Campo numérico + botón 🔍 en la parte superior, separado visualmente con borde inferior. Soporta Enter para buscar. Busca primero en cache local, si no encuentra consulta `GET /api/usuarios/:id`
- **Campos**: nombre, apellido, correo (email), teléfono (tel, max 10 chars)
- **Validación inline por campo**: Cada campo tiene un `<div class="field-error">` debajo que se muestra en rojo cuando hay error
- **Botones principales**:
  - "Registrar" (o "Actualizar" en modo edición) — botón púrpura primario
  - "Cancelar" — aparece solo en modo edición, limpia el formulario
- **Info de selección**: Cuando se selecciona un usuario de la tabla, muestra un badge púrpura "Usuario seleccionado: Nombre Apellido (#ID)"
- **Botones de acción CRUD** (aparecen solo cuando hay usuario seleccionado):
  - ✏️ Editar (naranja/warning) — carga los datos del usuario seleccionado en los campos del formulario
  - 🗑️ Eliminar (rojo/danger) — abre modal de confirmación
- **Input hidden `editId`**: Guarda el ID del usuario siendo editado. Si está vacío = modo CREATE, si tiene valor = modo UPDATE

#### 2. Panel de la Tabla (lado derecho)
- **Barra de búsqueda**: Input con icono SVG de lupa inline, filtra en tiempo real por nombre, apellido, correo, teléfono o ID
- **Contador**: Muestra "X registros" actualizado dinámicamente
- **Tabla**: Columnas: ID, Nombre, Apellido, Correo, Teléfono, Registro (fecha formateada es-MX)
- **Sin columna de acciones** — los botones CRUD están en el formulario
- **Filas clickeables**: Al hacer clic en una fila se "selecciona" el usuario (se resalta con fondo púrpura y borde izquierdo), y aparecen los botones Editar/Eliminar en el formulario
- **Fila seleccionada**: Clase CSS `.selected` con `background: var(--accent-glow)` y `border-left: 3px solid var(--accent)`
- **Estado vacío**: Muestra "No se encontraron usuarios." centrado
- **Estado cargando**: Muestra spinner CSS animado + "Cargando..."

#### 3. Toast de Notificaciones
- Posición fija arriba-derecha
- Animación slide-in desde la derecha con `cubic-bezier`
- Dos variantes: `.exito` (verde oscuro) y `.error` (rojo oscuro)
- Se auto-oculta después de 3.5 segundos

#### 4. Modal de Confirmación de Eliminación
- Overlay con `backdrop-filter: blur(4px)` y fondo semitransparente
- Modal centrado con animación scale de 0.92 a 1
- Muestra nombre del usuario a eliminar
- Botones: "Cancelar" y "Eliminar" (rojo)
- Se cierra al hacer clic fuera del modal, o al presionar Cancelar
- Botón Eliminar muestra spinner durante la operación

### Flujo de Interacción Completo

#### Crear usuario:
1. Llenar campos nombre, apellido, correo, teléfono
2. Click "Registrar"
3. Validación client-side (campos requeridos, email regex, teléfono 10 dígitos)
4. Si pasa → POST a `/api/registrar`
5. Botón muestra spinner "Registrando..."
6. Si éxito → toast verde, limpiar formulario, recargar tabla
7. Si error → toast rojo con mensaje del servidor

#### Seleccionar usuario:
1. Click en una fila de la tabla → se resalta la fila, aparece badge "Usuario seleccionado: ..." y botones Editar/Eliminar en el formulario
2. Alternativa: escribir un ID en "Buscar por ID" y click 🔍 o Enter

#### Editar usuario:
1. Seleccionar usuario (clic en fila o búsqueda por ID)
2. Click "✏️ Editar" en el formulario
3. Los datos se cargan en los campos, título cambia a "Editando #ID", botón cambia a "Actualizar", aparece "Cancelar"
4. Modificar campos → click "Actualizar"
5. PUT a `/api/usuarios/:id`
6. Si éxito → toast verde, limpiar formulario, recargar tabla

#### Eliminar usuario:
1. Seleccionar usuario
2. Click "🗑️ Eliminar"
3. Se abre modal: "¿Eliminar a Nombre Apellido? Esta acción no se puede deshacer."
4. Click "Eliminar" en modal
5. DELETE a `/api/usuarios/:id`
6. Si éxito → toast verde, limpiar formulario, recargar tabla, cerrar modal

### Estado Global en JavaScript
```javascript
let usuariosCache = [];       // Array con todos los usuarios cargados del servidor
let selectedUserId = null;    // ID del usuario seleccionado en la tabla (null = ninguno)
let deleteTargetId = null;    // ID del usuario que se va a eliminar (para el modal)
```

### Funciones Clave

| Función | Descripción |
|---------|-------------|
| `esc(str)` | Escapa HTML para prevenir XSS (crea div temporal, usa textContent→innerHTML) |
| `showToast(msg, tipo)` | Muestra notificación toast animada ('exito' o 'error') |
| `setFieldError(id, msg)` | Muestra/oculta error inline debajo de un campo |
| `clearErrors()` | Limpia todos los errores de validación |
| `validar()` | Ejecuta validación de los 4 campos, retorna boolean |
| `cargarUsuarios()` | GET /api/usuarios → actualiza `usuariosCache` → llama `renderTabla()` |
| `renderTabla(lista)` | Genera el HTML de la tabla a partir de un array de usuarios |
| `buscarPorId()` | Busca usuario por ID (cache local primero, luego API) |
| `seleccionarUsuario(u)` | Marca usuario como seleccionado, muestra info + botones |
| `deseleccionarUsuario()` | Quita selección, oculta info + botones |
| `prepararEdicion(u)` | Carga datos del usuario en el formulario, cambia a modo edición |
| `limpiarFormulario()` | Resetea formulario a modo CREATE, deselecciona usuario |
| `abrirModalEliminar(id)` | Abre modal de confirmación con nombre del usuario |
| `cerrarModal()` | Cierra modal de eliminación |

### Seguridad Frontend
- **Anti-XSS**: Todos los datos se escapan con `esc()` antes de inyectarlos al DOM
- **Delegación de eventos**: Se usa `data-id` en atributos y event delegation en el tbody en vez de `onclick` inline
- **Deshabilitación de botones**: Durante operaciones async, los botones se deshabilitan para evitar doble-submit

---

## Cómo Instalar y Ejecutar

```bash
# 1. Instalar dependencias del backend
cd backend
npm install

# 2. Configurar .env con credenciales de MySQL y MongoDB

# 3. Crear la base de datos y tabla en MySQL
# (ejecutar el CREATE TABLE mostrado arriba)

# 4. Iniciar MongoDB (debe estar corriendo localmente)

# 5. Iniciar el servidor backend
npm run dev    # con hot-reload (nodemon)
# o
npm start      # sin hot-reload

# 6. Abrir frontend/index.html directamente en el navegador
# El frontend se comunica con http://localhost:3000/api
```

### Dependencias npm
```json
{
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "mongoose": "^9.6.1",
  "mysql2": "^3.22.3"
}
```

---

## Notas para Implementación en Otro Proyecto

1. **Adaptar los campos**: Cambiar `nombre, apellido, correo, telefono` por los campos de tu entidad
2. **Adaptar validaciones**: Tanto en el frontend (`validar()`) como en el backend (`validarUsuario()`)
3. **Adaptar la tabla MySQL**: Modificar el `CREATE TABLE` y las queries SQL
4. **Adaptar el schema MongoDB**: Modificar el Mongoose schema para reflejar tus campos
5. **Si no necesitas MongoDB**: Eliminar todo lo relacionado con Mongoose — el CRUD funciona perfectamente solo con MySQL
6. **Si no necesitas MySQL**: Cambiar las queries SQL por operaciones Mongoose puras
7. **La API URL** está hardcodeada en el frontend como `const API = 'http://localhost:3000/api'` — cambiar según sea necesario
