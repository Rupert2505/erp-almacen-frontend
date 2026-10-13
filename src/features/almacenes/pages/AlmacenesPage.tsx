import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import {
  normalizeBusinessText,
  normalizeOptionalBusinessText,
} from '../../../shared/utils/textNormalization'
import { useAuth } from '../../auth/context/useAuth'
import {
  AlmacenFilters,
  type EstadoAlmacenFilter,
} from '../components/AlmacenFilters'
import { AlmacenFormModal } from '../components/AlmacenFormModal'
import { AlmacenTable } from '../components/AlmacenTable'
import type { AlmacenFormValues } from '../schemas/almacenSchema'
import {
  almacenService,
  getAlmacenApiErrorMessage,
} from '../services/almacenService'
import type { Almacen, AlmacenPayload } from '../types/almacen.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  almacen: Almacen
}

function getActivoFilter(estado: EstadoAlmacenFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: AlmacenFormValues): AlmacenPayload {
  return {
    codigo: normalizeBusinessText(values.codigo),
    nombre: normalizeBusinessText(values.nombre),
    direccion: normalizeOptionalBusinessText(values.direccion),
    responsable: normalizeOptionalBusinessText(values.responsable),
  }
}

export function AlmacenesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoAlmacenFilter>('todos')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlmacen, setEditingAlmacen] = useState<Almacen | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null)

  const canView = can(user, 'ALMACEN_VER')
  const canCreate = can(user, 'ALMACEN_CREAR')
  const canEdit = can(user, 'ALMACEN_EDITAR')
  const canToggle = can(user, 'ALMACEN_DESACTIVAR')

  const filters = useMemo(
    () => ({
      activo: getActivoFilter(estado),
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, page, texto],
  )

  const almacenesQuery = useQuery({
    enabled: canView,
    queryKey: ['almacenes', filters],
    queryFn: () => almacenService.getAlmacenes(filters),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: AlmacenFormValues) => {
      const payload = toPayload(values)

      if (editingAlmacen) {
        return almacenService.updateAlmacen(editingAlmacen.id, payload)
      }

      return almacenService.createAlmacen(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['almacenes'] })
      setIsModalOpen(false)
      setEditingAlmacen(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingAlmacen
          ? 'Almacen actualizado correctamente.'
          : 'Almacen creado correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getAlmacenApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return almacenService.activarAlmacen(action.almacen.id)
      }

      return almacenService.desactivarAlmacen(action.almacen.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['almacenes'] })
      await queryClient.invalidateQueries({ queryKey: ['almacenes-activos'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Almacen activado correctamente.'
            : 'Almacen desactivado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getAlmacenApiErrorMessage(error),
      })
    },
  })

  const totalPages = almacenesQuery.data?.totalPages ?? 0
  const totalElements = almacenesQuery.data?.totalElements ?? 0
  const almacenes = almacenesQuery.data?.content ?? []

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoAlmacenFilter) => {
    setEstado(value)
    setPage(0)
  }

  const openCreateModal = () => {
    setEditingAlmacen(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (almacen: Almacen) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(almacen.id)

    try {
      const detalle = await almacenService.getAlmacen(almacen.id)
      setEditingAlmacen(detalle)
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
    setEditingAlmacen(null)
    setFormError(null)
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await almacenesQuery.refetch()
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Almacenes"
          description="Catalogo operativo de almacenes del sistema."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar almacenes.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Almacenes"
          description="Catalogo operativo de almacenes del sistema."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={almacenesQuery.isFetching}
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
              Nuevo almacen
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

      {almacenesQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getAlmacenApiErrorMessage(almacenesQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <AlmacenFilters
          estado={estado}
          onEstadoChange={handleEstadoChange}
          onTextoChange={handleTextoChange}
          texto={texto}
        />
      </Card>

      <AlmacenTable
        actionLoadingId={toggleMutation.isPending ? confirmAction?.almacen.id : editLoadingId}
        almacenes={almacenes}
        canEdit={canEdit}
        canToggle={canToggle}
        isLoading={almacenesQuery.isLoading}
        onActivar={(almacen) => setConfirmAction({ almacen, type: 'activar' })}
        onDesactivar={(almacen) => setConfirmAction({ almacen, type: 'desactivar' })}
        onEdit={openEditModal}
        onVerUbicaciones={(almacen) => navigate(`/ubicaciones?almacenId=${almacen.id}`)}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} almacen{totalElements === 1 ? '' : 'es'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || almacenesQuery.isFetching}
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
            disabled={page + 1 >= totalPages || almacenesQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <AlmacenFormModal
        almacen={editingAlmacen}
        errorMessage={formError}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        mode={editingAlmacen ? 'edit' : 'create'}
        onClose={handleModalClose}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar almacen' : 'Desactivar almacen'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'activar'
                ? 'Confirme que desea activar el almacen'
                : 'Confirme que desea desactivar el almacen'}{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.almacen.codigo} - {confirmAction.almacen.nombre}
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
