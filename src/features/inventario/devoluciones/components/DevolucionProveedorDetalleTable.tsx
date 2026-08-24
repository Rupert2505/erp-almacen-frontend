import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { ProductCodeBadge } from '../../../../shared/components/ProductCodeBadge'
import { formatOptionalCurrency, formatOptionalNumber } from '../../../../shared/utils/numberFormat'
import type { MovimientoDetalleDevolucionPendiente } from '../../movimientos/types/movimiento.types'
import type { DevolucionProveedorFormInput } from '../schemas/devolucionProveedorSchema'

type DevolucionProveedorDetalleTableProps = {
  detalles: MovimientoDetalleDevolucionPendiente[]
  errors: FieldErrors<DevolucionProveedorFormInput>
  register: UseFormRegister<DevolucionProveedorFormInput>
}

export function DevolucionProveedorDetalleTable({
  detalles,
  errors,
  register,
}: DevolucionProveedorDetalleTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Sel.</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Almacen</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3 text-right">Recibida</th>
              <th className="px-4 py-3 text-right">Devuelta</th>
              <th className="px-4 py-3 text-right">Pendiente</th>
              <th className="px-4 py-3 text-right">Cantidad a devolver</th>
              <th className="px-4 py-3 text-right">Costo original</th>
              <th className="px-4 py-3">Observacion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {detalles.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                  No hay cantidades pendientes para devolver.
                </td>
              </tr>
            ) : null}
            {detalles.map((detalle, index) => {
              const lineErrors = errors.detalles?.[index]
              const disabled = Number(detalle.cantidadPendienteDevolver) <= 0

              return (
                <tr className="hover:bg-cyan-50/70" key={detalle.movimientoDetalleOrigenId}>
                  <td className="px-4 py-3 align-top">
                    <input
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      disabled={disabled}
                      type="checkbox"
                      {...register(`detalles.${index}.seleccionado`)}
                    />
                    <input
                      type="hidden"
                      {...register(`detalles.${index}.movimientoDetalleOrigenId`, {
                        valueAsNumber: true,
                      })}
                    />
                    <input
                      type="hidden"
                      {...register(`detalles.${index}.productoId`, { valueAsNumber: true })}
                    />
                    <input
                      type="hidden"
                      {...register(`detalles.${index}.cantidadPendienteDevolver`, {
                        valueAsNumber: true,
                      })}
                    />
                  </td>
                  <td className="min-w-64 px-4 py-3 align-top">
                    <div className="space-y-1">
                      {detalle.productoCodigo ? (
                        <ProductCodeBadge code={detalle.productoCodigo} />
                      ) : null}
                      <p className="font-medium leading-5 text-slate-950">
                        {detalle.productoNombre ?? '-'}
                      </p>
                    </div>
                  </td>
                  <td className="min-w-48 px-4 py-3 align-top text-slate-600">
                    {detalle.almacenCodigo ? (
                      <span className="inline-flex rounded bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                        {detalle.almacenCodigo}
                      </span>
                    ) : (
                      '-'
                    )}
                    {detalle.almacenNombre ? (
                      <p className="mt-1 text-xs text-slate-500">{detalle.almacenNombre}</p>
                    ) : null}
                  </td>
                  <td className="min-w-44 px-4 py-3 align-top text-slate-600">
                    {detalle.ubicacionCodigo ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top text-slate-600">
                    {formatOptionalNumber(detalle.cantidadRecibida, { maximumFractionDigits: 4 })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top text-slate-600">
                    {formatOptionalNumber(detalle.cantidadDevueltaConfirmada, {
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top font-semibold text-slate-900">
                    {formatOptionalNumber(detalle.cantidadPendienteDevolver, {
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="min-w-44 px-4 py-3 align-top">
                    <input
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-right text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500"
                      disabled={disabled}
                      min="0.0001"
                      step="0.000001"
                      type="number"
                      {...register(`detalles.${index}.cantidad`)}
                    />
                    {lineErrors?.cantidad ? (
                      <span className="mt-1 block text-xs text-red-600">
                        {lineErrors.cantidad.message}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top text-slate-600">
                    {formatOptionalCurrency(detalle.costoDocumentoUnitario)}
                  </td>
                  <td className="min-w-56 px-4 py-3 align-top">
                    <input
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      maxLength={255}
                      type="text"
                      {...register(`detalles.${index}.observacion`)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
