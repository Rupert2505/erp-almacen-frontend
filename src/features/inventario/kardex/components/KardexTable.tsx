import { formatMovimientoLabel } from '../../movimientos/utils/movimientoLabels'
import type { KardexItem } from '../types/kardex.types'

type KardexTableProps = {
  isLoading: boolean
  rows: KardexItem[]
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 4,
})

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function money(value?: number | null) {
  return value === null || value === undefined ? '-' : moneyFormatter.format(value)
}

export function KardexTable({ isLoading, rows }: KardexTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Numero movimiento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Entrada</th>
              <th className="px-4 py-3 text-right">Salida</th>
              <th className="px-4 py-3 text-right">Saldo anterior</th>
              <th className="px-4 py-3 text-right">Saldo final</th>
              <th className="px-4 py-3 text-right">Costo unitario</th>
              <th className="px-4 py-3 text-right">Costo promedio</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Observacion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={14}>
                  Cargando kardex...
                </td>
              </tr>
            ) : null}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={14}>
                  No se encontraron movimientos de kardex.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? rows.map((row) => (
                  <tr className="hover:bg-cyan-50/40" key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(row.fechaMovimiento)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-semibold text-slate-950">{row.numeroMovimiento}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {formatMovimientoLabel(row.tipoMovimiento)}
                      </span>
                    </td>
                    <td className="min-w-72 px-4 py-3">
                      <div className="space-y-1">
                        <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {row.productoCodigo}
                        </span>
                        <p className="font-medium leading-5 text-slate-950">{row.productoNombre}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.almacenCodigo} - {row.almacenNombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.ubicacionCodigo ? `${row.ubicacionCodigo} - ${row.ubicacionNombre ?? ''}` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                      {row.entrada > 0 ? numberFormatter.format(row.entrada) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                      {row.salida > 0 ? numberFormatter.format(row.salida) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                      {numberFormatter.format(row.saldoAnterior)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                      {numberFormatter.format(row.saldoFinal)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                      {money(row.costoUnitario)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                      {money(row.costoPromedio)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.username ?? '-'}</td>
                    <td className="min-w-56 px-4 py-3 text-slate-600">{row.observacion ?? '-'}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
