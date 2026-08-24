import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import type { ProductoBajoMinimoItem } from '../types/reporteInventario.types'
import { formatReportDecimal } from '../utils/reportNumberFormat'

type ProductosBajoMinimoTableProps = {
  rows: ProductoBajoMinimoItem[]
  isLoading: boolean
}

export function ProductosBajoMinimoTable({ isLoading, rows }: ProductosBajoMinimoTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3 text-right">Cantidad actual</th>
              <th className="px-4 py-3 text-right">Stock minimo</th>
              <th className="px-4 py-3 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  Consultando productos bajo minimo...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  No hay productos bajo minimo para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-amber-50/40" key={`${row.productoId}-${row.almacenId}`}>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <ProductCodeBadge code={row.productoCodigo} />
                      <p className="font-medium leading-5 text-slate-950">{row.productoNombre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.categoriaNombre || '-'}</td>
                  <td className="min-w-60 px-4 py-3 font-medium text-slate-700">
                    {row.almacenNombre || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.cantidadActual)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.stockMinimo)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                      {formatReportDecimal(row.diferencia)}
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
