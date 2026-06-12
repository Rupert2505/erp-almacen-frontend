export type Marca = {
  id: number
  codigo?: string | null
  nombre: string
  descripcion?: string | null
  activo: boolean
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type MarcaPayload = {
  codigo?: string | null
  nombre: string
  descripcion?: string | null
}

export type MarcaFilters = {
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
