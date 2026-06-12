import { Search } from 'lucide-react'

export type EstadoFamiliaFilter = 'todos' | 'activos' | 'inactivos'

type FamiliaFiltersProps = {
  texto: string
  estado: EstadoFamiliaFilter
  onEstadoChange: (estado: EstadoFamiliaFilter) => void
  onTextoChange: (texto: string) => void
}

export function FamiliaFilters({
  estado,
  onEstadoChange,
  onTextoChange,
  texto,
}: FamiliaFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
        <span className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
          <Search size={18} className="text-slate-400" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => onTextoChange(event.target.value)}
            placeholder="Nombre o descripcion"
            type="search"
            value={texto}
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onEstadoChange(event.target.value as EstadoFamiliaFilter)}
          value={estado}
        >
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </label>
    </div>
  )
}
