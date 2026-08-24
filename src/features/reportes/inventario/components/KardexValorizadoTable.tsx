import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { MovementTypeBadge } from '../../../../shared/components/MovementTypeBadge'
import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type { KardexValorizadoReporte } from '../types/reporteInventario.types'
import { formatReportDecimal } from '../utils/reportNumberFormat'

type KardexValorizadoTableProps = {
  isLoading: boolean
  reporte?: KardexValorizadoReporte
  showCosts: boolean
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : '-'
}

export function KardexValorizadoTable({
  isLoading,
  reporte,
  showCosts,
}: KardexValorizadoTableProps) {
  const rows = reporte?.detalles ?? []
  const colSpan = showCosts ? 13 : 9

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Producto</p>
          <div className="mt-1 space-y-1">
            <ProductCodeBadge code={reporte?.cabecera?.codigoProducto} />
            <p className="font-semibold text-slate-950">
              {reporte?.cabecera?.nombreProducto || 'Seleccione un producto'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Entradas</p>
          <p className="text-lg font-bold text-emerald-700">
            {formatReportDecimal(reporte?.resumen?.totalEntradas)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Salidas</p>
          <p className="text-lg font-bold text-red-700">
            {formatReportDecimal(reporte?.resumen?.totalSalidas)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Saldo final</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportDecimal(reporte?.resumen?.saldoFinalCantidad)}
          </p>
        </div>
        {showCosts ? (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Valor saldo</p>
            <p className="text-lg font-bold text-slate-950">
              S/ {formatReportDecimal(reporte?.resumen?.valorSaldoFinal)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Movimiento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3 text-right">Entrada</th>
              <th className="px-4 py-3 text-right">Salida</th>
              <th className="px-4 py-3 text-right">Saldo anterior</th>
              <th className="px-4 py-3 text-right">Saldo final</th>
              {showCosts ? <th className="px-4 py-3 text-right">Costo mov.</th> : null}
              {showCosts ? <th className="px-4 py-3 text-right">Costo prom.</th> : null}
              {showCosts ? <th className="px-4 py-3 text-right">Valor mov.</th> : null}
              {showCosts ? <th className="px-4 py-3 text-right">Valor saldo</th> : null}
              <th className="px-4 py-3">Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  Consultando kardex valorizado...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  Seleccione un producto o ajuste los filtros para consultar kardex.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const valorMovimiento =
                  row.valorEntrada && row.valorEntrada > 0 ? row.valorEntrada : row.valorSalida

                return (
                  <tr className="hover:bg-cyan-50/40" key={`${row.movimientoId}-${row.fecha}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(row.fecha)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <MovementNumberBadge number={row.numeroMovimiento} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <MovementTypeBadge
                        label={formatMovimientoLabel(row.tipoMovimiento)}
                        type={row.tipoMovimiento}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.documentoReferencia || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                      {formatReportDecimal(row.cantidadEntrada)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                      {formatReportDecimal(row.cantidadSalida)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatReportDecimal(row.saldoAnterior)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                      {formatReportDecimal(row.saldoFinal)}
                    </td>
                    {showCosts ? (
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatReportDecimal(row.costoUnitarioMovimiento)}
                      </td>
                    ) : null}
                    {showCosts ? (
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatReportDecimal(row.costoPromedio)}
                      </td>
                    ) : null}
                    {showCosts ? (
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        S/ {formatReportDecimal(valorMovimiento)}
                      </td>
                    ) : null}
                    {showCosts ? (
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                        S/ {formatReportDecimal(row.valorSaldo)}
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.usuario || '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
