import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import { normalizePage } from './productoService'
import type { Marca } from '../types/marca.types'
import type { PageResponse } from '../types/producto.types'

export const marcaService = {
  async getMarcas() {
    const { data } = await apiClient.get('/api/marcas', {
      params: {
        page: 0,
        size: 200,
        activo: true,
      },
    })

    return normalizePage<Marca>(
      unwrapApiData<PageResponse<Marca> | Marca[]>(data),
      0,
      200,
    ).content
  },
}
