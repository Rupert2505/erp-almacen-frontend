import axios from 'axios'
import { apiClient } from '../../../../shared/services/apiClient'
import { unwrapApiData } from '../../../../shared/services/apiResponse'
import type {
  EntradaProveedorReporte,
  KardexValorizadoReporte,
  PageResponse,
  ProductoBajoMinimoItem,
  ReporteInventarioFilters,
  ReporteInventarioResumen,
  ReporteMovimientoItem,
  SalidaInventarioItem,
  SalidaInventarioReporte,
  SalidaValorizadaOsReporteResponse,
  StockValorizadoReporte,
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

function reportDateStart(value?: string) {
  return value || undefined
}

function reportDateEnd(value?: string) {
  return value || undefined
}

function reporteParams(filters: ReporteInventarioFilters, options?: { plainDates?: boolean }) {
  return {
    page: filters.page,
    size: filters.size,
    texto: filters.texto || undefined,
    fechaDesde: options?.plainDates
      ? reportDateStart(filters.fechaDesde)
      : dateStart(filters.fechaDesde),
    fechaHasta: options?.plainDates ? reportDateEnd(filters.fechaHasta) : dateEnd(filters.fechaHasta),
    productoId: filters.productoId || undefined,
    almacenId: filters.almacenId || undefined,
    ubicacionId: filters.ubicacionId || undefined,
    proveedorId: filters.proveedorId || undefined,
    familiaId: filters.familiaId || undefined,
    subfamiliaId: filters.subfamiliaId || undefined,
    tipoArticuloId: filters.tipoArticuloId || undefined,
    marcaId: filters.marcaId || undefined,
    usuarioId: filters.usuarioId || undefined,
    tipoMovimiento: filters.tipoMovimiento || undefined,
    estado: filters.estado || undefined,
    tipoComprobante: filters.tipoComprobante || undefined,
    soloConStock: filters.soloConStock || undefined,
    bajoMinimo: filters.soloBajoMinimo || undefined,
    agruparPor: filters.agruparPor || undefined,
  }
}

function salidasPorOsParams(filters: ReporteInventarioFilters, includePagination = true) {
  return {
    ...(includePagination ? { page: filters.page, size: filters.size } : {}),
    fechaDesde: reportDateStart(filters.fechaDesde),
    fechaHasta: reportDateEnd(filters.fechaHasta),
    ordenTrabajo: filters.ordenTrabajo?.trim() || undefined,
    productoId: filters.productoId || undefined,
    estado: filters.estado || undefined,
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

function normalizeReporte<T extends { registros: PageResponse<unknown> }>(
  value: T,
  page: number,
  size: number,
) {
  if (!value?.registros) {
    return {
      ...(value ?? {}),
      registros: emptyPage(page, size),
    } as T
  }

  return {
    ...value,
    registros: normalizeReportePage(value.registros, page, size),
  } as T
}

async function getReporte<T extends { registros: PageResponse<unknown> }>(
  endpoint: string,
  filters: ReporteInventarioFilters,
  options?: { plainDates?: boolean },
) {
  const { data } = await apiClient.get(endpoint, {
    params: reporteParams(filters, options),
  })

  return normalizeReporte<T>(unwrapApiData<T>(data), filters.page, filters.size)
}

async function getBlob(endpoint: string, filters?: Partial<ReporteInventarioFilters>) {
  const { data, headers } = await apiClient.get<Blob>(endpoint, {
    params: filters
      ? reporteParams(
          {
            page: filters.page ?? 0,
            size: filters.size ?? 10,
            ...filters,
          },
          { plainDates: true },
        )
      : undefined,
    responseType: 'blob',
  })

  return {
    blob: data,
    filename: headers['content-disposition'] as string | undefined,
  }
}

async function getSalidasPorOsBlob(filters: ReporteInventarioFilters) {
  const { data, headers } = await apiClient.get<Blob>(
    '/api/reportes/inventario/salidas-por-os/excel',
    {
      params: salidasPorOsParams(filters, false),
      responseType: 'blob',
    },
  )

  return {
    blob: data,
    filename: headers['content-disposition'] as string | undefined,
  }
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

  if (error instanceof Error && error.message) {
    return error.message
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
    return getReporte<StockValorizadoReporte>(
      '/api/reportes/inventario/stock-valorizado',
      filters,
      { plainDates: true },
    )
  },

  async getKardexValorizado(filters: ReporteInventarioFilters) {
    const { data } = await apiClient.get('/api/reportes/inventario/kardex-valorizado', {
      params: reporteParams(filters, { plainDates: true }),
    })

    return unwrapApiData<KardexValorizadoReporte>(data)
  },

  getEntradasProveedor(filters: ReporteInventarioFilters) {
    return getReporte<EntradaProveedorReporte>(
      '/api/reportes/inventario/entradas-proveedor',
      filters,
      { plainDates: true },
    )
  },

  getSalidas(filters: ReporteInventarioFilters) {
    return getPage<SalidaInventarioItem>('/api/reportes/inventario/salidas', filters)
  },

  getSalidasDetalle(filters: ReporteInventarioFilters) {
    return getReporte<SalidaInventarioReporte>(
      '/api/reportes/inventario/salidas-detalle',
      filters,
      { plainDates: true },
    )
  },

  async getSalidasPorOs(filters: ReporteInventarioFilters) {
    const { data } = await apiClient.get('/api/reportes/inventario/salidas-por-os', {
      params: salidasPorOsParams(filters),
    })

    return normalizeReporte<SalidaValorizadaOsReporteResponse>(
      unwrapApiData<SalidaValorizadaOsReporteResponse>(data),
      filters.page,
      filters.size,
    )
  },

  getProductosBajoMinimo(filters: ReporteInventarioFilters) {
    return getPage<ProductoBajoMinimoItem>(
      '/api/reportes/inventario/productos-bajo-minimo',
      filters,
    )
  },

  exportMovimientos(filters: ReporteInventarioFilters) {
    return getBlob('/api/reportes/inventario/movimientos/excel', filters)
  },

  exportStockValorizado(filters: ReporteInventarioFilters) {
    return getBlob('/api/reportes/inventario/stock-valorizado/excel', filters)
  },

  exportKardexValorizado(filters: ReporteInventarioFilters) {
    return getBlob('/api/reportes/inventario/kardex-valorizado/excel', filters)
  },

  exportSalidasDetalle(filters: ReporteInventarioFilters) {
    return getBlob('/api/reportes/inventario/salidas-detalle/excel', filters)
  },

  exportSalidasPorOs(filters: ReporteInventarioFilters) {
    return getSalidasPorOsBlob(filters)
  },

  exportEntradasProveedor(filters: ReporteInventarioFilters) {
    return getBlob('/api/reportes/inventario/entradas-proveedor/excel', filters)
  },

  exportProductosBajoMinimo(filters: ReporteInventarioFilters) {
    return getBlob('/api/reportes/inventario/productos-bajo-minimo/excel', filters)
  },

  getMovimientoPdf(movimientoId: number) {
    return getBlob(`/api/reportes/inventario/movimientos/${movimientoId}/pdf`)
  },
}
