import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type { Permiso } from '../types/permiso.types'

export const permisoService = {
  async getPermisos() {
    const { data } = await apiClient.get('/api/permisos')
    return unwrapApiData<Permiso[]>(data)
  },

  async getPermiso(id: number) {
    const { data } = await apiClient.get(`/api/permisos/${id}`)
    return unwrapApiData<Permiso>(data)
  },
}
