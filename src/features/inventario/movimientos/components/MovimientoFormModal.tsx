import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { SearchableSelect } from '../../../../shared/components/SearchableSelect'
import type { Almacen } from '../../../almacenes/types/almacen.types'
import type { Ubicacion } from '../../../almacenes/types/ubicacion.types'
import { productoService } from '../../../productos/services/productoService'
import type { Producto } from '../../../productos/types/producto.types'
import { proveedorService } from '../../../proveedores/services/proveedorService'
import type { Proveedor } from '../../../proveedores/types/proveedor.types'
import { stockService } from '../../stock/services/stockService'
import type { StockItem } from '../../stock/types/stock.types'
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
  onSubmit: (values: MovimientoFormValues, options?: { confirmar: boolean }) => Promise<void>
}

type StockLineaState = {
  cantidadDisponible?: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  ubicacionId?: number | null
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500'

const textareaClass =
  'min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

function createDetalleInicial() {
  return {
    productoId: 0,
    ubicacionOrigenId: null,
    ubicacionDestinoId: null,
    cantidad: 1,
    costoUnitario: undefined,
    observacion: '',
  }
}

function createDefaultValues(): MovimientoFormInput {
  return {
  tipoMovimiento: 'ENTRADA_COMPRA',
  proveedorId: null,
  almacenOrigenId: null,
  almacenDestinoId: null,
  documentoReferencia: '',
  motivoMovimiento: '',
  ordenTrabajo: '',
  areaSolicitante: '',
  solicitante: '',
  responsableEntrega: '',
  responsableRecepcion: '',
  guiaSerie: '',
  guiaNumero: '',
  guiaFecha: '',
  comprobanteTipo: '',
  comprobanteSerie: '',
  comprobanteNumero: '',
  comprobanteFechaEmision: '',
  ordenCompraNumero: '',
  fechaPedido: '',
  fechaRecepcion: '',
  flete: undefined,
  movilidad: undefined,
  otrosGastos: undefined,
  observacionDocumentaria: '',
  observacion: '',
  detalles: [createDetalleInicial()],
  }
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

function movimientoRules(tipoMovimiento: TipoMovimiento) {
  const isEntradaCompra = tipoMovimiento === 'ENTRADA_COMPRA'
  const isEntradaAjuste = tipoMovimiento === 'ENTRADA_AJUSTE'
  const isSalidaConsumo = tipoMovimiento === 'SALIDA_CONSUMO'
  const isSalidaVenta = tipoMovimiento === 'SALIDA_VENTA'
  const isSalidaAjuste = tipoMovimiento === 'SALIDA_AJUSTE'
  const isTransferencia = tipoMovimiento === 'TRANSFERENCIA'
  const isAjustePositivo = tipoMovimiento === 'AJUSTE_POSITIVO'
  const isAjusteNegativo = tipoMovimiento === 'AJUSTE_NEGATIVO'
  const showMotivo =
    isEntradaAjuste ||
    isSalidaConsumo ||
    isSalidaVenta ||
    isSalidaAjuste ||
    isTransferencia ||
    isAjustePositivo ||
    isAjusteNegativo
  const requireMotivo =
    isEntradaAjuste || isSalidaConsumo || isSalidaAjuste || isAjustePositivo || isAjusteNegativo
  const showObservacion = true
  const requireObservacion =
    isEntradaAjuste || isSalidaConsumo || isSalidaAjuste || isAjustePositivo || isAjusteNegativo

  return {
    isEntradaCompra,
    requireCostoUnitario: isEntradaCompra,
    requireMotivo,
    requireObservacion,
    showAreaSolicitante: isSalidaConsumo,
    showDocumentoReferencia: !isEntradaCompra,
    showDocumentosCompra: isEntradaCompra,
    showMotivo,
    showObservacion,
    showOrdenTrabajo: isSalidaConsumo,
    showProveedor: isEntradaCompra || isEntradaAjuste,
    showResponsables: isTransferencia,
    showSolicitante: isSalidaConsumo,
    useCostoAutomatico:
      isSalidaConsumo || isSalidaVenta || isSalidaAjuste || isTransferencia || isAjusteNegativo,
  }
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
  const [pendingConfirmValues, setPendingConfirmValues] = useState<MovimientoFormValues | null>(null)
  const [stockLineaState, setStockLineaState] = useState<Record<number, StockLineaState>>({})
  const [stockConfirmError, setStockConfirmError] = useState<string | null>(null)
  const previousAlmacenOrigen = useRef<number | null>(null)
  const previousTipoMovimiento = useRef<TipoMovimiento | null>(null)
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<MovimientoFormInput, unknown, MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: createDefaultValues(),
  })
  const { append, fields, remove, replace } = useFieldArray({
    control,
    name: 'detalles',
  })
  const tipoMovimiento = useWatch({ control, name: 'tipoMovimiento' }) as TipoMovimiento
  const proveedorValue = useWatch({ control, name: 'proveedorId' })
  const almacenOrigenValue = useWatch({ control, name: 'almacenOrigenId' })
  const almacenDestinoValue = useWatch({ control, name: 'almacenDestinoId' })
  const detalles = useWatch({ control, name: 'detalles' })
  const almacenOrigenId = Number(almacenOrigenValue || 0)
  const almacenDestinoId = Number(almacenDestinoValue || 0)
  const detalleCostoKey = detalles
    .map((detalle) => `${detalle.productoId || 0}:${detalle.ubicacionOrigenId || 0}`)
    .join('|')
  const mostrarOrigen = requiereOrigen(tipoMovimiento)
  const mostrarDestino = requiereDestino(tipoMovimiento)
  const rules = movimientoRules(tipoMovimiento)
  const mostrarProveedor = rules.showProveedor
  const mostrarEntradaCompra = rules.showDocumentosCompra
  const ubicacionesOrigen = useMemo(
    () => ubicaciones.filter((ubicacion) => Number(ubicacion.almacenId) === almacenOrigenId),
    [almacenOrigenId, ubicaciones],
  )
  const ubicacionesDestino = useMemo(
    () => ubicaciones.filter((ubicacion) => Number(ubicacion.almacenId) === almacenDestinoId),
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
  const productoOptions = useMemo(
    () =>
      productos.map((producto) => ({
        label: `${producto.codigo} - ${producto.nombre}`,
        value: producto.id,
      })),
    [productos],
  )
  const proveedorOptions = useMemo(
    () =>
      proveedores.map((proveedor) => ({
        label: `${proveedor.numeroDocumento} - ${proveedor.razonSocial}`,
        value: proveedor.id,
      })),
    [proveedores],
  )
  const buscarProductos = useCallback(async (texto: string) => {
    const response = await productoService.getProductos({
      activo: true,
      page: 0,
      size: 10,
      texto,
    })

    return response.content.map((producto) => ({
      label: `${producto.codigo} - ${producto.nombre}`,
      value: producto.id,
    }))
  }, [])

  const buscarProveedores = useCallback(async (texto: string) => {
    const response = await proveedorService.getProveedores({
      activo: true,
      page: 0,
      size: 10,
      texto,
    })

    return response.content.map((proveedor) => ({
      label: `${proveedor.numeroDocumento} - ${proveedor.razonSocial}`,
      value: proveedor.id,
    }))
  }, [])

  const resolverOpcionesProveedor = useCallback(
    async (texto: string) => {
      if (!texto.trim()) {
        return proveedorOptions
      }

      return buscarProveedores(texto)
    },
    [buscarProveedores, proveedorOptions],
  )

  const resolverOpcionesProducto = useCallback(
    async (texto: string) => {
      if (!texto.trim()) {
        return productoOptions
      }

      return buscarProductos(texto)
    },
    [buscarProductos, productoOptions],
  )

  const seleccionarStockDisponible = useCallback(
    (stockItems: StockItem[], ubicacionOrigenId?: number | null) => {
      if (ubicacionOrigenId) {
        return stockItems.find(
          (item) => item.ubicacionId === ubicacionOrigenId && Number(item.cantidadActual || 0) > 0,
        )
      }

      return stockItems.find((item) => Number(item.cantidadActual || 0) > 0)
    },
    [],
  )

  const resolverCostoActual = useCallback(
    async (index: number, productoId: number, ubicacionOrigenId?: number | null) => {
      if (!rules.useCostoAutomatico || !productoId) {
        return
      }

      setValue(`detalles.${index}.costoUnitario`, undefined, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setStockConfirmError(null)

      if (!almacenOrigenId) {
        setStockLineaState((current) => ({
          ...current,
          [index]: {
            message: 'Seleccione el almacen origen en Datos generales para cargar el costo actual.',
            type: 'info',
          },
        }))
        return
      }

      setStockLineaState((current) => ({
        ...current,
        [index]: {
          message: 'Buscando costo actual...',
          type: 'info',
        },
      }))

      try {
        const stockPage = await stockService.getStock({
          almacenId: almacenOrigenId,
          page: 0,
          productoId,
          size: 50,
          ubicacionId: ubicacionOrigenId || undefined,
        })
        const stockDisponible = seleccionarStockDisponible(stockPage.content, ubicacionOrigenId)

        if (!stockDisponible) {
          const tieneStockEnCero = stockPage.content.some(
            (item) => Number(item.cantidadActual || 0) <= 0,
          )

          setStockLineaState((current) => ({
            ...current,
            [index]: {
              message: tieneStockEnCero
                ? 'Producto sin stock en el almacen seleccionado.'
                : 'No hay stock disponible para este producto en el almacen seleccionado.',
              type: 'warning',
            },
          }))
          return
        }

        if (stockDisponible.costoPromedio === undefined || stockDisponible.costoPromedio === null) {
          if (stockDisponible.ubicacionId && !ubicacionOrigenId) {
            setValue(`detalles.${index}.ubicacionOrigenId`, stockDisponible.ubicacionId, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }

          setStockLineaState((current) => ({
            ...current,
            [index]: {
              cantidadDisponible: stockDisponible.cantidadActual,
              message: 'Stock disponible sin costo promedio registrado.',
              type: 'warning',
              ubicacionId: stockDisponible.ubicacionId,
            },
          }))
          return
        }

        if (stockDisponible.ubicacionId && !ubicacionOrigenId) {
          setValue(`detalles.${index}.ubicacionOrigenId`, stockDisponible.ubicacionId, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }

        setValue(`detalles.${index}.costoUnitario`, stockDisponible.costoPromedio, {
          shouldDirty: true,
          shouldValidate: true,
        })
        setStockLineaState((current) => ({
          ...current,
          [index]: {
            cantidadDisponible: stockDisponible.cantidadActual,
            message: `Stock disponible: ${stockDisponible.cantidadActual}`,
            type: 'success',
            ubicacionId: stockDisponible.ubicacionId,
          },
        }))
      } catch {
        setStockLineaState((current) => ({
          ...current,
          [index]: {
            message: 'No se pudo consultar el stock actual para este producto.',
            type: 'error',
          },
        }))
      }
    },
    [almacenOrigenId, rules.useCostoAutomatico, seleccionarStockDisponible, setValue],
  )

  const resetFormulario = useCallback(() => {
    const nextValues = createDefaultValues()
    previousTipoMovimiento.current = null
    previousAlmacenOrigen.current = null
    reset(nextValues)
    replace(nextValues.detalles)
  }, [replace, reset])

  useEffect(() => {
    resetFormulario()

    const timeoutId = window.setTimeout(() => {
      setPendingConfirmValues(null)
      setStockLineaState({})
      setStockConfirmError(null)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [isOpen, resetFormulario])

  useEffect(() => {
    if (!isOpen) {
      previousTipoMovimiento.current = null
      previousAlmacenOrigen.current = null
      return
    }

    if (previousTipoMovimiento.current === null) {
      previousTipoMovimiento.current = tipoMovimiento
      return
    }

    if (previousTipoMovimiento.current === tipoMovimiento) {
      return
    }

    const nextRules = movimientoRules(tipoMovimiento)

    if (!nextRules.showProveedor) {
      setValue('proveedorId', null, { shouldDirty: true, shouldValidate: true })
    }

    if (!mostrarOrigen) {
      setValue('almacenOrigenId', null, { shouldDirty: true, shouldValidate: true })
      fields.forEach((_, index) => {
        setValue(`detalles.${index}.ubicacionOrigenId`, null, {
          shouldDirty: true,
          shouldValidate: true,
        })
      })
    }

    if (!mostrarDestino) {
      setValue('almacenDestinoId', null, { shouldDirty: true, shouldValidate: true })
      fields.forEach((_, index) => {
        setValue(`detalles.${index}.ubicacionDestinoId`, null, {
          shouldDirty: true,
          shouldValidate: true,
        })
      })
    }

    if (!nextRules.showDocumentoReferencia) {
      setValue('documentoReferencia', '', { shouldDirty: true, shouldValidate: true })
    }

    if (!nextRules.showMotivo) {
      setValue('motivoMovimiento', '', { shouldDirty: true, shouldValidate: true })
    }

    if (!nextRules.showOrdenTrabajo) {
      setValue('ordenTrabajo', '', { shouldDirty: true, shouldValidate: true })
    }

    if (!nextRules.showAreaSolicitante) {
      setValue('areaSolicitante', '', { shouldDirty: true, shouldValidate: true })
    }

    if (!nextRules.showSolicitante) {
      setValue('solicitante', '', { shouldDirty: true, shouldValidate: true })
    }

    if (!nextRules.showResponsables) {
      setValue('responsableEntrega', '', { shouldDirty: true, shouldValidate: true })
      setValue('responsableRecepcion', '', { shouldDirty: true, shouldValidate: true })
    }

    if (!nextRules.showDocumentosCompra) {
      setValue('guiaSerie', '', { shouldDirty: true, shouldValidate: true })
      setValue('guiaNumero', '', { shouldDirty: true, shouldValidate: true })
      setValue('guiaFecha', '', { shouldDirty: true, shouldValidate: true })
      setValue('comprobanteTipo', '', { shouldDirty: true, shouldValidate: true })
      setValue('comprobanteSerie', '', { shouldDirty: true, shouldValidate: true })
      setValue('comprobanteNumero', '', { shouldDirty: true, shouldValidate: true })
      setValue('comprobanteFechaEmision', '', { shouldDirty: true, shouldValidate: true })
      setValue('ordenCompraNumero', '', { shouldDirty: true, shouldValidate: true })
      setValue('fechaPedido', '', { shouldDirty: true, shouldValidate: true })
      setValue('fechaRecepcion', '', { shouldDirty: true, shouldValidate: true })
      setValue('flete', undefined, { shouldDirty: true, shouldValidate: true })
      setValue('movilidad', undefined, { shouldDirty: true, shouldValidate: true })
      setValue('otrosGastos', undefined, { shouldDirty: true, shouldValidate: true })
      setValue('observacionDocumentaria', '', { shouldDirty: true, shouldValidate: true })
    }

    if (nextRules.useCostoAutomatico) {
      fields.forEach((_, index) => {
        setValue(`detalles.${index}.costoUnitario`, undefined, {
          shouldDirty: true,
          shouldValidate: true,
        })
      })
    }

    previousTipoMovimiento.current = tipoMovimiento
  }, [fields, isOpen, mostrarDestino, mostrarOrigen, setValue, tipoMovimiento])

  useEffect(() => {
    if (!isOpen || !rules.useCostoAutomatico) {
      previousAlmacenOrigen.current = almacenOrigenId || null
      return
    }

    if (previousAlmacenOrigen.current === null) {
      previousAlmacenOrigen.current = almacenOrigenId || null
      return
    }

    if (previousAlmacenOrigen.current === almacenOrigenId) {
      return
    }

    fields.forEach((_, index) => {
      setValue(`detalles.${index}.ubicacionOrigenId`, null, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setValue(`detalles.${index}.costoUnitario`, undefined, {
        shouldDirty: true,
        shouldValidate: true,
      })
    })

    previousAlmacenOrigen.current = almacenOrigenId || null
  }, [almacenOrigenId, fields, isOpen, rules.useCostoAutomatico, setValue])

  useEffect(() => {
    if (!isOpen || !rules.useCostoAutomatico) {
      return
    }

    detalleCostoKey.split('|').forEach((value, index) => {
      const [productoIdValue, ubicacionOrigenIdValue] = value.split(':')
      const productoId = Number(productoIdValue || 0)
      const ubicacionOrigenIdValueNumber = Number(ubicacionOrigenIdValue || 0)

      if (productoId) {
        void resolverCostoActual(
          index,
          productoId,
          ubicacionOrigenIdValueNumber || null,
        )
      }
    })
  }, [detalleCostoKey, isOpen, resolverCostoActual, rules.useCostoAutomatico])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[94vh] w-full max-w-[96rem] flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Nuevo movimiento</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registre el movimiento como borrador o guardelo y confirmelo en una sola accion.
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

        <form className="overflow-y-auto px-6 py-5" onSubmit={(event) => event.preventDefault()}>
          {errorMessage ? (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="rounded-lg border border-slate-200 border-l-cyan-500 border-l-4 p-4">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-950">
                Datos generales del movimiento
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Seleccione el tipo de movimiento y los almacenes involucrados.
              </p>
            </div>
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

              {mostrarProveedor ? (
                <div className="block">
                  <span className={labelClass}>
                    Proveedor {requiereProveedor(tipoMovimiento) ? '' : '(opcional)'}
                  </span>
                  <SearchableSelect
                    ariaLabel="Proveedor"
                    emptyLabel="Sin resultados"
                    onChange={(value) =>
                      setValue('proveedorId', value, { shouldDirty: true, shouldValidate: true })
                    }
                    onSearch={resolverOpcionesProveedor}
                    placeholder="Buscar proveedor"
                    value={Number(proveedorValue || 0) || null}
                  />
                  {errors.proveedorId ? (
                    <span className="mt-1 block text-sm text-red-600">
                      {errors.proveedorId.message}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {mostrarOrigen ? (
                <label className="block">
                  <span className={labelClass}>Almacen origen</span>
                  <select className={inputClass} {...register('almacenOrigenId')}>
                    <option value="">Seleccione origen</option>
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
              ) : null}

              {mostrarDestino ? (
                <label className="block">
                  <span className={labelClass}>Almacen destino</span>
                  <select className={inputClass} {...register('almacenDestinoId')}>
                    <option value="">Seleccione destino</option>
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
              ) : null}

              {rules.showDocumentoReferencia ? (
                <label className="block">
                  <span className={labelClass}>Documento referencia (opcional)</span>
                  <input className={inputClass} {...register('documentoReferencia')} />
                  {errors.documentoReferencia ? (
                    <span className="mt-1 block text-sm text-red-600">
                      {errors.documentoReferencia.message}
                    </span>
                  ) : null}
                </label>
              ) : null}

              {rules.showObservacion && mostrarEntradaCompra ? (
                <label className="block xl:col-span-3">
                  <span className={labelClass}>Observacion general (opcional)</span>
                  <textarea className={textareaClass} {...register('observacion')} />
                  {errors.observacion ? (
                    <span className="mt-1 block text-sm text-red-600">
                      {errors.observacion.message}
                    </span>
                  ) : null}
                </label>
              ) : null}
            </div>
          </section>

          {!mostrarEntradaCompra &&
          (rules.showMotivo ||
            rules.showOrdenTrabajo ||
            rules.showAreaSolicitante ||
            rules.showSolicitante ||
            rules.showResponsables ||
            rules.showObservacion) ? (
            <section className="mt-6 rounded-lg border border-slate-200 border-l-blue-500 border-l-4 p-4">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-950">
                  Datos complementarios
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Complete la informacion operativa requerida para el tipo seleccionado.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rules.showMotivo ? (
                  <label className="block">
                    <span className={labelClass}>
                      Motivo movimiento {rules.requireMotivo ? '' : '(opcional)'}
                    </span>
                    <input className={inputClass} {...register('motivoMovimiento')} />
                    {errors.motivoMovimiento ? (
                      <span className="mt-1 block text-sm text-red-600">
                        {errors.motivoMovimiento.message}
                      </span>
                    ) : null}
                  </label>
                ) : null}

                {rules.showOrdenTrabajo ? (
                  <label className="block">
                    <span className={labelClass}>Orden trabajo (opcional)</span>
                    <input className={inputClass} {...register('ordenTrabajo')} />
                  </label>
                ) : null}

                {rules.showAreaSolicitante ? (
                  <label className="block">
                    <span className={labelClass}>Area solicitante (opcional)</span>
                    <input className={inputClass} {...register('areaSolicitante')} />
                  </label>
                ) : null}

                {rules.showSolicitante ? (
                  <label className="block">
                    <span className={labelClass}>Solicitante (opcional)</span>
                    <input className={inputClass} {...register('solicitante')} />
                  </label>
                ) : null}

                {rules.showResponsables ? (
                  <>
                    <label className="block">
                      <span className={labelClass}>Responsable entrega (opcional)</span>
                      <input className={inputClass} {...register('responsableEntrega')} />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Responsable recepcion (opcional)</span>
                      <input className={inputClass} {...register('responsableRecepcion')} />
                    </label>
                  </>
                ) : null}

                {rules.showObservacion ? (
                  <label className="block xl:col-span-3">
                    <span className={labelClass}>
                      Observacion {rules.requireObservacion ? '' : '(opcional)'}
                    </span>
                    <textarea className={textareaClass} {...register('observacion')} />
                    {errors.observacion ? (
                      <span className="mt-1 block text-sm text-red-600">
                        {errors.observacion.message}
                      </span>
                    ) : null}
                  </label>
                ) : null}
              </div>
            </section>
          ) : null}

          {mostrarEntradaCompra ? (
            <div className="mt-6 rounded-lg border border-slate-200 border-l-emerald-500 border-l-4 p-4">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-950">
                  Documentos de compra y recepcion
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Registre guia, comprobante, orden de compra y costos adicionales de la entrada.
                </p>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Guia de remision</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className={labelClass}>Serie guia (opcional)</span>
                      <input className={inputClass} {...register('guiaSerie')} />
                      {errors.guiaSerie ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.guiaSerie.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClass}>Numero guia (opcional)</span>
                      <input className={inputClass} {...register('guiaNumero')} />
                      {errors.guiaNumero ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.guiaNumero.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha guia (opcional)</span>
                      <input className={inputClass} type="date" {...register('guiaFecha')} />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Comprobante de compra
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className={labelClass}>Tipo comprobante (opcional)</span>
                      <select className={inputClass} {...register('comprobanteTipo')}>
                        <option value="">Sin comprobante</option>
                        <option value="FACTURA">Factura</option>
                        <option value="BOLETA">Boleta</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelClass}>Serie comprobante (opcional)</span>
                      <input className={inputClass} {...register('comprobanteSerie')} />
                      {errors.comprobanteSerie ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.comprobanteSerie.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClass}>Numero comprobante (opcional)</span>
                      <input className={inputClass} {...register('comprobanteNumero')} />
                      {errors.comprobanteNumero ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.comprobanteNumero.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha emision comprobante (opcional)</span>
                      <input
                        className={inputClass}
                        type="date"
                        {...register('comprobanteFechaEmision')}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Orden y recepcion</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className={labelClass}>Orden de compra (opcional)</span>
                      <input className={inputClass} {...register('ordenCompraNumero')} />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha pedido (opcional)</span>
                      <input className={inputClass} type="date" {...register('fechaPedido')} />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Fecha recepcion</span>
                      <input className={inputClass} type="date" {...register('fechaRecepcion')} />
                      {errors.fechaRecepcion ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.fechaRecepcion.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Costos adicionales</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className={labelClass}>Flete (opcional)</span>
                      <input
                        className={inputClass}
                        step="0.000001"
                        type="number"
                        {...register('flete')}
                      />
                      {errors.flete ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.flete.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClass}>Movilidad (opcional)</span>
                      <input
                        className={inputClass}
                        step="0.000001"
                        type="number"
                        {...register('movilidad')}
                      />
                      {errors.movilidad ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.movilidad.message}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={labelClass}>Otros gastos (opcional)</span>
                      <input
                        className={inputClass}
                        step="0.000001"
                        type="number"
                        {...register('otrosGastos')}
                      />
                      {errors.otrosGastos ? (
                        <span className="mt-1 block text-sm text-red-600">
                          {errors.otrosGastos.message}
                        </span>
                      ) : null}
                    </label>
                  </div>
                </div>

                <label className="block">
                  <span className={labelClass}>Observacion documentaria (opcional)</span>
                  <textarea className={textareaClass} {...register('observacionDocumentaria')} />
                </label>
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-lg border border-slate-200 border-l-indigo-500 border-l-4">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Detalles</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Agregue los productos, cantidades y costos que correspondan.
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
                onClick={() =>
                  append(createDetalleInicial())
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
                    {mostrarOrigen ? <th className="px-4 py-3">Ubicacion origen (opcional)</th> : null}
                    {mostrarDestino ? (
                      <th className="px-4 py-3">Ubicacion destino (opcional)</th>
                    ) : null}
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">
                      {rules.useCostoAutomatico
                        ? 'Costo actual'
                        : `Costo unitario ${rules.requireCostoUnitario ? '' : '(opcional)'}`}
                    </th>
                    <th className="px-4 py-3">Observacion</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="min-w-64 px-4 py-3 align-top">
                        <SearchableSelect
                          ariaLabel={`Producto linea ${index + 1}`}
                          emptyLabel="Sin productos"
                          onChange={(value) => {
                            setValue(`detalles.${index}.productoId`, value ?? 0, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                            if (!value) {
                              setValue(`detalles.${index}.costoUnitario`, undefined, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                              setStockLineaState((current) => ({
                                ...current,
                                [index]: {
                                  message: '',
                                  type: 'info',
                                },
                              }))
                            }
                          }}
                          onSearch={resolverOpcionesProducto}
                          placeholder="Buscar producto"
                          value={Number(detalles[index]?.productoId || 0) || null}
                        />
                        {errors.detalles?.[index]?.productoId ? (
                          <span className="mt-1 block text-sm text-red-600">
                            {errors.detalles[index]?.productoId?.message}
                          </span>
                        ) : null}
                      </td>
                      {mostrarOrigen ? (
                        <td className="min-w-56 px-4 py-3 align-top">
                          <select
                            className={inputClass}
                            disabled={!almacenOrigenId}
                            {...register(`detalles.${index}.ubicacionOrigenId`)}
                          >
                            <option value="">Sin ubicacion</option>
                            {ubicacionesOrigen.map((ubicacion) => (
                              <option key={ubicacion.id} value={ubicacion.id}>
                                {ubicacion.codigo} - {ubicacion.nombre}
                              </option>
                            ))}
                          </select>
                          {!almacenOrigenId ? (
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              Seleccione el almacen origen en Datos generales para habilitar ubicaciones.
                            </span>
                          ) : null}
                        </td>
                      ) : null}
                      {mostrarDestino ? (
                        <td className="min-w-56 px-4 py-3 align-top">
                          <select
                            className={inputClass}
                            disabled={!almacenDestinoId}
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
                      ) : null}
                      <td className="min-w-32 px-4 py-3 align-top">
                        <input
                          aria-label={`Cantidad linea ${index + 1}`}
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
                      <td className="w-40 min-w-40 px-4 py-3 align-top">
                        <input
                          aria-label={`Costo unitario linea ${index + 1}`}
                          className={`${inputClass.replace('w-full', 'w-36')} ${
                            rules.useCostoAutomatico ? 'bg-slate-50 text-slate-700' : ''
                          }`}
                          min="0"
                          readOnly={rules.useCostoAutomatico}
                          step="0.000001"
                          type="number"
                          {...register(`detalles.${index}.costoUnitario`)}
                        />
                        {errors.detalles?.[index]?.costoUnitario ? (
                          <span className="mt-1 block text-sm text-red-600">
                            {errors.detalles[index]?.costoUnitario?.message}
                          </span>
                        ) : null}
                        {rules.useCostoAutomatico && stockLineaState[index]?.message ? (
                          <span
                            className={`mt-1 block text-xs leading-5 ${
                              stockLineaState[index].type === 'success'
                                ? 'text-emerald-700'
                                : stockLineaState[index].type === 'warning'
                                  ? 'text-amber-700'
                                  : stockLineaState[index].type === 'error'
                                    ? 'text-red-700'
                                    : 'text-slate-500'
                            }`}
                          >
                            {stockLineaState[index].message}
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
            {stockConfirmError ? (
              <div className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:mr-auto sm:w-auto">
                {stockConfirmError}
              </div>
            ) : null}
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={handleSubmit((values) => onSubmit(values, { confirmar: false }))}
              type="button"
            >
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={handleSubmit((values) => {
                if (
                  rules.useCostoAutomatico &&
                  values.detalles.some((detalle) => detalle.productoId && !detalle.costoUnitario)
                ) {
                  setStockConfirmError(
                    'No se puede guardar y confirmar una salida sin stock disponible o costo actual.',
                  )
                  return
                }

                setPendingConfirmValues(values)
              })}
              type="button"
            >
              {isSaving ? 'Procesando...' : 'Guardar y confirmar'}
            </button>
          </div>
        </form>
      </section>

      {pendingConfirmValues ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Guardar y confirmar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta accion guardara y confirmara el movimiento, afectando el stock y generando
              kardex. Deseas continuar?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={isSaving}
                onClick={() => setPendingConfirmValues(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
                onClick={async () => {
                  await onSubmit(pendingConfirmValues, { confirmar: true })
                  setPendingConfirmValues(null)
                }}
                type="button"
              >
                {isSaving ? 'Confirmando...' : 'Si, guardar y confirmar'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
