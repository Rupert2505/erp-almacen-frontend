import type { StockItem } from '../types/stock.types'

type StockTableProps = {
  isLoading: boolean
  rows: StockItem[]
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

export function StockTable({ isLoading, rows }: StockTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto codigo</th>
              <th className="px-4 py-3">Producto nombre</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Cantidad actual</th>
              <th className="px-4 py-3 text-right">Costo promedio</th>
              <th className="px-4 py-3">Ultimo movimiento</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  Cargando stock...
                </td>
              </tr>
            ) : null}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  No se encontraron registros de stock.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? rows.map((row) => {
                  const hasStock = Number(row.cantidadActual) > 0

                  return (
                    <tr className="hover:bg-slate-50" key={row.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {row.productoCodigo}
                      </td>
                      <td className="min-w-64 px-4 py-3 text-slate-900">{row.productoNombre}</td>
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
                        {row.costoPromedio === null || row.costoPromedio === undefined
                          ? '-'
                          : moneyFormatter.format(row.costoPromedio)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(row.fechaUltimoMovimiento)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            hasStock ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
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
