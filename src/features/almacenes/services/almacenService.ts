import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type {
  Almacen,
  AlmacenFilters,
  AlmacenPayload,
  PageResponse,
} from '../types/almacen.types'

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

export function normalizeAlmacenPage<T>(
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

export function getAlmacenApiErrorMessage(error: unknown) {
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

export const almacenService = {
  async getAlmacenes(filters: AlmacenFilters) {
    const { data } = await apiClient.get('/api/almacenes', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizeAlmacenPage<Almacen>(
      unwrapApiData<PageResponse<Almacen> | Almacen[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getAlmacenesActivos() {
    const { data } = await apiClient.get('/api/almacenes', {
      params: {
        page: 0,
        size: 200,
        activo: true,
      },
    })

    return normalizeAlmacenPage<Almacen>(
      unwrapApiData<PageResponse<Almacen> | Almacen[]>(data),
      0,
      200,
    ).content
  },

  async getAlmacen(id: number) {
    const { data } = await apiClient.get(`/api/almacenes/${id}`)
    return unwrapApiData<Almacen>(data)
  },

  async createAlmacen(payload: AlmacenPayload) {
    const { data } = await apiClient.post('/api/almacenes', payload)
    return unwrapApiData<Almacen>(data)
  },

  async updateAlmacen(id: number, payload: AlmacenPayload) {
    const { data } = await apiClient.put(`/api/almacenes/${id}`, payload)
    return unwrapApiData<Almacen>(data)
  },

  async activarAlmacen(id: number) {
    const { data } = await apiClient.patch(`/api/almacenes/${id}/activar`)
    return unwrapApiData<Almacen>(data)
  },

  async desactivarAlmacen(id: number) {
    const { data } = await apiClient.patch(`/api/almacenes/${id}/desactivar`)
    return unwrapApiData<Almacen>(data)
  },
}
