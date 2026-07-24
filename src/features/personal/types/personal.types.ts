export type Personal = {
  id: number
  tipoDocumento: string
  numeroDocumento: string
  nombres: string
  apellidos?: string | null
  cargo?: string | null
  area?: string | null
  telefono?: string | null
  email?: string | null
  activo: boolean
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type PersonalPayload = {
  tipoDocumento: string
  numeroDocumento: string
  nombres: string
  apellidos?: string | null
  cargo?: string | null
  area?: string | null
  telefono?: string | null
  email?: string | null
}

export type PersonalFilters = {
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
