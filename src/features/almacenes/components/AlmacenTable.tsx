import { CheckCircle2, Edit, MapPinned, PowerOff } from 'lucide-react'
import type { Almacen } from '../types/almacen.types'

type AlmacenTableProps = {
  almacenes: Almacen[]
  canManage: boolean
  isLoading: boolean
  toggleLoadingId?: number | null
  onActivar: (almacen: Almacen) => void
  onDesactivar: (almacen: Almacen) => void
  onEdit: (almacen: Almacen) => void
  onVerUbicaciones: (almacen: Almacen) => void
}

export function AlmacenTable({
  almacenes,
  canManage,
  isLoading,
  onActivar,
  onDesactivar,
  onEdit,
  onVerUbicaciones,
  toggleLoadingId,
}: AlmacenTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Direccion</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Cargando almacenes...
                </td>
              </tr>
            ) : null}

            {!isLoading && almacenes.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  No se encontraron almacenes.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? almacenes.map((almacen) => {
                  const isToggleLoading = toggleLoadingId === almacen.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={almacen.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {almacen.codigo}
                      </td>
                      <td className="min-w-56 px-4 py-3 text-slate-900">{almacen.nombre}</td>
                      <td className="min-w-64 px-4 py-3 text-slate-600">
                        {almacen.direccion ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {almacen.responsable ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            almacen.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {almacen.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                            onClick={() => onVerUbicaciones(almacen)}
                            type="button"
                          >
                            <MapPinned size={16} />
                            Ubicaciones
                          </button>

                          {canManage ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              onClick={() => onEdit(almacen)}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}

                          {canManage && almacen.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onDesactivar(almacen)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}

                          {canManage && !almacen.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onActivar(almacen)}
                              type="button"
                            >
                              <CheckCircle2 size={16} />
                              Activar
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
