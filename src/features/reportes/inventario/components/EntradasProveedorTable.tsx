import type { EntradaProveedorItem } from '../types/reporteInventario.types'

type EntradasProveedorTableProps = {
  rows: EntradaProveedorItem[]
  isLoading: boolean
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

function formatNumber(value?: number | null) {
  return value === undefined || value === null ? '-' : numberFormatter.format(value)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : '-'
}

export function EntradasProveedorTable({ isLoading, rows }: EntradasProveedorTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Proveedor documento</th>
              <th className="px-4 py-3">Proveedor razon social</th>
              <th className="px-4 py-3">Numero movimiento</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Documento referencia</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Costo unitario</th>
              <th className="px-4 py-3 text-right">Total linea</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={9}>
                  Consultando entradas por proveedor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={9}>
                  No hay entradas por proveedor para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-slate-50" key={`${row.movimientoId}-${row.productoCodigo}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                    {row.proveedorDocumento || '-'}
                  </td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">
                    {row.proveedorRazonSocial || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {row.numeroMovimiento}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(row.fechaMovimiento)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.documentoReferencia || '-'}
                  </td>
                  <td className="min-w-60 px-4 py-3 text-slate-600">
                    <span className="font-medium text-slate-800">{row.productoCodigo}</span>
                    <br />
                    {row.productoNombre || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {formatNumber(row.cantidad)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {formatNumber(row.costoUnitario)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                    {formatNumber(row.totalLinea)}
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
