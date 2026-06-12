import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type { Familia, FamiliaFilters, FamiliaPayload, PageResponse } from '../types/familia.types'

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

export function normalizeFamiliaPage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

export function getFamiliaApiErrorMessage(error: unknown) {
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

export const familiaService = {
  async getFamilias(filters: FamiliaFilters) {
    const { data } = await apiClient.get('/api/familias', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizeFamiliaPage<Familia>(
      unwrapApiData<PageResponse<Familia> | Familia[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getFamiliasActivas() {
    const { data } = await apiClient.get('/api/familias/activas')

    return normalizeFamiliaPage<Familia>(
      unwrapApiData<PageResponse<Familia> | Familia[]>(data),
      0,
      200,
    ).content
  },

  async getFamilia(id: number) {
    const { data } = await apiClient.get(`/api/familias/${id}`)
    return unwrapApiData<Familia>(data)
  },

  async createFamilia(payload: FamiliaPayload) {
    const { data } = await apiClient.post('/api/familias', payload)
    return unwrapApiData<Familia>(data)
  },

  async updateFamilia(id: number, payload: FamiliaPayload) {
    const { data } = await apiClient.put(`/api/familias/${id}`, payload)
    return unwrapApiData<Familia>(data)
  },

  async activarFamilia(id: number) {
    const { data } = await apiClient.patch(`/api/familias/${id}/activar`)
    return unwrapApiData<Familia>(data)
  },

  async desactivarFamilia(id: number) {
    const { data } = await apiClient.patch(`/api/familias/${id}/desactivar`)
    return unwrapApiData<Familia>(data)
  },
}
