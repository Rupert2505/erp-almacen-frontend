import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  cancelarMovimientoSchema,
  type CancelarMovimientoValues,
} from '../schemas/movimientoSchema'
import type { Movimiento } from '../types/movimiento.types'

type MovimientoCancelarModalProps = {
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  movimiento?: Movimiento | null
  onClose: () => void
  onSubmit: (values: CancelarMovimientoValues) => Promise<void>
}

export function MovimientoCancelarModal({
  errorMessage,
  isOpen,
  isSaving,
  movimiento,
  onClose,
  onSubmit,
}: MovimientoCancelarModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CancelarMovimientoValues>({
    resolver: zodResolver(cancelarMovimientoSchema),
    defaultValues: {
      motivoCancelacion: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ motivoCancelacion: '' })
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Cancelar movimiento en borrador
            </h2>
            <p className="mt-1 text-sm text-slate-300">{movimiento?.numero}</p>
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
          <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Esta accion cancelara el borrador. No afectara stock ni kardex. Deseas
            continuar?
          </p>

          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Motivo de cancelacion
            </span>
            <textarea
              aria-label="Motivo de cancelacion"
              className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              disabled={isSaving}
              {...register('motivoCancelacion')}
            />
            {errors.motivoCancelacion ? (
              <span className="mt-1 block text-sm text-red-600">
                {errors.motivoCancelacion.message}
              </span>
            ) : null}
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Volver
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Cancelando...' : 'Cancelar borrador'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
