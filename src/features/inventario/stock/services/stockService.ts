import axios from 'axios'
import { apiClient } from '../../../../shared/services/apiClient'
import { unwrapApiData } from '../../../../shared/services/apiResponse'
import type {
  PageResponse,
  StockBajoMinimoItem,
  StockFilters,
  StockItem,
} from '../types/stock.types'

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

export function normalizeStockPage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

export function getStockApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BackendErrorPayload>(error)) {
    const payload = error.response?.data

    if (payload?.message) {
      return payload.message
    }

    if (payload?.error) {
      return payload.error
    }

    if (!error.response) {
      return 'No se pudo conectar con el backend. Verifique que este activo y que CORS permita el acceso.'
    }
  }

  return 'Ocurrio un error inesperado. Intente nuevamente.'
}

function stockEndpoint(filters: StockFilters) {
  if (filters.bajoMinimo) {
    return '/api/inventario/stock/bajo-minimo'
  }

  if (filters.productoId && !filters.almacenId && !filters.ubicacionId && !filters.texto) {
    return `/api/inventario/stock/producto/${filters.productoId}`
  }

  if (filters.almacenId && !filters.productoId && !filters.ubicacionId && !filters.texto) {
    return `/api/inventario/stock/almacen/${filters.almacenId}`
  }

  return '/api/inventario/stock'
}

export const stockService = {
  async getStock(filters: StockFilters) {
    const { data } = await apiClient.get(stockEndpoint(filters), {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        productoId: filters.productoId || undefined,
        almacenId: filters.almacenId || undefined,
        ubicacionId: filters.ubicacionId || undefined,
        soloConStock: filters.soloConStock || undefined,
      },
    })

    return normalizeStockPage<StockItem>(
      unwrapApiData<PageResponse<StockItem> | StockItem[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getStockBajoMinimo(filters: StockFilters) {
    const { data } = await apiClient.get('/api/inventario/stock/bajo-minimo', {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        productoId: filters.productoId || undefined,
        almacenId: filters.almacenId || undefined,
        ubicacionId: filters.ubicacionId || undefined,
      },
    })

    return normalizeStockPage<StockBajoMinimoItem>(
      unwrapApiData<PageResponse<StockBajoMinimoItem> | StockBajoMinimoItem[]>(data),
      filters.page,
      filters.size,
    )
  },
}
