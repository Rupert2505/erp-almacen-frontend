import { Search } from 'lucide-react'
import type { Almacen } from '../../../almacenes/types/almacen.types'
import type { Ubicacion } from '../../../almacenes/types/ubicacion.types'
import type { Producto } from '../../../productos/types/producto.types'

type StockFiltersProps = {
  almacenes: Almacen[]
  productos: Producto[]
  ubicaciones: Ubicacion[]
  almacenId: number | null
  productoId: number | null
  soloConStock: boolean
  texto: string
  ubicacionId: number | null
  onAlmacenChange: (value: number | null) => void
  onProductoChange: (value: number | null) => void
  onSoloConStockChange: (value: boolean) => void
  onTextoChange: (value: string) => void
  onUbicacionChange: (value: number | null) => void
}

export function StockFilters({
  almacenes,
  almacenId,
  onAlmacenChange,
  onProductoChange,
  onSoloConStockChange,
  onTextoChange,
  onUbicacionChange,
  productos,
  productoId,
  soloConStock,
  texto,
  ubicaciones,
  ubicacionId,
}: StockFiltersProps) {
  const ubicacionesFiltradas = almacenId
    ? ubicaciones.filter((ubicacion) => ubicacion.almacenId === almacenId)
    : ubicaciones

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_260px_240px_240px_160px]">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
        <span className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
          <Search size={18} className="text-slate-400" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => onTextoChange(event.target.value)}
            placeholder="Producto, almacen o ubicacion"
            type="search"
            value={texto}
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Producto</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onProductoChange(event.target.value ? Number(event.target.value) : null)}
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

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Almacen</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onAlmacenChange(event.target.value ? Number(event.target.value) : null)}
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

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Ubicacion</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onUbicacionChange(event.target.value ? Number(event.target.value) : null)}
          value={ubicacionId ?? ''}
        >
          <option value="">Todas</option>
          {ubicacionesFiltradas.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.codigo} - {ubicacion.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-end">
        <span className="flex h-11 w-full items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
          <input
            checked={soloConStock}
            className="h-4 w-4 rounded border-slate-300"
            onChange={(event) => onSoloConStockChange(event.target.checked)}
            type="checkbox"
          />
          Solo con stock
        </span>
      </label>
    </div>
  )
}
