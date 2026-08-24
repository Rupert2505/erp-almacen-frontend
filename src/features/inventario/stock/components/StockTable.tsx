import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatOptionalCurrency } from '../../../../shared/utils/numberFormat'
import type { StockItem } from '../types/stock.types'

type StockTableProps = {
  isLoading: boolean
  rows: StockItem[]
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 4,
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

export function StockTable({ isLoading, rows }: StockTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Costo promedio</th>
              <th className="px-4 py-3">Ultimo movimiento</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  Cargando stock...
                </td>
              </tr>
            ) : null}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                  No se encontraron registros de stock.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? rows.map((row) => {
                  const hasStock = Number(row.cantidadActual) > 0

                  return (
                    <tr className="hover:bg-cyan-50/40" key={row.id}>
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
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span
                          className={`font-semibold tabular-nums ${
                            hasStock ? 'text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          {numberFormatter.format(row.cantidadActual)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                        {formatOptionalCurrency(row.costoPromedio)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(row.fechaUltimoMovimiento)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            hasStock
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {hasStock ? 'Con stock' : 'Sin stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
