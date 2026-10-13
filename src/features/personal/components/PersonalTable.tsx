import { CheckCircle2, Edit, Eye, PowerOff } from 'lucide-react'
import type { Personal } from '../types/personal.types'

type PersonalTableProps = {
  personal: Personal[]
  canEdit: boolean
  canToggle: boolean
  canViewDetails: boolean
  isLoading: boolean
  actionLoadingId?: number | null
  onActivar: (personal: Personal) => void
  onDesactivar: (personal: Personal) => void
  onEdit: (personal: Personal) => void
  onView: (personal: Personal) => void
}

export function PersonalTable({
  actionLoadingId,
  canEdit,
  canToggle,
  canViewDetails,
  isLoading,
  onActivar,
  onDesactivar,
  onEdit,
  onView,
  personal,
}: PersonalTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Nombres</th>
              <th className="px-4 py-3">Apellidos</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Telefono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                  Cargando personal...
                </td>
              </tr>
            ) : null}

            {!isLoading && personal.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                  No se encontraron registros de personal.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? personal.map((item) => {
                  const isActionLoading = actionLoadingId === item.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={item.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {item.tipoDocumento} {item.numeroDocumento}
                        </span>
                      </td>
                      <td className="min-w-48 px-4 py-3 font-medium text-slate-950">
                        {item.nombres}
                      </td>
                      <td className="min-w-48 px-4 py-3 text-slate-600">
                        {item.apellidos ?? '-'}
                      </td>
                      <td className="min-w-40 px-4 py-3 text-slate-600">{item.cargo ?? '-'}</td>
                      <td className="min-w-40 px-4 py-3 text-slate-600">{item.area ?? '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {item.telefono ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {item.email ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canViewDetails ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              disabled={isActionLoading}
                              onClick={() => onView(item)}
                              type="button"
                            >
                              <Eye size={16} />
                              Ver
                            </button>
                          ) : null}

                          {canEdit ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              disabled={isActionLoading}
                              onClick={() => onEdit(item)}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}

                          {canToggle && item.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isActionLoading}
                              onClick={() => onDesactivar(item)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}

                          {canToggle && !item.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isActionLoading}
                              onClick={() => onActivar(item)}
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
