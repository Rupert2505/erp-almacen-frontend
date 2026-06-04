export type StockItem = {
  id: number
  productoId: number
  productoCodigo: string
  productoNombre: string
  almacenId: number
  almacenCodigo: string
  almacenNombre: string
  ubicacionId?: number | null
  ubicacionCodigo?: string | null
  ubicacionNombre?: string | null
  cantidadActual: number
  costoPromedio?: number | null
  fechaUltimoMovimiento?: string | null
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type StockBajoMinimoItem = {
  productoId: number
  productoCodigo: string
  productoNombre: string
  almacenId: number
  almacenCodigo: string
  almacenNombre: string
  ubicacionId?: number | null
  ubicacionCodigo?: string | null
  ubicacionNombre?: string | null
  cantidadActual: number
  stockMinimo: number
  diferencia: number
}

export type StockFilters = {
  texto?: string
  productoId?: number | null
  almacenId?: number | null
  ubicacionId?: number | null
  soloConStock?: boolean
  bajoMinimo?: boolean
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
