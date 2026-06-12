# Notas de despliegue frontend ERP Almacen

## Build de produccion

Generar build:

```bash
npm run build
```

Salida esperada:

```text
dist/
```

Previsualizar localmente:

```bash
npm run preview
```

## Variables de entorno

Crear archivo `.env.production` o configurar variables en el entorno de CI/CD:

```env
VITE_API_BASE_URL=https://api.erp-almacen.com
```

Para local:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Servidor web

El frontend es una SPA. El servidor web debe servir `index.html` para rutas internas.

Ejemplo de regla conceptual:

```text
Si no existe archivo fisico, responder /index.html
```

Esto evita errores 404 al recargar rutas como:

```text
/productos
/inventario/movimientos
/usuarios
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
- Revisar politica de expiracion de JWT.
- Evaluar cookies HttpOnly para token si el backend lo soporta.
- Configurar headers de seguridad en servidor web.
- Evitar exponer source maps en produccion si la politica del proyecto lo requiere.
- Revisar permisos de usuarios antes de liberar ambientes productivos.

## Checklist de despliegue

- `npm install` ejecutado.
- `npm run lint` sin errores.
- `npm run build` sin errores.
- `VITE_API_BASE_URL` apunta al backend correcto.
- Backend responde health/API desde el dominio frontend.
- CORS configurado.
- Login validado.
- Recarga en rutas protegidas validada.
- Logout validado.
- Usuario sin permisos validado.
- Rutas SPA servidas con fallback a `index.html`.

## Recomendaciones CI/CD

Pipeline sugerido:

```text
install -> lint -> build -> publish dist
```

Comandos:

```bash
npm ci
npm run lint
npm run build
```

## Monitoreo posterior

Despues de desplegar:

- revisar errores de consola del navegador;
- validar tiempos de carga inicial;
- validar llamadas 401/403;
- validar expiracion de sesion;
- validar modulos criticos: login, productos, movimientos, stock, usuarios.

