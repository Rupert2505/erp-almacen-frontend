import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type { PageResponse, Personal, PersonalFilters, PersonalPayload } from '../types/personal.types'

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

export function normalizePersonalPage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

export function getPersonalApiErrorMessage(error: unknown) {
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

export const personalService = {
  async getPersonal(filters: PersonalFilters) {
    const { data } = await apiClient.get('/api/personal', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizePersonalPage<Personal>(
      unwrapApiData<PageResponse<Personal> | Personal[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getPersonalById(id: number) {
    const { data } = await apiClient.get(`/api/personal/${id}`)
    return unwrapApiData<Personal>(data)
  },

  async createPersonal(payload: PersonalPayload) {
    const { data } = await apiClient.post('/api/personal', payload)
    return unwrapApiData<Personal>(data)
  },

  async updatePersonal(id: number, payload: PersonalPayload) {
    const { data } = await apiClient.put(`/api/personal/${id}`, payload)
    return unwrapApiData<Personal>(data)
  },

  async activarPersonal(id: number) {
    const { data } = await apiClient.patch(`/api/personal/${id}/activar`)
    return unwrapApiData<Personal>(data)
  },

  async desactivarPersonal(id: number) {
    const { data } = await apiClient.patch(`/api/personal/${id}/desactivar`)
    return unwrapApiData<Personal>(data)
  },
}
