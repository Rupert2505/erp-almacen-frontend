export type Producto = {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  tipoArticuloId: number
  tipoArticuloCodigo?: string | null
  tipoArticuloNombre?: string | null
  familiaId: number
  familiaPrefijo?: string | null
  familiaNombre?: string | null
  subfamiliaId?: number | null
  subfamiliaNombre?: string | null
  marcaId?: number | null
  marcaNombre?: string | null
  unidadMedidaId: number
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
  codigo?: string | null
  nombre: string
  descripcion?: string | null
  tipoArticuloId: number
  familiaId: number
  subfamiliaId?: number | null
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
  tipoArticuloId?: number | null
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
