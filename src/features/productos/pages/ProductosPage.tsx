import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { ProductCodeBadge } from '../../../shared/components/ProductCodeBadge'
import { can } from '../../../shared/utils/permissions'
import { useAuth } from '../../auth/context/useAuth'
import {
  ProductoFilters,
  type EstadoProductoFilter,
} from '../components/ProductoFilters'
import { ProductoFormModal } from '../components/ProductoFormModal'
import { ProductoTable } from '../components/ProductoTable'
import { familiaService } from '../../familias/services/familiaService'
import { marcaService } from '../../marcas/services/marcaService'
import { tipoArticuloService } from '../../tipos-articulo/services/tipoArticuloService'
import {
  getApiErrorMessage,
  productoService,
} from '../services/productoService'
import { unidadMedidaService } from '../services/unidadMedidaService'
import type { ProductoFormValues } from '../schemas/productoSchema'
import type { Producto, ProductoPayload } from '../types/producto.types'
import {
  normalizeBusinessText,
  normalizeOptionalBusinessText,
} from '../../../shared/utils/textNormalization'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  producto: Producto
}

function getActivoFilter(estado: EstadoProductoFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: ProductoFormValues): ProductoPayload {
  return {
    nombre: normalizeBusinessText(values.nombre),
    descripcion: normalizeOptionalBusinessText(values.descripcion),
    tipoArticuloId: values.tipoArticuloId,
    familiaId: values.familiaId,
    subfamiliaId: values.subfamiliaId ?? null,
    marcaId: values.marcaId ?? null,
    unidadMedidaId: values.unidadMedidaId,
    stockMinimo: values.stockMinimo ?? null,
    stockMaximo: values.stockMaximo ?? null,
    costoReferencial: values.costoReferencial ?? null,
    controlaLote: values.controlaLote,
    controlaSerie: values.controlaSerie,
  }
}

export function ProductosPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoProductoFilter>('todos')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSession, setModalSession] = useState(0)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null)

  const canView = can(user, 'PRODUCTO_VER')
  const canCreate = can(user, 'PRODUCTO_CREAR')
  const canEdit = can(user, 'PRODUCTO_EDITAR')
  const canToggle = can(user, 'PRODUCTO_DESACTIVAR')

  const filters = useMemo(
    () => ({
      activo: getActivoFilter(estado),
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, page, texto],
  )

  const productosQuery = useQuery({
    enabled: canView,
    queryKey: ['productos', filters],
    queryFn: () => productoService.getProductos(filters),
  })

  const familiasQuery = useQuery({
    enabled: canView,
    queryKey: ['familias-activas'],
    queryFn: familiaService.getFamiliasActivas,
  })

  const tiposArticuloQuery = useQuery({
    enabled: canView,
    queryKey: ['tipos-articulo-activos'],
    queryFn: tipoArticuloService.getTiposArticuloActivos,
  })

  const marcasQuery = useQuery({
    enabled: canView,
    queryKey: ['marcas-activas'],
    queryFn: marcaService.getMarcasActivas,
  })

  const unidadesQuery = useQuery({
    enabled: canView,
    queryKey: ['unidades-medida'],
    queryFn: unidadMedidaService.getUnidadesMedida,
  })

  const saveMutation = useMutation({
    mutationFn: async (values: ProductoFormValues) => {
      const payload = toPayload(values)

      if (editingProducto) {
        return productoService.updateProducto(editingProducto.id, payload)
      }

      return productoService.createProducto(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productos'] })
      setIsModalOpen(false)
      setEditingProducto(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingProducto
          ? 'Producto actualizado correctamente.'
          : 'Producto creado correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return productoService.activarProducto(action.producto.id)
      }

      return productoService.desactivarProducto(action.producto.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['productos'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Producto activado correctamente.'
            : 'Producto desactivado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error),
      })
    },
  })

  const totalPages = productosQuery.data?.totalPages ?? 0
  const totalElements = productosQuery.data?.totalElements ?? 0
  const productos = productosQuery.data?.content ?? []
  const isLoadingOptions =
    familiasQuery.isLoading ||
    tiposArticuloQuery.isLoading ||
    marcasQuery.isLoading ||
    unidadesQuery.isLoading

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoProductoFilter) => {
    setEstado(value)
    setPage(0)
  }

  const openCreateModal = () => {
    setEditingProducto(null)
    setFormError(null)
    setModalSession((current) => current + 1)
    setIsModalOpen(true)
  }

  const openEditModal = async (producto: Producto) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(producto.id)

    try {
      const detalle = await productoService.getProducto(producto.id)
      setEditingProducto(detalle)
      setModalSession((current) => current + 1)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error),
      })
    } finally {
      setEditLoadingId(null)
    }
  }

  const handleModalClose = () => {
    if (saveMutation.isPending) {
      return
    }

    setIsModalOpen(false)
    setEditingProducto(null)
    setFormError(null)
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await productosQuery.refetch()
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Productos"
          description="Catalogo base para gestionar productos del almacen."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar productos.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Productos"
          description="Catalogo base para gestionar productos del almacen."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={productosQuery.isFetching}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
          {canCreate ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={17} />
              Nuevo producto
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

      {productosQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(productosQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <ProductoFilters
          estado={estado}
          onEstadoChange={handleEstadoChange}
          onTextoChange={handleTextoChange}
          texto={texto}
        />
      </Card>

      <ProductoTable
        canEdit={canEdit}
        canToggle={canToggle}
        isLoading={productosQuery.isLoading}
        onActivar={(producto) => setConfirmAction({ producto, type: 'activar' })}
        onDesactivar={(producto) => setConfirmAction({ producto, type: 'desactivar' })}
        onEdit={openEditModal}
        productos={productos}
        toggleLoadingId={toggleMutation.isPending ? confirmAction?.producto.id : editLoadingId}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} producto{totalElements === 1 ? '' : 's'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || productosQuery.isFetching}
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
            disabled={page + 1 >= totalPages || productosQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <ProductoFormModal
        canCreateCatalogs={canCreate}
        errorMessage={formError}
        familias={familiasQuery.data ?? []}
        isLoadingOptions={isLoadingOptions}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        key={modalSession}
        marcas={marcasQuery.data ?? []}
        mode={editingProducto ? 'edit' : 'create'}
        onClose={handleModalClose}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        producto={editingProducto}
        tiposArticulo={tiposArticuloQuery.data ?? []}
        unidadesMedida={unidadesQuery.data ?? []}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar producto' : 'Desactivar producto'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'activar'
                ? 'Confirme que desea activar el producto'
                : 'Confirme que desea desactivar el producto'}{' '}
              <span className="inline-flex flex-wrap items-center gap-2 align-middle font-semibold text-slate-900">
                <ProductCodeBadge code={confirmAction.producto.codigo} />
                <span>{confirmAction.producto.nombre}</span>
              </span>
              .
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={toggleMutation.isPending}
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 ${
                  confirmAction.type === 'activar'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate(confirmAction)}
                type="button"
              >
                {toggleMutation.isPending ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
