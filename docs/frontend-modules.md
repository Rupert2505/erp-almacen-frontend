# Modulos del frontend ERP Almacen

## Auth

Responsabilidades:

- Login JWT.
- Persistencia de token y usuario.
- Restauracion de sesion con `/api/auth/me`.
- Logout.
- Limpieza de sesion ante `401`.

Archivos clave:

```text
src/features/auth/
```

## Dashboard

El modulo se conserva en el codigo, pero esta oculto en la navegacion. La ruta `/dashboard` redirige al reporte de inventario.

## Productos

Funciones:

- Listado paginado.
- Busqueda por texto, incluyendo codigo autogenerado.
- Crear y editar productos.
- Activar y desactivar.
- Codigo automatico por familia.
- Vista previa de codigo con `/api/productos/siguiente-codigo?familiaId=`.
- Codigo solo lectura en crear/editar.
- Familia obligatoria.
- Tipo de articulo obligatorio.
- Unidad de medida obligatoria.
- Subfamilia y marca opcionales.
- Creacion rapida de catalogos desde el modal cuando aplica.

Servicios:

```text
productoService
unidadMedidaService
```

## Familias y Subfamilias

Funciones:

- Listar familias.
- Crear/editar familia.
- Prefijo obligatorio de familia.
- Activar/desactivar familia.
- Seleccionar familia y gestionar subfamilias.
- Crear/editar subfamilia.
- Activar/desactivar subfamilia.

Servicios:

```text
familiaService
subfamiliaService
```

## Tipos de articulo

Funciones:

- Listar tipos de articulo.
- Buscar por codigo, nombre o descripcion.
- Crear/editar.
- Activar/desactivar.
- Usar como clasificador obligatorio en producto.

Servicio:

```text
tipoArticuloService
```

## Marcas

Funciones:

- Listar marcas.
- Buscar y filtrar por estado.
- Crear/editar.
- Activar/desactivar.
- Asociar opcionalmente a productos.

Servicio:

```text
marcaService
```

## Proveedores

Funciones:

- Listar proveedores.
- Buscar por documento, razon social o nombre comercial.
- Crear/editar.
- Activar/desactivar.
- Validar email.
- Mantener telefono sin transformacion.

Servicio:

```text
proveedorService
```

## Almacenes y Ubicaciones

Funciones:

- Gestionar almacenes.
- Gestionar ubicaciones.
- Filtrar ubicaciones por almacen.
- Activar/desactivar.
- Navegar de almacen a ubicaciones.

Servicios:

```text
almacenService
ubicacionService
```

## Movimientos de inventario

Funciones:

- Listado paginado y filtros.
- Busqueda por texto.
- Crear movimiento en borrador.
- Guardar y confirmar en una sola accion.
- Confirmar movimiento.
- Cancelar movimiento en borrador.
- Anular movimiento confirmado con motivo.
- Ver detalle.
- Reglas visuales por tipo de movimiento.
- Autocomplete de producto y proveedor.
- Costo unitario editable solo cuando corresponde.
- Costo actual de salida como dato de inventario, no precio de venta.
- Manejo de `409 CONFLICT` por concurrencia/datos.

Servicio:

```text
movimientoService
```

## Stock

Funciones:

- Consultar stock actual.
- Filtrar por texto, producto, almacen y ubicacion.
- Consultar solo registros con stock.
- Consultar stock bajo minimo.
- Mostrar costo promedio y estado visual.

Servicio:

```text
stockService
```

## Kardex

Funciones:

- Consultar kardex general.
- Filtrar por producto, almacen, ubicacion, tipo de movimiento y fechas.
- Mostrar entradas, salidas, saldo anterior y saldo final.

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
- Filtros por fechas, producto y almacen.

Servicio:

```text
reporteInventarioService
```

## Usuarios y administracion

Funciones:

- Listar usuarios.
- Crear usuario.
- Editar usuario.
- Cambiar roles.
- Resetear password.
- Activar/desactivar.
- Ver detalle con roles y permisos.
- Username y password conservan mayusculas/minusculas originales.
- Email se normaliza a minusculas.

Servicios:

```text
usuarioService
rolService
permisoService
```

## Personal

Funciones:

- Listar personal.
- Buscar por texto.
- Filtrar por estado.
- Crear/editar.
- Activar/desactivar.
- Validar documento, nombres y email opcional.
- Campos de negocio en mayusculas.
- Email en minusculas.
- Telefono sin transformacion.

Servicio:

```text
personalService
```

## Normalizacion transversal de texto

Se aplica de dos formas:

- Visualmente, con `useUppercaseTextInputs`.
- Antes de enviar payloads, con `textNormalization`.

Reglas:

- Campos de negocio: mayusculas.
- Emails: minusculas.
- Telefonos: sin transformacion.
- Usernames, passwords y tokens: sin transformacion.
- Observaciones de movimientos no se normalizan como regla operativa general.

## Pruebas automatizadas

El proyecto cuenta con Vitest y Testing Library para pruebas de:

- servicios Axios;
- filtros;
- tablas;
- modales;
- reglas de movimientos;
- schemas Zod;
- normalizacion de texto;
- sidebar/rutas/auth.

Comando:

```bash
npm test
```
