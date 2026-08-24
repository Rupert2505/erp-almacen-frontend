import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  usuarioCreateSchema,
  usuarioEditSchema,
  type UsuarioCreateInput,
  type UsuarioCreateValues,
  type UsuarioEditInput,
  type UsuarioEditValues,
} from '../schemas/usuarioSchema'
import type { Rol } from '../types/rol.types'
import type { Usuario } from '../types/usuario.types'

type UsuarioFormModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  mode: 'create' | 'edit'
  roles: Rol[]
  usuario?: Usuario | null
  onClose: () => void
  onCreateSubmit: (values: UsuarioCreateValues) => Promise<void>
  onEditSubmit: (values: UsuarioEditValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const createDefaults: UsuarioCreateInput = {
  username: '',
  password: '',
  nombres: '',
  apellidos: '',
  email: '',
  activo: true,
  rolesIds: [],
}

const editDefaults: UsuarioEditInput = {
  nombres: '',
  apellidos: '',
  email: '',
  activo: true,
}

function createValuesFromUsuario(usuario?: Usuario | null): UsuarioCreateInput {
  if (!usuario) {
    return createDefaults
  }

  return {
    username: usuario.username,
    password: '',
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    activo: usuario.activo,
    rolesIds: usuario.roles.map((rol) => String(rol.id)),
  }
}

function editValuesFromUsuario(usuario?: Usuario | null): UsuarioEditInput {
  if (!usuario) {
    return editDefaults
  }

  return {
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    activo: usuario.activo,
  }
}

export function UsuarioFormModal({
  errorMessage,
  isOpen,
  isSaving,
  mode,
  onClose,
  onCreateSubmit,
  onEditSubmit,
  roles,
  usuario,
}: UsuarioFormModalProps) {
  const createForm = useForm<UsuarioCreateInput, unknown, UsuarioCreateValues>({
    resolver: zodResolver(usuarioCreateSchema),
    defaultValues: createDefaults,
  })
  const editForm = useForm<UsuarioEditInput, unknown, UsuarioEditValues>({
    resolver: zodResolver(usuarioEditSchema),
    defaultValues: editDefaults,
  })

  useEffect(() => {
    if (isOpen && mode === 'create') {
      createForm.reset(createValuesFromUsuario(usuario))
    }

    if (isOpen && mode === 'edit') {
      editForm.reset(editValuesFromUsuario(usuario))
    }
  }, [createForm, editForm, isOpen, mode, usuario])

  if (!isOpen) {
    return null
  }

  const isCreate = mode === 'create'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isCreate ? 'Nuevo usuario' : 'Editar usuario'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {isCreate
                ? 'Cree una cuenta de acceso y asigne sus roles.'
                : 'Actualice los datos generales de la cuenta.'}
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

        {isCreate ? (
          <form
            className="overflow-y-auto px-6 py-5"
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
          >
            {errorMessage ? (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Username</span>
                <input
                  className={inputClass}
                  data-preserve-case="true"
                  {...createForm.register('username')}
                />
                {createForm.formState.errors.username ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {createForm.formState.errors.username.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className={labelClass}>Password</span>
                <input className={inputClass} type="password" {...createForm.register('password')} />
                {createForm.formState.errors.password ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {createForm.formState.errors.password.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className={labelClass}>Nombres</span>
                <input className={inputClass} {...createForm.register('nombres')} />
                {createForm.formState.errors.nombres ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {createForm.formState.errors.nombres.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className={labelClass}>Apellidos</span>
                <input className={inputClass} {...createForm.register('apellidos')} />
                {createForm.formState.errors.apellidos ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {createForm.formState.errors.apellidos.message}
                  </span>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className={labelClass}>Email</span>
                <input className={inputClass} type="email" {...createForm.register('email')} />
                {createForm.formState.errors.email ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {createForm.formState.errors.email.message}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="mt-5 rounded-md border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">Roles</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {roles.map((rol) => (
                  <label className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-3" key={rol.id}>
                    <input
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      type="checkbox"
                      value={String(rol.id)}
                      {...createForm.register('rolesIds')}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{rol.nombre}</span>
                      <span className="block text-xs text-slate-500">{rol.descripcion || 'Sin descripcion'}</span>
                    </span>
                  </label>
                ))}
              </div>
              {createForm.formState.errors.rolesIds ? (
                <span className="mt-2 block text-sm text-red-600">
                  {createForm.formState.errors.rolesIds.message}
                </span>
              ) : null}
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3">
              <input
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                type="checkbox"
                {...createForm.register('activo')}
              />
              <span className="text-sm font-medium text-slate-800">Usuario activo</span>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <form
            className="overflow-y-auto px-6 py-5"
            onSubmit={editForm.handleSubmit(onEditSubmit)}
          >
            {errorMessage ? (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Nombres</span>
                <input className={inputClass} {...editForm.register('nombres')} />
                {editForm.formState.errors.nombres ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {editForm.formState.errors.nombres.message}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className={labelClass}>Apellidos</span>
                <input className={inputClass} {...editForm.register('apellidos')} />
                {editForm.formState.errors.apellidos ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {editForm.formState.errors.apellidos.message}
                  </span>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className={labelClass}>Email</span>
                <input className={inputClass} type="email" {...editForm.register('email')} />
                {editForm.formState.errors.email ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {editForm.formState.errors.email.message}
                  </span>
                ) : null}
              </label>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3">
              <input
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                type="checkbox"
                {...editForm.register('activo')}
              />
              <span className="text-sm font-medium text-slate-800">Usuario activo</span>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
