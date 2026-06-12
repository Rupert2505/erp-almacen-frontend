# Documentacion tecnica del frontend ERP Almacen

## 1. Descripcion general

El frontend del ERP Almacen es una aplicacion web desarrollada con React, TypeScript y Vite. Es un proyecto separado del backend Spring Boot y consume una API REST protegida mediante JWT.

La aplicacion cubre los flujos principales de operacion del almacen: autenticacion, catalogos, inventario, consultas, reportes y administracion de usuarios. Su objetivo es ofrecer una interfaz tipo ERP, profesional, sobria y orientada a productividad.

URLs locales actuales:

```bash
Backend:  http://localhost:8080
Frontend: http://localhost:5173
```

## 2. Tecnologias utilizadas

| Tecnologia | Uso |
| --- | --- |
| React | Construccion de interfaz |
| TypeScript | Tipado estatico |
| Vite | Dev server, build y bundling |
| React Router | Rutas publicas y protegidas |
| Axios | Cliente HTTP centralizado |
| TanStack Query | Cache, loading y sincronizacion de datos remotos |
| React Hook Form | Manejo de formularios |
| Zod | Validacion de formularios |
| Tailwind CSS | Estilos utilitarios |
| Lucide React | Iconografia |
| ESLint | Revision estatica de codigo |

## 3. Estructura de carpetas

```text
src/
  app/
    config/
      env.ts
    providers/
      AppProviders.tsx
    router/
      AppRouter.tsx
      ProtectedRoute.tsx
  layout/
    Header.tsx
    MainLayout.tsx
    Sidebar.tsx
  features/
    auth/
      context/
      pages/
      schemas/
      services/
      types/
    dashboard/
      pages/
    productos/
      components/
      pages/
      schemas/
      services/
      types/
    proveedores/
      components/
      pages/
      schemas/
      services/
      types/
    almacenes/
      components/
      pages/
      schemas/
      services/
      types/
    inventario/
      kardex/
      movimientos/
      pages/
      stock/
    reportes/
      inventario/
      pages/
    usuarios/
      components/
      pages/
      schemas/
      services/
      types/
  shared/
    components/
      Card.tsx
      LoadingScreen.tsx
      PageHeader.tsx
    services/
      apiClient.ts
      apiResponse.ts
    utils/
      permissions.ts
      storageKeys.ts
  styles/
    globals.css
```

## 4. Arquitectura frontend

La arquitectura se organiza por funcionalidades dentro de `src/features`. Cada modulo contiene sus propias paginas, componentes, servicios, tipos y validaciones cuando aplica.

Capas principales:

- `app`: configuracion global, providers y router.
- `layout`: estructura visual comun del ERP.
- `features`: modulos funcionales aislados por dominio.
- `shared`: componentes, servicios y utilidades reutilizables.
- `styles`: estilos globales.

El patron principal es:

```text
Page -> Components -> Services -> apiClient -> Backend REST
```

TanStack Query administra consultas, cache, estados de carga y refetch. React Hook Form y Zod administran formularios y validaciones.

## 5. Manejo de rutas

Las rutas se definen en `src/app/router/AppRouter.tsx`.

La aplicacion usa:

- `BrowserRouter` en `AppProviders`.
- `Routes` y `Route` de React Router.
- `ProtectedRoute` para proteger las rutas privadas.
- `React.lazy` y `Suspense` para cargar paginas bajo demanda.

La ruta raiz `/` redirige a `/dashboard`.

## 6. Rutas publicas y protegidas

Ruta publica:

```text
/login
```

Rutas protegidas:

```text
/
/dashboard
/productos
/proveedores
/almacenes
/ubicaciones
/inventario/movimientos
/inventario/stock
/inventario/kardex
/reportes/inventario
/usuarios
```

Cualquier ruta no reconocida redirige a `/dashboard`.

## 7. Autenticacion JWT

El login consume:

```http
POST /api/auth/login
```

El backend devuelve datos de usuario y token JWT:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "username": "admin",
  "nombres": "Administrador",
  "apellidos": "Sistema",
  "email": "admin@erpalmacen.local",
  "roles": ["ADMIN"],
  "permisos": ["PRODUCTO_VER"]
}
```

El token se almacena actualmente en `localStorage`. Axios lo agrega automaticamente en cada request:

```http
Authorization: Bearer <token>
```

## 8. Manejo de sesion

La sesion se administra en `AuthContext`.

Flujo al iniciar la aplicacion:

1. Se revisa si existe token en `localStorage`.
2. Si existe token, se consulta:

```http
GET /api/auth/me
```

3. Si el token es valido, se restaura el usuario.
4. Si el token es invalido, se limpia la sesion.

Cuando el backend responde `401`, el interceptor de Axios:

- elimina token y usuario del storage;
- dispara un evento interno de no autorizado;
- redirige a `/login`.

## 9. Axios y cliente HTTP

El cliente HTTP centralizado esta en:

```text
src/shared/services/apiClient.ts
```

Responsabilidades:

- definir `baseURL` desde variables de entorno;
- establecer `Content-Type: application/json`;
- adjuntar `Authorization` si existe token;
- manejar respuestas `401`;
- propagar errores para que las paginas los muestren.

El helper `unwrapApiData` adapta respuestas del backend con formato:

```json
{
  "success": true,
  "message": "Operacion realizada correctamente",
  "data": {}
}
```

## 10. Manejo de permisos

Los permisos se validan desde:

```text
src/shared/utils/permissions.ts
```

Funciones disponibles:

- `hasPermission(user, permission)`
- `hasRole(user, role)`
- `isAdmin(user)`
- `can(user, permission)`

La funcion `can` permite acceso si el usuario tiene el permiso requerido o rol `ADMIN`.

Ejemplos de permisos usados:

```text
PRODUCTO_VER
PRODUCTO_CREAR
PROVEEDOR_VER
ALMACEN_VER
STOCK_VER
KARDEX_VER
REPORTE_VER
USUARIO_ADMIN
```

## 11. Layout general

El layout principal esta compuesto por:

- `MainLayout`: contenedor general y `Outlet`.
- `Sidebar`: navegacion lateral por grupos.
- `Header`: usuario autenticado y accion de cierre de sesion.

El diseño usa fondo gris claro, tarjetas blancas, sidebar oscuro, espaciado amplio e iconos de Lucide React.

## 12. Componentes compartidos

Componentes principales en `src/shared/components`:

- `Card`: contenedor visual reutilizable.
- `PageHeader`: titulo y descripcion de pagina.
- `LoadingScreen`: fallback profesional para lazy loading.

Utilidades compartidas:

- `apiClient`: cliente HTTP.
- `apiResponse`: adaptador de envelope.
- `permissions`: helpers de permisos.
- `storageKeys`: claves de storage y eventos internos.

## 13. Modulos implementados

| Modulo | Estado |
| --- | --- |
| Login | Funcional |
| Dashboard | Funcional |
| Productos | Listado, filtros, crear, editar, activar/desactivar |
| Proveedores | Listado, filtros, crear, editar, activar/desactivar |
| Almacenes | Listado, filtros, crear, editar, activar/desactivar |
| Ubicaciones | Listado, filtros, crear, editar, activar/desactivar |
| Movimientos | Crear borrador, confirmar, anular, detalle |
| Stock | Consulta actual y bajo minimo |
| Kardex | Consulta paginada con filtros |
| Reportes de inventario | Resumen y reportes tabulares |
| Usuarios | Crear, editar, roles, reset password, activar/desactivar |

## 14. Servicios por modulo

Servicios principales:

```text
authService
productoService
categoriaService
marcaService
unidadMedidaService
proveedorService
almacenService
ubicacionService
movimientoService
stockService
kardexService
reporteInventarioService
usuarioService
rolService
permisoService
```

Cada servicio encapsula endpoints REST, transforma respuestas con `unwrapApiData` y normaliza paginas Spring cuando aplica.

## 15. Tipos TypeScript

Cada modulo declara tipos propios en `types/`.

Ejemplos:

- `Producto`
- `Proveedor`
- `Almacen`
- `Ubicacion`
- `Movimiento`
- `StockItem`
- `KardexItem`
- `Usuario`
- `Rol`
- `Permiso`

Tambien se declaran tipos de payload, filtros y respuestas paginadas.

## 16. Validaciones con Zod y React Hook Form

Los formularios usan:

- React Hook Form para estado, errores y submit.
- Zod para esquemas de validacion.
- `@hookform/resolvers/zod` como integracion.

Validaciones implementadas incluyen:

- campos obligatorios;
- email valido;
- cantidades mayores a cero;
- costos no negativos;
- password minimo 8 caracteres;
- seleccion obligatoria de roles;
- reglas por tipo de movimiento.

## 17. Manejo de errores

Cada modulo muestra errores backend en bloques visuales claros.

El patron usual contempla:

- `message` del backend;
- `error` del backend;
- errores de validacion en `data`;
- mensaje de conexion si no hay respuesta.

No se usan `alert` basicos del navegador para errores funcionales.

## 18. Paginacion

Las pantallas de listado usan paginacion basica compatible con Spring Page:

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 10
}
```

El frontend usa controles `Anterior` y `Siguiente`, reinicia pagina al cambiar filtros y muestra el total de registros.

## 19. Lazy loading y optimizacion de bundle

Las paginas protegidas se cargan con `React.lazy` y `Suspense`.

Pagina publica cargada directamente:

```text
/login
```

Paginas lazy:

```text
Dashboard
Productos
Proveedores
Almacenes
Ubicaciones
Movimientos
Stock
Kardex
Reportes
Usuarios
```

Resultado observado tras optimizacion:

- chunk principal bajo aproximadamente de `594.85 kB` a `420.44 kB`;
- desaparecio el warning de chunk mayor a `500 kB`;
- cada modulo funcional queda separado en su propio chunk.

## 20. Variables de entorno

Configuracion actual:

```text
src/app/config/env.ts
```

Variable soportada:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Ejemplo de `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Ejemplo para produccion:

```env
VITE_API_BASE_URL=https://api.erp-almacen.com
```

Nota: las variables expuestas al frontend con Vite deben iniciar con `VITE_`.

## 21. Comandos de ejecucion

Instalar dependencias:

```bash
npm install
```

Ejecutar entorno local:

```bash
npm run dev
```

Abrir:

```text
http://localhost:5173
```

## 22. Comandos de build y lint

Compilar para produccion:

```bash
npm run build
```

Ejecutar lint:

```bash
npm run lint
```

Previsualizar build:

```bash
npm run preview
```

## 23. Flujo funcional principal

1. Usuario ingresa a `/login`.
2. Se autentica contra `/api/auth/login`.
3. El token JWT se guarda en `localStorage`.
4. El usuario entra a `/dashboard`.
5. Las rutas protegidas quedan disponibles segun permisos.
6. Axios agrega el token en cada request.
7. Si el token vence o es invalido, se limpia sesion y se redirige a `/login`.
8. Los modulos consumen servicios REST, muestran tablas, filtros, modales, estados de carga y errores.

## 24. Buenas practicas aplicadas

- Separacion por modulos funcionales.
- Cliente HTTP centralizado.
- Manejo uniforme de envelope backend.
- Validaciones declarativas con Zod.
- Formularios controlados con React Hook Form.
- Rutas protegidas.
- Lazy loading por modulo.
- Tipos TypeScript por dominio.
- Permisos en UI.
- Mensajes de error visibles.
- No acoplar frontend al backend como monolito.
- Componentes compartidos para layout y estados comunes.

## 25. Deuda tecnica y mejoras futuras

Recomendaciones detectadas:

- Crear componentes compartidos para tablas, paginacion, confirmaciones y badges de estado.
- Centralizar normalizacion de paginas Spring para evitar duplicacion en servicios.
- Evaluar refresh token o estrategia de renovacion de sesion.
- Evaluar mover tokens a cookies HttpOnly si el backend lo soporta.
- Agregar pruebas unitarias y pruebas E2E para flujos criticos.
- Agregar manejo global de notificaciones tipo toast.
- Agregar Error Boundary para fallos inesperados por modulo.
- Revisar accesibilidad de modales, foco y navegacion por teclado.
- Configurar variables de entorno por ambiente.
- Preparar Dockerfile o pipeline CI/CD.

## 26. Checklist antes de despliegue

- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.
- Validar `VITE_API_BASE_URL` del ambiente.
- Validar CORS en backend para el dominio frontend.
- Validar expiracion y seguridad del JWT.
- Validar rutas protegidas con usuario sin permisos.
- Validar login y logout.
- Validar recarga en rutas protegidas.
- Validar operaciones CRUD principales.
- Validar que `/dist` se sirva con fallback a `index.html`.
- Configurar HTTPS.
- Configurar headers de seguridad en servidor web.
- Revisar source maps segun politica del ambiente.

## 27. Proximas fases recomendadas

1. Documentacion general del sistema completo frontend/backend.
2. Preparacion de despliegue frontend.
3. Dockerizacion del frontend.
4. Configuracion de CI/CD.
5. Pruebas automatizadas E2E.
6. Mejoras de UX transversales: toast, tabla reutilizable, confirm modal generico.
7. Exportaciones PDF/Excel para reportes.
8. Observabilidad frontend: logging controlado y metricas.

