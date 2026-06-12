import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type {
  PageResponse,
  TipoArticulo,
  TipoArticuloFilters,
  TipoArticuloPayload,
} from '../types/tipoArticulo.types'

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

export function normalizeTipoArticuloPage<T>(
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

export function getTipoArticuloApiErrorMessage(error: unknown) {
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

export const tipoArticuloService = {
  async getTiposArticulo(filters: TipoArticuloFilters) {
    const { data } = await apiClient.get('/api/tipos-articulo', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizeTipoArticuloPage<TipoArticulo>(
      unwrapApiData<PageResponse<TipoArticulo> | TipoArticulo[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getTiposArticuloActivos() {
    const { data } = await apiClient.get('/api/tipos-articulo/activos')

    return normalizeTipoArticuloPage<TipoArticulo>(
      unwrapApiData<PageResponse<TipoArticulo> | TipoArticulo[]>(data),
      0,
      200,
    ).content
  },

  async getTipoArticulo(id: number) {
    const { data } = await apiClient.get(`/api/tipos-articulo/${id}`)
    return unwrapApiData<TipoArticulo>(data)
  },

  async createTipoArticulo(payload: TipoArticuloPayload) {
    const { data } = await apiClient.post('/api/tipos-articulo', payload)
    return unwrapApiData<TipoArticulo>(data)
  },

  async updateTipoArticulo(id: number, payload: TipoArticuloPayload) {
    const { data } = await apiClient.put(`/api/tipos-articulo/${id}`, payload)
    return unwrapApiData<TipoArticulo>(data)
  },

  async activarTipoArticulo(id: number) {
    const { data } = await apiClient.patch(`/api/tipos-articulo/${id}/activar`)
    return unwrapApiData<TipoArticulo>(data)
  },

  async desactivarTipoArticulo(id: number) {
    const { data } = await apiClient.patch(`/api/tipos-articulo/${id}/desactivar`)
    return unwrapApiData<TipoArticulo>(data)
  },
}
