import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import type { Rol } from '../types/rol.types'

export const rolService = {
  async getRoles() {
    const { data } = await apiClient.get('/api/roles')
    return unwrapApiData<Rol[]>(data)
  },

  async getRol(id: number) {
    const { data } = await apiClient.get(`/api/roles/${id}`)
    return unwrapApiData<Rol>(data)
  },
}
