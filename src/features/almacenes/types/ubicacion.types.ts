export type Ubicacion = {
  id: number
  almacenId: number
  almacenCodigo?: string | null
  almacenNombre?: string | null
  codigo: string
  nombre: string
  descripcion?: string | null
  activo: boolean
  creadoEn?: string
  actualizadoEn?: string
}

export type UbicacionPayload = {
  almacenId: number
  codigo: string
  nombre: string
  descripcion?: string | null
}

export type UbicacionFilters = {
  texto?: string
  activo?: boolean
  almacenId?: number | null
  page: number
  size: number
}
