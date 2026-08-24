import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { SearchableSelect } from '../../../../shared/components/SearchableSelect'
import { formatOptionalCurrency } from '../../../../shared/utils/numberFormat'
import type { Almacen } from '../../../almacenes/types/almacen.types'
import type { Ubicacion } from '../../../almacenes/types/ubicacion.types'
import { formatUbicacionLabel } from '../../../almacenes/utils/ubicacionLabels'
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
import { calcularCostoEntrada, sumarCostosEntrada } from '../utils/costosEntrada'
import { formatMovimientoLabel } from '../utils/movimientoLabels'
import { calcularTotalesComerciales } from '../utils/valorizacionComercial'

const TIPOS_MOVIMIENTO_REGISTRO = TIPOS_MOVIMIENTO.filter(
  (tipo) => tipo !== 'DEVOLUCION_PROVEEDOR',
)

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

type FormSectionKey =
  | 'generales'
  | 'complementarios'
  | 'documentos'
  | 'detalles'

const INITIAL_EXPANDED_SECTIONS: Record<FormSectionKey, boolean> = {
  generales: true,
  complementarios: true,
  documentos: true,
  detalles: true,
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500'

const textareaClass =
  'min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

const labelClass = 'mb-2 block text-sm font-medium text-slate-700'

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

type CollapseButtonProps = {
  contentId: string
  expanded: boolean
  onToggle: () => void
  title: string
}

function CollapseButton({ contentId, expanded, onToggle, title }: CollapseButtonProps) {
  return (
    <button
      aria-controls={contentId}
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Comprimir' : 'Desplegar'} ${title}`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200"
      onClick={onToggle}
      title={expanded ? `Comprimir ${title}` : `Desplegar ${title}`}
      type="button"
    >
      <ChevronDown
        aria-hidden="true"
        className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        size={17}
      />
    </button>
  )
}

type SectionHeaderProps = CollapseButtonProps & {
  action?: ReactNode
  description: string
}

function SectionHeader({
  action,
  contentId,
  description,
  expanded,
  onToggle,
  title,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {action}
        <CollapseButton
          contentId={contentId}
          expanded={expanded}
          onToggle={onToggle}
          title={title}
        />
      </div>
    </div>
  )
}

type DocumentSubsectionProps = {
  children: ReactNode
  title: string
}

function DocumentSubsection({ children, title }: DocumentSubsectionProps) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function toPreviewNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : undefined
}

function toPreviewBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function createDetalleInicial() {
  return {
    productoId: 0,
    ubicacionOrigenId: null,
    ubicacionDestinoId: null,
    cantidad: 1,
    costoUnitario: undefined,
    costoBaseComercialSinIgv: undefined,
    recargoComercialPct: undefined,
    valorUnitarioSinIgv: undefined,
    tasaIgv: 18,
    igvRecuperable: true,
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
  confirmar: false,
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
    showOrdenTrabajo: isSalidaConsumo || isSalidaVenta,
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
  const [customRecargoLines, setCustomRecargoLines] = useState<Record<string, boolean>>({})
  const [expandedSections, setExpandedSections] = useState(INITIAL_EXPANDED_SECTIONS)
  const productosByIdRef = useRef(new Map<number, Producto>())
  const formRef = useRef<HTMLFormElement>(null)
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
  const isSalidaVenta = tipoMovimiento === 'SALIDA_VENTA'
  const mostrarProveedor = rules.showProveedor
  const mostrarEntradaCompra = rules.showDocumentosCompra
  const toggleSection = useCallback((section: FormSectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }, [])
  const revealValidationErrors = useCallback(() => {
    setExpandedSections({ ...INITIAL_EXPANDED_SECTIONS })
  }, [])
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
    const compraTotals = sumarCostosEntrada(
      detalles.map((detalle) => ({
        cantidad: toPreviewNumber(detalle.cantidad),
        igvRecuperable: toPreviewBoolean(detalle.igvRecuperable),
        tasaIgv: toPreviewNumber(detalle.tasaIgv),
        valorUnitarioSinIgv: toPreviewNumber(detalle.valorUnitarioSinIgv),
      })),
    )
    const commercialPreviews = detalles.map((detalle) =>
      calcularTotalesComerciales(
        toPreviewNumber(detalle.costoBaseComercialSinIgv),
        toPreviewNumber(detalle.recargoComercialPct),
        toPreviewNumber(detalle.cantidad),
      ),
    )
    const comercialesCompletos =
      commercialPreviews.length > 0 && commercialPreviews.every((preview) => preview !== null)
    const valorVentaTotalSinIgv = comercialesCompletos
      ? commercialPreviews.reduce(
          (sum, preview) => sum + (preview?.valorVentaTotalSinIgv ?? 0),
          0,
        )
      : null
    const igvComercialTotal = comercialesCompletos
      ? commercialPreviews.reduce((sum, preview) => sum + (preview?.igvTotal ?? 0), 0)
      : null
    const precioVentaTotalConIgv = comercialesCompletos
      ? commercialPreviews.reduce(
          (sum, preview) => sum + (preview?.precioVentaTotalConIgv ?? 0),
          0,
        )
      : null

    return {
      compraTotals,
      cantidadTotal,
      importeTotal,
      igvComercialTotal,
      lineas: detalles.length,
      precioVentaTotalConIgv,
      valorVentaTotalSinIgv,
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
  const datosComercialesPendientes = useMemo(() => {
    if (!isSalidaVenta) {
      return []
    }

    const pendientes: string[] = []
    const sinBase = detalles.filter(
      (detalle) => toPreviewNumber(detalle.costoBaseComercialSinIgv) === undefined,
    ).length
    const sinRecargo = detalles.filter(
      (detalle) => toPreviewNumber(detalle.recargoComercialPct) === undefined,
    ).length

    if (sinBase > 0) {
      pendientes.push(`costo base comercial en ${sinBase} linea(s)`)
    }
    if (sinRecargo > 0) {
      pendientes.push(`recargo comercial en ${sinRecargo} linea(s)`)
    }

    return pendientes
  }, [detalles, isSalidaVenta])
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

    response.content.forEach((producto) => productosByIdRef.current.set(producto.id, producto))

    return response.content.map((producto) => ({
      label: `${producto.codigo} - ${producto.nombre}`,
      value: producto.id,
    }))
  }, [])

  useEffect(() => {
    productos.forEach((producto) => productosByIdRef.current.set(producto.id, producto))
  }, [productos])

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
        return productoOptions.slice(0, 20)
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
      setCustomRecargoLines({})
      setStockLineaState({})
      setStockConfirmError(null)
      setExpandedSections({ ...INITIAL_EXPANDED_SECTIONS })
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

    const nextValues = {
      ...createDefaultValues(),
      tipoMovimiento,
    }
    previousTipoMovimiento.current = tipoMovimiento
    previousAlmacenOrigen.current = null
    reset(nextValues)
    replace(nextValues.detalles)
    setPendingConfirmValues(null)
    setCustomRecargoLines({})
    setStockLineaState({})
    setStockConfirmError(null)
  }, [isOpen, replace, reset, tipoMovimiento])

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

  useEffect(() => {
    if (!errorMessage) {
      return
    }

    formRef.current?.scrollTo?.({ behavior: 'smooth', top: 0 })
  }, [errorMessage])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[94vh] w-full max-w-[96rem] flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold text-white">Nuevo movimiento</h2>
            <p className="mt-1 text-sm text-slate-300">
              Registre el movimiento como borrador o guardelo y confirmelo en una sola accion.
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="overflow-y-auto px-6 py-5"
          onSubmit={(event) => event.preventDefault()}
          ref={formRef}
        >
          {errorMessage ? (
            <div
              className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-slate-200 border-l-cyan-500 border-l-4">
            <SectionHeader
              contentId="movimiento-datos-generales"
              description="Seleccione el tipo de movimiento y los almacenes involucrados."
              expanded={expandedSections.generales}
              onToggle={() => toggleSection('generales')}
              title="Datos generales del movimiento"
            />
            <div
              className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
              hidden={!expandedSections.generales}
              id="movimiento-datos-generales"
            >
              <label className="block">
                <span className={labelClass}>Tipo movimiento</span>
                <select className={inputClass} {...register('tipoMovimiento')}>
                  {TIPOS_MOVIMIENTO_REGISTRO.map((tipo) => (
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
                    key={`proveedor-${tipoMovimiento}`}
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
            <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 border-l-blue-500 border-l-4">
              <SectionHeader
                contentId="movimiento-datos-complementarios"
                description="Complete la informacion operativa requerida para el tipo seleccionado."
                expanded={expandedSections.complementarios}
                onToggle={() => toggleSection('complementarios')}
                title="Datos complementarios"
              />
              <div
                className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
                hidden={!expandedSections.complementarios}
                id="movimiento-datos-complementarios"
              >
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
                    <span className={labelClass}>
                      {isSalidaVenta ? 'Orden de Servicio (OS) *' : 'Orden trabajo (opcional)'}
                    </span>
                    <input
                      aria-label={isSalidaVenta ? 'Orden de Servicio (OS)' : undefined}
                      className={inputClass}
                      placeholder={isSalidaVenta ? 'Ej. OS-002541' : undefined}
                      {...register('ordenTrabajo')}
                    />
                    {isSalidaVenta ? (
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        Obligatoria para guardar la salida de venta, incluso como borrador.
                      </span>
                    ) : null}
                    {errors.ordenTrabajo ? (
                      <span className="mt-1 block text-sm text-red-600">
                        {errors.ordenTrabajo.message}
                      </span>
                    ) : null}
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
            <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 border-l-emerald-500 border-l-4">
              <SectionHeader
                contentId="movimiento-documentos-compra"
                description="Registre guia, comprobante, orden de compra y costos adicionales de la entrada."
                expanded={expandedSections.documentos}
                onToggle={() => toggleSection('documentos')}
                title="Documentos de compra y recepcion"
              />
              <div
                className="space-y-4 p-4"
                hidden={!expandedSections.documentos}
                id="movimiento-documentos-compra"
              >
                <DocumentSubsection title="Guia de remision">
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
                </DocumentSubsection>

                <DocumentSubsection title="Comprobante de compra">
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
                </DocumentSubsection>

                <DocumentSubsection title="Orden y recepcion">
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
                </DocumentSubsection>

                <DocumentSubsection title="Costos adicionales">
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
                  <label className="mt-4 block border-t border-slate-200 pt-4">
                    <span className={labelClass}>Observacion documentaria (opcional)</span>
                    <textarea className={textareaClass} {...register('observacionDocumentaria')} />
                  </label>
                </DocumentSubsection>
              </div>
            </section>
          ) : null}

          <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 border-l-indigo-500 border-l-4">
            <SectionHeader
              action={
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => {
                    setExpandedSections((current) => ({ ...current, detalles: true }))
                    append(createDetalleInicial())
                  }}
                  type="button"
                >
                  <Plus size={16} />
                  Agregar linea
                </button>
              }
              contentId="movimiento-detalles"
              description="Agregue los productos, cantidades y costos que correspondan."
              expanded={expandedSections.detalles}
              onToggle={() => toggleSection('detalles')}
              title="Detalles"
            />

            <div hidden={!expandedSections.detalles} id="movimiento-detalles">
              {errors.detalles?.root?.message ? (
                <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {errors.detalles.root.message}
                </div>
              ) : null}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[28rem] min-w-[28rem] px-4 py-3">Producto</th>
                    {mostrarOrigen ? <th className="px-4 py-3">Ubicacion origen (opcional)</th> : null}
                    {mostrarDestino ? (
                      <th className="px-4 py-3">Ubicacion destino (opcional)</th>
                    ) : null}
                    <th className="w-28 min-w-28 px-3 py-3">Cantidad</th>
                    <th
                      className="px-4 py-3"
                      title={
                        isSalidaVenta
                          ? 'Costo histórico determinado por el motor de inventario. Se muestra únicamente para análisis.'
                          : undefined
                      }
                    >
                      {rules.useCostoAutomatico
                        ? isSalidaVenta
                          ? 'Costo de inventario'
                          : 'Costo actual'
                        : rules.isEntradaCompra
                          ? 'Costo de compra unitario sin IGV'
                          : `Costo unitario ${rules.requireCostoUnitario ? '' : '(opcional)'}`}
                    </th>
                    {isSalidaVenta ? <th className="px-4 py-3">Valorizacion comercial</th> : null}
                    {rules.isEntradaCompra ? (
                      <>
                        <th className="px-4 py-3">Tasa IGV</th>
                        <th className="px-4 py-3">IGV recuperable</th>
                        <th className="px-4 py-3">Previsualizacion</th>
                      </>
                    ) : null}
                    <th className="px-4 py-3">Observacion</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="w-[28rem] min-w-[28rem] px-4 py-3 align-top">
                        <SearchableSelect
                          ariaLabel={`Producto linea ${index + 1}`}
                          emptyLabel="Sin productos"
                          onChange={(value) => {
                            setValue(`detalles.${index}.productoId`, value ?? 0, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                            const producto = value
                              ? productosByIdRef.current.get(value)
                              : undefined
                            setValue(
                              `detalles.${index}.costoBaseComercialSinIgv`,
                              isSalidaVenta ? producto?.costoReferencial ?? undefined : undefined,
                              { shouldDirty: true, shouldValidate: true },
                            )
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
                              setValue(`detalles.${index}.recargoComercialPct`, undefined, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                              setCustomRecargoLines((current) => {
                                const next = { ...current }
                                delete next[field.id]
                                return next
                              })
                            }
                          }}
                          onSearch={resolverOpcionesProducto}
                          placeholder="Buscar producto"
                          prefetchedOptions={productoOptions}
                          value={Number(detalles[index]?.productoId || 0) || null}
                        />
                        {errors.detalles?.[index]?.productoId ? (
                          <span className="mt-1 block text-sm text-red-600">
                            {errors.detalles[index]?.productoId?.message}
                          </span>
                        ) : null}
                      </td>
                      {mostrarOrigen ? (
                        <td className="min-w-52 px-4 py-3 align-top">
                          <select
                            className={inputClass}
                            disabled={!almacenOrigenId}
                            {...register(`detalles.${index}.ubicacionOrigenId`)}
                          >
                            <option value="">Sin ubicacion</option>
                            {ubicacionesOrigen.map((ubicacion) => (
                              <option key={ubicacion.id} value={ubicacion.id}>
                                {formatUbicacionLabel(ubicacion)}
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
                        <td className="min-w-52 px-4 py-3 align-top">
                          <select
                            className={inputClass}
                            disabled={!almacenDestinoId}
                            {...register(`detalles.${index}.ubicacionDestinoId`)}
                          >
                            <option value="">Sin ubicacion</option>
                            {ubicacionesDestino.map((ubicacion) => (
                              <option key={ubicacion.id} value={ubicacion.id}>
                                {formatUbicacionLabel(ubicacion)}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : null}
                      <td className="w-28 min-w-28 px-3 py-3 align-top">
                        <input
                          aria-label={`Cantidad linea ${index + 1}`}
                          className={inputClass}
                          min="0.0001"
                          onFocus={(event) => event.currentTarget.select()}
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
                        {rules.isEntradaCompra ? (
                          <>
                            <input
                              aria-label={`Costo de compra unitario sin IGV linea ${index + 1}`}
                              className={inputClass.replace('w-full', 'w-36')}
                              min="0"
                              step="0.000001"
                              type="number"
                              {...register(`detalles.${index}.valorUnitarioSinIgv`)}
                            />
                            {errors.detalles?.[index]?.valorUnitarioSinIgv ? (
                              <span className="mt-1 block text-sm text-red-600">
                                {errors.detalles[index]?.valorUnitarioSinIgv?.message}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </td>
                      {isSalidaVenta ? (
                        <td className="min-w-[34rem] px-4 py-3 align-top">
                          {(() => {
                            const costoBase = toPreviewNumber(
                              detalles[index]?.costoBaseComercialSinIgv,
                            )
                            const recargo = toPreviewNumber(detalles[index]?.recargoComercialPct)
                            const presetValues = [25, 35, 50, 100]
                            const customSelected =
                              Boolean(customRecargoLines[field.id]) ||
                              (recargo !== undefined && !presetValues.includes(recargo))
                            const preview = calcularTotalesComerciales(
                              costoBase,
                              recargo,
                              toPreviewNumber(detalles[index]?.cantidad),
                            )

                            return (
                              <div className="space-y-3 rounded-md border border-cyan-200 bg-cyan-50/40 p-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Costo base comercial sin IGV
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                      {formatOptionalCurrency(costoBase)}
                                    </p>
                                    {costoBase === undefined ? (
                                      <p className="mt-1 text-xs leading-5 text-amber-700">
                                        Este producto no tiene configurado un costo base comercial sin
                                        IGV.
                                      </p>
                                    ) : null}
                                    {errors.detalles?.[index]?.costoBaseComercialSinIgv ? (
                                      <p className="mt-1 text-xs leading-5 text-red-700">
                                        {
                                          errors.detalles[index]?.costoBaseComercialSinIgv
                                            ?.message
                                        }
                                      </p>
                                    ) : null}
                                  </div>
                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Recargo comercial
                                    </span>
                                    <select
                                      aria-label={`Recargo comercial linea ${index + 1}`}
                                      className={inputClass}
                                      onChange={(event) => {
                                        const value = event.target.value

                                        if (value === 'CUSTOM') {
                                          setCustomRecargoLines((current) => ({
                                            ...current,
                                            [field.id]: true,
                                          }))
                                          setValue(
                                            `detalles.${index}.recargoComercialPct`,
                                            undefined,
                                            { shouldDirty: true, shouldValidate: true },
                                          )
                                          return
                                        }

                                        setCustomRecargoLines((current) => ({
                                          ...current,
                                          [field.id]: false,
                                        }))
                                        setValue(
                                          `detalles.${index}.recargoComercialPct`,
                                          value ? Number(value) : undefined,
                                          { shouldDirty: true, shouldValidate: true },
                                        )
                                      }}
                                      value={
                                        customSelected
                                          ? 'CUSTOM'
                                          : recargo === undefined
                                            ? ''
                                            : String(recargo)
                                      }
                                    >
                                      <option value="">Seleccione</option>
                                      <option value="25">25%</option>
                                      <option value="35">35%</option>
                                      <option value="50">50%</option>
                                      <option value="100">100%</option>
                                      <option value="CUSTOM">Personalizado</option>
                                    </select>
                                  </label>
                                </div>

                                {customSelected ? (
                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Recargo personalizado (%)
                                    </span>
                                    <input
                                      aria-label={`Recargo personalizado (%) linea ${index + 1}`}
                                      className={inputClass}
                                      min="0"
                                      max="1000"
                                      step="0.01"
                                      type="number"
                                      {...register(`detalles.${index}.recargoComercialPct`)}
                                    />
                                  </label>
                                ) : null}

                                {errors.detalles?.[index]?.recargoComercialPct ? (
                                  <p className="text-xs leading-5 text-red-700">
                                    {errors.detalles[index]?.recargoComercialPct?.message}
                                  </p>
                                ) : null}

                                <div className="grid gap-2 border-t border-cyan-100 pt-3 text-xs sm:grid-cols-3">
                                  <p>
                                    Valor unit. s/IGV:{' '}
                                    <span className="font-semibold text-slate-900">
                                      {formatOptionalCurrency(preview?.valorVentaUnitarioSinIgv)}
                                    </span>
                                  </p>
                                  <p>
                                    IGV unitario:{' '}
                                    <span className="font-semibold text-slate-900">
                                      {formatOptionalCurrency(preview?.igvUnitario)}
                                    </span>
                                  </p>
                                  <p>
                                    Precio unit. c/IGV:{' '}
                                    <span className="font-semibold text-slate-900">
                                      {formatOptionalCurrency(preview?.precioVentaUnitarioConIgv)}
                                    </span>
                                  </p>
                                  <p>
                                    Valor total s/IGV:{' '}
                                    <span className="font-semibold text-slate-900">
                                      {formatOptionalCurrency(preview?.valorVentaTotalSinIgv)}
                                    </span>
                                  </p>
                                  <p>
                                    IGV total:{' '}
                                    <span className="font-semibold text-slate-900">
                                      {formatOptionalCurrency(preview?.igvTotal)}
                                    </span>
                                  </p>
                                  <p>
                                    Precio total c/IGV:{' '}
                                    <span className="font-semibold text-slate-950">
                                      {formatOptionalCurrency(preview?.precioVentaTotalConIgv)}
                                    </span>
                                  </p>
                                </div>
                                <p className="text-xs leading-5 text-slate-500">
                                  Previsualización informativa. Los importes definitivos se
                                  calcularán y registrarán al confirmar el movimiento.
                                </p>
                              </div>
                            )
                          })()}
                        </td>
                      ) : null}
                      {rules.isEntradaCompra ? (
                        <>
                          <td className="w-32 min-w-32 px-4 py-3 align-top">
                            <input
                              aria-label={`Tasa IGV linea ${index + 1}`}
                              className={inputClass.replace('w-full', 'w-28')}
                              min="0"
                              step="0.01"
                              type="number"
                              {...register(`detalles.${index}.tasaIgv`)}
                            />
                            {errors.detalles?.[index]?.tasaIgv ? (
                              <span className="mt-1 block text-sm text-red-600">
                                {errors.detalles[index]?.tasaIgv?.message}
                              </span>
                            ) : null}
                          </td>
                          <td className="min-w-48 px-4 py-3 align-top">
                            <label className="flex items-start gap-2 text-sm text-slate-700">
                              <input
                                aria-label={`IGV recuperable linea ${index + 1}`}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                type="checkbox"
                                {...register(`detalles.${index}.igvRecuperable`)}
                              />
                              <span>
                                Si
                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                  Cuando el IGV es recuperable, no forma parte del costo del inventario.
                                </span>
                              </span>
                            </label>
                          </td>
                          <td className="min-w-64 px-4 py-3 align-top text-xs leading-5 text-slate-600">
                            {(() => {
                              const calculo = calcularCostoEntrada({
                                cantidad: toPreviewNumber(detalles[index]?.cantidad),
                                igvRecuperable: toPreviewBoolean(
                                  detalles[index]?.igvRecuperable,
                                ),
                                tasaIgv: toPreviewNumber(detalles[index]?.tasaIgv),
                                valorUnitarioSinIgv: toPreviewNumber(
                                  detalles[index]?.valorUnitarioSinIgv,
                                ),
                              })

                              return (
                                <div className="space-y-1">
                                  <p>
                                    IGV unitario:{' '}
                                    <span className="font-semibold text-slate-800">
                                      {currencyFormatter.format(calculo.montoIgvUnitario)}
                                    </span>
                                  </p>
                                  <p>
                                    Precio unitario con IGV:{' '}
                                    <span className="font-semibold text-slate-800">
                                      {currencyFormatter.format(calculo.precioUnitarioConIgv)}
                                    </span>
                                  </p>
                                  <p>
                                    Costo aplicado al inventario:{' '}
                                    <span className="font-semibold text-slate-950">
                                      {currencyFormatter.format(
                                        calculo.costoUnitarioInventariable,
                                      )}
                                    </span>
                                  </p>
                                  <p className="text-slate-500">
                                    Este valor se utiliza para calcular el costo promedio y valorizar
                                    el stock.
                                  </p>
                                  <p>
                                    Valor inventariable:{' '}
                                    <span className="font-semibold text-slate-950">
                                      {currencyFormatter.format(calculo.totalInventariable)}
                                    </span>
                                  </p>
                                </div>
                              )
                            })()}
                          </td>
                        </>
                      ) : null}
                      <td className="w-44 min-w-44 px-4 py-3 align-top">
                        <input className={inputClass} {...register(`detalles.${index}.observacion`)} />
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          disabled={fields.length === 1}
                          onClick={() => {
                            setCustomRecargoLines((current) => {
                              const next = { ...current }
                              delete next[field.id]
                              return next
                            })
                            remove(index)
                          }}
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
              {rules.isEntradaCompra ? (
                <>
                  <p>
                    Subtotal sin IGV:{' '}
                    <span className="font-semibold text-slate-950">
                      {currencyFormatter.format(totals.compraTotals.subtotalSinIgv)}
                    </span>
                  </p>
                  <p>
                    IGV total:{' '}
                    <span className="font-semibold text-slate-950">
                      {currencyFormatter.format(totals.compraTotals.igvTotal)}
                    </span>
                  </p>
                  <p>
                    Total documento:{' '}
                    <span className="font-semibold text-slate-950">
                      {currencyFormatter.format(totals.compraTotals.totalDocumento)}
                    </span>
                  </p>
                  <p>
                    Valor inventariable:{' '}
                    <span className="font-semibold text-slate-950">
                      {currencyFormatter.format(totals.compraTotals.valorInventariable)}
                    </span>
                  </p>
                </>
              ) : isSalidaVenta ? (
                <>
                  <p>
                    Costo total inventario:{' '}
                    <span className="font-semibold text-slate-950">
                      {formatOptionalCurrency(totals.importeTotal)}
                    </span>
                  </p>
                  <p>
                    Valor total sin IGV:{' '}
                    <span className="font-semibold text-slate-950">
                      {formatOptionalCurrency(totals.valorVentaTotalSinIgv)}
                    </span>
                  </p>
                  <p>
                    IGV total:{' '}
                    <span className="font-semibold text-slate-950">
                      {formatOptionalCurrency(totals.igvComercialTotal)}
                    </span>
                  </p>
                  <p>
                    Precio total con IGV:{' '}
                    <span className="font-semibold text-slate-950">
                      {formatOptionalCurrency(totals.precioVentaTotalConIgv)}
                    </span>
                  </p>
                </>
              ) : (
                <p>
                  Importe total:{' '}
                  <span className="font-semibold text-slate-950">
                    {currencyFormatter.format(totals.importeTotal)}
                  </span>
                </p>
              )}
            </div>
            </div>
          </section>

          {isSalidaVenta ? (
            <div
              className={`mt-4 rounded-md border px-4 py-3 text-sm ${
                datosComercialesPendientes.length > 0
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {datosComercialesPendientes.length > 0 ? (
                <>
                  <p className="font-semibold">Datos pendientes para confirmar:</p>
                  <p className="mt-1">{datosComercialesPendientes.join(', ')}.</p>
                  <p className="mt-1 text-xs">
                    Puede guardar el borrador; deberá completar estos datos antes de confirmar.
                  </p>
                </>
              ) : (
                <p className="font-semibold">La valorizacion comercial está lista para confirmar.</p>
              )}
            </div>
          ) : null}

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
              onClick={(event) => {
                setStockConfirmError(null)
                setValue('confirmar', false, { shouldValidate: false })
                void handleSubmit(
                  (values) => onSubmit(values, { confirmar: false }),
                  revealValidationErrors,
                )(event)
              }}
              type="button"
            >
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={(event) => {
                setStockConfirmError(null)
                setValue('confirmar', true, { shouldValidate: false })
                void handleSubmit(
                  (values) => {
                    if (
                      rules.useCostoAutomatico &&
                      values.detalles.some(
                        (detalle) =>
                          detalle.productoId &&
                          (detalle.costoUnitario === undefined ||
                            detalle.costoUnitario === null ||
                            !Number.isFinite(detalle.costoUnitario)),
                      )
                    ) {
                      setStockConfirmError(
                        'No se puede guardar y confirmar una salida sin stock disponible o costo actual.',
                      )
                      return
                    }

                    setPendingConfirmValues(values)
                  },
                  revealValidationErrors,
                )(event)
              }}
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
                  try {
                    await onSubmit(pendingConfirmValues, { confirmar: true })
                  } catch {
                    setPendingConfirmValues(null)
                    return
                  }

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
