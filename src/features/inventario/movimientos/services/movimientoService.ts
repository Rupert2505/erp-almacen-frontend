import axios from 'axios'
import { apiClient } from '../../../../shared/services/apiClient'
import { unwrapApiData } from '../../../../shared/services/apiResponse'
import type {
  Movimiento,
  MovimientoFilters,
  MovimientoPayload,
  PageResponse,
} from '../types/movimiento.types'

type BackendErrorPayload = {
  message?: string
  error?: string
  data?: unknown
}

const CONFLICT_ERROR_MESSAGE =
  'El registro fue modificado por otro usuario. Actualice la informacion e intente nuevamente.'

const emptyPage = <T>(page: number, size: number): PageResponse<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: page,
  size,
})

export function normalizeMovimientoPage<T>(
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

export function getMovimientoApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BackendErrorPayload>(error)) {
    const payload = error.response?.data
    const status = error.response?.status

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

    if (status === 409) {
      return CONFLICT_ERROR_MESSAGE
    }

    if (!error.response) {
      return 'No se pudo conectar con el backend. Verifique que este activo y que CORS permita el acceso.'
    }
  }

  return 'Ocurrio un error inesperado. Intente nuevamente.'
}

export function isMovimientoConflictError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 409
}

export const movimientoService = {
  async getMovimientos(filters: MovimientoFilters) {
    const { data } = await apiClient.get('/api/inventario/movimientos', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        tipoMovimiento: filters.tipoMovimiento || undefined,
        estado: filters.estado || undefined,
        sort: 'fechaMovimiento,desc',
      },
    })

    return normalizeMovimientoPage<Movimiento>(
      unwrapApiData<PageResponse<Movimiento> | Movimiento[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getMovimiento(id: number) {
    const { data } = await apiClient.get(`/api/inventario/movimientos/${id}`)
    return unwrapApiData<Movimiento>(data)
  },

  async createMovimiento(payload: MovimientoPayload) {
    const { data } = await apiClient.post('/api/inventario/movimientos', payload)
    return unwrapApiData<Movimiento>(data)
  },

  async confirmarMovimiento(id: number) {
    const { data } = await apiClient.post(`/api/inventario/movimientos/${id}/confirmar`)
    return unwrapApiData<Movimiento>(data)
  },

  async anularMovimiento(id: number, motivo: string) {
    const { data } = await apiClient.post(`/api/inventario/movimientos/${id}/anular`, {
      motivo,
    })
    return unwrapApiData<Movimiento>(data)
  },

  async cancelarMovimiento(id: number, motivoCancelacion: string) {
    const { data } = await apiClient.patch(`/api/inventario/movimientos/${id}/cancelar`, {
      motivoCancelacion,
    })
    return unwrapApiData<Movimiento>(data)
  },
}
