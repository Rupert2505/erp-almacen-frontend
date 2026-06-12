# Rutas del frontend ERP Almacen

## Resumen

El frontend usa React Router con una ruta publica y rutas protegidas. Las rutas protegidas se renderizan dentro de `MainLayout` y pasan por `ProtectedRoute`.

## Ruta publica

| Ruta | Pagina | Descripcion |
| --- | --- | --- |
| `/login` | `LoginPage` | Autenticacion de usuario |

## Rutas protegidas

| Ruta | Pagina | Modulo |
| --- | --- | --- |
| `/` | Redirect | Redirige a `/dashboard` |
| `/dashboard` | `DashboardPage` | Dashboard |
| `/productos` | `ProductosPage` | Productos |
| `/proveedores` | `ProveedoresPage` | Proveedores |
| `/almacenes` | `AlmacenesPage` | Almacenes |
| `/ubicaciones` | `UbicacionesPage` | Ubicaciones |
| `/inventario/movimientos` | `MovimientosPage` | Movimientos de inventario |
| `/inventario/stock` | `StockPage` | Stock |
| `/inventario/kardex` | `KardexPage` | Kardex |
| `/reportes/inventario` | `ReportesInventarioPage` | Reportes de inventario |
| `/usuarios` | `UsuariosPage` | Usuarios y administracion |

## Fallback

| Ruta | Comportamiento |
| --- | --- |
| `*` | Redirige a `/dashboard` |

## Lazy loading

Las rutas protegidas cargan sus paginas con `React.lazy`. El fallback visual es `LoadingScreen`.

## Requisitos de servidor web

En produccion, el servidor que sirva el build debe redirigir rutas SPA a `index.html`.

Ejemplo conceptual:

```text
/productos -> index.html
/inventario/stock -> index.html
/reportes/inventario -> index.html
```

