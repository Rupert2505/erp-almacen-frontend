import { X } from 'lucide-react'
import type { Usuario } from '../types/usuario.types'

type UsuarioDetalleModalProps = {
  isLoading: boolean
  isOpen: boolean
  usuario?: Usuario | null
  onClose: () => void
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : '-'
}

export function UsuarioDetalleModal({
  isLoading,
  isOpen,
  onClose,
  usuario,
}: UsuarioDetalleModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">Detalle de usuario</h2>
            <p className="mt-1 text-sm text-slate-300">Informacion de cuenta, roles y permisos.</p>
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Cargando detalle...</p>
          ) : usuario ? (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{usuario.username}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{usuario.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombres</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{usuario.nombres}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Apellidos</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{usuario.apellidos}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      usuario.activo
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Creado</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(usuario.creadoEn)}</p>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Roles</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {usuario.roles.length > 0 ? (
                    usuario.roles.map((rol) => (
                      <span
                        className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        key={rol.id}
                      >
                        {rol.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Sin roles asignados.</span>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Permisos efectivos</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {usuario.permisos.length > 0 ? (
                    usuario.permisos.map((permiso) => (
                      <div className="rounded-md bg-slate-50 px-3 py-2" key={permiso.id}>
                        <p className="text-xs font-semibold text-slate-800">{permiso.codigo}</p>
                        <p className="mt-1 text-xs text-slate-500">{permiso.descripcion || '-'}</p>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Sin permisos efectivos.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No hay usuario seleccionado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
