import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  anularMovimientoSchema,
  type AnularMovimientoValues,
} from '../schemas/movimientoSchema'
import type { Movimiento } from '../types/movimiento.types'

type MovimientoAnularModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  movimiento?: Movimiento | null
  onClose: () => void
  onSubmit: (values: AnularMovimientoValues) => Promise<void>
}

export function MovimientoAnularModal({
  errorMessage,
  isOpen,
  isSaving,
  movimiento,
  onClose,
  onSubmit,
}: MovimientoAnularModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<AnularMovimientoValues>({
    resolver: zodResolver(anularMovimientoSchema),
    defaultValues: {
      motivo: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ motivo: '' })
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Anular movimiento</h2>
            <p className="mt-1 text-sm text-slate-500">{movimiento?.numero}</p>
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

        <form className="px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Motivo</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              {...register('motivo')}
            />
            {errors.motivo ? (
              <span className="mt-1 block text-sm text-red-600">{errors.motivo.message}</span>
            ) : null}
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Anulando...' : 'Anular'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
