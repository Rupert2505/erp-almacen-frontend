import { apiClient } from '../../../shared/services/apiClient'
import { unwrapApiData } from '../../../shared/services/apiResponse'
import { normalizePage } from './productoService'
import type { Categoria } from '../types/categoria.types'
import type { PageResponse } from '../types/producto.types'

export const categoriaService = {
  async getCategorias() {
    const { data } = await apiClient.get('/api/categorias', {
      params: {
        page: 0,
        size: 200,
        activo: true,
      },
    })

    return normalizePage<Categoria>(
      unwrapApiData<PageResponse<Categoria> | Categoria[]>(data),
      0,
      200,
    ).content
  },
}
