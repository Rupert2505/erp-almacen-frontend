export type Subfamilia = {
  id: number
  familiaId: number
  familiaNombre?: string | null
  nombre: string
  descripcion?: string | null
  activo: boolean
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type SubfamiliaPayload = {
  familiaId: number
  nombre: string
  descripcion?: string | null
}

export type SubfamiliaFilters = {
  texto?: string
  activo?: boolean
  familiaId?: number | null
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
