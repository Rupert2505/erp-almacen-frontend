import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import type {
  StockValorizadoItem,
  StockValorizadoResumen,
} from '../types/reporteInventario.types'
import { formatReportCount, formatReportDecimal } from '../utils/reportNumberFormat'

type StockValorizadoTableProps = {
  rows: StockValorizadoItem[]
  isLoading: boolean
  resumen?: StockValorizadoResumen | null
  totalLines?: number | null
  showCosts: boolean
}

function estadoClass(estado?: string) {
  if (estado === 'BAJO_MINIMO') {
    return 'bg-amber-100 text-amber-800'
  }

  if (estado === 'SIN_STOCK') {
    return 'bg-slate-100 text-slate-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

function estadoLabel(estado?: string) {
  if (estado === 'BAJO_MINIMO') {
    return 'Bajo minimo'
  }

  if (estado === 'SIN_STOCK') {
    return 'Sin stock'
  }

  return 'Con stock'
}

export function StockValorizadoTable({
  isLoading,
  resumen,
  rows,
  showCosts,
  totalLines,
}: StockValorizadoTableProps) {
  const colSpan = showCosts ? 9 : 7

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Productos</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(resumen?.cantidadProductos)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Lineas</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(totalLines)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Cantidad total</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportDecimal(resumen?.cantidadUnidades)}
          </p>
        </div>
        {showCosts ? (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Valor total</p>
            <p className="text-lg font-bold text-slate-950">
              S/ {formatReportDecimal(resumen?.valorTotalInventario)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">U.M.</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Stock minimo</th>
              {showCosts ? <th className="px-4 py-3 text-right">Costo promedio</th> : null}
              {showCosts ? <th className="px-4 py-3 text-right">Valor total</th> : null}
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  Consultando stock valorizado...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  No hay stock valorizado para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-cyan-50/40" key={`${row.productoId}-${row.almacenId}-${row.ubicacionId}`}>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <ProductCodeBadge code={row.codigoProducto} />
                      <p className="font-medium leading-5 text-slate-950">{row.nombreProducto}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {row.unidadMedida || '-'}
                  </td>
                  <td className="min-w-60 px-4 py-3 font-medium text-slate-700">
                    {row.almacen || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.ubicacion || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.cantidadActual)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.stockMinimo)}
                  </td>
                  {showCosts ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatReportDecimal(row.costoPromedio)}
                    </td>
                  ) : null}
                  {showCosts ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                      S/ {formatReportDecimal(row.valorTotal)}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${estadoClass(
                        row.estadoStock,
                      )}`}
                    >
                      {estadoLabel(row.estadoStock)}
                    </span>
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
