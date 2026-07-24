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
import { MarcaFilters, type EstadoMarcaFilter } from '../components/MarcaFilters'
import { MarcaFormModal } from '../components/MarcaFormModal'
import { MarcaTable } from '../components/MarcaTable'
import type { MarcaFormValues } from '../schemas/marcaSchema'
import { getMarcaApiErrorMessage, marcaService } from '../services/marcaService'
import type { Marca, MarcaPayload } from '../types/marca.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  marca: Marca
}

function getActivoFilter(estado: EstadoMarcaFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: MarcaFormValues): MarcaPayload {
  return {
    codigo: normalizeOptionalBusinessText(values.codigo),
    nombre: normalizeBusinessText(values.nombre),
    descripcion: normalizeOptionalBusinessText(values.descripcion),
  }
}

export function MarcasPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoMarcaFilter>('todos')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null)
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

  const marcasQuery = useQuery({
    enabled: canView,
    queryKey: ['marcas-admin', filters],
    queryFn: () => marcaService.getMarcas(filters),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: MarcaFormValues) => {
      const payload = toPayload(values)

      if (editingMarca) {
        return marcaService.updateMarca(editingMarca.id, payload)
      }

      return marcaService.createMarca(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['marcas-admin'] })
      await queryClient.invalidateQueries({ queryKey: ['marcas-activas'] })
      setIsModalOpen(false)
      setEditingMarca(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingMarca ? 'Marca actualizada correctamente.' : 'Marca creada correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getMarcaApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return marcaService.activarMarca(action.marca.id)
      }

      return marcaService.desactivarMarca(action.marca.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['marcas-admin'] })
      await queryClient.invalidateQueries({ queryKey: ['marcas-activas'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Marca activada correctamente.'
            : 'Marca desactivada correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getMarcaApiErrorMessage(error) })
    },
  })

  const marcas = marcasQuery.data?.content ?? []
  const totalElements = marcasQuery.data?.totalElements ?? 0
  const totalPages = marcasQuery.data?.totalPages ?? 0

  const openCreateModal = () => {
    setEditingMarca(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (marca: Marca) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(marca.id)

    try {
      const detalle = await marcaService.getMarca(marca.id)
      setEditingMarca(detalle)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({ type: 'error', message: getMarcaApiErrorMessage(error) })
    } finally {
      setEditLoadingId(null)
    }
  }

  if (!canView) {
    return (
      <div>
        <PageHeader title="Marcas" description="Catalogo de marcas asociadas a productos." />
        <Card className="p-6">
          <p className="text-sm text-slate-600">No tiene permisos para consultar marcas.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader title="Marcas" description="Catalogo de marcas asociadas a productos." />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={marcasQuery.isFetching}
            onClick={() => marcasQuery.refetch()}
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
              Nueva marca
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

      {marcasQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getMarcaApiErrorMessage(marcasQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <MarcaFilters
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

      <MarcaTable
        canEdit={canEdit}
        canToggle={canToggle}
        isLoading={marcasQuery.isLoading}
        marcas={marcas}
        onActivar={(marca) => setConfirmAction({ marca, type: 'activar' })}
        onDesactivar={(marca) => setConfirmAction({ marca, type: 'desactivar' })}
        onEdit={openEditModal}
        toggleLoadingId={toggleMutation.isPending ? confirmAction?.marca.id : editLoadingId}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} marca{totalElements === 1 ? '' : 's'} encontrada
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || marcasQuery.isFetching}
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
            disabled={page + 1 >= totalPages || marcasQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <MarcaFormModal
        errorMessage={formError}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        marca={editingMarca}
        mode={editingMarca ? 'edit' : 'create'}
        onClose={() => {
          if (!saveMutation.isPending) {
            setIsModalOpen(false)
            setEditingMarca(null)
            setFormError(null)
          }
        }}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar marca' : 'Desactivar marca'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Confirme que desea {confirmAction.type === 'activar' ? 'activar' : 'desactivar'} la marca{' '}
              <span className="font-semibold text-slate-900">{confirmAction.marca.nombre}</span>.
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
