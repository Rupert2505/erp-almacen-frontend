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
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto codigo</th>
              <th className="px-4 py-3">Producto nombre</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Cantidad actual</th>
              <th className="px-4 py-3 text-right">Costo promedio</th>
              <th className="px-4 py-3 text-right">Valor total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                  Consultando stock valorizado...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                  No hay stock valorizado para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-slate-50" key={`${row.productoId}-${row.almacenId}-${row.ubicacionId}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                    {row.productoCodigo}
                  </td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">{row.productoNombre}</td>
                  <td className="min-w-52 px-4 py-3 text-slate-600">
                    {row.almacenNombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.ubicacionNombre || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {formatNumber(row.cantidadActual)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {formatNumber(row.costoPromedio)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
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
