export type Almacen = {
  id: number
  codigo: string
  nombre: string
  direccion?: string | null
  responsable?: string | null
  activo: boolean
  creadoEn?: string
  actualizadoEn?: string
}

export type AlmacenPayload = {
  codigo: string
  nombre: string
  direccion?: string | null
  responsable?: string | null
}

export type AlmacenFilters = {
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
