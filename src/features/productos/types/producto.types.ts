export type Producto = {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  categoriaId?: number | null
  categoriaCodigo?: string | null
  categoriaNombre?: string | null
  marcaId?: number | null
  marcaCodigo?: string | null
  marcaNombre?: string | null
  unidadMedidaId: number
  unidadMedidaCodigo?: string | null
  unidadMedidaNombre?: string | null
  unidadMedidaAbreviatura?: string | null
  stockMinimo?: number | null
  stockMaximo?: number | null
  costoReferencial?: number | null
  controlaLote: boolean
  controlaSerie: boolean
  activo: boolean
  creadoEn?: string
  actualizadoEn?: string
}

export type ProductoPayload = {
  codigo: string
  nombre: string
  descripcion?: string | null
  categoriaId?: number | null
  marcaId?: number | null
  unidadMedidaId: number
  stockMinimo?: number | null
  stockMaximo?: number | null
  costoReferencial?: number | null
  controlaLote: boolean
  controlaSerie: boolean
}

export type ProductoFilters = {
  texto?: string
  activo?: boolean
  page: number
  size: number
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first?: boolean
  last?: boolean
  empty?: boolean
  numberOfElements?: number
}
