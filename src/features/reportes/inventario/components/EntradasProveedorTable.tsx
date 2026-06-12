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
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Movimiento</th>
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
                <td className="px-4 py-6 text-center text-slate-500" colSpan={8}>
                  Consultando entradas por proveedor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={8}>
                  No hay entradas por proveedor para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-cyan-50/40" key={`${row.movimientoId}-${row.productoCodigo}`}>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {row.proveedorDocumento || 'Sin documento'}
                      </span>
                      <p className="font-medium leading-5 text-slate-950">
                        {row.proveedorRazonSocial || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-semibold text-slate-950">{row.numeroMovimiento}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(row.fechaMovimiento)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.documentoReferencia || '-'}
                  </td>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {row.productoCodigo}
                      </span>
                      <p className="font-medium leading-5 text-slate-950">{row.productoNombre || '-'}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatNumber(row.cantidad)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatNumber(row.costoUnitario)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
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
