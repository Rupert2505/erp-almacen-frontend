import { CheckCircle2, Edit, PowerOff } from 'lucide-react'
import type { Marca } from '../types/marca.types'

type MarcaTableProps = {
  marcas: Marca[]
  canEdit: boolean
  canToggle: boolean
  isLoading: boolean
  toggleLoadingId?: number | null
  onActivar: (marca: Marca) => void
  onDesactivar: (marca: Marca) => void
  onEdit: (marca: Marca) => void
}

export function MarcaTable({
  canEdit,
  canToggle,
  isLoading,
  marcas,
  onActivar,
  onDesactivar,
  onEdit,
  toggleLoadingId,
}: MarcaTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
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
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  Cargando marcas...
                </td>
              </tr>
            ) : null}

            {!isLoading && marcas.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  No se encontraron marcas.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? marcas.map((marca) => {
                  const isToggleLoading = toggleLoadingId === marca.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={marca.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {marca.codigo ?? '-'}
                      </td>
                      <td className="min-w-56 px-4 py-3 text-slate-900">{marca.nombre}</td>
                      <td className="min-w-72 px-4 py-3 text-slate-600">
                        {marca.descripcion ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            marca.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {marca.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              onClick={() => onEdit(marca)}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}
                          {canToggle && marca.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onDesactivar(marca)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}
                          {canToggle && !marca.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onActivar(marca)}
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
