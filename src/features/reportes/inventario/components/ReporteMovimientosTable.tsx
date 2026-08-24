import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { MovementTypeBadge } from '../../../../shared/components/MovementTypeBadge'
import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type { ReporteMovimientoItem } from '../types/reporteInventario.types'
import { formatReportDecimal } from '../utils/reportNumberFormat'

type ReporteMovimientosTableProps = {
  rows: ReporteMovimientoItem[]
  isLoading: boolean
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : '-'
}

function statusClass(status: string) {
  if (status === 'CONFIRMADO') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'ANULADO') {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-amber-100 text-amber-700'
}

export function ReporteMovimientosTable({ isLoading, rows }: ReporteMovimientosTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Movimiento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Documento referencia</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacen origen</th>
              <th className="px-4 py-3">Almacen destino</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Costo unitario</th>
              <th className="px-4 py-3 text-right">Total linea</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={11}>
                  Consultando movimientos...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={11}>
                  No hay movimientos para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-cyan-50/40" key={`${row.movimientoId}-${row.productoCodigo}`}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementNumberBadge number={row.numero} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementTypeBadge
                      label={formatMovimientoLabel(row.tipoMovimiento)}
                      type={row.tipoMovimiento}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(
                        row.estado,
                      )}`}
                    >
                      {formatMovimientoLabel(row.estado)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(row.fechaMovimiento)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.documentoReferencia || '-'}
                  </td>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <ProductCodeBadge code={row.productoCodigo} />
                      <p className="font-medium leading-5 text-slate-950">{row.productoNombre || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.almacenOrigenNombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.almacenDestinoNombre || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.cantidad)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.costoUnitario)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                    {formatReportDecimal(row.totalLinea)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
