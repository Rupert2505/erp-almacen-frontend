export type TipoArticulo = {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  activo: boolean
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type TipoArticuloPayload = {
  codigo: string
  nombre: string
  descripcion?: string | null
}

export type TipoArticuloFilters = {
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
