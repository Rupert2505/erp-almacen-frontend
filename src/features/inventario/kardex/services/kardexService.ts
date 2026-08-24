import axios from 'axios'
import { apiClient } from '../../../../shared/services/apiClient'
import { unwrapApiData } from '../../../../shared/services/apiResponse'
import type { KardexFilters, KardexItem, PageResponse } from '../types/kardex.types'

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

export function normalizeKardexPage<T>(value: PageResponse<T> | T[], page: number, size: number) {
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

export function getKardexApiErrorMessage(error: unknown) {
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

function dateStart(value?: string) {
  return value ? `${value}T00:00:00` : undefined
}

function dateEnd(value?: string) {
  return value ? `${value}T23:59:59` : undefined
}

function kardexEndpoint(filters: KardexFilters) {
  if (filters.movimientoId) {
    return `/api/inventario/kardex/movimiento/${filters.movimientoId}`
  }

  if (filters.productoId && filters.almacenId && !filters.ubicacionId && !filters.texto) {
    return `/api/inventario/kardex/producto/${filters.productoId}/almacen/${filters.almacenId}`
  }

  if (filters.productoId && !filters.almacenId && !filters.ubicacionId && !filters.texto) {
    return `/api/inventario/kardex/producto/${filters.productoId}`
  }

  return '/api/inventario/kardex'
}

export const kardexService = {
  async getKardex(filters: KardexFilters) {
    const { data } = await apiClient.get(kardexEndpoint(filters), {
      params: {
        page: filters.page,
        size: filters.size,
        sort: 'fechaMovimiento,id,desc',
        texto: filters.texto || undefined,
        productoId: filters.productoId || undefined,
        almacenId: filters.almacenId || undefined,
        ubicacionId: filters.ubicacionId || undefined,
        tipoMovimiento: filters.tipoMovimiento || undefined,
        fechaDesde: dateStart(filters.fechaDesde),
        fechaHasta: dateEnd(filters.fechaHasta),
      },
    })

    return normalizeKardexPage<KardexItem>(
      unwrapApiData<PageResponse<KardexItem> | KardexItem[]>(data),
      filters.page,
      filters.size,
    )
  },
}
