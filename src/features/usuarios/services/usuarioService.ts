import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type {
  PageResponse,
  Usuario,
  UsuarioCreatePayload,
  UsuarioFilters,
  UsuarioResetPasswordPayload,
  UsuarioRolesPayload,
  UsuarioUpdatePayload,
} from '../types/usuario.types'

type BackendErrorPayload = {
  message?: string
  error?: string
  data?: unknown
}

const emptyPage = <T>(page: number, size: number): PageResponse<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: page,
  size,
})

export function normalizeUsuarioPage<T>(
  value: PageResponse<T> | T[],
  page: number,
  size: number,
) {
  if (Array.isArray(value)) {
    return {
      content: value,
      totalElements: value.length,
      totalPages: 1,
      number: page,
      size,
    }
  }

  return value ?? emptyPage<T>(page, size)
}

export function getUsuarioApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BackendErrorPayload>(error)) {
    const payload = error.response?.data

    if (payload?.message) {
      return payload.message
    }

    if (payload?.error) {
      return payload.error
    }

    if (payload?.data && typeof payload.data === 'object') {
      const messages = Object.values(payload.data)
        .flat()
        .filter(Boolean)
        .join('. ')

      if (messages) {
        return messages
      }
    }

    if (!error.response) {
      return 'No se pudo conectar con el backend. Verifique que este activo y que CORS permita el acceso.'
    }
  }

  return 'Ocurrio un error inesperado. Intente nuevamente.'
}

export const usuarioService = {
  async getUsuarios(filters: UsuarioFilters) {
    const { data } = await apiClient.get('/api/usuarios', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
        rolId: filters.rolId || undefined,
      },
    })

    return normalizeUsuarioPage<Usuario>(
      unwrapApiData<PageResponse<Usuario> | Usuario[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getUsuario(id: number) {
    const { data } = await apiClient.get(`/api/usuarios/${id}`)
    return unwrapApiData<Usuario>(data)
  },

  async createUsuario(payload: UsuarioCreatePayload) {
    const { data } = await apiClient.post('/api/usuarios', payload)
    return unwrapApiData<Usuario>(data)
  },

  async updateUsuario(id: number, payload: UsuarioUpdatePayload) {
    const { data } = await apiClient.put(`/api/usuarios/${id}`, payload)
    return unwrapApiData<Usuario>(data)
  },

  async activarUsuario(id: number) {
    const { data } = await apiClient.patch(`/api/usuarios/${id}/activar`)
    return unwrapApiData<Usuario>(data)
  },

  async desactivarUsuario(id: number) {
    const { data } = await apiClient.patch(`/api/usuarios/${id}/desactivar`)
    return unwrapApiData<Usuario>(data)
  },

  async updateRoles(id: number, payload: UsuarioRolesPayload) {
    const { data } = await apiClient.put(`/api/usuarios/${id}/roles`, payload)
    return unwrapApiData<Usuario>(data)
  },

  async resetPassword(id: number, payload: UsuarioResetPasswordPayload) {
    const { data } = await apiClient.patch(`/api/usuarios/${id}/reset-password`, payload)
    return unwrapApiData<Usuario>(data)
  },
}
