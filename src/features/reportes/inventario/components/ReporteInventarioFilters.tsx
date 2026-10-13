import type { ReactNode } from 'react'
import type { Almacen } from '../../../almacenes/types/almacen.types'
import type { Ubicacion } from '../../../almacenes/types/ubicacion.types'
import { formatUbicacionLabel } from '../../../almacenes/utils/ubicacionLabels'
import type { Familia } from '../../../familias/types/familia.types'
import { ESTADOS_MOVIMIENTO, TIPOS_MOVIMIENTO } from '../../../inventario/movimientos/types/movimiento.types'
import type {
  EstadoMovimiento,
  TipoMovimiento,
} from '../../../inventario/movimientos/types/movimiento.types'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type { Marca } from '../../../marcas/types/marca.types'
import type { Producto } from '../../../productos/types/producto.types'
import type { Proveedor } from '../../../proveedores/types/proveedor.types'
import type { Subfamilia } from '../../../subfamilias/types/subfamilia.types'
import type { TipoArticulo } from '../../../tipos-articulo/types/tipoArticulo.types'
import type { ReporteInventarioTipo } from '../types/reporteInventario.types'
import { reportUsesDateRange } from '../utils/reportDateRange'

type ReporteInventarioFiltersProps = {
  actions?: ReactNode
  reporte: ReporteInventarioTipo
  productos: Producto[]
  almacenes: Almacen[]
  ubicaciones: Ubicacion[]
  familias: Familia[]
  subfamilias: Subfamilia[]
  tiposArticulo: TipoArticulo[]
  marcas: Marca[]
  proveedores: Proveedor[]
  texto: string
  ordenTrabajo: string
  fechaDesde: string
  fechaHasta: string
  productoId: number | null
  almacenId: number | null
  ubicacionId: number | null
  familiaId: number | null
  subfamiliaId: number | null
  tipoArticuloId: number | null
  marcaId: number | null
  proveedorId: number | null
  tipoMovimiento: TipoMovimiento | ''
  estado: EstadoMovimiento | ''
  soloConStock: boolean
  soloBajoMinimo: boolean
  tipoComprobante: string
  onTextoChange: (value: string) => void
  onOrdenTrabajoChange: (value: string) => void
  onFechaDesdeChange: (value: string) => void
  onFechaHastaChange: (value: string) => void
  onProductoChange: (value: number | null) => void
  onAlmacenChange: (value: number | null) => void
  onUbicacionChange: (value: number | null) => void
  onFamiliaChange: (value: number | null) => void
  onSubfamiliaChange: (value: number | null) => void
  onTipoArticuloChange: (value: number | null) => void
  onMarcaChange: (value: number | null) => void
  onProveedorChange: (value: number | null) => void
  onTipoMovimientoChange: (value: TipoMovimiento | '') => void
  onEstadoChange: (value: EstadoMovimiento | '') => void
  onSoloConStockChange: (value: boolean) => void
  onSoloBajoMinimoChange: (value: boolean) => void
  onTipoComprobanteChange: (value: string) => void
  onClear: () => void
  onConsult: () => void
}

function selectNumber(value: string) {
  return value ? Number(value) : null
}

export function ReporteInventarioFilters({
  actions,
  almacenId,
  almacenes,
  estado,
  familiaId,
  familias,
  fechaDesde,
  fechaHasta,
  marcaId,
  marcas,
  onAlmacenChange,
  onClear,
  onConsult,
  onEstadoChange,
  onFamiliaChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onMarcaChange,
  onOrdenTrabajoChange,
  onProductoChange,
  onProveedorChange,
  onSoloBajoMinimoChange,
  onSoloConStockChange,
  onSubfamiliaChange,
  onTextoChange,
  onTipoArticuloChange,
  onTipoComprobanteChange,
  onTipoMovimientoChange,
  onUbicacionChange,
  productoId,
  productos,
  proveedorId,
  proveedores,
  reporte,
  ordenTrabajo,
  soloBajoMinimo,
  soloConStock,
  subfamiliaId,
  subfamilias,
  texto,
  tipoArticuloId,
  tipoComprobante,
  tiposArticulo,
  tipoMovimiento,
  ubicacionId,
  ubicaciones,
}: ReporteInventarioFiltersProps) {
  const showDates = reportUsesDateRange(reporte)
  const showProducto = [
    'movimientos',
    'stock-valorizado',
    'kardex-valorizado',
    'salidas-detalle',
    'entradas-proveedor',
    'salidas-por-os',
  ].includes(reporte)
  const showAlmacen = [
    'movimientos',
    'stock-valorizado',
    'kardex-valorizado',
    'salidas-detalle',
    'entradas-proveedor',
    'productos-bajo-minimo',
  ].includes(reporte)
  const showUbicacion = ['stock-valorizado', 'kardex-valorizado'].includes(reporte)
  const showProveedor = reporte === 'entradas-proveedor'
  const showTipo = ['movimientos', 'salidas-detalle'].includes(reporte)
  const showEstado = ['movimientos', 'salidas-detalle', 'salidas-por-os'].includes(reporte)
  const showSearch = reporte !== 'salidas-por-os'
  const showOrdenTrabajo = reporte === 'salidas-por-os'
  const showSoloConStock = reporte === 'stock-valorizado'
  const showCatalogos = ['stock-valorizado', 'salidas-detalle', 'entradas-proveedor'].includes(
    reporte,
  )
  const showTipoComprobante = reporte === 'entradas-proveedor'

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {showSearch ? (
          <label className="text-sm font-medium text-slate-700">
            Buscar
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              onChange={(event) => onTextoChange(event.target.value)}
              placeholder="Codigo, producto, documento..."
              type="search"
              value={texto}
            />
          </label>
        ) : null}

      {showOrdenTrabajo ? (
        <label className="text-sm font-medium text-slate-700">
          Orden de Servicio (OS)
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onOrdenTrabajoChange(event.target.value)}
            placeholder="Ej. OS-002541"
            type="search"
            value={ordenTrabajo}
          />
        </label>
      ) : null}

      {showDates ? (
        <>
          <label className="text-sm font-medium text-slate-700">
            Fecha desde
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              onChange={(event) => onFechaDesdeChange(event.target.value)}
              type="date"
              value={fechaDesde}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha hasta
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              onChange={(event) => onFechaHastaChange(event.target.value)}
              type="date"
              value={fechaHasta}
            />
          </label>
        </>
      ) : null}

      {showProducto ? (
        <label className="text-sm font-medium text-slate-700">
          Producto
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onProductoChange(selectNumber(event.target.value))}
            value={productoId ?? ''}
          >
            <option value="">Todos</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.codigo} - {producto.nombre}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showAlmacen ? (
        <label className="text-sm font-medium text-slate-700">
          Almacen
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onAlmacenChange(selectNumber(event.target.value))}
            value={almacenId ?? ''}
          >
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.codigo} - {almacen.nombre}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showUbicacion ? (
        <label className="text-sm font-medium text-slate-700">
          Ubicacion
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onUbicacionChange(selectNumber(event.target.value))}
            value={ubicacionId ?? ''}
          >
            <option value="">Todas</option>
            {ubicaciones.map((ubicacion) => (
              <option key={ubicacion.id} value={ubicacion.id}>
                {formatUbicacionLabel(ubicacion)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showProveedor ? (
        <label className="text-sm font-medium text-slate-700">
          Proveedor
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onProveedorChange(selectNumber(event.target.value))}
            value={proveedorId ?? ''}
          >
            <option value="">Todos</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.numeroDocumento} - {proveedor.razonSocial}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showCatalogos ? (
        <>
          <label className="text-sm font-medium text-slate-700">
            Familia
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              onChange={(event) => onFamiliaChange(selectNumber(event.target.value))}
              value={familiaId ?? ''}
            >
              <option value="">Todas</option>
              {familias.map((familia) => (
                <option key={familia.id} value={familia.id}>
                  {familia.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Subfamilia
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              onChange={(event) => onSubfamiliaChange(selectNumber(event.target.value))}
              value={subfamiliaId ?? ''}
            >
              <option value="">Todas</option>
              {subfamilias.map((subfamilia) => (
                <option key={subfamilia.id} value={subfamilia.id}>
                  {subfamilia.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Tipo de articulo
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
              onChange={(event) => onTipoArticuloChange(selectNumber(event.target.value))}
              value={tipoArticuloId ?? ''}
            >
              <option value="">Todos</option>
              {tiposArticulo.map((tipoArticulo) => (
                <option key={tipoArticulo.id} value={tipoArticulo.id}>
                  {tipoArticulo.nombre}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}

      {showCatalogos && reporte === 'stock-valorizado' ? (
        <label className="text-sm font-medium text-slate-700">
          Marca
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onMarcaChange(selectNumber(event.target.value))}
            value={marcaId ?? ''}
          >
            <option value="">Todas</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showTipo ? (
        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) =>
              onTipoMovimientoChange(event.target.value as TipoMovimiento | '')
            }
            value={tipoMovimiento}
          >
            <option value="">Todos</option>
            {TIPOS_MOVIMIENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {formatMovimientoLabel(tipo)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showTipoComprobante ? (
        <label className="text-sm font-medium text-slate-700">
          Tipo comprobante
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onTipoComprobanteChange(event.target.value)}
            value={tipoComprobante}
          >
            <option value="">Todos</option>
            <option value="FACTURA">Factura</option>
            <option value="BOLETA">Boleta</option>
            <option value="OTRO">Otro</option>
          </select>
        </label>
      ) : null}

      {showEstado ? (
        <label className="text-sm font-medium text-slate-700">
          Estado
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onEstadoChange(event.target.value as EstadoMovimiento | '')}
            value={estado}
          >
            <option value="">
              {reporte === 'salidas-por-os' ? 'Confirmado (por defecto)' : 'Todos'}
            </option>
            {ESTADOS_MOVIMIENTO.map((item) => (
              <option key={item} value={item}>
                {formatMovimientoLabel(item)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showSoloConStock ? (
        <label className="flex h-10 items-center gap-2 self-end text-sm font-medium text-slate-700">
          <input
            checked={soloConStock}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
            onChange={(event) => onSoloConStockChange(event.target.checked)}
            type="checkbox"
          />
          Solo con stock
        </label>
      ) : null}

      {showSoloConStock ? (
        <label className="flex h-10 items-center gap-2 self-end text-sm font-medium text-slate-700">
          <input
            checked={soloBajoMinimo}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
            onChange={(event) => onSoloBajoMinimoChange(event.target.checked)}
            type="checkbox"
          />
          Solo bajo minimo
        </label>
      ) : null}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        {actions}
        <button
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onClear}
          type="button"
        >
          Limpiar
        </button>
        <button
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={onConsult}
          type="button"
        >
          Consultar
        </button>
      </div>
    </div>
  )
}
