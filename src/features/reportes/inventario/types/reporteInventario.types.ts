import type {
  EstadoMovimiento,
  TipoMovimiento,
} from '../../../inventario/movimientos/types/movimiento.types'

export type ReporteInventarioResumen = {
  totalProductos: number
  productosActivos: number
  totalAlmacenes: number
  totalMovimientos: number
  movimientosConfirmados: number
  movimientosBorrador: number
  movimientosAnulados: number
  totalStockActual: number
  productosBajoMinimo: number
  valorInventarioEstimado: number
}

export type ReporteInventarioTipo =
  | 'movimientos'
  | 'stock-valorizado'
  | 'entradas-proveedor'
  | 'salidas'
  | 'productos-bajo-minimo'

export type ReporteInventarioFilters = {
  page: number
  size: number
  fechaDesde?: string
  fechaHasta?: string
  productoId?: number | null
  almacenId?: number | null
  proveedorId?: number | null
  tipoMovimiento?: TipoMovimiento | ''
  estado?: EstadoMovimiento | ''
  soloConStock?: boolean
}

export type ReporteMovimientoItem = {
  movimientoId: number
  numero: string
  tipoMovimiento: TipoMovimiento
  estado: EstadoMovimiento
  fechaMovimiento?: string | null
  documentoReferencia?: string | null
  productoCodigo?: string | null
  productoNombre?: string | null
  almacenOrigenNombre?: string | null
  almacenDestinoNombre?: string | null
  cantidad?: number | null
  costoUnitario?: number | null
  totalLinea?: number | null
}

export type StockValorizadoItem = {
  productoId: number
  productoCodigo: string
  productoNombre: string
  almacenId?: number | null
  almacenNombre?: string | null
  ubicacionId?: number | null
  ubicacionNombre?: string | null
  cantidadActual?: number | null
  costoPromedio?: number | null
  valorTotal?: number | null
}

export type EntradaProveedorItem = {
  proveedorId: number
  proveedorDocumento?: string | null
  proveedorRazonSocial?: string | null
  movimientoId: number
  numeroMovimiento: string
  fechaMovimiento?: string | null
  documentoReferencia?: string | null
  productoCodigo?: string | null
  productoNombre?: string | null
  cantidad?: number | null
  costoUnitario?: number | null
  totalLinea?: number | null
}

export type SalidaInventarioItem = {
  movimientoId: number
  numeroMovimiento: string
  tipoMovimiento: TipoMovimiento
  fechaMovimiento?: string | null
  almacenNombre?: string | null
  productoCodigo?: string | null
  productoNombre?: string | null
  cantidad?: number | null
  costoReferencial?: number | null
  observacion?: string | null
}

export type ProductoBajoMinimoItem = {
  productoId: number
  productoCodigo: string
  productoNombre: string
  categoriaNombre?: string | null
  almacenId?: number | null
  almacenNombre?: string | null
  cantidadActual?: number | null
  stockMinimo?: number | null
  diferencia?: number | null
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
