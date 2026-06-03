import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import { normalizeAlmacenPage } from './almacenService'
import type { PageResponse } from '../types/almacen.types'
import type {
  Ubicacion,
  UbicacionFilters,
  UbicacionPayload,
} from '../types/ubicacion.types'

export const ubicacionService = {
  async getUbicaciones(filters: UbicacionFilters) {
    const endpoint = filters.almacenId
      ? `/api/almacenes/${filters.almacenId}/ubicaciones`
      : '/api/ubicaciones'
    const { data } = await apiClient.get(endpoint, {
      params: {
        page: filters.page,
        size: filters.size,
        texto: filters.texto || undefined,
        activo: filters.activo,
      },
    })

    return normalizeAlmacenPage<Ubicacion>(
      unwrapApiData<PageResponse<Ubicacion> | Ubicacion[]>(data),
      filters.page,
      filters.size,
    )
  },

  async getUbicacion(id: number) {
    const { data } = await apiClient.get(`/api/ubicaciones/${id}`)
    return unwrapApiData<Ubicacion>(data)
  },

  async createUbicacion(payload: UbicacionPayload) {
    const { data } = await apiClient.post('/api/ubicaciones', payload)
    return unwrapApiData<Ubicacion>(data)
  },

  async updateUbicacion(id: number, payload: UbicacionPayload) {
    const { data } = await apiClient.put(`/api/ubicaciones/${id}`, payload)
    return unwrapApiData<Ubicacion>(data)
  },

  async activarUbicacion(id: number) {
    const { data } = await apiClient.patch(`/api/ubicaciones/${id}/activar`)
    return unwrapApiData<Ubicacion>(data)
  },

  async desactivarUbicacion(id: number) {
    const { data } = await apiClient.patch(`/api/ubicaciones/${id}/desactivar`)
    return unwrapApiData<Ubicacion>(data)
  },
}
