import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatApiDateTime } from '../../../../shared/utils/dateTime'
import {
  formatOptionalCurrency,
  toFiniteNumber,
} from '../../../../shared/utils/numberFormat'
import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type {
  SalidaValorizadaOsResponse,
  SalidaValorizadaOsResumenResponse,
} from '../types/reporteInventario.types'
import { formatReportDecimal, formatReportPercent } from '../utils/reportNumberFormat'

type SalidasPorOsTableProps = {
  isLoading: boolean
  resumenPorOs?: SalidaValorizadaOsResumenResponse[] | null
  rows: SalidaValorizadaOsResponse[]
  showCosts: boolean
}

function estadoClass(estado: SalidaValorizadaOsResponse['estado']) {
  if (estado === 'ANULADO') {
    return 'bg-red-100 text-red-700'
  }

  if (estado === 'CONFIRMADO') {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-700'
}

function isNegative(value?: number | null) {
  const numberValue = toFiniteNumber(value)
  return numberValue !== null && numberValue < 0
}

export function SalidasPorOsTable({
  isLoading,
  resumenPorOs,
  rows,
  showCosts,
}: SalidasPorOsTableProps) {
  const summaries = resumenPorOs ?? []
  const colSpan = showCosts ? 19 : 8

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="font-semibold text-slate-950">Resumen por Orden de Servicio</h3>
          <p className="mt-1 text-sm text-slate-500">
            Totales calculados y devueltos por el backend para cada OS.
          </p>
        </div>
        {summaries.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {isLoading ? 'Consultando resumen por OS...' : 'No hay resumen para los filtros seleccionados.'}
          </p>
        ) : (
          <div className="grid gap-4 p-4 xl:grid-cols-2">
            {summaries.map((summary) => (
              <article
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
                key={summary.ordenTrabajo}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{summary.ordenTrabajo || '-'}</p>
                  <p className="text-xs font-medium text-slate-500">
                    {summary.cantidadMovimientos} movimiento(s) · {summary.cantidadItems} item(s)
                  </p>
                </div>
                {showCosts ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Inventario</p>
                      <p className="font-semibold text-slate-800">
                        {formatOptionalCurrency(summary.costoTotalInventario)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Comercial sin IGV
                      </p>
                      <p className="font-semibold text-slate-800">
                        {formatOptionalCurrency(summary.valorComercialTotalSinIgv)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">IGV</p>
                      <p className="font-semibold text-slate-800">
                        {formatOptionalCurrency(summary.igvTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Precio con IGV
                      </p>
                      <p className="font-semibold text-slate-950">
                        {formatOptionalCurrency(summary.precioTotalConIgv)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Diferencia comercial
                      </p>
                      <p
                        className={`font-semibold ${
                          isNegative(summary.diferenciaComercialSinIgv)
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {formatOptionalCurrency(summary.diferenciaComercialSinIgv)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Movimiento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">OS</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">U.M.</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                {showCosts ? (
                  <th
                    className="px-4 py-3 text-right"
                    title="Costo historico determinado por el motor de inventario. Se muestra unicamente para analisis."
                  >
                    Costo inventario unit.
                  </th>
                ) : null}
                {showCosts ? <th className="px-4 py-3 text-right">Costo inventario total</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Costo base comercial s/IGV</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Recargo</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Venta unit. s/IGV</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Venta total s/IGV</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">IGV unit.</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">IGV total</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Precio unit. c/IGV</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Precio total c/IGV</th> : null}
                {showCosts ? <th className="px-4 py-3 text-right">Diferencia comercial</th> : null}
                <th className="px-4 py-3">Analisis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                    Consultando salidas por Orden de Servicio...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                    No hay salidas de venta por OS para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const negativeDifference = isNegative(row.diferenciaComercialSinIgv)

                  return (
                    <tr
                      className="hover:bg-cyan-50/40"
                      key={`${row.movimientoId}-${row.productoId}-${index}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatApiDateTime(row.fecha)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <MovementNumberBadge number={row.numeroMovimiento} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass(
                            row.estado,
                          )}`}
                        >
                          {formatMovimientoLabel(row.estado)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        {row.ordenTrabajo || '-'}
                      </td>
                      <td className="min-w-72 px-4 py-3">
                        <div className="space-y-1">
                          <ProductCodeBadge code={row.codigoProducto} />
                          <p className="font-medium leading-5 text-slate-950">
                            {row.descripcionProducto || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row.unidadMedida || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatReportDecimal(row.cantidad)}
                      </td>
                      {showCosts ? (
                        <>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.costoInventarioUnitario)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.costoInventarioTotal)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.costoBaseComercialUnitarioSinIgv)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatReportPercent(row.recargoAplicadoPct)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.valorVentaUnitarioSinIgv)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.valorVentaTotalSinIgv)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.igvUnitario)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.igvTotal)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                            {formatOptionalCurrency(row.precioVentaUnitarioConIgv)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                            {formatOptionalCurrency(row.precioVentaTotalConIgv)}
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                              negativeDifference ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {formatOptionalCurrency(row.diferenciaComercialSinIgv)}
                          </td>
                        </>
                      ) : null}
                      <td className="min-w-64 px-4 py-3 text-xs text-slate-600">
                        {negativeDifference
                          ? 'El valor comercial es inferior al costo de inventario.'
                          : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
