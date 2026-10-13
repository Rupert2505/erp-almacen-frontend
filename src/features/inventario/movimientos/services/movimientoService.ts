import axios from 'axios'
import { apiClient } from '../../../../shared/services/apiClient'
import { unwrapApiData } from '../../../../shared/services/apiResponse'
import type {
  DevolucionProveedorPayload,
  Movimiento,
  MovimientoDetalleDevolucionPendiente,
  MovimientoFilters,
  MovimientoPayload,
  PageResponse,
} from '../types/movimiento.types'

type BackendErrorPayload = {
  detail?: string
  message?: string
  mensaje?: string
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

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'No se pudo procesar la operacion. Revise la informacion e intente nuevamente.',
  409: CONFLICT_ERROR_MESSAGE,
  422: 'La operacion no cumple las reglas de negocio. Actualice la informacion e intente nuevamente.',
}

function isTechnicalMessage(message: string) {
  return /exception|stack trace|org\.|java\.|sql|constraint|hibernate|postgres|psqlexception/i.test(
    message,
  )
}

function safeMessage(message?: string | null) {
  const trimmed = message?.trim()

  if (!trimmed || isTechnicalMessage(trimmed)) {
    return null
  }

  return trimmed
}

function dataMessages(data: unknown) {
  if (!data || typeof data !== 'object') {
    return null
  }

  const messages = Object.values(data)
    .flat()
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim())
    .filter((value) => !isTechnicalMessage(value))
    .join('. ')

  return messages || null
}

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
    const backendMessage =
      safeMessage(payload?.message) ??
      safeMessage(payload?.mensaje) ??
      safeMessage(payload?.detail) ??
      safeMessage(payload?.error) ??
      dataMessages(payload?.data)

    if (backendMessage) {
      return backendMessage
    }

    if (status && HTTP_STATUS_MESSAGES[status]) {
      return HTTP_STATUS_MESSAGES[status]
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

export function shouldRefreshMovimientoAfterError(error: unknown) {
  return axios.isAxiosError(error) && [400, 409, 422].includes(error.response?.status ?? 0)
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

  async getMovimientoPdf(id: number) {
    const { data } = await apiClient.get<Blob>(
      `/api/reportes/inventario/movimientos/${id}/pdf`,
      { responseType: 'blob' },
    )
    return data
  },

  async createMovimiento(payload: MovimientoPayload) {
    const { data } = await apiClient.post('/api/inventario/movimientos', payload)
    return unwrapApiData<Movimiento>(data)
  },

  async createDevolucionProveedor(payload: DevolucionProveedorPayload) {
    const { data } = await apiClient.post(
      '/api/inventario/movimientos/devoluciones-proveedor',
      payload,
    )
    return unwrapApiData<Movimiento>(data)
  },

  async getDevolucionesProveedor(entradaId: number) {
    const { data } = await apiClient.get(`/api/inventario/movimientos/${entradaId}/devoluciones`)
    return unwrapApiData<Movimiento[]>(data)
  },

  async getCantidadesDevolucion(entradaId: number) {
    const { data } = await apiClient.get(
      `/api/inventario/movimientos/${entradaId}/cantidades-devolucion`,
    )
    return unwrapApiData<MovimientoDetalleDevolucionPendiente[]>(data)
  },

  async confirmarMovimiento(id: number) {
    const { data } = await apiClient.post(`/api/inventario/movimientos/${id}/confirmar`)
    return unwrapApiData<Movimiento>(data)
  },

  async anularMovimiento(id: number, motivo: string) {
    const { data } = await apiClient.post(`/api/inventario/movimientos/${id}/anular`, {
      motivo: motivo.trim(),
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
