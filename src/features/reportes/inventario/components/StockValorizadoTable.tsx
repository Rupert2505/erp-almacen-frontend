import type { StockValorizadoItem } from '../types/reporteInventario.types'

type StockValorizadoTableProps = {
  rows: StockValorizadoItem[]
  isLoading: boolean
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

function formatNumber(value?: number | null) {
  return value === undefined || value === null ? '-' : numberFormatter.format(value)
}

export function StockValorizadoTable({ isLoading, rows }: StockValorizadoTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Costo promedio</th>
              <th className="px-4 py-3 text-right">Valor total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  Consultando stock valorizado...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  No hay stock valorizado para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-cyan-50/40" key={`${row.productoId}-${row.almacenId}-${row.ubicacionId}`}>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {row.productoCodigo}
                      </span>
                      <p className="font-medium leading-5 text-slate-950">{row.productoNombre}</p>
                    </div>
                  </td>
                  <td className="min-w-60 px-4 py-3 font-medium text-slate-700">
                    {row.almacenNombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.ubicacionNombre || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatNumber(row.cantidadActual)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatNumber(row.costoPromedio)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                    {formatNumber(row.valorTotal)}
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
