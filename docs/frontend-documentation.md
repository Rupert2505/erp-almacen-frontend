# Documentacion tecnica del frontend ERP Almacen

## 1. Descripcion general

El frontend del ERP Almacen es una aplicacion web desarrollada con React, TypeScript y Vite. Es un proyecto independiente del backend Spring Boot y consume una API REST protegida con JWT mediante el header:

```http
Authorization: Bearer <token>
```

La aplicacion cubre los flujos principales del MVP operativo del almacen: autenticacion, dashboard, catalogos, inventario, stock, kardex, reportes y administracion.

Entornos locales actuales:

```text
Backend:  http://localhost:8080
Frontend: http://localhost:5173
```

## 2. Tecnologias utilizadas

| Tecnologia | Uso |
| --- | --- |
| React 19 | Construccion de interfaz |
| TypeScript | Tipado estatico y contratos frontend |
| Vite | Desarrollo local, build y bundling |
| React Router | Rutas publicas, protegidas y lazy loading |
| Axios | Cliente HTTP centralizado |
| TanStack Query | Cache, loading, refetch y sincronizacion con API |
| React Hook Form | Manejo de formularios |
| Zod | Validacion declarativa de formularios |
| Tailwind CSS | Estilos utilitarios |
| Lucide React | Iconografia |
| Vitest | Pruebas unitarias y de componentes |
| Testing Library | Pruebas de UI |
| ESLint | Revision estatica |

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
  assets/
    logo_ballena_02.png
  layout/
    Header.tsx
    MainLayout.tsx
    Sidebar.tsx
  features/
    auth/
    dashboard/
    productos/
    familias/
    subfamilias/
    tipos-articulo/
    marcas/
    proveedores/
    almacenes/
    inventario/
      movimientos/
      stock/
      kardex/
      pages/
    reportes/
      inventario/
      pages/
    usuarios/
    personal/
  shared/
    components/
    hooks/
    services/
    utils/
  styles/
    globals.css
docs/
  frontend-documentation.md
  frontend-routes.md
  frontend-modules.md
  frontend-deployment-notes.md
```

## 4. Arquitectura frontend

La arquitectura esta organizada por dominio funcional dentro de `src/features`. Cada modulo concentra sus paginas, componentes, servicios, esquemas Zod y tipos TypeScript.

Flujo principal:

```text
Page -> Components -> Services -> apiClient -> Backend REST
```

Responsabilidades por capa:

| Capa | Responsabilidad |
| --- | --- |
| `app` | Providers globales, router y configuracion de entorno |
| `layout` | Layout ERP, header, sidebar y contenedor principal |
| `features` | Modulos funcionales por dominio |
| `shared/components` | Componentes reutilizables |
| `shared/services` | Axios centralizado y helpers de respuesta |
| `shared/hooks` | Hooks globales, como normalizacion visual a mayusculas |
| `shared/utils` | Permisos, storage keys y normalizacion de texto |

## 5. Manejo de rutas

Las rutas estan declaradas en:

```text
src/app/router/AppRouter.tsx
```

La aplicacion usa:

- `BrowserRouter` desde `AppProviders`.
- `ProtectedRoute` para rutas privadas.
- `MainLayout` como contenedor de las rutas autenticadas.
- `React.lazy` y `Suspense` para carga por modulo.
- `LoadingScreen` como fallback de carga.

La ruta raiz `/` redirige a `/reportes/inventario`.

## 6. Rutas publicas y protegidas

Ruta publica:

```text
/login
```

Rutas protegidas:

```text
/dashboard -> redirige a /reportes/inventario
/productos
/familias
/subfamilias -> redirige a /familias
/tipos-articulo
/marcas
/proveedores
/almacenes
/ubicaciones
/inventario/movimientos
/inventario/stock
/inventario/kardex
/reportes/inventario
/usuarios
/personal
```

La ruta comodin `*` redirige a `/reportes/inventario`.

## 7. Autenticacion JWT

El login consume:

```http
POST /api/auth/login
```

El usuario autenticado queda representado por token, datos basicos, roles y permisos. El token se guarda actualmente en `localStorage`.

Al iniciar la aplicacion, si existe token, se consulta:

```http
GET /api/auth/me
```

Si la respuesta es valida, la sesion se restaura. Si no es valida, se limpia el storage.

## 8. Manejo de sesion

La sesion vive en `AuthContext`.

Flujo:

1. Login exitoso guarda token y usuario.
2. Axios adjunta el token en cada request.
3. Rutas privadas leen el estado de autenticacion.
4. Logout limpia token y usuario.
5. Si el backend responde `401`, el interceptor limpia sesion y redirige a `/login`.

Claves de storage:

```text
AUTH_ACCESS_TOKEN_KEY
AUTH_USER_KEY
AUTH_UNAUTHORIZED_EVENT
SIDEBAR_COLLAPSED_KEY
```

## 9. Axios y cliente HTTP

Cliente centralizado:

```text
src/shared/services/apiClient.ts
```

Responsabilidades:

- usar `VITE_API_BASE_URL`;
- enviar `Content-Type: application/json`;
- adjuntar `Authorization: Bearer <token>`;
- manejar `401`;
- propagar errores de negocio para que cada pantalla los muestre claramente.

El backend suele responder con envelope:

```json
{
  "success": true,
  "message": "Operacion realizada correctamente",
  "data": {}
}
```

El helper `unwrapApiData` devuelve `data` cuando la respuesta viene envuelta.

## 10. Manejo de permisos

Helpers:

```text
src/shared/utils/permissions.ts
```

Funciones:

```text
hasPermission(user, permission)
hasRole(user, role)
isAdmin(user)
can(user, permission)
```

`can` permite acceso si el usuario tiene el permiso requerido o rol `ADMIN`.

Permisos relevantes:

| Area | Permisos |
| --- | --- |
| Productos/catalogos | `PRODUCTO_VER`, `PRODUCTO_CREAR`, `PRODUCTO_EDITAR`, `PRODUCTO_DESACTIVAR` |
| Proveedores | `PROVEEDOR_VER`, `PROVEEDOR_CREAR` |
| Almacenes/ubicaciones | `ALMACEN_VER`, `USUARIO_ADMIN` |
| Inventario | `INVENTARIO_ENTRADA`, `INVENTARIO_SALIDA`, `INVENTARIO_TRANSFERENCIA`, `INVENTARIO_AJUSTE` |
| Stock/Kardex | `STOCK_VER`, `KARDEX_VER` |
| Reportes | `REPORTE_VER` |
| Usuarios/Personal | `USUARIO_ADMIN` |

## 11. Layout general

Componentes:

- `MainLayout`: define sidebar, header y `Outlet`.
- `Sidebar`: menu lateral agrupado por dominio.
- `Header`: usuario autenticado, acciones de sesion y control movil.

El sidebar es contraible, conserva preferencia en `localStorage` y muestra solo iconos cuando esta contraido.

El login usa el logo `logo_ballena_02` dentro de una composicion visual sobria, con el formulario separado en una columna clara.

## 12. Componentes y utilidades compartidas

Componentes:

- `Card`
- `PageHeader`
- `LoadingScreen`
- `SearchableSelect`

Hooks:

- `useUppercaseTextInputs`: transforma visualmente campos editables de texto a mayusculas. Respeta `readOnly`, `disabled`, `data-preserve-case`, `email`, `password`, `number`, `date`, `search` y `tel`.

Utilidades:

- `permissions`
- `storageKeys`
- `textNormalization`

Normalizacion de texto:

```text
normalizeBusinessText(value)       -> mayusculas + trim
normalizeOptionalBusinessText(...) -> mayusculas + trim o null
normalizeEmail(value)              -> minusculas + trim
normalizeOptionalEmail(...)        -> minusculas + trim o null
normalizePhone(...)                -> trim sin cambiar caracteres
```

## 13. Modulos implementados

| Modulo | Estado |
| --- | --- |
| Login | Funcional con JWT, logo y restauracion de sesion |
| Dashboard | Funcional |
| Productos | CRUD, filtros, activacion, codigo automatico, familia, subfamilia, tipo de articulo, marca y unidad |
| Familias y Subfamilias | CRUD, prefijo obligatorio de familia, activacion/desactivacion |
| Tipos de articulo | CRUD y asociacion a producto |
| Marcas | CRUD y asociacion a producto |
| Proveedores | CRUD con validaciones |
| Almacenes | CRUD y acceso a ubicaciones |
| Ubicaciones | CRUD, filtro por almacen |
| Movimientos | Listado, filtros, crear borrador, guardar y confirmar, confirmar, cancelar, anular, detalle |
| Stock | Consulta actual, bajo minimo, filtros y costo promedio |
| Kardex | Consulta con filtros por producto, almacen, ubicacion, tipo y fechas |
| Reportes de inventario | Resumen, stock valorizado, movimientos, entradas, salidas y bajo minimo |
| Usuarios | CRUD, roles, reset password, detalle y permisos |
| Personal | CRUD administrativo con permisos `USUARIO_ADMIN` o `ADMIN` |

## 14. Servicios por modulo

Servicios principales:

```text
authService
productoService
familiaService
subfamiliaService
tipoArticuloService
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
personalService
```

Cada servicio:

- encapsula endpoints REST;
- usa `apiClient`;
- transforma envelope con `unwrapApiData`;
- normaliza paginas Spring cuando el backend responde `Page`;
- expone mensajes de error por modulo cuando aplica.

## 15. Tipos TypeScript

Los tipos estan separados por modulo en carpetas `types`.

Ejemplos:

```text
Producto
Familia
Subfamilia
TipoArticulo
Marca
Proveedor
Almacen
Ubicacion
Movimiento
StockItem
KardexItem
ReporteInventario
Usuario
Rol
Permiso
Personal
```

Tambien se definen:

- payloads de create/update;
- filtros por pantalla;
- `PageResponse<T>`;
- tipos de estado y acciones de UI.

## 16. Validaciones con Zod y React Hook Form

Cada formulario relevante usa React Hook Form con `zodResolver`.

Reglas destacadas:

- campos obligatorios por catalogo;
- email valido;
- password minimo 8 caracteres;
- seleccion obligatoria de roles;
- cantidad mayor a cero;
- costos y gastos no negativos;
- fecha de recepcion no menor que fecha de pedido;
- serie y numero de documento deben informarse juntos cuando aplica;
- `ENTRADA_COMPRA` exige proveedor, almacen destino, fecha recepcion y costo unitario;
- salidas y transferencias no exigen costo unitario manual;
- familia exige prefijo obligatorio, maximo 20 caracteres y solo letras/numeros;
- producto exige familia, tipo de articulo y unidad de medida.

## 17. Manejo de errores

Patron por modulo:

1. Priorizar `message` del backend.
2. Si no existe, usar `error`.
3. Si `data` contiene errores de validacion, unirlos en un mensaje claro.
4. Si no hay respuesta, mostrar mensaje de conexion/CORS/backend apagado.
5. Mantener modales abiertos cuando falla guardar.

Movimientos contempla `409 CONFLICT` para concurrencia o conflicto de datos. El mensaje esperado es:

```text
El registro fue modificado por otro usuario. Actualice la informacion e intente nuevamente.
```

Luego de conflictos en movimientos, se refrescan datos cuando el flujo actual lo permite.

## 18. Paginacion

Las tablas usan paginacion compatible con Spring Page:

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 10
}
```

El patron de UI incluye:

- total de registros;
- botones `Anterior` y `Siguiente`;
- reinicio a pagina 0 al cambiar filtros;
- loading durante consultas.

## 19. Lazy loading y optimizacion de bundle

Las paginas protegidas se cargan con `React.lazy` y `Suspense`.

Rutas lazy actuales:

```text
Dashboard
Productos
Familias
Tipos de articulo
Marcas
Proveedores
Almacenes
Ubicaciones
Movimientos
Stock
Kardex
Reportes
Usuarios
Personal
```

La carga modular redujo el chunk inicial y mantiene cada modulo separado.

## 20. Variables de entorno

Archivo de configuracion:

```text
src/app/config/env.ts
```

Variable principal:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Ejemplo `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Ejemplo produccion:

```env
VITE_API_BASE_URL=https://api.erp-almacen.com
```

## 21. Comandos de ejecucion

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Abrir:

```text
http://localhost:5173
```

## 22. Comandos de build, lint y tests

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Tests:

```bash
npm test
```

Preview:

```bash
npm run preview
```

## 23. Flujo funcional principal

1. Usuario ingresa a `/login`.
2. Se autentica con usuario/password.
3. El token JWT se guarda en `localStorage`.
4. Se redirige a `/reportes/inventario`.
5. El sidebar muestra modulos segun permisos.
6. Las pantallas consultan backend con TanStack Query.
7. Los formularios validan con Zod.
8. Los servicios consumen API con Axios.
9. Si hay `401`, se limpia sesion y se redirige a `/login`.
10. Al recargar, `/api/auth/me` restaura la sesion si el token sigue valido.

## 24. Buenas practicas aplicadas

- Proyecto frontend separado del backend.
- Separacion por dominio funcional.
- Cliente HTTP centralizado.
- Rutas protegidas.
- Permisos visibles en UI.
- Lazy loading por modulo.
- Validaciones declarativas.
- Servicios y tipos por modulo.
- Normalizacion de texto centralizada.
- Manejo claro de errores de backend.
- Tests unitarios y de componentes para flujos criticos.
- No uso de `alert` basico para flujos funcionales.
- Diseño ERP sobrio, consistente y responsivo.

## 25. Deuda tecnica y mejoras futuras

- Crear tabla reutilizable generica para reducir duplicacion visual.
- Centralizar paginacion en un componente compartido.
- Crear confirmacion modal generica reutilizable.
- Agregar sistema de toast global.
- Evaluar Error Boundary por modulo.
- Evaluar refresh token o cookies HttpOnly si backend lo soporta.
- Agregar pruebas E2E cuando el MVP este estable.
- Revisar accesibilidad de modales y foco.
- Documentar contratos de API por modulo.
- Preparar Dockerfile y pipeline CI/CD.
- Separar configuraciones por ambiente.

## 26. Checklist antes de despliegue

- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.
- Ejecutar `npm test`.
- Validar `VITE_API_BASE_URL`.
- Validar CORS del backend.
- Validar login/logout.
- Validar recarga en rutas protegidas.
- Validar permisos con usuario no admin.
- Validar CRUD de catalogos principales.
- Validar movimientos: borrador, confirmar, cancelar y anular.
- Validar stock, kardex y reportes.
- Validar que el servidor web haga fallback a `index.html`.
- Configurar HTTPS.
- Revisar politica de source maps.
- Revisar headers de seguridad.

## 27. Proximas fases recomendadas

1. Documentacion general frontend/backend.
2. Preparacion de despliegue.
3. Dockerizacion del frontend.
4. Pipeline CI/CD.
5. Migracion de datos reales.
6. Pruebas E2E con datos productivos.
7. Exportaciones PDF/Excel.
8. Observabilidad frontend.
9. Mejoras transversales de UX.
