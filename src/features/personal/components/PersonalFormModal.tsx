import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  personalSchema,
  type PersonalFormInput,
  type PersonalFormValues,
} from '../schemas/personalSchema'
import type { Personal } from '../types/personal.types'

type PersonalFormModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  mode: 'create' | 'edit'
  personal?: Personal | null
  onClose: () => void
  onSubmit: (values: PersonalFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: PersonalFormInput = {
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  nombres: '',
  apellidos: '',
  cargo: '',
  area: '',
  telefono: '',
  email: '',
}

function valuesFromPersonal(personal?: Personal | null): PersonalFormInput {
  if (!personal) {
    return defaultValues
  }

  return {
    tipoDocumento: personal.tipoDocumento,
    numeroDocumento: personal.numeroDocumento,
    nombres: personal.nombres,
    apellidos: personal.apellidos ?? '',
    cargo: personal.cargo ?? '',
    area: personal.area ?? '',
    telefono: personal.telefono ?? '',
    email: personal.email ?? '',
  }
}

export function PersonalFormModal({
  errorMessage,
  isOpen,
  isSaving,
  mode,
  onClose,
  onSubmit,
  personal,
}: PersonalFormModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<PersonalFormInput, unknown, PersonalFormValues>({
    resolver: zodResolver(personalSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(valuesFromPersonal(personal))
    }
  }, [isOpen, personal, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Nuevo personal' : 'Editar personal'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Complete los datos administrativos del personal.
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Tipo documento</span>
              <select className={inputClass} {...register('tipoDocumento')}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
              {errors.tipoDocumento ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.tipoDocumento.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Numero documento</span>
              <input className={inputClass} {...register('numeroDocumento')} />
              {errors.numeroDocumento ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.numeroDocumento.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Nombres</span>
              <input className={inputClass} {...register('nombres')} />
              {errors.nombres ? (
                <span className="mt-1 block text-sm text-red-600">{errors.nombres.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Apellidos</span>
              <input className={inputClass} {...register('apellidos')} />
              {errors.apellidos ? (
                <span className="mt-1 block text-sm text-red-600">{errors.apellidos.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Cargo</span>
              <input className={inputClass} {...register('cargo')} />
              {errors.cargo ? (
                <span className="mt-1 block text-sm text-red-600">{errors.cargo.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Area</span>
              <input className={inputClass} {...register('area')} />
              {errors.area ? (
                <span className="mt-1 block text-sm text-red-600">{errors.area.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Telefono</span>
              <input className={inputClass} type="tel" {...register('telefono')} />
              {errors.telefono ? (
                <span className="mt-1 block text-sm text-red-600">{errors.telefono.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Email</span>
              <input className={inputClass} type="email" {...register('email')} />
              {errors.email ? (
                <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>
              ) : null}
            </label>
          </div>

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
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
