import type { TipoMovimiento } from '../../movimientos/types/movimiento.types'

export type KardexItem = {
  id: number
  movimientoId: number
  movimientoDetalleId?: number | null
  productoId: number
  productoCodigo: string
  productoNombre: string
  almacenId: number
  almacenCodigo: string
  almacenNombre: string
  ubicacionId?: number | null
  ubicacionCodigo?: string | null
  ubicacionNombre?: string | null
  fechaMovimiento: string
  tipoMovimiento: TipoMovimiento
  numeroMovimiento: string
  entrada: number
  salida: number
  saldoAnterior: number
  saldoFinal: number
  costoUnitario?: number | null
  costoPromedio?: number | null
  usuarioId?: number | null
  username?: string | null
  observacion?: string | null
  creadoEn?: string | null
}

export type KardexFilters = {
  texto?: string
  productoId?: number | null
  almacenId?: number | null
  ubicacionId?: number | null
  movimientoId?: number | null
  tipoMovimiento?: TipoMovimiento | ''
  fechaDesde?: string
  fechaHasta?: string
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
