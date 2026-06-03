export type Proveedor = {
  id: number
  tipoDocumento: string
  numeroDocumento: string
  razonSocial: string
  nombreComercial?: string | null
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  activo: boolean
  creadoEn?: string
  actualizadoEn?: string
}

export type ProveedorPayload = {
  tipoDocumento: string
  numeroDocumento: string
  razonSocial: string
  nombreComercial?: string | null
  direccion?: string | null
  telefono?: string | null
  email?: string | null
}

export type ProveedorFilters = {
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
