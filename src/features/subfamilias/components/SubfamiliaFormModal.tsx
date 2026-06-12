import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Familia } from '../../familias/types/familia.types'
import {
  subfamiliaSchema,
  type SubfamiliaFormInput,
  type SubfamiliaFormValues,
} from '../schemas/subfamiliaSchema'
import type { Subfamilia } from '../types/subfamilia.types'

type SubfamiliaFormModalProps = {
  errorMessage?: string | null
  familias: Familia[]
  isLoadingOptions: boolean
  isOpen: boolean
  isSaving: boolean
  lockedFamilia?: Familia | null
  mode: 'create' | 'edit'
  subfamilia?: Subfamilia | null
  onClose: () => void
  onSubmit: (values: SubfamiliaFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: SubfamiliaFormInput = {
  familiaId: 0,
  nombre: '',
  descripcion: '',
}

function valuesFromSubfamilia(
  subfamilia?: Subfamilia | null,
  lockedFamilia?: Familia | null,
): SubfamiliaFormInput {
  if (!subfamilia) {
    return {
      ...defaultValues,
      familiaId: lockedFamilia?.id ?? defaultValues.familiaId,
    }
  }

  return {
    familiaId: subfamilia.familiaId,
    nombre: subfamilia.nombre,
    descripcion: subfamilia.descripcion ?? '',
  }
}

export function SubfamiliaFormModal({
  errorMessage,
  familias,
  isLoadingOptions,
  isOpen,
  isSaving,
  lockedFamilia,
  mode,
  onClose,
  onSubmit,
  subfamilia,
}: SubfamiliaFormModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<SubfamiliaFormInput, unknown, SubfamiliaFormValues>({
    resolver: zodResolver(subfamiliaSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(valuesFromSubfamilia(subfamilia, lockedFamilia))
    }
  }, [isOpen, lockedFamilia, reset, subfamilia])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {mode === 'create' ? 'Nueva subfamilia' : 'Editar subfamilia'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Asocie la subfamilia a una familia.</p>
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

          <label className="block">
            <span className={labelClass}>Familia</span>
            {lockedFamilia ? (
              <>
                <input className={`${inputClass} bg-slate-50 text-slate-600`} readOnly value={lockedFamilia.nombre} />
                <input type="hidden" value={lockedFamilia.id} {...register('familiaId')} />
              </>
            ) : (
              <select className={inputClass} disabled={isLoadingOptions} {...register('familiaId')}>
                <option value="">Seleccione una familia</option>
                {familias.map((familia) => (
                  <option key={familia.id} value={familia.id}>
                    {familia.nombre}
                  </option>
                ))}
              </select>
            )}
            {errors.familiaId ? (
              <span className="mt-1 block text-sm text-red-600">
                {errors.familiaId.message}
              </span>
            ) : null}
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Nombre</span>
            <input className={inputClass} {...register('nombre')} />
            {errors.nombre ? (
              <span className="mt-1 block text-sm text-red-600">{errors.nombre.message}</span>
            ) : null}
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Descripcion</span>
            <textarea className={textareaClass} {...register('descripcion')} />
            {errors.descripcion ? (
              <span className="mt-1 block text-sm text-red-600">
                {errors.descripcion.message}
              </span>
            ) : null}
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
      </section>
    </div>
  )
}
