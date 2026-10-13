import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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

type SalidasOsGroup = {
  os: string
  rows: SalidaValorizadaOsResponse[]
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

function osLabel(row: SalidaValorizadaOsResponse) {
  return row.ordenTrabajo?.trim() || 'SIN OS'
}

function groupRowsByOs(rows: SalidaValorizadaOsResponse[]) {
  const grouped = new Map<string, SalidaValorizadaOsResponse[]>()

  rows.forEach((row) => {
    const os = osLabel(row)
    const osRows = grouped.get(os) ?? []
    osRows.push(row)
    grouped.set(os, osRows)
  })

  return [...grouped.entries()]
    .sort(([first], [second]) =>
      first.localeCompare(second, 'es', { numeric: true, sensitivity: 'base' }),
    )
    .map(([os, osRows]) => ({ os, rows: osRows })) satisfies SalidasOsGroup[]
}

function SalidaDetailRow({
  row,
  showCosts,
}: {
  row: SalidaValorizadaOsResponse
  showCosts: boolean
}) {
  const negativeDifference = isNegative(row.diferenciaComercialSinIgv)

  return (
    <tr className="hover:bg-cyan-50/40">
      <td className="whitespace-nowrap border-l-4 border-cyan-200 px-4 py-3 text-slate-600">
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
        {negativeDifference ? 'El valor comercial es inferior al costo de inventario.' : '-'}
      </td>
    </tr>
  )
}

export function SalidasPorOsTable({
  isLoading,
  resumenPorOs,
  rows,
  showCosts,
}: SalidasPorOsTableProps) {
  const [expandedOs, setExpandedOs] = useState<Set<string>>(() => new Set())
  const groups = groupRowsByOs(rows)
  const summaries = new Map(
    (resumenPorOs ?? []).map((summary) => [summary.ordenTrabajo?.trim() || 'SIN OS', summary]),
  )
  const colSpan = showCosts ? 19 : 8
  const allExpanded = groups.length > 0 && groups.every((group) => expandedOs.has(group.os))

  const toggleGroup = (os: string) => {
    setExpandedOs((current) => {
      const next = new Set(current)

      if (next.has(os)) {
        next.delete(os)
      } else {
        next.add(os)
      }

      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h3 className="font-semibold text-slate-950">Detalle agrupado por Orden de Servicio</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {groups.length} OS en esta pagina. Expanda solo las que necesite revisar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || groups.length === 0 || allExpanded}
            onClick={() => setExpandedOs(new Set(groups.map((group) => group.os)))}
            type="button"
          >
            Expandir todo
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || expandedOs.size === 0}
            onClick={() => setExpandedOs(new Set())}
            type="button"
          >
            Contraer todo
          </button>
        </div>
      </div>

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
            ) : groups.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  No hay salidas de venta por OS para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const isExpanded = expandedOs.has(group.os)
                const summary = summaries.get(group.os)
                const movementCount =
                  summary?.cantidadMovimientos ??
                  new Set(group.rows.map((row) => row.movimientoId)).size
                const itemCount = summary?.cantidadItems ?? group.rows.length

                return (
                  <Fragment key={group.os}>
                    <tr className="bg-cyan-50/80">
                      <td className="p-0" colSpan={colSpan}>
                        <button
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} ${group.os}`}
                          className="flex w-full min-w-max items-center gap-8 px-4 py-3 text-left hover:bg-cyan-100/70"
                          onClick={() => toggleGroup(group.os)}
                          type="button"
                        >
                          <span className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown aria-hidden="true" className="text-cyan-700" size={17} />
                            ) : (
                              <ChevronRight aria-hidden="true" className="text-cyan-700" size={17} />
                            )}
                            <span className="font-bold text-slate-950">{group.os}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                              {movementCount} mov. - {itemCount} items
                            </span>
                          </span>

                          {showCosts && summary ? (
                            <span className="flex items-center gap-5 text-xs text-slate-600">
                              <span>
                                Inventario:{' '}
                                <strong className="text-slate-900">
                                  {formatOptionalCurrency(summary.costoTotalInventario)}
                                </strong>
                              </span>
                              <span>
                                Comercial s/IGV:{' '}
                                <strong className="text-slate-900">
                                  {formatOptionalCurrency(summary.valorComercialTotalSinIgv)}
                                </strong>
                              </span>
                              <span>
                                IGV:{' '}
                                <strong className="text-slate-900">
                                  {formatOptionalCurrency(summary.igvTotal)}
                                </strong>
                              </span>
                              <span>
                                Precio c/IGV:{' '}
                                <strong className="text-slate-950">
                                  {formatOptionalCurrency(summary.precioTotalConIgv)}
                                </strong>
                              </span>
                              <span>
                                Diferencia:{' '}
                                <strong
                                  className={
                                    isNegative(summary.diferenciaComercialSinIgv)
                                      ? 'text-amber-700'
                                      : 'text-emerald-700'
                                  }
                                >
                                  {formatOptionalCurrency(summary.diferenciaComercialSinIgv)}
                                </strong>
                              </span>
                            </span>
                          ) : null}
                        </button>
                      </td>
                    </tr>
                    {isExpanded
                      ? group.rows.map((row, index) => (
                          <SalidaDetailRow
                            key={`${row.movimientoId}-${row.productoId}-${index}`}
                            row={row}
                            showCosts={showCosts}
                          />
                        ))
                      : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
