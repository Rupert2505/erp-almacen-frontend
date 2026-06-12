import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  tipoArticuloSchema,
  type TipoArticuloFormInput,
  type TipoArticuloFormValues,
} from '../../tipos-articulo/schemas/tipoArticuloSchema'

type QuickTipoArticuloModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: TipoArticuloFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const textareaClass =
  'min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: TipoArticuloFormInput = {
  codigo: '',
  nombre: '',
  descripcion: '',
}

export function QuickTipoArticuloModal({
  errorMessage,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: QuickTipoArticuloModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TipoArticuloFormInput, unknown, TipoArticuloFormValues>({
    resolver: zodResolver(tipoArticuloSchema),
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
            <h2 className="text-lg font-semibold text-slate-950">Nuevo tipo de articulo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Se agregara al catalogo y quedara seleccionado en el producto.
            </p>
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

          <label className="block">
            <span className={labelClass}>Codigo</span>
            <input className={inputClass} {...register('codigo')} />
            {errors.codigo ? (
              <span className="mt-1 block text-sm text-red-600">{errors.codigo.message}</span>
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
