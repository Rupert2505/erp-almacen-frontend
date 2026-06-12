import axios from 'axios'
import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type {
  PageResponse,
  Subfamilia,
  SubfamiliaFilters,
  SubfamiliaPayload,
} from '../types/subfamilia.types'

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

export function normalizeSubfamiliaPage<T>(
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

export function getSubfamiliaApiErrorMessage(error: unknown) {
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

export const subfamiliaService = {
  async getSubfamilias(filters: SubfamiliaFilters) {
    const { data } = await apiClient.get('/api/subfamilias', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
        familiaId: filters.familiaId || undefined,
      },
    })

    return normalizeSubfamiliaPage<Subfamilia>(
      unwrapApiData<PageResponse<Subfamilia> | Subfamilia[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getSubfamiliasActivas() {
    const { data } = await apiClient.get('/api/subfamilias/activas')

    return normalizeSubfamiliaPage<Subfamilia>(
      unwrapApiData<PageResponse<Subfamilia> | Subfamilia[]>(data),
      0,
      200,
    ).content
  },

  async getSubfamiliasPorFamilia(familiaId: number) {
    const { data } = await apiClient.get(`/api/subfamilias/por-familia/${familiaId}`)

    return normalizeSubfamiliaPage<Subfamilia>(
      unwrapApiData<PageResponse<Subfamilia> | Subfamilia[]>(data),
      0,
      200,
    ).content
  },

  async getSubfamiliasPorFamiliaPage(
    familiaId: number,
    page: number,
    size: number,
    filters?: Pick<SubfamiliaFilters, 'activo' | 'texto'>,
  ) {
    const { data } = await apiClient.get(`/api/subfamilias/por-familia/${familiaId}`, {
      params: {
        page,
        size,
        texto: filters?.texto || undefined,
        activo: filters?.activo,
      },
    })

    return normalizeSubfamiliaPage<Subfamilia>(
      unwrapApiData<PageResponse<Subfamilia> | Subfamilia[]>(data),
      page,
      size,
    )
  },

  async getSubfamilia(id: number) {
    const { data } = await apiClient.get(`/api/subfamilias/${id}`)
    return unwrapApiData<Subfamilia>(data)
  },

  async createSubfamilia(payload: SubfamiliaPayload) {
    const { data } = await apiClient.post('/api/subfamilias', payload)
    return unwrapApiData<Subfamilia>(data)
  },

  async updateSubfamilia(id: number, payload: SubfamiliaPayload) {
    const { data } = await apiClient.put(`/api/subfamilias/${id}`, payload)
    return unwrapApiData<Subfamilia>(data)
  },

  async activarSubfamilia(id: number) {
    const { data } = await apiClient.patch(`/api/subfamilias/${id}/activar`)
    return unwrapApiData<Subfamilia>(data)
  },

  async desactivarSubfamilia(id: number) {
    const { data } = await apiClient.patch(`/api/subfamilias/${id}/desactivar`)
    return unwrapApiData<Subfamilia>(data)
  },
}
