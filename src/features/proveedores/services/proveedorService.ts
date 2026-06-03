import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type {
  PageResponse,
  Proveedor,
  ProveedorFilters,
  ProveedorPayload,
} from '../types/proveedor.types'

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

export function normalizeProveedorPage<T>(
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

export function getProveedorApiErrorMessage(error: unknown) {
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

export const proveedorService = {
  async getProveedores(filters: ProveedorFilters) {
    const { data } = await apiClient.get('/api/proveedores', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizeProveedorPage<Proveedor>(
      unwrapApiData<PageResponse<Proveedor> | Proveedor[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getProveedor(id: number) {
    const { data } = await apiClient.get(`/api/proveedores/${id}`)
    return unwrapApiData<Proveedor>(data)
  },

  async createProveedor(payload: ProveedorPayload) {
    const { data } = await apiClient.post('/api/proveedores', payload)
    return unwrapApiData<Proveedor>(data)
  },

  async updateProveedor(id: number, payload: ProveedorPayload) {
    const { data } = await apiClient.put(`/api/proveedores/${id}`, payload)
    return unwrapApiData<Proveedor>(data)
  },

  async activarProveedor(id: number) {
    const { data } = await apiClient.patch(`/api/proveedores/${id}/activar`)
    return unwrapApiData<Proveedor>(data)
  },

  async desactivarProveedor(id: number) {
    const { data } = await apiClient.patch(`/api/proveedores/${id}/desactivar`)
    return unwrapApiData<Proveedor>(data)
  },
}
