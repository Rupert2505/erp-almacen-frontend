import type { Almacen } from '../../../almacenes/types/almacen.types'
import { ESTADOS_MOVIMIENTO, TIPOS_MOVIMIENTO } from '../../../inventario/movimientos/types/movimiento.types'
import type {
  EstadoMovimiento,
  TipoMovimiento,
} from '../../../inventario/movimientos/types/movimiento.types'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type { Producto } from '../../../productos/types/producto.types'
import type { Proveedor } from '../../../proveedores/types/proveedor.types'
import type { ReporteInventarioTipo } from '../types/reporteInventario.types'

type ReporteInventarioFiltersProps = {
  reporte: ReporteInventarioTipo
  productos: Producto[]
  almacenes: Almacen[]
  proveedores: Proveedor[]
  fechaDesde: string
  fechaHasta: string
  productoId: number | null
  almacenId: number | null
  proveedorId: number | null
  tipoMovimiento: TipoMovimiento | ''
  estado: EstadoMovimiento | ''
  soloConStock: boolean
  onFechaDesdeChange: (value: string) => void
  onFechaHastaChange: (value: string) => void
  onProductoChange: (value: number | null) => void
  onAlmacenChange: (value: number | null) => void
  onProveedorChange: (value: number | null) => void
  onTipoMovimientoChange: (value: TipoMovimiento | '') => void
  onEstadoChange: (value: EstadoMovimiento | '') => void
  onSoloConStockChange: (value: boolean) => void
}

function selectNumber(value: string) {
  return value ? Number(value) : null
}

export function ReporteInventarioFilters({
  almacenId,
  almacenes,
  estado,
  fechaDesde,
  fechaHasta,
  onAlmacenChange,
  onEstadoChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onProductoChange,
  onProveedorChange,
  onSoloConStockChange,
  onTipoMovimientoChange,
  productoId,
  productos,
  proveedorId,
  proveedores,
  reporte,
  soloConStock,
  tipoMovimiento,
}: ReporteInventarioFiltersProps) {
  const showDates = ['movimientos', 'entradas-proveedor', 'salidas'].includes(reporte)
  const showProducto = ['movimientos', 'stock-valorizado', 'salidas'].includes(reporte)
  const showAlmacen = [
    'movimientos',
    'stock-valorizado',
    'salidas',
    'productos-bajo-minimo',
  ].includes(reporte)
  const showProveedor = reporte === 'entradas-proveedor'
  const showTipo = ['movimientos', 'salidas'].includes(reporte)
  const showEstado = reporte === 'movimientos'
  const showSoloConStock = reporte === 'stock-valorizado'

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      {showEstado ? (
        <label className="text-sm font-medium text-slate-700">
          Estado
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            onChange={(event) => onEstadoChange(event.target.value as EstadoMovimiento | '')}
            value={estado}
          >
            <option value="">Todos</option>
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
    </div>
  )
}
