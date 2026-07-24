import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { PageHeader } from '../../../shared/components/PageHeader'
import { can } from '../../../shared/utils/permissions'
import { normalizeBusinessText, normalizeEmail } from '../../../shared/utils/textNormalization'
import { useAuth } from '../../auth/context/useAuth'
import type { CambiarRolesValues } from '../schemas/cambiarRolesSchema'
import type { ResetPasswordValues } from '../schemas/resetPasswordSchema'
import type { UsuarioCreateValues, UsuarioEditValues } from '../schemas/usuarioSchema'
import { UsuarioDetalleModal } from '../components/UsuarioDetalleModal'
import { UsuarioFilters } from '../components/UsuarioFilters'
import type { EstadoUsuarioFilter } from '../components/UsuarioFilters'
import { UsuarioFormModal } from '../components/UsuarioFormModal'
import { UsuarioResetPasswordModal } from '../components/UsuarioResetPasswordModal'
import { UsuarioRolesModal } from '../components/UsuarioRolesModal'
import { UsuarioTable } from '../components/UsuarioTable'
import { permisoService } from '../services/permisoService'
import { rolService } from '../services/rolService'
import {
  getUsuarioApiErrorMessage,
  usuarioService,
} from '../services/usuarioService'
import type {
  Usuario,
  UsuarioCreatePayload,
  UsuarioUpdatePayload,
} from '../types/usuario.types'

const PAGE_SIZE = 10

type Feedback = {
  type: 'success' | 'error'
  message: string
}

type ConfirmAction = {
  type: 'activar' | 'desactivar'
  usuario: Usuario
}

function getActivoFilter(estado: EstadoUsuarioFilter) {
  if (estado === 'activos') {
    return true
  }

  if (estado === 'inactivos') {
    return false
  }

  return undefined
}

function toCreatePayload(values: UsuarioCreateValues): UsuarioCreatePayload {
  return {
    username: values.username.trim(),
    password: values.password,
    nombres: normalizeBusinessText(values.nombres),
    apellidos: normalizeBusinessText(values.apellidos),
    email: normalizeEmail(values.email),
    activo: values.activo,
    rolesIds: values.rolesIds,
  }
}

function toUpdatePayload(values: UsuarioEditValues): UsuarioUpdatePayload {
  return {
    nombres: normalizeBusinessText(values.nombres),
    apellidos: normalizeBusinessText(values.apellidos),
    email: normalizeEmail(values.email),
    activo: values.activo,
  }
}

export function UsuariosPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoUsuarioFilter>('todos')
  const [rolId, setRolId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [rolesUsuario, setRolesUsuario] = useState<Usuario | null>(null)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [resetUsuario, setResetUsuario] = useState<Usuario | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [viewUsuario, setViewUsuario] = useState<Usuario | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const canManage = can(user, 'USUARIO_ADMIN')

  const filters = useMemo(
    () => ({
      activo: getActivoFilter(estado),
      page,
      rolId,
      size: PAGE_SIZE,
      texto: texto.trim(),
    }),
    [estado, page, rolId, texto],
  )

  const usuariosQuery = useQuery({
    enabled: canManage,
    queryKey: ['usuarios', filters],
    queryFn: () => usuarioService.getUsuarios(filters),
  })

  const rolesQuery = useQuery({
    enabled: canManage,
    queryKey: ['roles'],
    queryFn: rolService.getRoles,
  })

  const permisosQuery = useQuery({
    enabled: canManage,
    queryKey: ['permisos'],
    queryFn: permisoService.getPermisos,
  })

  const saveMutation = useMutation({
    mutationFn: async (values: UsuarioCreateValues | UsuarioEditValues) => {
      if (formMode === 'edit' && editingUsuario) {
        return usuarioService.updateUsuario(editingUsuario.id, toUpdatePayload(values as UsuarioEditValues))
      }

      return usuarioService.createUsuario(toCreatePayload(values as UsuarioCreateValues))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setIsFormOpen(false)
      setEditingUsuario(null)
      setFormError(null)
      setFeedback({
        type: 'success',
        message:
          formMode === 'edit'
            ? 'Usuario actualizado correctamente.'
            : 'Usuario creado correctamente.',
      })
    },
    onError: (error) => {
      setFormError(getUsuarioApiErrorMessage(error))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'activar') {
        return usuarioService.activarUsuario(action.usuario.id)
      }

      return usuarioService.desactivarUsuario(action.usuario.id)
    },
    onMutate: (action) => {
      setActionLoadingId(action.usuario.id)
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setConfirmAction(null)
      setFeedback({
        type: 'success',
        message:
          action.type === 'activar'
            ? 'Usuario activado correctamente.'
            : 'Usuario desactivado correctamente.',
      })
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getUsuarioApiErrorMessage(error),
      })
    },
    onSettled: () => {
      setActionLoadingId(null)
    },
  })

  const rolesMutation = useMutation({
    mutationFn: async (values: CambiarRolesValues) => {
      if (!rolesUsuario) {
        throw new Error('No hay usuario seleccionado')
      }

      return usuarioService.updateRoles(rolesUsuario.id, {
        rolesIds: values.rolesIds,
      })
    },
    onMutate: () => {
      setActionLoadingId(rolesUsuario?.id ?? null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setRolesUsuario(null)
      setRolesError(null)
      setFeedback({
        type: 'success',
        message: 'Roles actualizados correctamente.',
      })
    },
    onError: (error) => {
      setRolesError(getUsuarioApiErrorMessage(error))
    },
    onSettled: () => {
      setActionLoadingId(null)
    },
  })

  const resetMutation = useMutation({
    mutationFn: async (values: ResetPasswordValues) => {
      if (!resetUsuario) {
        throw new Error('No hay usuario seleccionado')
      }

      return usuarioService.resetPassword(resetUsuario.id, {
        nuevaPassword: values.nuevaPassword,
      })
    },
    onMutate: () => {
      setActionLoadingId(resetUsuario?.id ?? null)
    },
    onSuccess: async () => {
      setResetUsuario(null)
      setResetError(null)
      setFeedback({
        type: 'success',
        message: 'Password reseteada correctamente.',
      })
    },
    onError: (error) => {
      setResetError(getUsuarioApiErrorMessage(error))
    },
    onSettled: () => {
      setActionLoadingId(null)
    },
  })

  const usuarios = usuariosQuery.data?.content ?? []
  const totalElements = usuariosQuery.data?.totalElements ?? 0
  const totalPages = usuariosQuery.data?.totalPages ?? 0
  const roles = rolesQuery.data ?? []

  const handleTextoChange = (value: string) => {
    setTexto(value)
    setPage(0)
  }

  const handleEstadoChange = (value: EstadoUsuarioFilter) => {
    setEstado(value)
    setPage(0)
  }

  const handleRolChange = (value: number | null) => {
    setRolId(value)
    setPage(0)
  }

  const openCreateModal = () => {
    setFeedback(null)
    setFormError(null)
    setEditingUsuario(null)
    setFormMode('create')
    setIsFormOpen(true)
  }

  const openEditModal = async (usuario: Usuario) => {
    setFeedback(null)
    setFormError(null)
    setActionLoadingId(usuario.id)

    try {
      const detalle = await usuarioService.getUsuario(usuario.id)
      setEditingUsuario(detalle)
      setFormMode('edit')
      setIsFormOpen(true)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getUsuarioApiErrorMessage(error),
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const openViewModal = async (usuario: Usuario) => {
    setIsViewOpen(true)
    setIsViewLoading(true)
    setViewUsuario(usuario)

    try {
      const detalle = await usuarioService.getUsuario(usuario.id)
      setViewUsuario(detalle)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getUsuarioApiErrorMessage(error),
      })
      setIsViewOpen(false)
    } finally {
      setIsViewLoading(false)
    }
  }

  const handleRefresh = async () => {
    setFeedback(null)
    await Promise.all([
      usuariosQuery.refetch(),
      rolesQuery.refetch(),
      permisosQuery.refetch(),
    ])
  }

  const handleCloseForm = () => {
    if (saveMutation.isPending) {
      return
    }

    setIsFormOpen(false)
    setEditingUsuario(null)
    setFormError(null)
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader
          title="Usuarios"
          description="Administracion de cuentas, roles y permisos."
        />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            Acceso restringido. Necesita permiso USUARIO_ADMIN para administrar usuarios.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Usuarios"
          description="Administracion de cuentas, roles y permisos."
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={usuariosQuery.isFetching}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={openCreateModal}
            type="button"
          >
            <Plus size={17} />
            Nuevo usuario
          </button>
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

      {usuariosQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getUsuarioApiErrorMessage(usuariosQuery.error)}
        </div>
      ) : null}

      {rolesQuery.isError ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getUsuarioApiErrorMessage(rolesQuery.error)}
        </div>
      ) : null}

      <Card className="mb-5 p-5">
        <UsuarioFilters
          estado={estado}
          onEstadoChange={handleEstadoChange}
          onRolChange={handleRolChange}
          onTextoChange={handleTextoChange}
          rolId={rolId}
          roles={roles}
          texto={texto}
        />
      </Card>

      <UsuarioTable
        actionLoadingId={actionLoadingId}
        canManage={canManage}
        isLoading={usuariosQuery.isLoading}
        onActivar={(usuario) => setConfirmAction({ usuario, type: 'activar' })}
        onCambiarRoles={(usuario) => {
          setRolesError(null)
          setRolesUsuario(usuario)
        }}
        onDesactivar={(usuario) => setConfirmAction({ usuario, type: 'desactivar' })}
        onEdit={openEditModal}
        onResetPassword={(usuario) => {
          setResetError(null)
          setResetUsuario(usuario)
        }}
        onView={openViewModal}
        usuarios={usuarios}
      />

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalElements} usuario{totalElements === 1 ? '' : 's'} encontrado
          {totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 0 || usuariosQuery.isFetching}
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
            disabled={page + 1 >= totalPages || usuariosQuery.isFetching}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <UsuarioFormModal
        errorMessage={formError}
        isOpen={isFormOpen}
        isSaving={saveMutation.isPending}
        mode={formMode}
        onClose={handleCloseForm}
        onCreateSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        onEditSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
        roles={roles}
        usuario={editingUsuario}
      />

      <UsuarioRolesModal
        errorMessage={rolesError}
        isOpen={Boolean(rolesUsuario)}
        isSaving={rolesMutation.isPending}
        onClose={() => {
          if (!rolesMutation.isPending) {
            setRolesUsuario(null)
            setRolesError(null)
          }
        }}
        onSubmit={async (values) => {
          await rolesMutation.mutateAsync(values)
        }}
        roles={roles}
        usuario={rolesUsuario}
      />

      <UsuarioResetPasswordModal
        errorMessage={resetError}
        isOpen={Boolean(resetUsuario)}
        isSaving={resetMutation.isPending}
        onClose={() => {
          if (!resetMutation.isPending) {
            setResetUsuario(null)
            setResetError(null)
          }
        }}
        onSubmit={async (values) => {
          await resetMutation.mutateAsync(values)
        }}
        usuario={resetUsuario}
      />

      <UsuarioDetalleModal
        isLoading={isViewLoading}
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false)
          setViewUsuario(null)
        }}
        usuario={viewUsuario}
      />

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === 'activar' ? 'Activar usuario' : 'Desactivar usuario'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === 'activar'
                ? 'Confirme que desea activar el usuario'
                : 'Confirme que desea desactivar el usuario'}{' '}
              <span className="font-semibold text-slate-900">
                {confirmAction.usuario.username}
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
