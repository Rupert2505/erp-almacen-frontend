import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import { normalizePage } from './productoService'
import type { PageResponse } from '../types/producto.types'
import type { UnidadMedida } from '../types/unidadMedida.types'

export const unidadMedidaService = {
  async getUnidadesMedida() {
    const { data } = await apiClient.get('/api/unidades-medida', {
      params: {
        page: 0,
        size: 200,
        activo: true,
      },
    })

    return normalizePage<UnidadMedida>(
      unwrapApiData<PageResponse<UnidadMedida> | UnidadMedida[]>(data),
      0,
      200,
    ).content
  },
}
