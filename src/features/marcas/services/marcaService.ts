import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type { Marca, MarcaFilters, MarcaPayload, PageResponse } from '../types/marca.types'

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

export function normalizeMarcaPage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

export function getMarcaApiErrorMessage(error: unknown) {
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

export const marcaService = {
  async getMarcas(filters: MarcaFilters) {
    const { data } = await apiClient.get('/api/marcas', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizeMarcaPage<Marca>(
      unwrapApiData<PageResponse<Marca> | Marca[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getMarcasActivas() {
    const { data } = await apiClient.get('/api/marcas', {
      params: {
        page: 0,
        size: 200,
        activo: true,
      },
    })

    return normalizeMarcaPage<Marca>(
      unwrapApiData<PageResponse<Marca> | Marca[]>(data),
      0,
      200,
    ).content
  },

  async getMarca(id: number) {
    const { data } = await apiClient.get(`/api/marcas/${id}`)
    return unwrapApiData<Marca>(data)
  },

  async createMarca(payload: MarcaPayload) {
    const { data } = await apiClient.post('/api/marcas', payload)
    return unwrapApiData<Marca>(data)
  },

  async updateMarca(id: number, payload: MarcaPayload) {
    const { data } = await apiClient.put(`/api/marcas/${id}`, payload)
    return unwrapApiData<Marca>(data)
  },

  async activarMarca(id: number) {
    const { data } = await apiClient.patch(`/api/marcas/${id}/activar`)
    return unwrapApiData<Marca>(data)
  },

  async desactivarMarca(id: number) {
    const { data } = await apiClient.patch(`/api/marcas/${id}/desactivar`)
    return unwrapApiData<Marca>(data)
  },
}
