import { Ban, CheckCircle2, Eye, XCircle } from 'lucide-react'
import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { MovementTypeBadge } from '../../../../shared/components/MovementTypeBadge'
import { formatApiDateTime } from '../../../../shared/utils/dateTime'
import type { Movimiento } from '../types/movimiento.types'
import { formatMovimientoLabel } from '../utils/movimientoLabels'

type MovimientoTableProps = {
  movimientos: Movimiento[]
  isLoading: boolean
  onAnular: (movimiento: Movimiento) => void
  onCancelar: (movimiento: Movimiento) => void
  onConfirmar: (movimiento: Movimiento) => void
  onView: (movimiento: Movimiento) => void
  processingId?: number | null
  puedeAnularMovimiento: (movimiento: Movimiento) => boolean
  puedeCancelarMovimiento: (movimiento: Movimiento) => boolean
  puedeConfirmarMovimiento: (movimiento: Movimiento) => boolean
}

function formatDate(value?: string | null) {
  return formatApiDateTime(value)
}

function estadoClass(estado: Movimiento['estado']) {
  if (estado === 'CONFIRMADO') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (estado === 'ANULADO') {
    return 'bg-red-100 text-red-700'
  }

  if (estado === 'CANCELADO') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-amber-100 text-amber-700'
}

export function MovimientoTable({
  isLoading,
  movimientos,
  onAnular,
  onCancelar,
  onConfirmar,
  onView,
  processingId,
  puedeAnularMovimiento,
  puedeCancelarMovimiento,
  puedeConfirmarMovimiento,
}: MovimientoTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha movimiento</th>
              <th className="px-4 py-3">Documento referencia</th>
              <th className="px-4 py-3">Almacen origen</th>
              <th className="px-4 py-3">Almacen destino</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                  Cargando movimientos...
                </td>
              </tr>
            ) : null}

            {!isLoading && movimientos.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                  No se encontraron movimientos.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? movimientos.map((movimiento) => {
                  const isProcessing = processingId === movimiento.id

                  return (
                    <tr className="hover:bg-cyan-50/40" key={movimiento.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <MovementNumberBadge number={movimiento.numero} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <MovementTypeBadge
                          label={formatMovimientoLabel(movimiento.tipoMovimiento)}
                          type={movimiento.tipoMovimiento}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass(
                            movimiento.estado,
                          )}`}
                        >
                          {formatMovimientoLabel(movimiento.estado)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(movimiento.fechaMovimiento)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {movimiento.documentoReferencia ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {movimiento.almacenOrigenCodigo ? (
                          <span className="inline-flex rounded bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                            {movimiento.almacenOrigenCodigo}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {movimiento.almacenDestinoCodigo ? (
                          <span className="inline-flex rounded bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                            {movimiento.almacenDestinoCodigo}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="min-w-52 px-4 py-3 text-slate-600">
                        {movimiento.proveedorRazonSocial ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                            onClick={() => onView(movimiento)}
                            type="button"
                          >
                            <Eye size={16} />
                            Ver
                          </button>

                          {movimiento.estado === 'BORRADOR' &&
                          (puedeConfirmarMovimiento(movimiento) ||
                            puedeCancelarMovimiento(movimiento)) ? (
                            <>
                              {puedeConfirmarMovimiento(movimiento) ? (
                                <button
                                  className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                  disabled={isProcessing}
                                  onClick={() => onConfirmar(movimiento)}
                                  type="button"
                                >
                                  <CheckCircle2 size={16} />
                                  Confirmar
                                </button>
                              ) : null}
                              {puedeCancelarMovimiento(movimiento) ? (
                                <button
                                  className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-300 px-3 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                                  disabled={isProcessing}
                                  onClick={() => onCancelar(movimiento)}
                                  type="button"
                                >
                                  <XCircle size={16} />
                                  Cancelar
                                </button>
                              ) : null}
                            </>
                          ) : null}

                          {movimiento.estado === 'CONFIRMADO' &&
                          puedeAnularMovimiento(movimiento) ? (
                            <button
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              disabled={isProcessing}
                              onClick={() => onAnular(movimiento)}
                              type="button"
                            >
                              <Ban size={16} />
                              Anular
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
