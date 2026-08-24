import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  almacenSchema,
  type AlmacenFormInput,
  type AlmacenFormValues,
} from '../schemas/almacenSchema'
import type { Almacen } from '../types/almacen.types'

type AlmacenFormModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  mode: 'create' | 'edit'
  almacen?: Almacen | null
  onClose: () => void
  onSubmit: (values: AlmacenFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: AlmacenFormInput = {
  codigo: '',
  nombre: '',
  direccion: '',
  responsable: '',
}

function valuesFromAlmacen(almacen?: Almacen | null): AlmacenFormInput {
  if (!almacen) {
    return defaultValues
  }

  return {
    codigo: almacen.codigo,
    nombre: almacen.nombre,
    direccion: almacen.direccion ?? '',
    responsable: almacen.responsable ?? '',
  }
}

export function AlmacenFormModal({
  almacen,
  errorMessage,
  isOpen,
  isSaving,
  mode,
  onClose,
  onSubmit,
}: AlmacenFormModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<AlmacenFormInput, unknown, AlmacenFormValues>({
    resolver: zodResolver(almacenSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(valuesFromAlmacen(almacen))
    }
  }, [almacen, isOpen, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Nuevo almacen' : 'Editar almacen'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Complete los datos generales del almacen.
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
              <span className={labelClass}>Codigo</span>
              <input className={inputClass} {...register('codigo')} />
              {errors.codigo ? (
                <span className="mt-1 block text-sm text-red-600">{errors.codigo.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Nombre</span>
              <input className={inputClass} {...register('nombre')} />
              {errors.nombre ? (
                <span className="mt-1 block text-sm text-red-600">{errors.nombre.message}</span>
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
              <span className={labelClass}>Responsable</span>
              <input className={inputClass} {...register('responsable')} />
              {errors.responsable ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.responsable.message}
                </span>
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
