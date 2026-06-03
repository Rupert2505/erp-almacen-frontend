import { X } from 'lucide-react'
import { MovimientoDetalleTable } from './MovimientoDetalleTable'
import type { Movimiento } from '../types/movimiento.types'
import { formatMovimientoLabel } from '../utils/movimientoLabels'

type MovimientoViewModalProps = {
  isOpen: boolean
  isLoading: boolean
  movimiento?: Movimiento | null
  onClose: () => void
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value ?? '-'}</p>
    </div>
  )
}

export function MovimientoViewModal({
  isLoading,
  isOpen,
  movimiento,
  onClose,
}: MovimientoViewModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Detalle de movimiento</h2>
            <p className="mt-1 text-sm text-slate-500">{movimiento?.numero ?? 'Cargando...'}</p>
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

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Cargando detalle...
            </div>
          ) : null}

          {!isLoading && movimiento ? (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Numero" value={movimiento.numero} />
                <InfoItem label="Tipo" value={formatMovimientoLabel(movimiento.tipoMovimiento)} />
                <InfoItem label="Estado" value={formatMovimientoLabel(movimiento.estado)} />
                <InfoItem label="Fecha movimiento" value={formatDate(movimiento.fechaMovimiento)} />
                <InfoItem label="Documento referencia" value={movimiento.documentoReferencia} />
                <InfoItem label="Proveedor" value={movimiento.proveedorRazonSocial} />
                <InfoItem label="Almacen origen" value={movimiento.almacenOrigenNombre} />
                <InfoItem label="Almacen destino" value={movimiento.almacenDestinoNombre} />
                <InfoItem label="Usuario" value={movimiento.username} />
                <InfoItem label="Confirmado en" value={formatDate(movimiento.confirmadoEn)} />
                <InfoItem label="Anulado en" value={formatDate(movimiento.anuladoEn)} />
                <InfoItem label="Creado en" value={formatDate(movimiento.creadoEn)} />
              </div>

              {movimiento.observacion ? (
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Observacion
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{movimiento.observacion}</p>
                </div>
              ) : null}

              <MovimientoDetalleTable detalles={movimiento.detalles ?? []} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
