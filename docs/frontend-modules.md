# Modulos del frontend ERP Almacen

## Auth

Responsabilidades:

- Login.
- Persistencia de token y usuario.
- Restauracion de sesion con `/api/auth/me`.
- Logout.

Archivos clave:

```text
src/features/auth/
```

## Dashboard

Pantalla inicial protegida del ERP. Muestra tarjetas y acceso visual al estado general.

## Productos

Funciones:

- Listar productos.
- Buscar y filtrar por estado.
- Crear y editar.
- Activar y desactivar.
- Cargar categorias, marcas y unidades de medida.

Servicios:

```text
productoService
categoriaService
marcaService
unidadMedidaService
```

## Proveedores

Funciones:

- Listar proveedores.
- Buscar y filtrar por estado.
- Crear y editar.
- Activar y desactivar.

Servicio:

```text
proveedorService
```

## Almacenes y ubicaciones

Funciones:

- Gestionar almacenes.
- Gestionar ubicaciones.
- Filtrar por texto, estado y almacen.
- Activar y desactivar.

Servicios:

```text
almacenService
ubicacionService
```

## Movimientos de inventario

Funciones:

- Listar movimientos.
- Crear movimiento en borrador.
- Agregar detalles.
- Confirmar movimiento.
- Anular movimiento con motivo.
- Ver detalle.

Servicio:

```text
movimientoService
```

## Stock

Funciones:

- Consultar stock actual.
- Consultar productos bajo minimo.
- Filtrar por producto, almacen, ubicacion y stock.

Servicio:

```text
stockService
```

## Kardex

Funciones:

- Consultar historial de movimientos.
- Filtrar por producto, almacen, ubicacion, tipo y fechas.

Servicio:

```text
kardexService
```

## Reportes de inventario

Funciones:

- Resumen general.
- Movimientos.
- Stock valorizado.
- Entradas por proveedor.
- Salidas.
- Productos bajo minimo.

Servicio:

```text
reporteInventarioService
```

## Usuarios y administracion

Funciones:

- Listar usuarios.
- Crear y editar.
- Activar y desactivar.
- Cambiar roles.
- Resetear password.
- Ver detalle con roles y permisos.

Servicios:

```text
usuarioService
rolService
permisoService
```

