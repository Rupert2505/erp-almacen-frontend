import { MovementNumberBadge } from '../../../../shared/components/MovementNumberBadge'
import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import type {
  EntradaProveedorItem,
  EntradaProveedorResumen,
} from '../types/reporteInventario.types'
import { formatReportCount, formatReportDecimal } from '../utils/reportNumberFormat'

type EntradasProveedorTableProps = {
  rows: EntradaProveedorItem[]
  isLoading: boolean
  resumen?: EntradaProveedorResumen | null
  showCosts: boolean
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : '-'
}

function joinDocumento(serie?: string | null, numero?: string | null) {
  if (!serie && !numero) {
    return '-'
  }

  return [serie, numero].filter(Boolean).join('-')
}

export function EntradasProveedorTable({
  isLoading,
  resumen,
  rows,
  showCosts,
}: EntradasProveedorTableProps) {
  const colSpan = showCosts ? 11 : 9

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Movimientos</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(resumen?.cantidadMovimientos)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Proveedores</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(resumen?.cantidadProveedores)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Productos</p>
          <p className="text-lg font-bold text-slate-950">
            {formatReportCount(resumen?.cantidadProductos)}
          </p>
        </div>
        {showCosts ? (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Total documentario</p>
            <p className="text-lg font-bold text-slate-950">
              S/ {formatReportDecimal(resumen?.totalDocumentario)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Movimiento</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Guia</th>
              <th className="px-4 py-3">Comprobante</th>
              <th className="px-4 py-3">Orden compra</th>
              <th className="px-4 py-3">Almacen destino</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              {showCosts ? <th className="px-4 py-3 text-right">Costo unitario</th> : null}
              {showCosts ? <th className="px-4 py-3 text-right">Valor linea</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  Consultando entradas por proveedor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
                  No hay entradas por proveedor para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="hover:bg-cyan-50/40" key={`${row.movimientoId}-${row.codigoProducto}`}>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {row.proveedorNumeroDocumento || 'Sin documento'}
                      </span>
                      <p className="font-medium leading-5 text-slate-950">
                        {row.proveedorRazonSocial || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <MovementNumberBadge number={row.numeroMovimiento} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(row.fechaMovimiento)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {joinDocumento(row.guiaSerie, row.guiaNumero)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="space-y-1">
                      <p>{row.comprobanteTipo || 'Sin comprobante'}</p>
                      <p className="text-xs text-slate-500">
                        {joinDocumento(row.comprobanteSerie, row.comprobanteNumero)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.ordenCompra || '-'}
                  </td>
                  <td className="min-w-52 px-4 py-3 text-slate-600">
                    {row.almacenDestino || '-'}
                  </td>
                  <td className="min-w-72 px-4 py-3">
                    <div className="space-y-1">
                      <ProductCodeBadge code={row.codigoProducto} />
                      <p className="font-medium leading-5 text-slate-950">{row.nombreProducto || '-'}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatReportDecimal(row.cantidad)}
                  </td>
                  {showCosts ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatReportDecimal(row.costoUnitario)}
                    </td>
                  ) : null}
                  {showCosts ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-950">
                      S/ {formatReportDecimal(row.valorLinea)}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
