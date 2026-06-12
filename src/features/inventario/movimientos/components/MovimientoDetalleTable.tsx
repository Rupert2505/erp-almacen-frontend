import type { MovimientoDetalle } from '../types/movimiento.types'

type MovimientoDetalleTableProps = {
  detalles: MovimientoDetalle[]
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 4,
})

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

export function MovimientoDetalleTable({ detalles }: MovimientoDetalleTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Ubicacion origen</th>
              <th className="px-4 py-3">Ubicacion destino</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Costo unitario</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Observacion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {detalles.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                  Sin detalles.
                </td>
              </tr>
            ) : null}
            {detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td className="min-w-56 px-4 py-3 text-slate-900">
                  {detalle.productoCodigo
                    ? `${detalle.productoCodigo} - ${detalle.productoNombre ?? ''}`
                    : (detalle.productoNombre ?? '-')}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {detalle.ubicacionOrigenCodigo ?? '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {detalle.ubicacionDestinoCodigo ?? '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {numberFormatter.format(detalle.cantidad)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {detalle.costoUnitario === null || detalle.costoUnitario === undefined
                    ? '-'
                    : moneyFormatter.format(detalle.costoUnitario)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {detalle.totalLinea === null || detalle.totalLinea === undefined
                    ? '-'
                    : moneyFormatter.format(detalle.totalLinea)}
                </td>
                <td className="min-w-48 px-4 py-3 text-slate-600">
                  {detalle.observacion ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
