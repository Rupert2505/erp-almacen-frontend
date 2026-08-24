import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  cambiarRolesSchema,
  type CambiarRolesInput,
  type CambiarRolesValues,
} from '../schemas/cambiarRolesSchema'
import type { Rol } from '../types/rol.types'
import type { Usuario } from '../types/usuario.types'

type UsuarioRolesModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  roles: Rol[]
  usuario?: Usuario | null
  onClose: () => void
  onSubmit: (values: CambiarRolesValues) => Promise<void>
}

const defaultValues: CambiarRolesInput = {
  rolesIds: [],
}

export function UsuarioRolesModal({
  errorMessage,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  roles,
  usuario,
}: UsuarioRolesModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CambiarRolesInput, unknown, CambiarRolesValues>({
    resolver: zodResolver(cambiarRolesSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        rolesIds: usuario?.roles.map((rol) => String(rol.id)) ?? [],
      })
    }
  }, [isOpen, reset, usuario])

  if (!isOpen || !usuario) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">Cambiar roles</h2>
            <p className="mt-1 text-sm text-slate-300">
              Usuario: <span className="font-medium text-slate-700">{usuario.username}</span>
            </p>
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

        <form className="overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((rol) => (
              <label
                className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-3"
                key={rol.id}
              >
                <input
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  type="checkbox"
                  value={String(rol.id)}
                  {...register('rolesIds')}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{rol.nombre}</span>
                  <span className="block text-xs text-slate-500">
                    {rol.descripcion || 'Sin descripcion'}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {errors.rolesIds ? (
            <span className="mt-2 block text-sm text-red-600">{errors.rolesIds.message}</span>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : 'Guardar roles'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
