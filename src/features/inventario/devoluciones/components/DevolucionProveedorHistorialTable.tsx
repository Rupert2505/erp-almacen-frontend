import { Eye } from 'lucide-react'
import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { formatApiDateTime } from '../../../../shared/utils/dateTime'
import { formatOptionalNumber } from '../../../../shared/utils/numberFormat'
import type { Movimiento } from '../../movimientos/types/movimiento.types'
import { formatMovimientoLabel } from '../../movimientos/utils/movimientoLabels'

type DevolucionProveedorHistorialTableProps = {
  devoluciones: Movimiento[]
  isLoading: boolean
  onView: (movimiento: Movimiento) => void
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
    return 'bg-slate-100 text-slate-600'
  }

  return 'bg-amber-100 text-amber-700'
}

function totalCantidad(movimiento: Movimiento) {
  return movimiento.detalles?.reduce((total, detalle) => total + Number(detalle.cantidad ?? 0), 0)
}

export function DevolucionProveedorHistorialTable({
  devoluciones,
  isLoading,
  onView,
}: DevolucionProveedorHistorialTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3">Nota de credito</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  Cargando devoluciones...
                </td>
              </tr>
            ) : null}
            {!isLoading && devoluciones.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  Esta entrada no tiene devoluciones registradas.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? devoluciones.map((movimiento) => (
                  <tr className="hover:bg-cyan-50/70" key={movimiento.id}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <MovementNumberBadge number={movimiento.numero} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(movimiento.fechaMovimiento)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                      {formatOptionalNumber(totalCantidad(movimiento), { maximumFractionDigits: 4 })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {movimiento.numeroNotaCredito ?? '-'}
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
                      {movimiento.username ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-cyan-50/40"
                          onClick={() => onView(movimiento)}
                          type="button"
                        >
                          <Eye size={16} />
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
