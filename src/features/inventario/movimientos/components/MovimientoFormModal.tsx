import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { Almacen } from '../../../almacenes/types/almacen.types'
import type { Ubicacion } from '../../../almacenes/types/ubicacion.types'
import type { Producto } from '../../../productos/types/producto.types'
import type { Proveedor } from '../../../proveedores/types/proveedor.types'
import {
  movimientoSchema,
  type MovimientoFormInput,
  type MovimientoFormValues,
} from '../schemas/movimientoSchema'
import { TIPOS_MOVIMIENTO, type TipoMovimiento } from '../types/movimiento.types'
import { formatMovimientoLabel } from '../utils/movimientoLabels'

type MovimientoFormModalProps = {
  almacenes: Almacen[]
  errorMessage?: string | null
  isOpen: boolean
  isSaving: boolean
  productos: Producto[]
  proveedores: Proveedor[]
  ubicaciones: Ubicacion[]
  onClose: () => void
  onSubmit: (values: MovimientoFormValues) => Promise<void>
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500'

const textareaClass =
  'min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const defaultValues: MovimientoFormInput = {
  tipoMovimiento: 'ENTRADA_COMPRA',
  proveedorId: null,
  almacenOrigenId: null,
  almacenDestinoId: null,
  documentoReferencia: '',
  observacion: '',
  detalles: [
    {
      productoId: 0,
      ubicacionOrigenId: null,
      ubicacionDestinoId: null,
      cantidad: 1,
      costoUnitario: undefined,
      observacion: '',
    },
  ],
}

function requiereProveedor(tipoMovimiento?: TipoMovimiento) {
  return tipoMovimiento === 'ENTRADA_COMPRA'
}

function requiereOrigen(tipoMovimiento?: TipoMovimiento) {
  return Boolean(
    tipoMovimiento &&
      [
        'SALIDA_CONSUMO',
        'SALIDA_VENTA',
        'SALIDA_AJUSTE',
        'AJUSTE_NEGATIVO',
        'TRANSFERENCIA',
      ].includes(tipoMovimiento),
  )
}

function requiereDestino(tipoMovimiento?: TipoMovimiento) {
  return Boolean(
    tipoMovimiento &&
      ['ENTRADA_COMPRA', 'ENTRADA_AJUSTE', 'AJUSTE_POSITIVO', 'TRANSFERENCIA'].includes(
        tipoMovimiento,
      ),
  )
}

export function MovimientoFormModal({
  almacenes,
  errorMessage,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  productos,
  proveedores,
  ubicaciones,
}: MovimientoFormModalProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<MovimientoFormInput, unknown, MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues,
  })
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'detalles',
  })
  const tipoMovimiento = useWatch({ control, name: 'tipoMovimiento' }) as TipoMovimiento
  const almacenOrigenValue = useWatch({ control, name: 'almacenOrigenId' })
  const almacenDestinoValue = useWatch({ control, name: 'almacenDestinoId' })
  const detalles = useWatch({ control, name: 'detalles' })
  const almacenOrigenId = Number(almacenOrigenValue || 0)
  const almacenDestinoId = Number(almacenDestinoValue || 0)
  const mostrarOrigen = requiereOrigen(tipoMovimiento)
  const mostrarDestino = requiereDestino(tipoMovimiento)
  const mostrarProveedor = requiereProveedor(tipoMovimiento)
  const ubicacionesOrigen = useMemo(
    () => ubicaciones.filter((ubicacion) => ubicacion.almacenId === almacenOrigenId),
    [almacenOrigenId, ubicaciones],
  )
  const ubicacionesDestino = useMemo(
    () => ubicaciones.filter((ubicacion) => ubicacion.almacenId === almacenDestinoId),
    [almacenDestinoId, ubicaciones],
  )
  const totals = useMemo(() => {
    const cantidadTotal = detalles.reduce((sum, detalle) => sum + Number(detalle.cantidad || 0), 0)
    const importeTotal = detalles.reduce(
      (sum, detalle) =>
        sum + Number(detalle.cantidad || 0) * Number(detalle.costoUnitario || 0),
      0,
    )

    return {
      cantidadTotal,
      importeTotal,
      lineas: detalles.length,
    }
  }, [detalles])

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[94vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Nuevo movimiento</h2>
            <p className="mt-1 text-sm text-slate-500">
              El movimiento se registrara en estado BORRADOR.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="overflow-y-auto px-6 py-5" onSubmit={handleSubmit(onSubmit)}>
          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Tipo movimiento</span>
              <select className={inputClass} {...register('tipoMovimiento')}>
                {TIPOS_MOVIMIENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {formatMovimientoLabel(tipo)}
                  </option>
                ))}
              </select>
              {errors.tipoMovimiento ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.tipoMovimiento.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>
                Proveedor {mostrarProveedor ? '' : '(opcional)'}
              </span>
              <select className={inputClass} {...register('proveedorId')}>
                <option value="">Sin proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.numeroDocumento} - {proveedor.razonSocial}
                  </option>
                ))}
              </select>
              {errors.proveedorId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.proveedorId.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>
                Almacen origen {mostrarOrigen ? '' : '(opcional)'}
              </span>
              <select className={inputClass} {...register('almacenOrigenId')}>
                <option value="">Sin origen</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.codigo} - {almacen.nombre}
                  </option>
                ))}
              </select>
              {errors.almacenOrigenId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.almacenOrigenId.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>
                Almacen destino {mostrarDestino ? '' : '(opcional)'}
              </span>
              <select className={inputClass} {...register('almacenDestinoId')}>
                <option value="">Sin destino</option>
                {almacenes.map((almacen) => (
                  <option key={almacen.id} value={almacen.id}>
                    {almacen.codigo} - {almacen.nombre}
                  </option>
                ))}
              </select>
              {errors.almacenDestinoId ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.almacenDestinoId.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className={labelClass}>Documento referencia</span>
              <input className={inputClass} {...register('documentoReferencia')} />
              {errors.documentoReferencia ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.documentoReferencia.message}
                </span>
              ) : null}
            </label>

            <label className="block xl:col-span-3">
              <span className={labelClass}>Observacion</span>
              <textarea className={textareaClass} {...register('observacion')} />
              {errors.observacion ? (
                <span className="mt-1 block text-sm text-red-600">
                  {errors.observacion.message}
                </span>
              ) : null}
            </label>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Detalles</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Agregue uno o mas productos al movimiento.
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  append({
                    productoId: 0,
                    ubicacionOrigenId: null,
                    ubicacionDestinoId: null,
                    cantidad: 1,
                    costoUnitario: undefined,
                    observacion: '',
                  })
                }
                type="button"
              >
                <Plus size={16} />
                Agregar linea
              </button>
            </div>

            {errors.detalles?.root?.message ? (
              <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                {errors.detalles.root.message}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Ubicacion origen</th>
                    <th className="px-4 py-3">Ubicacion destino</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Costo unitario</th>
                    <th className="px-4 py-3">Observacion</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="min-w-64 px-4 py-3 align-top">
                        <select className={inputClass} {...register(`detalles.${index}.productoId`)}>
                          <option value="">Seleccione</option>
                          {productos.map((producto) => (
                            <option key={producto.id} value={producto.id}>
                              {producto.codigo} - {producto.nombre}
                            </option>
                          ))}
                        </select>
                        {errors.detalles?.[index]?.productoId ? (
                          <span className="mt-1 block text-sm text-red-600">
                            {errors.detalles[index]?.productoId?.message}
                          </span>
                        ) : null}
                      </td>
                      <td className="min-w-56 px-4 py-3 align-top">
                        <select
                          className={inputClass}
                          disabled={!mostrarOrigen || !almacenOrigenId}
                          {...register(`detalles.${index}.ubicacionOrigenId`)}
                        >
                          <option value="">Sin ubicacion</option>
                          {ubicacionesOrigen.map((ubicacion) => (
                            <option key={ubicacion.id} value={ubicacion.id}>
                              {ubicacion.codigo} - {ubicacion.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="min-w-56 px-4 py-3 align-top">
                        <select
                          className={inputClass}
                          disabled={!mostrarDestino || !almacenDestinoId}
                          {...register(`detalles.${index}.ubicacionDestinoId`)}
                        >
                          <option value="">Sin ubicacion</option>
                          {ubicacionesDestino.map((ubicacion) => (
                            <option key={ubicacion.id} value={ubicacion.id}>
                              {ubicacion.codigo} - {ubicacion.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="min-w-32 px-4 py-3 align-top">
                        <input
                          className={inputClass}
                          min="0.0001"
                          step="0.0001"
                          type="number"
                          {...register(`detalles.${index}.cantidad`)}
                        />
                        {errors.detalles?.[index]?.cantidad ? (
                          <span className="mt-1 block text-sm text-red-600">
                            {errors.detalles[index]?.cantidad?.message}
                          </span>
                        ) : null}
                      </td>
                      <td className="min-w-36 px-4 py-3 align-top">
                        <input
                          className={inputClass}
                          min="0"
                          step="0.01"
                          type="number"
                          {...register(`detalles.${index}.costoUnitario`)}
                        />
                        {errors.detalles?.[index]?.costoUnitario ? (
                          <span className="mt-1 block text-sm text-red-600">
                            {errors.detalles[index]?.costoUnitario?.message}
                          </span>
                        ) : null}
                      </td>
                      <td className="min-w-48 px-4 py-3 align-top">
                        <input className={inputClass} {...register(`detalles.${index}.observacion`)} />
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                          type="button"
                        >
                          <Trash2 size={16} />
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:grid-cols-3">
              <p>
                Lineas: <span className="font-semibold text-slate-950">{totals.lineas}</span>
              </p>
              <p>
                Cantidad total:{' '}
                <span className="font-semibold text-slate-950">{totals.cantidadTotal}</span>
              </p>
              <p>
                Importe total:{' '}
                <span className="font-semibold text-slate-950">
                  {new Intl.NumberFormat('es-PE', {
                    currency: 'PEN',
                    style: 'currency',
                  }).format(totals.importeTotal)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
