import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import { useAuth } from '../../auth/context/useAuth'
import {
  UbicacionFilters,
  type EstadoUbicacionFilter,
} from '../components/UbicacionFilters'
import { UbicacionFormModal } from '../components/UbicacionFormModal'
import { UbicacionTable } from '../components/UbicacionTable'
import type { UbicacionFormValues } from '../schemas/ubicacionSchema'
import {
  almacenService,
  getAlmacenApiErrorMessage,
} from '../services/almacenService'
import { ubicacionService } from '../services/ubicacionService'
import type { Ubicacion, UbicacionPayload } from '../types/ubicacion.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  ubicacion: Ubicacion
}

function getActivoFilter(estado: EstadoUbicacionFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: UbicacionFormValues): UbicacionPayload {
  return {
    almacenId: values.almacenId,
    codigo: values.codigo.trim(),
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  }
}

export function UbicacionesPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialAlmacenId = searchParams.get('almacenId')
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoUbicacionFilter>('todos')
  const [almacenId, setAlmacenId] = useState<number | null>(
    initialAlmacenId ? Number(initialAlmacenId) : null,
  )
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null)

  const canView = can(user, 'ALMACEN_VER')
  const canManage = can(user, 'USUARIO_ADMIN')

  const filters = useMemo(
    () => ({
      activo: getActivoFilter(estado),
      almacenId,
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [almacenId, estado, page, texto],
  )

  const almacenesQuery = useQuery({
    enabled: canView,
    queryKey: ['almacenes-activos'],
    queryFn: almacenService.getAlmacenesActivos,
  })

  const ubicacionesQuery = useQuery({
    enabled: canView,
    queryKey: ['ubicaciones', filters],
    queryFn: () => ubicacionService.getUbicaciones(filters),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: UbicacionFormValues) => {
      const payload = toPayload(values)

      if (editingUbicacion) {
        return ubicacionService.updateUbicacion(editingUbicacion.id, payload)
      }

      return ubicacionService.createUbicacion(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
      setIsModalOpen(false)
      setEditingUbicacion(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingUbicacion
          ? 'Ubicacion actualizada correctamente.'
          : 'Ubicacion creada correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getAlmacenApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return ubicacionService.activarUbicacion(action.ubicacion.id)
      }

      return ubicacionService.desactivarUbicacion(action.ubicacion.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Ubicacion activada correctamente.'
            : 'Ubicacion desactivada correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getAlmacenApiErrorMessage(error),
      })
    },
  })

  const totalPages = ubicacionesQuery.data?.totalPages ?? 0
  const totalElements = ubicacionesQuery.data?.totalElements ?? 0
  const ubicaciones = ubicacionesQuery.data?.content ?? []
  const almacenes = almacenesQuery.data ?? []

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoUbicacionFilter) => {
    setEstado(value)
    setPage(0)
  }

  const handleAlmacenChange = (value: number | null) => {
    setAlmacenId(value)
    setPage(0)

    if (value) {
      setSearchParams({ almacenId: String(value) })
    } else {
      setSearchParams({})
    }
  }

  const openCreateModal = () => {
    setEditingUbicacion(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (ubicacion: Ubicacion) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(ubicacion.id)

    try {
      const detalle = await ubicacionService.getUbicacion(ubicacion.id)
      setEditingUbicacion(detalle)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getAlmacenApiErrorMessage(error),
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
    setEditingUbicacion(null)
    setFormError(null)
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await ubicacionesQuery.refetch()
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Ubicaciones de almacen"
          description="Catalogo de ubicaciones fisicas por almacen."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar ubicaciones.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Ubicaciones de almacen"
          description="Catalogo de ubicaciones fisicas por almacen."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={ubicacionesQuery.isFetching}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
          {canManage ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={almacenes.length === 0}
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={17} />
              Nueva ubicacion
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

      {ubicacionesQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getAlmacenApiErrorMessage(ubicacionesQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <UbicacionFilters
          almacenId={almacenId}
          almacenes={almacenes}
          estado={estado}
          onAlmacenChange={handleAlmacenChange}
          onEstadoChange={handleEstadoChange}
          onTextoChange={handleTextoChange}
          texto={texto}
        />
      </Card>

      <UbicacionTable
        canManage={canManage}
        isLoading={ubicacionesQuery.isLoading}
        onActivar={(ubicacion) => setConfirmAction({ ubicacion, type: 'activar' })}
        onDesactivar={(ubicacion) => setConfirmAction({ ubicacion, type: 'desactivar' })}
        onEdit={openEditModal}
        toggleLoadingId={toggleMutation.isPending ? confirmAction?.ubicacion.id : editLoadingId}
        ubicaciones={ubicaciones}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} ubicacion{totalElements === 1 ? '' : 'es'} encontrada
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || ubicacionesQuery.isFetching}
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
            disabled={page + 1 >= totalPages || ubicacionesQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <UbicacionFormModal
        almacenes={almacenes}
        errorMessage={formError}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        mode={editingUbicacion ? 'edit' : 'create'}
        onClose={handleModalClose}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        selectedAlmacenId={almacenId}
        ubicacion={editingUbicacion}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar ubicacion' : 'Desactivar ubicacion'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'activar'
                ? 'Confirme que desea activar la ubicacion'
                : 'Confirme que desea desactivar la ubicacion'}{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.ubicacion.codigo} - {confirmAction.ubicacion.nombre}
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
