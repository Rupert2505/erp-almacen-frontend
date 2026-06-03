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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tipo documento</th>
              <th className="px-4 py-3">Numero documento</th>
              <th className="px-4 py-3">Razon social</th>
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
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  Cargando proveedores...
                </td>
              </tr>
            ) : null}

            {!isLoading && proveedores.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  No se encontraron proveedores.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? proveedores.map((proveedor) => {
                  const isToggleLoading = toggleLoadingId === proveedor.id

                  return (
                    <tr className="hover:bg-slate-50" key={proveedor.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {proveedor.tipoDocumento}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {proveedor.numeroDocumento}
                      </td>
                      <td className="min-w-64 px-4 py-3 text-slate-900">
                        {proveedor.razonSocial}
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
                              ? 'bg-emerald-50 text-emerald-700'
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
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
