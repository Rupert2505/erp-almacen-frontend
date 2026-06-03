import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type {
  PageResponse,
  Producto,
  ProductoFilters,
  ProductoPayload,
} from '../types/producto.types'

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

export function normalizePage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

export function getApiErrorMessage(error: unknown) {
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

export const productoService = {
  async getProductos(filters: ProductoFilters) {
    const { data } = await apiClient.get('/api/productos', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizePage<Producto>(
      unwrapApiData<PageResponse<Producto> | Producto[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getProducto(id: number) {
    const { data } = await apiClient.get(`/api/productos/${id}`)
    return unwrapApiData<Producto>(data)
  },

  async createProducto(payload: ProductoPayload) {
    const { data } = await apiClient.post('/api/productos', payload)
    return unwrapApiData<Producto>(data)
  },

  async updateProducto(id: number, payload: ProductoPayload) {
    const { data } = await apiClient.put(`/api/productos/${id}`, payload)
    return unwrapApiData<Producto>(data)
  },

  async activarProducto(id: number) {
    const { data } = await apiClient.patch(`/api/productos/${id}/activar`)
    return unwrapApiData<Producto>(data)
  },

  async desactivarProducto(id: number) {
    const { data } = await apiClient.patch(`/api/productos/${id}/desactivar`)
    return unwrapApiData<Producto>(data)
  },
}
