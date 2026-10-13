import { Search } from 'lucide-react'
import {
  ESTADOS_MOVIMIENTO,
  TIPOS_MOVIMIENTO,
  type EstadoMovimiento,
  type TipoMovimiento,
} from '../types/movimiento.types'
import { formatMovimientoLabel } from '../utils/movimientoLabels'

type MovimientoFiltersProps = {
  texto: string
  tipoMovimiento: TipoMovimiento | ''
  estado: EstadoMovimiento | ''
  onEstadoChange: (estado: EstadoMovimiento | '') => void
  onTextoChange: (texto: string) => void
  onTipoMovimientoChange: (tipoMovimiento: TipoMovimiento | '') => void
}

export function MovimientoFilters({
  estado,
  onEstadoChange,
  onTextoChange,
  onTipoMovimientoChange,
  texto,
  tipoMovimiento,
}: MovimientoFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px_220px]">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
        <span className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
          <Search size={18} className="text-slate-400" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => onTextoChange(event.target.value)}
            placeholder="Numero, producto, documento, proveedor, personal u observacion"
            type="search"
            value={texto}
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Tipo</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onTipoMovimientoChange(event.target.value as TipoMovimiento | '')}
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

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
    </div>
  )
}
