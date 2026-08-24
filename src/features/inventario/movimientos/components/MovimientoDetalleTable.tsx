import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatOptionalCurrency } from '../../../../shared/utils/numberFormat'
import type { MovimientoDetalle } from '../types/movimiento.types'

type MovimientoDetalleTableProps = {
  detalles: MovimientoDetalle[]
}

const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 4,
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
              <th className="px-4 py-3 text-right">Costo inventariable</th>
              <th className="px-4 py-3 text-right">Valor inventariable</th>
              <th className="px-4 py-3 text-right">Costo documental</th>
              <th className="px-4 py-3 text-right">Valor stock</th>
              <th className="px-4 py-3 text-right">Valor documento</th>
              <th className="px-4 py-3 text-right">Diferencia</th>
              <th className="px-4 py-3">Observacion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {detalles.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={11}>
                  Sin detalles.
                </td>
              </tr>
            ) : null}
            {detalles.map((detalle) => (
              <tr key={detalle.id}>
                <td className="min-w-56 px-4 py-3">
                  <div className="space-y-1">
                    {detalle.productoCodigo ? <ProductCodeBadge code={detalle.productoCodigo} /> : null}
                    <p className="font-medium leading-5 text-slate-950">
                      {detalle.productoNombre ?? '-'}
                    </p>
                  </div>
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
                  {formatOptionalCurrency(
                    detalle.costoUnitarioInventariable ?? detalle.costoUnitario,
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {formatOptionalCurrency(detalle.totalInventariable ?? detalle.totalLinea)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {formatOptionalCurrency(detalle.costoDocumentoUnitario)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {formatOptionalCurrency(detalle.valorStock)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
                  {formatOptionalCurrency(detalle.valorDocumento)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-700">
                  {formatOptionalCurrency(detalle.diferenciaValorizacion)}
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
