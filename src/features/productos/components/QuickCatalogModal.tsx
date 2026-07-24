import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

function buildQuickCatalogSchema(requirePrefijo: boolean) {
  return z
    .object({
      nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
      prefijo: z.string().trim().optional(),
      descripcion: z.string().trim().optional(),
    })
    .superRefine((values, context) => {
      if (!requirePrefijo) {
        return
      }

      if (!values.prefijo) {
        context.addIssue({
          code: 'custom',
          message: 'El prefijo es obligatorio',
          path: ['prefijo'],
        })
        return
      }

      if (values.prefijo.length > 20) {
        context.addIssue({
          code: 'custom',
          message: 'El prefijo no puede superar 20 caracteres',
          path: ['prefijo'],
        })
      }

      if (!/^[A-Za-z0-9]+$/.test(values.prefijo)) {
        context.addIssue({
          code: 'custom',
          message: 'El prefijo solo puede contener letras y numeros',
          path: ['prefijo'],
        })
      }
    })
}

export type QuickCatalogFormValues = {
  nombre: string
  prefijo?: string
  descripcion?: string
}

type QuickCatalogModalProps = {
  errorMessage?: string | null
  helperText?: string
  isOpen: boolean
  isSaving: boolean
  requirePrefijo?: boolean
  readonlyLabel?: string
  readonlyValue?: string
  title: string
  onClose: () => void
  onSubmit: (values: QuickCatalogFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: QuickCatalogFormValues = {
  nombre: '',
  prefijo: '',
  descripcion: '',
}

export function QuickCatalogModal({
  errorMessage,
  helperText,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  requirePrefijo = false,
  readonlyLabel,
  readonlyValue,
  title,
}: QuickCatalogModalProps) {
  const quickCatalogSchema = useMemo(
    () => buildQuickCatalogSchema(requirePrefijo),
    [requirePrefijo],
  )
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<QuickCatalogFormValues>({
    resolver: zodResolver(quickCatalogSchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {helperText ? <p className="mt-1 text-sm text-slate-500">{helperText}</p> : null}
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            disabled={isSaving}
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

          {readonlyLabel && readonlyValue ? (
            <label className="mb-4 block">
              <span className={labelClass}>{readonlyLabel}</span>
              <input className={`${inputClass} bg-slate-50 text-slate-600`} readOnly value={readonlyValue} />
            </label>
          ) : null}

          <label className="block">
            <span className={labelClass}>Nombre</span>
            <input className={inputClass} {...register('nombre')} />
            {errors.nombre ? (
              <span className="mt-1 block text-sm text-red-600">{errors.nombre.message}</span>
            ) : null}
          </label>

          {requirePrefijo ? (
            <label className="mt-4 block">
              <span className={labelClass}>Prefijo</span>
              <input
                className={inputClass}
                maxLength={20}
                placeholder="REP"
                {...register('prefijo')}
              />
              {errors.prefijo ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.prefijo.message}
                </span>
              ) : null}
            </label>
          ) : null}

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
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
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
