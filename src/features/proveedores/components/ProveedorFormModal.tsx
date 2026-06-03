import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  proveedorSchema,
  type ProveedorFormInput,
  type ProveedorFormValues,
} from '../schemas/proveedorSchema'
import type { Proveedor } from '../types/proveedor.types'

type ProveedorFormModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  mode: 'create' | 'edit'
  proveedor?: Proveedor | null
  onClose: () => void
  onSubmit: (values: ProveedorFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: ProveedorFormInput = {
  tipoDocumento: 'RUC',
  numeroDocumento: '',
  razonSocial: '',
  nombreComercial: '',
  direccion: '',
  telefono: '',
  email: '',
}

function valuesFromProveedor(proveedor?: Proveedor | null): ProveedorFormInput {
  if (!proveedor) {
    return defaultValues
  }

  return {
    tipoDocumento: proveedor.tipoDocumento,
    numeroDocumento: proveedor.numeroDocumento,
    razonSocial: proveedor.razonSocial,
    nombreComercial: proveedor.nombreComercial ?? '',
    direccion: proveedor.direccion ?? '',
    telefono: proveedor.telefono ?? '',
    email: proveedor.email ?? '',
  }
}

export function ProveedorFormModal({
  errorMessage,
  isOpen,
  isSaving,
  mode,
  onClose,
  onSubmit,
  proveedor,
}: ProveedorFormModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProveedorFormInput, unknown, ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(valuesFromProveedor(proveedor))
    }
  }, [isOpen, proveedor, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {mode === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete los datos comerciales del proveedor.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
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
                <option value="RUC">RUC</option>
                <option value="DNI">DNI</option>
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

            <label className="block md:col-span-2">
              <span className={labelClass}>Razon social</span>
              <input className={inputClass} {...register('razonSocial')} />
              {errors.razonSocial ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.razonSocial.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Nombre comercial</span>
              <input className={inputClass} {...register('nombreComercial')} />
              {errors.nombreComercial ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.nombreComercial.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Telefono</span>
              <input className={inputClass} {...register('telefono')} />
              {errors.telefono ? (
                <span className="mt-1 block text-sm text-red-600">{errors.telefono.message}</span>
              ) : null}
            </label>

            <label className="block md:col-span-2">
              <span className={labelClass}>Direccion</span>
              <textarea className={textareaClass} {...register('direccion')} />
              {errors.direccion ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.direccion.message}
                </span>
              ) : null}
            </label>

            <label className="block md:col-span-2">
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
