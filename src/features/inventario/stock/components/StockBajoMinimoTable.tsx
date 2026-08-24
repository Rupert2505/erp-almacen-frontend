import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
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
                  <tr
                    className="hover:bg-amber-50/50"
                    key={`${row.productoId}-${row.almacenId}-${row.ubicacionId ?? 'sin'}`}
                  >
                    <td className="min-w-72 px-4 py-3">
                      <div className="space-y-1">
                        <ProductCodeBadge code={row.productoCodigo} />
                        <p className="font-medium leading-5 text-slate-950">{row.productoNombre}</p>
                      </div>
                    </td>
                    <td className="min-w-72 px-4 py-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {row.almacenCodigo}
                        </span>
                        <p className="leading-5 text-slate-700">{row.almacenNombre}</p>
                      </div>
                    </td>
                    <td className="min-w-64 px-4 py-3">
                      {row.ubicacionCodigo ? (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {row.ubicacionCodigo}
                          </span>
                          <p className="leading-5 text-slate-700">{row.ubicacionNombre ?? '-'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin ubicacion</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                      {numberFormatter.format(row.cantidadActual)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                      {numberFormatter.format(row.stockMinimo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-amber-700">
                      {numberFormatter.format(row.diferencia)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
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
