# Rutas del frontend ERP Almacen

## Resumen

El frontend usa React Router. La ruta `/login` es publica. El resto de rutas se renderiza dentro de `MainLayout` y pasa por `ProtectedRoute`.

## Ruta publica

| Ruta | Pagina | Descripcion |
| --- | --- | --- |
| `/login` | `LoginPage` | Autenticacion JWT |

## Rutas protegidas

| Ruta | Pagina | Modulo |
| --- | --- | --- |
| `/` | `Navigate` | Redirige a `/reportes/inventario` |
| `/dashboard` | `Navigate` | Redirige a `/reportes/inventario` |
| `/productos` | `ProductosPage` | Productos |
| `/familias` | `FamiliasPage` | Familias y subfamilias |
| `/subfamilias` | `Navigate` | Redirige a `/familias` |
| `/tipos-articulo` | `TiposArticuloPage` | Tipos de articulo |
| `/marcas` | `MarcasPage` | Marcas |
| `/proveedores` | `ProveedoresPage` | Proveedores |
| `/almacenes` | `AlmacenesPage` | Almacenes |
| `/ubicaciones` | `UbicacionesPage` | Ubicaciones |
| `/inventario/movimientos` | `MovimientosPage` | Movimientos de inventario |
| `/inventario/stock` | `StockPage` | Stock actual |
| `/inventario/kardex` | `KardexPage` | Kardex |
| `/reportes/inventario` | `ReportesInventarioPage` | Reportes de inventario |
| `/usuarios` | `UsuariosPage` | Usuarios y administracion |
| `/personal` | `PersonalPage` | Mantenedor de personal |

## Fallback

| Ruta | Comportamiento |
| --- | --- |
| `*` | Redirige a `/reportes/inventario` |

## Lazy loading

Las paginas protegidas se cargan con `React.lazy` y `Suspense`. El fallback visual es `LoadingScreen`.

## Permisos relevantes por ruta

| Ruta | Permiso principal |
| --- | --- |
| `/productos` | `PRODUCTO_VER` o `ADMIN` |
| `/familias` | `PRODUCTO_VER` o `ADMIN` |
| `/tipos-articulo` | `PRODUCTO_VER` o `ADMIN` |
| `/marcas` | `PRODUCTO_VER` o `ADMIN` |
| `/proveedores` | `PROVEEDOR_VER` o `ADMIN` |
| `/almacenes` | `ALMACEN_VER` o `ADMIN` |
| `/ubicaciones` | `ALMACEN_VER` o `ADMIN` |
| `/inventario/stock` | `STOCK_VER` o `ADMIN` |
| `/inventario/kardex` | `KARDEX_VER` o `ADMIN` |
| `/usuarios` | `USUARIO_ADMIN` o `ADMIN` |
| `/personal` | `USUARIO_ADMIN` o `ADMIN` |

## Requisitos de servidor web

En produccion, el servidor que sirve `dist/` debe responder `index.html` para rutas SPA internas.

Ejemplo:

```text
/productos                  -> index.html
/inventario/movimientos     -> index.html
/reportes/inventario        -> index.html
/personal                   -> index.html
```
