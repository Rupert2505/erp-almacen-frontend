import { CheckCircle2, Edit, PowerOff } from 'lucide-react'
import type { Proveedor } from '../types/proveedor.types'

type ProveedorTableProps = {
  proveedores: Proveedor[]
  canManage: boolean
  isLoading: boolean
  toggleLoadingId?: number | null
  onActivar: (proveedor: Proveedor) => void
  onDesactivar: (proveedor: Proveedor) => void
  onEdit: (proveedor: Proveedor) => void
}

export function ProveedorTable({
  canManage,
  isLoading,
  onActivar,
  onDesactivar,
  onEdit,
  proveedores,
  toggleLoadingId,
}: ProveedorTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Nombre comercial</th>
              <th className="px-4 py-3">Telefono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  Cargando proveedores...
                </td>
              </tr>
            ) : null}

            {!isLoading && proveedores.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  No se encontraron proveedores.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? proveedores.map((proveedor) => {
                  const isToggleLoading = toggleLoadingId === proveedor.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={proveedor.id}>
                      <td className="min-w-72 px-4 py-3">
                        <div className="space-y-1">
                          <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {proveedor.tipoDocumento} {proveedor.numeroDocumento}
                          </span>
                          <p className="font-medium leading-5 text-slate-950">
                            {proveedor.razonSocial}
                          </p>
                        </div>
                      </td>
                      <td className="min-w-48 px-4 py-3 text-slate-600">
                        {proveedor.nombreComercial ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {proveedor.telefono ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {proveedor.email ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            proveedor.activo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canManage ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                              onClick={() => onEdit(proveedor)}
                              type="button"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                          ) : null}

                          {canManage && proveedor.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onDesactivar(proveedor)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}

                          {canManage && !proveedor.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isToggleLoading}
                              onClick={() => onActivar(proveedor)}
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
