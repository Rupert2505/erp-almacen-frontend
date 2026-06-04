import { Search } from 'lucide-react'
import type { Rol } from '../types/rol.types'

export type EstadoUsuarioFilter = 'todos' | 'activos' | 'inactivos'

type UsuarioFiltersProps = {
  texto: string
  estado: EstadoUsuarioFilter
  rolId: number | null
  roles: Rol[]
  onEstadoChange: (estado: EstadoUsuarioFilter) => void
  onRolChange: (rolId: number | null) => void
  onTextoChange: (texto: string) => void
}

export function UsuarioFilters({
  estado,
  onEstadoChange,
  onRolChange,
  onTextoChange,
  rolId,
  roles,
  texto,
}: UsuarioFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px_240px]">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Buscar</span>
        <span className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
          <Search size={18} className="text-slate-400" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            onChange={(event) => onTextoChange(event.target.value)}
            placeholder="Username, nombres, apellidos o email"
            type="search"
            value={texto}
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Estado</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onEstadoChange(event.target.value as EstadoUsuarioFilter)}
          value={estado}
        >
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Rol</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          onChange={(event) => onRolChange(event.target.value ? Number(event.target.value) : null)}
          value={rolId ?? ''}
        >
          <option value="">Todos</option>
          {roles.map((rol) => (
            <option key={rol.id} value={rol.id}>
              {rol.nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
