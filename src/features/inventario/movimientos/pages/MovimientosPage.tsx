import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../../shared/components/Card'
import { PageHeader } from '../../../../shared/components/PageHeader'
import { can } from '../../../../shared/utils/permissions'
import { almacenService } from '../../../almacenes/services/almacenService'
import { ubicacionService } from '../../../almacenes/services/ubicacionService'
import { useAuth } from '../../../auth/context/useAuth'
import { productoService } from '../../../productos/services/productoService'
import { proveedorService } from '../../../proveedores/services/proveedorService'
import { MovimientoAnularModal } from '../components/MovimientoAnularModal'
import { MovimientoFilters } from '../components/MovimientoFilters'
import { MovimientoFormModal } from '../components/MovimientoFormModal'
import { MovimientoTable } from '../components/MovimientoTable'
import { MovimientoViewModal } from '../components/MovimientoViewModal'
import type {
  AnularMovimientoValues,
  MovimientoFormValues,
} from '../schemas/movimientoSchema'
import {
  getMovimientoApiErrorMessage,
  movimientoService,
} from '../services/movimientoService'
import type {
  EstadoMovimiento,
  Movimiento,
  MovimientoPayload,
  TipoMovimiento,
} from '../types/movimiento.types'

const PAGE_SIZE = 10

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

function toPayload(values: MovimientoFormValues): MovimientoPayload {
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

  return {
    tipoMovimiento,
    proveedorId: tipoMovimiento === 'ENTRADA_COMPRA' ? values.proveedorId : null,
    almacenOrigenId: usaOrigen ? values.almacenOrigenId : null,
    almacenDestinoId: usaDestino ? values.almacenDestinoId : null,
    documentoReferencia: values.documentoReferencia?.trim() || null,
    observacion: values.observacion?.trim() || null,
    detalles: values.detalles.map((detalle) => ({
      productoId: detalle.productoId,
      ubicacionOrigenId: usaOrigen ? detalle.ubicacionOrigenId : null,
      ubicacionDestinoId: usaDestino ? detalle.ubicacionDestinoId : null,
      cantidad: detalle.cantidad,
      costoUnitario: detalle.costoUnitario ?? null,
      observacion: detalle.observacion?.trim() || null,
    })),
  }
}

export function MovimientosPage() {
  const queryClient = useQueryClient()
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
  const [viewMovimiento, setViewMovimiento] = useState<Movimiento | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const canView = can(user, 'STOCK_VER') || can(user, 'KARDEX_VER')
  const canCreate = hasAnyInventoryPermission(user)
  const canAnular = can(user, 'INVENTARIO_AJUSTE')

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
        size: 300,
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
        size: 300,
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

  const createMutation = useMutation({
    mutationFn: (values: MovimientoFormValues) => movimientoService.createMovimiento(toPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
      setIsFormOpen(false)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: 'Movimiento creado en BORRADOR correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getMovimientoApiErrorMessage(error))
    },
  })

  const confirmarMutation = useMutation({
    mutationFn: (movimiento: Movimiento) => movimientoService.confirmarMovimiento(movimiento.id),
    onMutate: (movimiento) => {
      setProcessingId(movimiento.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
      setConfirmMovimiento(null)
      setFeedback({
        type: 'success',
        message: 'Movimiento confirmado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getMovimientoApiErrorMessage(error),
      })
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] })
      setAnularMovimiento(null)
      setAnularError(null)
      setFeedback({
        type: 'success',
        message: 'Movimiento anulado correctamente.',
      })
    },
    onError: (error) => {
      setAnularError(getMovimientoApiErrorMessage(error))
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
        canAnular={canAnular}
        isLoading={movimientosQuery.isLoading}
        movimientos={movimientos}
        onAnular={(movimiento) => {
          setAnularError(null)
          setAnularMovimiento(movimiento)
        }}
        onConfirmar={setConfirmMovimiento}
        onView={openView}
        puedeConfirmarMovimiento={puedeConfirmarMovimiento}
        processingId={processingId}
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
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values)
        }}
        productos={productosQuery.data?.content ?? []}
        proveedores={proveedoresQuery.data?.content ?? []}
        ubicaciones={ubicacionesQuery.data?.content ?? []}
      />

      <MovimientoViewModal
        isLoading={isViewLoading}
        isOpen={isViewOpen}
        movimiento={viewMovimiento}
        onClose={() => {
          setIsViewOpen(false)
          setViewMovimiento(null)
        }}
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
