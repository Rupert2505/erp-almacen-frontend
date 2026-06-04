import {
  CheckCircle2,
  Edit,
  Eye,
  KeyRound,
  PowerOff,
  ShieldCheck,
} from 'lucide-react'
import type { Usuario } from '../types/usuario.types'

type UsuarioTableProps = {
  usuarios: Usuario[]
  canManage: boolean
  isLoading: boolean
  actionLoadingId?: number | null
  onActivar: (usuario: Usuario) => void
  onCambiarRoles: (usuario: Usuario) => void
  onDesactivar: (usuario: Usuario) => void
  onEdit: (usuario: Usuario) => void
  onResetPassword: (usuario: Usuario) => void
  onView: (usuario: Usuario) => void
}

function roleText(usuario: Usuario) {
  return usuario.roles.length > 0 ? usuario.roles.map((rol) => rol.nombre).join(', ') : '-'
}

export function UsuarioTable({
  actionLoadingId,
  canManage,
  isLoading,
  onActivar,
  onCambiarRoles,
  onDesactivar,
  onEdit,
  onResetPassword,
  onView,
  usuarios,
}: UsuarioTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Nombres</th>
              <th className="px-4 py-3">Apellidos</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : null}

            {!isLoading && usuarios.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? usuarios.map((usuario) => {
                  const isActionLoading = actionLoadingId === usuario.id

                  return (
                    <tr className="hover:bg-slate-50" key={usuario.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {usuario.username}
                      </td>
                      <td className="min-w-40 px-4 py-3 text-slate-700">{usuario.nombres}</td>
                      <td className="min-w-40 px-4 py-3 text-slate-700">{usuario.apellidos}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {usuario.email}
                      </td>
                      <td className="min-w-56 px-4 py-3 text-slate-600">{roleText(usuario)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            usuario.activo
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => onView(usuario)}
                            type="button"
                          >
                            <Eye size={16} />
                            Ver
                          </button>

                          {canManage ? (
                            <>
                              <button
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                disabled={isActionLoading}
                                onClick={() => onEdit(usuario)}
                                type="button"
                              >
                                <Edit size={16} />
                                Editar
                              </button>
                              <button
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                disabled={isActionLoading}
                                onClick={() => onCambiarRoles(usuario)}
                                type="button"
                              >
                                <ShieldCheck size={16} />
                                Roles
                              </button>
                              <button
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                disabled={isActionLoading}
                                onClick={() => onResetPassword(usuario)}
                                type="button"
                              >
                                <KeyRound size={16} />
                                Reset
                              </button>
                            </>
                          ) : null}

                          {canManage && usuario.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isActionLoading}
                              onClick={() => onDesactivar(usuario)}
                              type="button"
                            >
                              <PowerOff size={16} />
                              Desactivar
                            </button>
                          ) : null}

                          {canManage && !usuario.activo ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              disabled={isActionLoading}
                              onClick={() => onActivar(usuario)}
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
