import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import {
  normalizeBusinessText,
  normalizeOptionalBusinessText,
} from '../../../shared/utils/textNormalization'
import { useAuth } from '../../auth/context/useAuth'
import {
  TipoArticuloFilters,
  type EstadoTipoArticuloFilter,
} from '../components/TipoArticuloFilters'
import { TipoArticuloFormModal } from '../components/TipoArticuloFormModal'
import { TipoArticuloTable } from '../components/TipoArticuloTable'
import type { TipoArticuloFormValues } from '../schemas/tipoArticuloSchema'
import {
  getTipoArticuloApiErrorMessage,
  tipoArticuloService,
} from '../services/tipoArticuloService'
import type { TipoArticulo, TipoArticuloPayload } from '../types/tipoArticulo.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  tipoArticulo: TipoArticulo
}

function getActivoFilter(estado: EstadoTipoArticuloFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: TipoArticuloFormValues): TipoArticuloPayload {
  return {
    codigo: normalizeBusinessText(values.codigo),
    nombre: normalizeBusinessText(values.nombre),
    descripcion: normalizeOptionalBusinessText(values.descripcion),
  }
}

export function TiposArticuloPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoTipoArticuloFilter>('todos')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipoArticulo, setEditingTipoArticulo] = useState<TipoArticulo | null>(null)
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

  const tiposArticuloQuery = useQuery({
    enabled: canView,
    queryKey: ['tipos-articulo', filters],
    queryFn: () => tipoArticuloService.getTiposArticulo(filters),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: TipoArticuloFormValues) => {
      const payload = toPayload(values)

      if (editingTipoArticulo) {
        return tipoArticuloService.updateTipoArticulo(editingTipoArticulo.id, payload)
      }

      return tipoArticuloService.createTipoArticulo(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tipos-articulo'] })
      await queryClient.invalidateQueries({ queryKey: ['tipos-articulo-activos'] })
      setIsModalOpen(false)
      setEditingTipoArticulo(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingTipoArticulo
          ? 'Tipo de articulo actualizado correctamente.'
          : 'Tipo de articulo creado correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getTipoArticuloApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return tipoArticuloService.activarTipoArticulo(action.tipoArticulo.id)
      }

      return tipoArticuloService.desactivarTipoArticulo(action.tipoArticulo.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['tipos-articulo'] })
      await queryClient.invalidateQueries({ queryKey: ['tipos-articulo-activos'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Tipo de articulo activado correctamente.'
            : 'Tipo de articulo desactivado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getTipoArticuloApiErrorMessage(error) })
    },
  })

  const tiposArticulo = tiposArticuloQuery.data?.content ?? []
  const totalElements = tiposArticuloQuery.data?.totalElements ?? 0
  const totalPages = tiposArticuloQuery.data?.totalPages ?? 0

  const openCreateModal = () => {
    setEditingTipoArticulo(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (tipoArticulo: TipoArticulo) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(tipoArticulo.id)

    try {
      const detalle = await tipoArticuloService.getTipoArticulo(tipoArticulo.id)
      setEditingTipoArticulo(detalle)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({ type: 'error', message: getTipoArticuloApiErrorMessage(error) })
    } finally {
      setEditLoadingId(null)
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Tipos de articulo"
          description="Catalogo para clasificar el uso del producto o articulo."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar tipos de articulo.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Tipos de articulo"
          description="Catalogo para clasificar el uso del producto o articulo."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={tiposArticuloQuery.isFetching}
            onClick={() => tiposArticuloQuery.refetch()}
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
              Nuevo tipo
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

      {tiposArticuloQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getTipoArticuloApiErrorMessage(tiposArticuloQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <TipoArticuloFilters
          estado={estado}
          onEstadoChange={(value) => {
            setEstado(value)
            setPage(0)
          }}
          onTextoChange={(value) => {
            setTexto(value)
            setPage(0)
          }}
          texto={texto}
        />
      </Card>

      <TipoArticuloTable
        canEdit={canEdit}
        canToggle={canToggle}
        isLoading={tiposArticuloQuery.isLoading}
        onActivar={(tipoArticulo) => setConfirmAction({ tipoArticulo, type: 'activar' })}
        onDesactivar={(tipoArticulo) => setConfirmAction({ tipoArticulo, type: 'desactivar' })}
        onEdit={openEditModal}
        tiposArticulo={tiposArticulo}
        toggleLoadingId={
          toggleMutation.isPending ? confirmAction?.tipoArticulo.id : editLoadingId
        }
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} tipo{totalElements === 1 ? '' : 's'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || tiposArticuloQuery.isFetching}
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
            disabled={page + 1 >= totalPages || tiposArticuloQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <TipoArticuloFormModal
        errorMessage={formError}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        mode={editingTipoArticulo ? 'edit' : 'create'}
        onClose={() => {
          if (!saveMutation.isPending) {
            setIsModalOpen(false)
            setEditingTipoArticulo(null)
            setFormError(null)
          }
        }}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        tipoArticulo={editingTipoArticulo}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar'
                ? 'Activar tipo de articulo'
                : 'Desactivar tipo de articulo'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirme que desea{' '}
              {confirmAction.type === 'activar' ? 'activar' : 'desactivar'} el tipo de
              articulo{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.tipoArticulo.codigo} - {confirmAction.tipoArticulo.nombre}
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
