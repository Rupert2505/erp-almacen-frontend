import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { MovementTypeBadge } from '../../../../shared/components/MovementTypeBadge'
import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type {
  SalidaInventarioItem,
  SalidaInventarioResumen,
} from '../types/reporteInventario.types'
import { formatReportCount, formatReportDecimal } from '../utils/reportNumberFormat'

type SalidasInventarioTableProps = {
  rows: SalidaInventarioItem[]
  isLoading: boolean
  resumen?: SalidaInventarioResumen | null
  showCosts: boolean
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : '-'
}

export function SalidasInventarioTable({
  isLoading,
  resumen,
  rows,
  showCosts,
}: SalidasInventarioTableProps) {
  const colSpan = showCosts ? 12 : 10

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Movimientos</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(resumen?.cantidadMovimientos)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Lineas</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(resumen?.cantidadLineas)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Cantidad salida</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportDecimal(resumen?.cantidadTotalSalida)}
          </p>
        </div>
        {showCosts ? (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Valor salida</p>
            <p className="text-lg font-bold text-slate-950">
              S/ {formatReportDecimal(resumen?.valorTotalSalida)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Movimiento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              {showCosts ? <th className="px-4 py-3 text-right">Costo aplicado</th> : null}
              {showCosts ? <th className="px-4 py-3 text-right">Valor salida</th> : null}
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Observacion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  Consultando salidas...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  No hay salidas para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-cyan-50/40" key={`${row.movimientoId}-${row.codigoProducto}`}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementNumberBadge number={row.numeroMovimiento} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementTypeBadge
                      label={formatMovimientoLabel(row.tipoMovimiento)}
                      type={row.tipoMovimiento}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {row.estado ? formatMovimientoLabel(row.estado) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(row.fecha)}
                  </td>
                  <td className="min-w-60 px-4 py-3 font-medium text-slate-700">
                    {row.almacenOrigen || '-'}
                  </td>
                  <td className="min-w-44 px-4 py-3 text-slate-600">
                    {row.ubicacionOrigen || '-'}
                  </td>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <ProductCodeBadge code={row.codigoProducto} />
                      <p className="font-medium leading-5 text-slate-950">{row.nombreProducto || '-'}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.cantidad)}
                  </td>
                  {showCosts ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatReportDecimal(row.costoPromedioAplicado)}
                    </td>
                  ) : null}
                  {showCosts ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                      S/ {formatReportDecimal(row.valorSalida)}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {row.usuario || '-'}
                  </td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">
                    {row.observacion || '-'}
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
