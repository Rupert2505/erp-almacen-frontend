import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import { useAuth } from '../../auth/context/useAuth'
import { familiaService } from '../../familias/services/familiaService'
import {
  SubfamiliaFilters,
  type EstadoSubfamiliaFilter,
} from '../components/SubfamiliaFilters'
import { SubfamiliaFormModal } from '../components/SubfamiliaFormModal'
import { SubfamiliaTable } from '../components/SubfamiliaTable'
import type { SubfamiliaFormValues } from '../schemas/subfamiliaSchema'
import {
  getSubfamiliaApiErrorMessage,
  subfamiliaService,
} from '../services/subfamiliaService'
import type { Subfamilia, SubfamiliaPayload } from '../types/subfamilia.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  subfamilia: Subfamilia
}

function getActivoFilter(estado: EstadoSubfamiliaFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: SubfamiliaFormValues): SubfamiliaPayload {
  return {
    familiaId: values.familiaId,
    nombre: values.nombre.trim(),
    descripcion: values.descripcion?.trim() || null,
  }
}

export function SubfamiliasPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoSubfamiliaFilter>('todos')
  const [familiaId, setFamiliaId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubfamilia, setEditingSubfamilia] = useState<Subfamilia | null>(null)
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
      familiaId,
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, familiaId, page, texto],
  )

  const subfamiliasQuery = useQuery({
    enabled: canView,
    queryKey: ['subfamilias', filters],
    queryFn: () => subfamiliaService.getSubfamilias(filters),
  })

  const familiasQuery = useQuery({
    enabled: canView,
    queryKey: ['familias-activas'],
    queryFn: familiaService.getFamiliasActivas,
  })

  const saveMutation = useMutation({
    mutationFn: async (values: SubfamiliaFormValues) => {
      const payload = toPayload(values)

      if (editingSubfamilia) {
        return subfamiliaService.updateSubfamilia(editingSubfamilia.id, payload)
      }

      return subfamiliaService.createSubfamilia(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subfamilias'] })
      await queryClient.invalidateQueries({ queryKey: ['subfamilias-por-familia'] })
      setIsModalOpen(false)
      setEditingSubfamilia(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingSubfamilia
          ? 'Subfamilia actualizada correctamente.'
          : 'Subfamilia creada correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getSubfamiliaApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return subfamiliaService.activarSubfamilia(action.subfamilia.id)
      }

      return subfamiliaService.desactivarSubfamilia(action.subfamilia.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['subfamilias'] })
      await queryClient.invalidateQueries({ queryKey: ['subfamilias-por-familia'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Subfamilia activada correctamente.'
            : 'Subfamilia desactivada correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getSubfamiliaApiErrorMessage(error) })
    },
  })

  const subfamilias = subfamiliasQuery.data?.content ?? []
  const totalElements = subfamiliasQuery.data?.totalElements ?? 0
  const totalPages = subfamiliasQuery.data?.totalPages ?? 0
  const familias = familiasQuery.data ?? []

  const openCreateModal = () => {
    setEditingSubfamilia(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (subfamilia: Subfamilia) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(subfamilia.id)

    try {
      const detalle = await subfamiliaService.getSubfamilia(subfamilia.id)
      setEditingSubfamilia(detalle)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({ type: 'error', message: getSubfamiliaApiErrorMessage(error) })
    } finally {
      setEditLoadingId(null)
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Subfamilias" description="Catalogo de subfamilias asociadas a familias." />
        <Card className="p-6">
          <p className="text-sm text-slate-600">No tiene permisos para consultar subfamilias.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader title="Subfamilias" description="Catalogo de subfamilias asociadas a familias." />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={subfamiliasQuery.isFetching}
            onClick={() => subfamiliasQuery.refetch()}
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
              Nueva subfamilia
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

      {subfamiliasQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getSubfamiliaApiErrorMessage(subfamiliasQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <SubfamiliaFilters
          estado={estado}
          familiaId={familiaId}
          familias={familias}
          onEstadoChange={(value) => {
            setEstado(value)
            setPage(0)
          }}
          onFamiliaChange={(value) => {
            setFamiliaId(value)
            setPage(0)
          }}
          onTextoChange={(value) => {
            setTexto(value)
            setPage(0)
          }}
          texto={texto}
        />
      </Card>

      <SubfamiliaTable
        canEdit={canEdit}
        canToggle={canToggle}
        isLoading={subfamiliasQuery.isLoading}
        onActivar={(subfamilia) => setConfirmAction({ subfamilia, type: 'activar' })}
        onDesactivar={(subfamilia) => setConfirmAction({ subfamilia, type: 'desactivar' })}
        onEdit={openEditModal}
        subfamilias={subfamilias}
        toggleLoadingId={toggleMutation.isPending ? confirmAction?.subfamilia.id : editLoadingId}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} subfamilia{totalElements === 1 ? '' : 's'} encontrada
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || subfamiliasQuery.isFetching}
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
            disabled={page + 1 >= totalPages || subfamiliasQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <SubfamiliaFormModal
        errorMessage={formError}
        familias={familias}
        isLoadingOptions={familiasQuery.isLoading}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        mode={editingSubfamilia ? 'edit' : 'create'}
        onClose={() => {
          if (!saveMutation.isPending) {
            setIsModalOpen(false)
            setEditingSubfamilia(null)
            setFormError(null)
          }
        }}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        subfamilia={editingSubfamilia}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar subfamilia' : 'Desactivar subfamilia'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirme que desea {confirmAction.type === 'activar' ? 'activar' : 'desactivar'} la subfamilia{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.subfamilia.nombre}
              </span>.
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
