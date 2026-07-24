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
  ProveedorFilters,
  type EstadoProveedorFilter,
} from '../components/ProveedorFilters'
import { ProveedorFormModal } from '../components/ProveedorFormModal'
import { ProveedorTable } from '../components/ProveedorTable'
import type { ProveedorFormValues } from '../schemas/proveedorSchema'
import {
  getProveedorApiErrorMessage,
  proveedorService,
} from '../services/proveedorService'
import type { Proveedor, ProveedorPayload } from '../types/proveedor.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  proveedor: Proveedor
}

function getActivoFilter(estado: EstadoProveedorFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toPayload(values: ProveedorFormValues): ProveedorPayload {
  return {
    tipoDocumento: normalizeBusinessText(values.tipoDocumento),
    numeroDocumento: normalizeBusinessText(values.numeroDocumento),
    razonSocial: normalizeBusinessText(values.razonSocial),
    nombreComercial: normalizeOptionalBusinessText(values.nombreComercial),
    direccion: normalizeOptionalBusinessText(values.direccion),
    telefono: normalizePhone(values.telefono),
    email: normalizeOptionalEmail(values.email),
  }
}

export function ProveedoresPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoProveedorFilter>('todos')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null)

  const canView = can(user, 'PROVEEDOR_VER')
  const canManage = can(user, 'PROVEEDOR_CREAR')

  const filters = useMemo(
    () => ({
      activo: getActivoFilter(estado),
      page,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, page, texto],
  )

  const proveedoresQuery = useQuery({
    enabled: canView,
    queryKey: ['proveedores', filters],
    queryFn: () => proveedorService.getProveedores(filters),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: ProveedorFormValues) => {
      const payload = toPayload(values)

      if (editingProveedor) {
        return proveedorService.updateProveedor(editingProveedor.id, payload)
      }

      return proveedorService.createProveedor(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      setIsModalOpen(false)
      setEditingProveedor(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message: editingProveedor
          ? 'Proveedor actualizado correctamente.'
          : 'Proveedor creado correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getProveedorApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return proveedorService.activarProveedor(action.proveedor.id)
      }

      return proveedorService.desactivarProveedor(action.proveedor.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Proveedor activado correctamente.'
            : 'Proveedor desactivado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getProveedorApiErrorMessage(error),
      })
    },
  })

  const totalPages = proveedoresQuery.data?.totalPages ?? 0
  const totalElements = proveedoresQuery.data?.totalElements ?? 0
  const proveedores = proveedoresQuery.data?.content ?? []

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoProveedorFilter) => {
    setEstado(value)
    setPage(0)
  }

  const openCreateModal = () => {
    setEditingProveedor(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (proveedor: Proveedor) => {
    setFeedback(null)
    setFormError(null)
    setEditLoadingId(proveedor.id)

    try {
      const detalle = await proveedorService.getProveedor(proveedor.id)
      setEditingProveedor(detalle)
      setIsModalOpen(true)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getProveedorApiErrorMessage(error),
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
    setEditingProveedor(null)
    setFormError(null)
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await proveedoresQuery.refetch()
  }

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Proveedores"
          description="Directorio base para gestionar proveedores comerciales."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            No tiene permisos para consultar proveedores.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Proveedores"
          description="Directorio base para gestionar proveedores comerciales."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={proveedoresQuery.isFetching}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
          {canManage ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={17} />
              Nuevo proveedor
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

      {proveedoresQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getProveedorApiErrorMessage(proveedoresQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <ProveedorFilters
          estado={estado}
          onEstadoChange={handleEstadoChange}
          onTextoChange={handleTextoChange}
          texto={texto}
        />
      </Card>

      <ProveedorTable
        canManage={canManage}
        isLoading={proveedoresQuery.isLoading}
        onActivar={(proveedor) => setConfirmAction({ proveedor, type: 'activar' })}
        onDesactivar={(proveedor) => setConfirmAction({ proveedor, type: 'desactivar' })}
        onEdit={openEditModal}
        proveedores={proveedores}
        toggleLoadingId={toggleMutation.isPending ? confirmAction?.proveedor.id : editLoadingId}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} proveedor{totalElements === 1 ? '' : 'es'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || proveedoresQuery.isFetching}
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
            disabled={page + 1 >= totalPages || proveedoresQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <ProveedorFormModal
        errorMessage={formError}
        isOpen={isModalOpen}
        isSaving={saveMutation.isPending}
        mode={editingProveedor ? 'edit' : 'create'}
        onClose={handleModalClose}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        proveedor={editingProveedor}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar proveedor' : 'Desactivar proveedor'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'activar'
                ? 'Confirme que desea activar el proveedor'
                : 'Confirme que desea desactivar el proveedor'}{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.proveedor.numeroDocumento} - {confirmAction.proveedor.razonSocial}
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
