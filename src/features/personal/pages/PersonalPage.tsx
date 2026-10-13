import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import {
  normalizeBusinessText,
  normalizeOptionalBusinessText,
  normalizeOptionalEmail,
  normalizePhone,
} from '../../../shared/utils/textNormalization'
import { useAuth } from '../../auth/context/useAuth'
import {
  PersonalFilters,
  type EstadoPersonalFilter,
} from '../components/PersonalFilters'
import { PersonalDetailModal } from '../components/PersonalDetailModal'
import { PersonalFormModal } from '../components/PersonalFormModal'
import { PersonalTable } from '../components/PersonalTable'
import type { PersonalFormValues } from '../schemas/personalSchema'
import { getPersonalApiErrorMessage, personalService } from '../services/personalService'
import type { Personal, PersonalPayload } from '../types/personal.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  personal: Personal
}

function getActivoFilter(estado: EstadoPersonalFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: PersonalFormValues): PersonalPayload {
  return {
    tipoDocumento: normalizeBusinessText(values.tipoDocumento),
    numeroDocumento: normalizeBusinessText(values.numeroDocumento),
    nombres: normalizeBusinessText(values.nombres),
    apellidos: normalizeOptionalBusinessText(values.apellidos),
    cargo: normalizeOptionalBusinessText(values.cargo),
    area: normalizeOptionalBusinessText(values.area),
    telefono: normalizePhone(values.telefono),
    email: normalizeOptionalEmail(values.email),
  }
}

export function PersonalPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoPersonalFilter>('todos')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [viewingPersonal, setViewingPersonal] = useState<Personal | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null)

  const hasLegacyAdminAccess = can(user, 'USUARIO_ADMIN')
  const canView = can(user, 'PERSONAL_VER') || hasLegacyAdminAccess
  const canCreate = can(user, 'PERSONAL_CREAR') || hasLegacyAdminAccess
  const canEdit = can(user, 'PERSONAL_EDITAR') || hasLegacyAdminAccess
  const canToggle = can(user, 'PERSONAL_DESACTIVAR') || hasLegacyAdminAccess
  const hasPersonalAccess = canView || canCreate || canEdit || canToggle

  const filters = useMemo(
    () => ({
      activo: getActivoFilter(estado),
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, page, texto],
  )

  const personalQuery = useQuery({
    enabled: canView,
    queryKey: ['personal', filters],
    queryFn: () => personalService.getPersonal(filters),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: PersonalFormValues) => {
      const payload = toPayload(values)

      if (editingPersonal) {
        return personalService.updatePersonal(editingPersonal.id, payload)
      }

      return personalService.createPersonal(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['personal'] })
      setIsModalOpen(false)
      setEditingPersonal(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingPersonal
          ? 'Personal actualizado correctamente.'
          : 'Personal creado correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getPersonalApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return personalService.activarPersonal(action.personal.id)
      }

      return personalService.desactivarPersonal(action.personal.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['personal'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Personal activado correctamente.'
            : 'Personal desactivado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getPersonalApiErrorMessage(error),
      })
    },
  })

  const totalPages = personalQuery.data?.totalPages ?? 0
  const totalElements = personalQuery.data?.totalElements ?? 0
  const personal = personalQuery.data?.content ?? []

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoPersonalFilter) => {
    setEstado(value)
    setPage(0)
  }

  const openCreateModal = () => {
    setEditingPersonal(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (item: Personal) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(item.id)

    try {
      const detalle = await personalService.getPersonalById(item.id)
      setEditingPersonal(detalle)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getPersonalApiErrorMessage(error),
      })
    } finally {
      setEditLoadingId(null)
    }
  }

  const openDetailModal = async (item: Personal) => {
    setFeedback(null)
    setDetailLoadingId(item.id)

    try {
      const detalle = await personalService.getPersonalById(item.id)
      setViewingPersonal(detalle)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getPersonalApiErrorMessage(error),
      })
    } finally {
      setDetailLoadingId(null)
    }
  }

  const handleModalClose = () => {
    if (saveMutation.isPending) {
      return
    }

    setIsModalOpen(false)
    setEditingPersonal(null)
    setFormError(null)
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await personalQuery.refetch()
  }

  if (!hasPersonalAccess) {
    return (
      <div>
        <PageHeader
          title="Personal"
          description="Mantenimiento administrativo del personal."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para administrar personal.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Personal"
          description="Mantenimiento administrativo del personal."
        />
        <div className="flex flex-wrap gap-2">
          {canView ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={personalQuery.isFetching}
              onClick={handleRefresh}
              type="button"
            >
              <RefreshCw size={17} />
              Actualizar
            </button>
          ) : null}
          {canCreate ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={17} />
              Nuevo personal
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

      {canView && personalQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getPersonalApiErrorMessage(personalQuery.error)}
        </div>
      ) : null}

      {canView ? (
        <>
          <Card className="mb-5 p-5">
            <PersonalFilters
              estado={estado}
              onEstadoChange={handleEstadoChange}
              onTextoChange={handleTextoChange}
              texto={texto}
            />
          </Card>

          <PersonalTable
            actionLoadingId={
              toggleMutation.isPending
                ? confirmAction?.personal.id
                : editLoadingId ?? detailLoadingId
            }
            canEdit={canEdit}
            canToggle={canToggle}
            canViewDetails={canView}
            isLoading={personalQuery.isLoading}
            onActivar={(item) => setConfirmAction({ personal: item, type: 'activar' })}
            onDesactivar={(item) => setConfirmAction({ personal: item, type: 'desactivar' })}
            onEdit={openEditModal}
            onView={openDetailModal}
            personal={personal}
          />

          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {totalElements} registro{totalElements === 1 ? '' : 's'} encontrado
              {totalElements === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page === 0 || personalQuery.isFetching}
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
                disabled={page + 1 >= totalPages || personalQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                type="button"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permiso para listar personal. Puede usar las acciones habilitadas para su
            cuenta.
          </p>
        </Card>
      )}

      <PersonalDetailModal
        isOpen={Boolean(viewingPersonal)}
        onClose={() => setViewingPersonal(null)}
        personal={viewingPersonal}
      />

      <PersonalFormModal
        errorMessage={formError}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        mode={editingPersonal ? 'edit' : 'create'}
        onClose={handleModalClose}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        personal={editingPersonal}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar personal' : 'Desactivar personal'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'activar'
                ? 'Confirme que desea activar el registro'
                : 'Confirme que desea desactivar el registro'}{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.personal.numeroDocumento} - {confirmAction.personal.nombres}
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
