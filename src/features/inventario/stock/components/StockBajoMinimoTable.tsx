import type { StockBajoMinimoItem } from '../types/stock.types'

type StockBajoMinimoTableProps = {
  isLoading: boolean
  rows: StockBajoMinimoItem[]
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 4,
})

export function StockBajoMinimoTable({ isLoading, rows }: StockBajoMinimoTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Cantidad actual</th>
              <th className="px-4 py-3 text-right">Stock minimo</th>
              <th className="px-4 py-3 text-right">Diferencia</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  Cargando stock bajo minimo...
                </td>
              </tr>
            ) : null}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  No hay productos bajo minimo con los filtros actuales.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? rows.map((row) => (
                  <tr className="hover:bg-amber-50/40" key={`${row.productoId}-${row.almacenId}-${row.ubicacionId ?? 'sin'}`}>
                    <td className="min-w-64 px-4 py-3 text-slate-900">
                      <span className="font-medium">{row.productoCodigo}</span> - {row.productoNombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.almacenCodigo} - {row.almacenNombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.ubicacionCodigo
                        ? `${row.ubicacionCodigo} - ${row.ubicacionNombre ?? ''}`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {numberFormatter.format(row.cantidadActual)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                      {numberFormatter.format(row.stockMinimo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-amber-700">
                      {numberFormatter.format(row.diferencia)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Bajo minimo
                      </span>
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
