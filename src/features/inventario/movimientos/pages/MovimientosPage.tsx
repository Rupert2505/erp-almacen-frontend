import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../../shared/components/Card'
import { PageHeader } from '../../../../shared/components/PageHeader'
import { toLocalDateTimePayload } from '../../../../shared/utils/dateTime'
import { can } from '../../../../shared/utils/permissions'
import { almacenService } from '../../../almacenes/services/almacenService'
import { ubicacionService } from '../../../almacenes/services/ubicacionService'
import { useAuth } from '../../../auth/context/useAuth'
import { productoService } from '../../../productos/services/productoService'
import { proveedorService } from '../../../proveedores/services/proveedorService'
import { MovimientoAnularModal } from '../components/MovimientoAnularModal'
import { MovimientoCancelarModal } from '../components/MovimientoCancelarModal'
import { MovimientoFilters } from '../components/MovimientoFilters'
import { MovimientoFormModal } from '../components/MovimientoFormModal'
import { MovimientoTable } from '../components/MovimientoTable'
import { MovimientoViewModal } from '../components/MovimientoViewModal'
import type {
  AnularMovimientoValues,
  CancelarMovimientoValues,
  MovimientoFormValues,
} from '../schemas/movimientoSchema'
import {
  getMovimientoApiErrorMessage,
  isMovimientoConflictError,
  movimientoService,
  shouldRefreshMovimientoAfterError,
} from '../services/movimientoService'
import type {
  EstadoMovimiento,
  Movimiento,
  MovimientoPayload,
  TipoMovimiento,
} from '../types/movimiento.types'
import { buildMovimientoDetallePayload } from '../utils/movimientoPayload'
import { isValidRecargoComercial } from '../utils/valorizacionComercial'

const PAGE_SIZE = 10
const PRODUCT_SEARCH_PREFETCH_SIZE = 1000

type Feedback = {
  type: 'success' | 'error'
  message: string
}

function movimientoPermission(tipoMovimiento: TipoMovimiento) {
  if (['ENTRADA_COMPRA', 'ENTRADA_AJUSTE'].includes(tipoMovimiento)) {
    return 'INVENTARIO_ENTRADA'
  }

  if (['SALIDA_CONSUMO', 'SALIDA_VENTA', 'SALIDA_AJUSTE'].includes(tipoMovimiento)) {
    return 'INVENTARIO_SALIDA'
  }

  if (tipoMovimiento === 'TRANSFERENCIA') {
    return 'INVENTARIO_TRANSFERENCIA'
  }

  if (tipoMovimiento === 'DEVOLUCION_PROVEEDOR') {
    return 'INVENTARIO_DEVOLUCION_CONFIRMAR'
  }

  return 'INVENTARIO_AJUSTE'
}

function hasAnyInventoryPermission(user: ReturnType<typeof useAuth>['user']) {
  return (
    can(user, 'INVENTARIO_ENTRADA') ||
    can(user, 'INVENTARIO_SALIDA') ||
    can(user, 'INVENTARIO_TRANSFERENCIA') ||
    can(user, 'INVENTARIO_AJUSTE')
  )
}

function toPayload(values: MovimientoFormValues, confirmar = false): MovimientoPayload {
  const tipoMovimiento = values.tipoMovimiento
  const usaOrigen = [
    'SALIDA_CONSUMO',
    'SALIDA_VENTA',
    'SALIDA_AJUSTE',
    'AJUSTE_NEGATIVO',
    'TRANSFERENCIA',
  ].includes(tipoMovimiento)
  const usaDestino = [
    'ENTRADA_COMPRA',
    'ENTRADA_AJUSTE',
    'AJUSTE_POSITIVO',
    'TRANSFERENCIA',
  ].includes(tipoMovimiento)
  const esEntradaCompra = tipoMovimiento === 'ENTRADA_COMPRA'
  const usaProveedor = esEntradaCompra || tipoMovimiento === 'ENTRADA_AJUSTE'
  const usaDocumentoReferencia = !esEntradaCompra
  const usaMotivo = [
    'ENTRADA_AJUSTE',
    'SALIDA_CONSUMO',
    'SALIDA_VENTA',
    'SALIDA_AJUSTE',
    'TRANSFERENCIA',
    'AJUSTE_POSITIVO',
    'AJUSTE_NEGATIVO',
  ].includes(tipoMovimiento)
  const usaDatosConsumo = tipoMovimiento === 'SALIDA_CONSUMO'
  const usaOrdenTrabajo = usaDatosConsumo || tipoMovimiento === 'SALIDA_VENTA'
  const usaResponsables = tipoMovimiento === 'TRANSFERENCIA'

  return {
    tipoMovimiento,
    fechaMovimiento: toLocalDateTimePayload(),
    proveedorId: usaProveedor ? values.proveedorId : null,
    almacenOrigenId: usaOrigen ? values.almacenOrigenId : null,
    almacenDestinoId: usaDestino ? values.almacenDestinoId : null,
    documentoReferencia: usaDocumentoReferencia ? values.documentoReferencia?.trim() || null : null,
    motivoMovimiento: usaMotivo ? values.motivoMovimiento?.trim() || null : null,
    ordenTrabajo: usaOrdenTrabajo ? values.ordenTrabajo?.trim() || null : null,
    areaSolicitante: usaDatosConsumo ? values.areaSolicitante?.trim() || null : null,
    solicitante: usaDatosConsumo ? values.solicitante?.trim() || null : null,
    responsableEntrega: usaResponsables ? values.responsableEntrega?.trim() || null : null,
    responsableRecepcion: usaResponsables
      ? values.responsableRecepcion?.trim() || null
      : null,
    guiaSerie: esEntradaCompra ? values.guiaSerie?.trim() || null : null,
    guiaNumero: esEntradaCompra ? values.guiaNumero?.trim() || null : null,
    guiaFecha: esEntradaCompra ? values.guiaFecha || null : null,
    comprobanteTipo: esEntradaCompra ? values.comprobanteTipo || null : null,
    comprobanteSerie: esEntradaCompra ? values.comprobanteSerie?.trim() || null : null,
    comprobanteNumero: esEntradaCompra ? values.comprobanteNumero?.trim() || null : null,
    comprobanteFechaEmision: esEntradaCompra ? values.comprobanteFechaEmision || null : null,
    ordenCompra: esEntradaCompra ? values.ordenCompraNumero?.trim() || null : null,
    ordenCompraNumero: esEntradaCompra ? values.ordenCompraNumero?.trim() || null : null,
    fechaPedido: esEntradaCompra ? values.fechaPedido || null : null,
    fechaRecepcion: esEntradaCompra ? values.fechaRecepcion || null : null,
    flete: esEntradaCompra ? values.flete ?? null : null,
    movilidad: esEntradaCompra ? values.movilidad ?? null : null,
    otrosGastos: esEntradaCompra ? values.otrosGastos ?? null : null,
    observacionDocumentaria:
      esEntradaCompra ? values.observacionDocumentaria?.trim() || null : null,
    confirmar,
    observacion: values.observacion?.trim() || null,
    detalles: values.detalles.map((detalle) =>
      buildMovimientoDetallePayload(tipoMovimiento, detalle, {
        usaDestino,
        usaOrigen,
      }),
    ),
  }
}

export function MovimientosPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento | ''>('')
  const [estado, setEstado] = useState<EstadoMovimiento | ''>('')
  const [page, setPage] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmMovimiento, setConfirmMovimiento] = useState<Movimiento | null>(null)
  const [anularMovimiento, setAnularMovimiento] = useState<Movimiento | null>(null)
  const [anularError, setAnularError] = useState<string | null>(null)
  const [cancelarMovimiento, setCancelarMovimiento] = useState<Movimiento | null>(null)
  const [cancelarError, setCancelarError] = useState<string | null>(null)
  const [viewMovimiento, setViewMovimiento] = useState<Movimiento | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [preparingConfirmId, setPreparingConfirmId] = useState<number | null>(null)

  const canView =
    can(user, 'STOCK_VER') || can(user, 'KARDEX_VER') || can(user, 'INVENTARIO_DEVOLUCION_VER')
  const canCreate = hasAnyInventoryPermission(user)
  const canCreateDevolucion = can(user, 'INVENTARIO_DEVOLUCION_CREAR')
  const canViewDevolucion = can(user, 'INVENTARIO_DEVOLUCION_VER')
  const canExportReportes = can(user, 'REPORTE_EXPORTAR')

  const filters = useMemo(
    () => ({
      estado,
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
      tipoMovimiento,
    }),
    [estado, page, texto, tipoMovimiento],
  )

  const movimientosQuery = useQuery({
    enabled: canView,
    queryKey: ['movimientos-inventario', filters],
    queryFn: () => movimientoService.getMovimientos(filters),
  })

  const productosQuery = useQuery({
    enabled: canView,
    queryKey: ['productos-activos-movimientos'],
    queryFn: () =>
      productoService.getProductos({
        activo: true,
        page: 0,
        size: PRODUCT_SEARCH_PREFETCH_SIZE,
        texto: '',
      }),
  })

  const proveedoresQuery = useQuery({
    enabled: canView,
    queryKey: ['proveedores-activos-movimientos'],
    queryFn: () =>
      proveedorService.getProveedores({
        activo: true,
        page: 0,
        size: 10,
        texto: '',
      }),
  })

  const almacenesQuery = useQuery({
    enabled: canView,
    queryKey: ['almacenes-activos-movimientos'],
    queryFn: almacenService.getAlmacenesActivos,
  })

  const ubicacionesQuery = useQuery({
    enabled: canView,
    queryKey: ['ubicaciones-activas-movimientos'],
    queryFn: () =>
      ubicacionService.getUbicaciones({
        activo: true,
        page: 0,
        size: 500,
        texto: '',
      }),
  })

  const invalidateMovimientoData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] }),
      queryClient.invalidateQueries({ queryKey: ['stock-actual'] }),
      queryClient.invalidateQueries({ queryKey: ['stock-bajo-minimo'] }),
      queryClient.invalidateQueries({ queryKey: ['kardex'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-resumen'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-movimientos'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-stock-valorizado'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-entradas-proveedor'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-salidas'] }),
      queryClient.invalidateQueries({ queryKey: ['reportes', 'salidas-por-os'] }),
      queryClient.invalidateQueries({ queryKey: ['reporte-inventario-productos-bajo-minimo'] }),
      queryClient.invalidateQueries({ queryKey: ['cantidades-devolucion'] }),
      queryClient.invalidateQueries({ queryKey: ['devoluciones-proveedor'] }),
    ])
  }

  const refreshMovimientoAfterRejection = async (movimientoId?: number | null) => {
    await invalidateMovimientoData()

    if (!movimientoId || viewMovimiento?.id !== movimientoId) {
      return
    }

    try {
      const detalleActualizado = await movimientoService.getMovimiento(movimientoId)
      setViewMovimiento(detalleActualizado)
    } catch {
      setIsViewOpen(false)
      setViewMovimiento(null)
    }
  }

  const createMutation = useMutation({
    mutationFn: ({
      confirmar,
      values,
    }: {
      confirmar: boolean
      values: MovimientoFormValues
    }) => movimientoService.createMovimiento(toPayload(values, confirmar)),
    onSuccess: async (_movimiento, variables) => {
      setPage(0)
      if (variables.confirmar) {
        await invalidateMovimientoData()
      } else {
        await queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
      }
      setIsFormOpen(false)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: variables.confirmar
          ? 'Movimiento guardado y confirmado correctamente.'
          : 'Movimiento guardado en borrador.',
      })
    },
    onError: async (error) => {
      setFormError(getMovimientoApiErrorMessage(error))

      if (shouldRefreshMovimientoAfterError(error)) {
        await refreshMovimientoAfterRejection()
      }
    },
  })

  const confirmarMutation = useMutation({
    mutationFn: (movimiento: Movimiento) => movimientoService.confirmarMovimiento(movimiento.id),
    onMutate: (movimiento) => {
      setProcessingId(movimiento.id)
    },
    onSuccess: async () => {
      await invalidateMovimientoData()
      setConfirmMovimiento(null)
      setFeedback({
        type: 'success',
        message: 'El movimiento fue confirmado correctamente.',
      })
    },
    onError: async (error, movimiento) => {
      setConfirmMovimiento(null)
      setFeedback({
        type: 'error',
        message: getMovimientoApiErrorMessage(error),
      })

      if (shouldRefreshMovimientoAfterError(error)) {
        await refreshMovimientoAfterRejection(movimiento.id)
      }
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const anularMutation = useMutation({
    mutationFn: (values: AnularMovimientoValues) => {
      if (!anularMovimiento) {
        throw new Error('No hay movimiento seleccionado')
      }

      return movimientoService.anularMovimiento(anularMovimiento.id, values.motivo)
    },
    onMutate: () => {
      setProcessingId(anularMovimiento?.id ?? null)
    },
    onSuccess: async (movimientoActualizado) => {
      await invalidateMovimientoData()
      if (viewMovimiento?.id === movimientoActualizado.id) {
        setViewMovimiento(movimientoActualizado)
      }
      setAnularMovimiento(null)
      setAnularError(null)
      setFeedback({
        type: 'success',
        message:
          movimientoActualizado.tipoMovimiento === 'DEVOLUCION_PROVEEDOR'
            ? 'La devolucion fue anulada correctamente y el stock fue restaurado.'
            : 'El movimiento fue anulado correctamente y el stock fue restaurado.',
      })
    },
    onError: async (error) => {
      setAnularError(getMovimientoApiErrorMessage(error))

      if (isMovimientoConflictError(error) && anularMovimiento?.estado !== 'CONFIRMADO') {
        setAnularMovimiento(null)
      }

      if (shouldRefreshMovimientoAfterError(error)) {
        await refreshMovimientoAfterRejection(anularMovimiento?.id)
      }
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const cancelarMutation = useMutation({
    mutationFn: (values: CancelarMovimientoValues) => {
      if (!cancelarMovimiento) {
        throw new Error('No hay movimiento seleccionado')
      }

      return movimientoService.cancelarMovimiento(
        cancelarMovimiento.id,
        values.motivoCancelacion,
      )
    },
    onMutate: () => {
      setProcessingId(cancelarMovimiento?.id ?? null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
      setCancelarMovimiento(null)
      setCancelarError(null)
      setFeedback({
        type: 'success',
        message: 'Movimiento cancelado correctamente.',
      })
    },
    onError: async (error) => {
      setCancelarError(getMovimientoApiErrorMessage(error))

      if (shouldRefreshMovimientoAfterError(error)) {
        await refreshMovimientoAfterRejection(cancelarMovimiento?.id)
      }
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const movimientos = movimientosQuery.data?.content ?? []
  const totalElements = movimientosQuery.data?.totalElements ?? 0
  const totalPages = movimientosQuery.data?.totalPages ?? 0

  const puedeConfirmarMovimiento = (movimiento: Movimiento) =>
    can(user, movimientoPermission(movimiento.tipoMovimiento))

  const puedeCancelarMovimiento = (movimiento: Movimiento) =>
    movimiento.tipoMovimiento === 'DEVOLUCION_PROVEEDOR'
      ? can(user, 'INVENTARIO_DEVOLUCION_CREAR') ||
        can(user, 'INVENTARIO_DEVOLUCION_CONFIRMAR')
      : can(user, movimientoPermission(movimiento.tipoMovimiento))

  const puedeAnularMovimiento = (movimiento: Movimiento) =>
    movimiento.tipoMovimiento === 'DEVOLUCION_PROVEEDOR'
      ? can(user, 'INVENTARIO_DEVOLUCION_ANULAR')
      : can(user, 'INVENTARIO_AJUSTE')

  const viewEntradaPuedeTenerDevolucion =
    isViewOpen &&
    viewMovimiento?.tipoMovimiento === 'ENTRADA_COMPRA' &&
    viewMovimiento.estado === 'CONFIRMADO'

  const cantidadesDevolucionQuery = useQuery({
    enabled:
      Boolean(viewMovimiento?.id) &&
      viewEntradaPuedeTenerDevolucion &&
      canCreateDevolucion &&
      canViewDevolucion,
    queryKey: ['cantidades-devolucion', viewMovimiento?.id],
    queryFn: () => movimientoService.getCantidadesDevolucion(Number(viewMovimiento?.id)),
  })

  const showRegistrarDevolucion =
    viewEntradaPuedeTenerDevolucion &&
    canCreateDevolucion &&
    canViewDevolucion &&
    Boolean(
      cantidadesDevolucionQuery.data?.some(
        (detalle) => Number(detalle.cantidadPendienteDevolver ?? 0) > 0,
      ),
    )

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleTipoMovimientoChange = (value: TipoMovimiento | '') => {
    setTipoMovimiento(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoMovimiento | '') => {
    setEstado(value)
    setPage(0)
  }

  const openForm = () => {
    setFormError(null)
    setFeedback(null)
    setIsFormOpen(true)
  }

  const openView = async (movimiento: Movimiento) => {
    setIsViewOpen(true)
    setIsViewLoading(true)
    setViewMovimiento(movimiento)

    try {
      const detalle = await movimientoService.getMovimiento(movimiento.id)
      setViewMovimiento(detalle)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getMovimientoApiErrorMessage(error),
      })
      setIsViewOpen(false)
    } finally {
      setIsViewLoading(false)
    }
  }

  const prepareConfirmacion = async (movimiento: Movimiento) => {
    setFeedback(null)
    setPreparingConfirmId(movimiento.id)

    try {
      const movimientoActual = await movimientoService.getMovimiento(movimiento.id)

      if (movimientoActual.tipoMovimiento === 'SALIDA_VENTA') {
        if (!movimientoActual.ordenTrabajo?.trim()) {
          setFeedback({
            type: 'error',
            message: 'La Orden de Servicio (OS) es obligatoria para confirmar una salida de venta.',
          })
          return
        }

        const detalles = movimientoActual.detalles ?? []
        if (detalles.length === 0) {
          setFeedback({
            type: 'error',
            message: 'La salida de venta debe tener al menos un detalle para confirmar.',
          })
          return
        }

        const invalidRecargo = detalles.find(
          (detalle) => !isValidRecargoComercial(detalle.recargoComercialPct),
        )
        if (invalidRecargo) {
          setFeedback({
            type: 'error',
            message:
              'Todos los detalles deben tener un recargo comercial válido entre 0% y 1000% antes de confirmar.',
          })
          return
        }

        const productoIds = [...new Set(detalles.map((detalle) => detalle.productoId))]
        if (productoIds.some((productoId) => !Number.isInteger(productoId) || productoId <= 0)) {
          setFeedback({
            type: 'error',
            message: 'Todos los detalles deben tener un producto válido antes de confirmar.',
          })
          return
        }

        const productosActuales = await Promise.all(
          productoIds.map((productoId) => productoService.getProducto(productoId)),
        )
        const productoSinBase = productosActuales.find(
          (producto) =>
            producto.costoReferencial === null ||
            producto.costoReferencial === undefined ||
            !Number.isFinite(Number(producto.costoReferencial)) ||
            Number(producto.costoReferencial) < 0,
        )

        if (productoSinBase) {
          setFeedback({
            type: 'error',
            message: `El producto ${productoSinBase.codigo} no tiene configurado un costo base comercial sin IGV válido.`,
          })
          return
        }
      }

      setConfirmMovimiento(movimientoActual)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getMovimientoApiErrorMessage(error),
      })
    } finally {
      setPreparingConfirmId(null)
    }
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await movimientosQuery.refetch()
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Movimientos de inventario"
          description="Registro operativo de entradas, salidas, ajustes y transferencias."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar movimientos de inventario.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Movimientos de inventario"
          description="Registro operativo de entradas, salidas, ajustes y transferencias."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={movimientosQuery.isFetching}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
          {canCreate ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={openForm}
              type="button"
            >
              <Plus size={17} />
              Nuevo movimiento
            </button>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div
          className={`mb-5 rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {movimientosQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getMovimientoApiErrorMessage(movimientosQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <MovimientoFilters
          estado={estado}
          onEstadoChange={handleEstadoChange}
          onTextoChange={handleTextoChange}
          onTipoMovimientoChange={handleTipoMovimientoChange}
          texto={texto}
          tipoMovimiento={tipoMovimiento}
        />
      </Card>

      <MovimientoTable
        isLoading={movimientosQuery.isLoading}
        movimientos={movimientos}
        onAnular={(movimiento) => {
          setAnularError(null)
          setAnularMovimiento(movimiento)
        }}
        onCancelar={(movimiento) => {
          setCancelarError(null)
          setCancelarMovimiento(movimiento)
        }}
        onConfirmar={(movimiento) => void prepareConfirmacion(movimiento)}
        onView={openView}
        puedeAnularMovimiento={puedeAnularMovimiento}
        puedeCancelarMovimiento={puedeCancelarMovimiento}
        puedeConfirmarMovimiento={puedeConfirmarMovimiento}
        processingId={processingId ?? preparingConfirmId}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} movimiento{totalElements === 1 ? '' : 's'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || movimientosQuery.isFetching}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
            type="button"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <span className="min-w-28 text-center">
            Pagina {totalPages === 0 ? 0 : page + 1} de {totalPages}
          </span>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page + 1 >= totalPages || movimientosQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <MovimientoFormModal
        almacenes={almacenesQuery.data ?? []}
        errorMessage={formError}
        isOpen={isFormOpen}
        isSaving={createMutation.isPending}
        onClose={() => {
          if (!createMutation.isPending) {
            setIsFormOpen(false)
            setFormError(null)
          }
        }}
        onSubmit={async (values, options) => {
          await createMutation.mutateAsync({
            confirmar: Boolean(options?.confirmar),
            values,
          })
        }}
        productos={productosQuery.data?.content ?? []}
        proveedores={proveedoresQuery.data?.content ?? []}
        ubicaciones={ubicacionesQuery.data?.content ?? []}
      />

      <MovimientoViewModal
        isRegistrarDevolucionLoading={cantidadesDevolucionQuery.isLoading}
        isLoading={isViewLoading}
        isOpen={isViewOpen}
        movimiento={viewMovimiento}
        onClose={() => {
          setIsViewOpen(false)
          setViewMovimiento(null)
        }}
        onRegistrarDevolucion={() => {
          if (viewMovimiento?.id) {
            navigate(`/inventario/entradas/${viewMovimiento.id}/devolucion`)
          }
        }}
        showPdfButton={canExportReportes}
        showRegistrarDevolucion={showRegistrarDevolucion}
      />

      <MovimientoAnularModal
        errorMessage={anularError}
        isOpen={Boolean(anularMovimiento)}
        isSaving={anularMutation.isPending}
        movimiento={anularMovimiento}
        onClose={() => {
          if (!anularMutation.isPending) {
            setAnularMovimiento(null)
            setAnularError(null)
          }
        }}
        onSubmit={async (values) => {
          await anularMutation.mutateAsync(values)
        }}
      />

      <MovimientoCancelarModal
        errorMessage={cancelarError}
        isOpen={Boolean(cancelarMovimiento)}
        isSaving={cancelarMutation.isPending}
        movimiento={cancelarMovimiento}
        onClose={() => {
          if (!cancelarMutation.isPending) {
            setCancelarMovimiento(null)
            setCancelarError(null)
          }
        }}
        onSubmit={async (values) => {
          await cancelarMutation.mutateAsync(values)
        }}
      />

      {confirmMovimiento ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Confirmar movimiento</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirme que desea aplicar el movimiento{' '}
              <span className="font-semibold text-slate-900">{confirmMovimiento.numero}</span>.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={confirmarMutation.isPending}
                onClick={() => setConfirmMovimiento(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={confirmarMutation.isPending}
                onClick={() => confirmarMutation.mutate(confirmMovimiento)}
                type="button"
              >
                {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
