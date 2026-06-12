export type Familia = {
  id: number
  nombre: string
  descripcion?: string | null
  activo: boolean
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type FamiliaPayload = {
  nombre: string
  descripcion?: string | null
}

export type FamiliaFilters = {
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
