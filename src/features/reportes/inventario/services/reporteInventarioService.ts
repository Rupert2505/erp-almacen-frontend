import axios from 'axios'
import { apiClient } from '../../../../shared/services/apiClient'
import { unwrapApiData } from '../../../../shared/services/apiResponse'
import type {
  EntradaProveedorItem,
  PageResponse,
  ProductoBajoMinimoItem,
  ReporteInventarioFilters,
  ReporteInventarioResumen,
  ReporteMovimientoItem,
  SalidaInventarioItem,
  StockValorizadoItem,
} from '../types/reporteInventario.types'

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

function normalizeReportePage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

function dateStart(value?: string) {
  return value ? `${value}T00:00:00` : undefined
}

function dateEnd(value?: string) {
  return value ? `${value}T23:59:59` : undefined
}

function reporteParams(filters: ReporteInventarioFilters) {
  return {
    page: filters.page,
    size: filters.size,
    fechaDesde: dateStart(filters.fechaDesde),
    fechaHasta: dateEnd(filters.fechaHasta),
    productoId: filters.productoId || undefined,
    almacenId: filters.almacenId || undefined,
    proveedorId: filters.proveedorId || undefined,
    tipoMovimiento: filters.tipoMovimiento || undefined,
    estado: filters.estado || undefined,
    soloConStock: filters.soloConStock || undefined,
  }
}

async function getPage<T>(endpoint: string, filters: ReporteInventarioFilters) {
  const { data } = await apiClient.get(endpoint, {
    params: reporteParams(filters),
  })

  return normalizeReportePage<T>(
    unwrapApiData<PageResponse<T> | T[]>(data),
    filters.page,
    filters.size,
  )
}

export function getReporteInventarioApiErrorMessage(error: unknown) {
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

  return 'Ocurrio un error inesperado al consultar reportes.'
}

export const reporteInventarioService = {
  async getResumen() {
    const { data } = await apiClient.get('/api/reportes/inventario/resumen')
    return unwrapApiData<ReporteInventarioResumen>(data)
  },

  getMovimientos(filters: ReporteInventarioFilters) {
    return getPage<ReporteMovimientoItem>('/api/reportes/inventario/movimientos', filters)
  },

  getStockValorizado(filters: ReporteInventarioFilters) {
    return getPage<StockValorizadoItem>('/api/reportes/inventario/stock-valorizado', filters)
  },

  getEntradasProveedor(filters: ReporteInventarioFilters) {
    return getPage<EntradaProveedorItem>(
      '/api/reportes/inventario/entradas-proveedor',
      filters,
    )
  },

  getSalidas(filters: ReporteInventarioFilters) {
    return getPage<SalidaInventarioItem>('/api/reportes/inventario/salidas', filters)
  },

  getProductosBajoMinimo(filters: ReporteInventarioFilters) {
    return getPage<ProductoBajoMinimoItem>(
      '/api/reportes/inventario/productos-bajo-minimo',
      filters,
    )
  },
}
