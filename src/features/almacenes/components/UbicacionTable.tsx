import { CheckCircle2, Edit, PowerOff } from 'lucide-react'
import type { Ubicacion } from '../types/ubicacion.types'

type UbicacionTableProps = {
  ubicaciones: Ubicacion[]
  canEdit: boolean
  canToggle: boolean
  isLoading: boolean
  actionLoadingId?: number | null
  onActivar: (ubicacion: Ubicacion) => void
  onDesactivar: (ubicacion: Ubicacion) => void
  onEdit: (ubicacion: Ubicacion) => void
}

export function UbicacionTable({
  actionLoadingId,
  canEdit,
  canToggle,
  isLoading,
  onActivar,
  onDesactivar,
  onEdit,
  ubicaciones,
}: UbicacionTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Cargando ubicaciones...
                </td>
              </tr>
            ) : null}

            {!isLoading && ubicaciones.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  No se encontraron ubicaciones.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? ubicaciones.map((ubicacion) => {
                  const isActionLoading = actionLoadingId === ubicacion.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={ubicacion.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {ubicacion.almacenCodigo
                          ? `${ubicacion.almacenCodigo} - ${ubicacion.almacenNombre ?? ''}`
                          : (ubicacion.almacenNombre ?? '-')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {ubicacion.codigo}
                      </td>
                      <td className="min-w-48 px-4 py-3 text-slate-900">{ubicacion.nombre}</td>
                      <td className="min-w-64 px-4 py-3 text-slate-600">
                        {ubicacion.descripcion ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ubicacion.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ubicacion.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              disabled={isActionLoading}
                              onClick={() => onEdit(ubicacion)}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}

                          {canToggle && ubicacion.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isActionLoading}
                              onClick={() => onDesactivar(ubicacion)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}

                          {canToggle && !ubicacion.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isActionLoading}
                              onClick={() => onActivar(ubicacion)}
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
