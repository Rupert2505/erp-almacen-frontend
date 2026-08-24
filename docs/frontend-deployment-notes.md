# Notas de despliegue frontend ERP Almacen

## Build de produccion

Generar build:

```bash
npm run build
```

Salida:

```text
dist/
```

Previsualizar build:

```bash
npm run preview
```

## Variables de entorno

Local:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Produccion:

```env
VITE_API_BASE_URL=https://api.erp-almacen.com
```

Las variables expuestas al frontend deben iniciar con `VITE_`.

## Servidor web

El frontend es una SPA. El servidor debe servir `index.html` para rutas internas cuando no exista archivo fisico.

Rutas que deben funcionar al recargar:

```text
/dashboard -> redirige a /reportes/inventario
/productos
/familias
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

## CORS

El backend debe permitir el origen del frontend.

Ejemplos:

```text
http://localhost:5173
https://erp-almacen.com
```

## Seguridad recomendada

- Usar HTTPS en frontend y backend.
- Validar expiracion de JWT.
- Evaluar cookies HttpOnly si el backend lo soporta.
- Configurar headers de seguridad.
- Revisar politica de source maps.
- No exponer variables secretas en el frontend.
- Validar usuarios sin permisos.

## Checklist tecnico previo

```bash
npm install
npm run lint
npm test
npm run build
```

Validaciones funcionales minimas:

- Login admin.
- Restauracion de sesion al recargar.
- Logout.
- Productos con codigo automatico.
- Familias con prefijo.
- Tipos de articulo.
- Proveedores.
- Almacenes y ubicaciones.
- Movimientos: borrador, guardar/confirmar, cancelar, anular.
- Stock.
- Kardex.
- Reportes.
- Usuarios.
- Personal.
- Usuario sin permisos.

## Checklist de infraestructura

- `VITE_API_BASE_URL` apunta al backend correcto.
- Backend responde desde el dominio final.
- CORS configurado.
- Rutas SPA con fallback a `index.html`.
- HTTPS configurado.
- Cache de assets versionados habilitado.
- `index.html` sin cache agresivo.
- Logs de servidor revisados.

## Pipeline CI/CD sugerido

```text
install -> lint -> test -> build -> publish dist
```

Comandos recomendados:

```bash
npm ci
npm run lint
npm test
npm run build
```

## Monitoreo posterior

Despues de desplegar:

- revisar consola del navegador;
- validar respuestas `401`, `403`, `409` y `500`;
- validar tiempos de carga;
- validar modulos criticos con usuario admin;
- validar permisos con usuario limitado;
- validar recarga directa en rutas protegidas;
- revisar llamadas a backend y CORS.

## Pendientes recomendados antes de produccion

- Definir estrategia de refresh token o expiracion de sesion.
- Evaluar cookies HttpOnly.
- Agregar Error Boundary.
- Agregar notificaciones globales tipo toast.
- Agregar pruebas E2E si el alcance de despliegue lo requiere.
- Documentar versionamiento de API.
