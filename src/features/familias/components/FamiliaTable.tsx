import { CheckCircle2, Edit, PowerOff } from 'lucide-react'
import type { Familia } from '../types/familia.types'

type FamiliaTableProps = {
  familias: Familia[]
  canEdit: boolean
  canToggle: boolean
  isLoading: boolean
  selectedFamiliaId?: number | null
  toggleLoadingId?: number | null
  onActivar: (familia: Familia) => void
  onDesactivar: (familia: Familia) => void
  onEdit: (familia: Familia) => void
  onSelect?: (familia: Familia) => void
}

export function FamiliaTable({
  canEdit,
  canToggle,
  familias,
  isLoading,
  onActivar,
  onDesactivar,
  onEdit,
  onSelect,
  selectedFamiliaId,
  toggleLoadingId,
}: FamiliaTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  Cargando familias...
                </td>
              </tr>
            ) : null}

            {!isLoading && familias.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  No se encontraron familias.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? familias.map((familia) => {
                  const isToggleLoading = toggleLoadingId === familia.id
                  const isSelected = selectedFamiliaId === familia.id

                  return (
                    <tr
                      className={`cursor-pointer hover:bg-cyan-50/40 ${
                        isSelected ? 'bg-cyan-50 ring-1 ring-inset ring-cyan-200' : ''
                      }`}
                      key={familia.id}
                      onClick={() => onSelect?.(familia)}
                    >
                      <td className="min-w-56 px-4 py-3 font-medium text-slate-900">
                        {familia.nombre}
                      </td>
                      <td className="min-w-72 px-4 py-3 text-slate-600">
                        {familia.descripcion ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            familia.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {familia.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                              isSelected
                                ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                                : 'border-slate-200 text-slate-700 hover:bg-cyan-50/40'
                            }`}
                            onClick={(event) => {
                              event.stopPropagation()
                              onSelect?.(familia)
                            }}
                            type="button"
                          >
                            <CheckCircle2 size={16} />
                            {isSelected ? 'Seleccionada' : 'Seleccionar'}
                          </button>
                          {canEdit ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              onClick={(event) => {
                                event.stopPropagation()
                                onEdit(familia)
                              }}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}
                          {canToggle && familia.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={(event) => {
                                event.stopPropagation()
                                onDesactivar(familia)
                              }}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}
                          {canToggle && !familia.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={(event) => {
                                event.stopPropagation()
                                onActivar(familia)
                              }}
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
