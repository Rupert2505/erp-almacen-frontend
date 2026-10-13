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
  | 'kardex-valorizado'
  | 'entradas-proveedor'
  | 'salidas-detalle'
  | 'salidas-por-os'
  | 'productos-bajo-minimo'

export type ReporteInventarioFilters = {
  page: number
  size: number
  texto?: string
  ordenTrabajo?: string
  fechaDesde?: string
  fechaHasta?: string
  productoId?: number | null
  almacenId?: number | null
  ubicacionId?: number | null
  proveedorId?: number | null
  familiaId?: number | null
  subfamiliaId?: number | null
  tipoArticuloId?: number | null
  marcaId?: number | null
  usuarioId?: number | null
  tipoMovimiento?: TipoMovimiento | ''
  estado?: EstadoMovimiento | ''
  tipoComprobante?: string
  soloConStock?: boolean
  soloBajoMinimo?: boolean
  agruparPor?: string
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
  codigoProducto: string
  nombreProducto: string
  familia?: string | null
  subfamilia?: string | null
  tipoArticulo?: string | null
  marca?: string | null
  unidadMedida?: string | null
  almacenId?: number | null
  almacen?: string | null
  ubicacionId?: number | null
  ubicacion?: string | null
  cantidadActual?: number | null
  stockMinimo?: number | null
  stockMaximo?: number | null
  costoPromedio?: number | null
  valorTotal?: number | null
  estadoStock?: 'CON_STOCK' | 'SIN_STOCK' | 'BAJO_MINIMO' | string
}

export type StockValorizadoResumen = {
  cantidadProductos: number
  cantidadUnidades: number
  valorTotalInventario: number | null
  productosBajoMinimo: number
  productosSinStockActivos: number
}

export type StockValorizadoReporte = {
  registros: PageResponse<StockValorizadoItem>
  resumen?: StockValorizadoResumen | null
}

export type KardexValorizadoCabecera = {
  productoId: number
  codigoProducto: string
  nombreProducto: string
  unidadMedida?: string | null
  almacenId?: number | null
  almacen?: string | null
  ubicacionId?: number | null
  ubicacion?: string | null
  fechaDesde?: string | null
  fechaHasta?: string | null
  saldoInicialCantidad?: number | null
  saldoInicialCostoPromedio?: number | null
  saldoInicialValor?: number | null
}

export type KardexValorizadoResumen = {
  totalEntradas?: number | null
  totalSalidas?: number | null
  saldoFinalCantidad?: number | null
  costoPromedioFinal?: number | null
  valorSaldoFinal?: number | null
}

export type KardexValorizadoDetalle = {
  fecha?: string | null
  movimientoId: number
  numeroMovimiento: string
  tipoMovimiento: TipoMovimiento
  estadoMovimiento: EstadoMovimiento
  documentoReferencia?: string | null
  cantidadEntrada?: number | null
  cantidadSalida?: number | null
  saldoAnterior?: number | null
  saldoFinal?: number | null
  costoUnitarioMovimiento?: number | null
  costoPromedio?: number | null
  valorEntrada?: number | null
  valorSalida?: number | null
  valorSaldo?: number | null
  usuario?: string | null
}

export type KardexValorizadoReporte = {
  cabecera?: KardexValorizadoCabecera | null
  detalles: KardexValorizadoDetalle[]
  resumen?: KardexValorizadoResumen | null
}

export type EntradaProveedorItem = {
  fechaMovimiento?: string | null
  fechaPedido?: string | null
  fechaRecepcion?: string | null
  movimientoId: number
  numeroMovimiento: string
  proveedorId: number
  proveedorNumeroDocumento?: string | null
  proveedorRazonSocial?: string | null
  ordenCompra?: string | null
  guiaSerie?: string | null
  guiaNumero?: string | null
  guiaFecha?: string | null
  comprobanteTipo?: string | null
  comprobanteSerie?: string | null
  comprobanteNumero?: string | null
  comprobanteFecha?: string | null
  almacenDestino?: string | null
  almacenDestinoCodigo?: string | null
  productoId?: number | null
  codigoProducto?: string | null
  nombreProducto?: string | null
  unidadMedida?: string | null
  unidadMedidaAbreviatura?: string | null
  cantidad?: number | null
  costoUnitario?: number | null
  valorLinea?: number | null
  flete?: number | null
  movilidad?: number | null
  otrosGastos?: number | null
}

export type EntradaProveedorResumen = {
  cantidadMovimientos?: number | null
  cantidadProveedores?: number | null
  cantidadProductos?: number | null
  valorProductos?: number | null
  totalFlete?: number | null
  totalMovilidad?: number | null
  totalOtrosGastos?: number | null
  totalDocumentario?: number | null
}

export type EntradaProveedorReporte = {
  registros: PageResponse<EntradaProveedorItem>
  resumen?: EntradaProveedorResumen | null
}

export type SalidaInventarioItem = {
  fecha?: string | null
  movimientoId: number
  numeroMovimiento: string
  tipoMovimiento: TipoMovimiento
  estado?: EstadoMovimiento | null
  almacenOrigen?: string | null
  almacenOrigenCodigo?: string | null
  ubicacionOrigen?: string | null
  productoId?: number | null
  codigoProducto?: string | null
  nombreProducto?: string | null
  familia?: string | null
  unidadMedida?: string | null
  unidadMedidaAbreviatura?: string | null
  cantidad?: number | null
  costoPromedioAplicado?: number | null
  valorSalida?: number | null
  usuario?: string | null
  motivo?: string | null
  observacion?: string | null
}

export type SalidaInventarioResumen = {
  cantidadMovimientos?: number | null
  cantidadLineas?: number | null
  cantidadTotalSalida?: number | null
  valorTotalSalida?: number | null
}

export type SalidaInventarioAgrupacion = {
  clave?: string | null
  descripcion?: string | null
  cantidad?: number | null
  valor?: number | null
}

export type SalidaInventarioReporte = {
  registros: PageResponse<SalidaInventarioItem>
  resumen?: SalidaInventarioResumen | null
  agrupaciones?: SalidaInventarioAgrupacion[]
}

export type SalidaValorizadaOsResponse = {
  fecha?: string | null
  movimientoId: number
  numeroMovimiento: string
  estado: EstadoMovimiento
  ordenTrabajo?: string | null
  productoId: number
  codigoProducto: string
  descripcionProducto: string
  cantidad: number
  unidadMedida: string
  costoInventarioUnitario?: number | null
  costoInventarioTotal?: number | null
  costoBaseComercialUnitarioSinIgv?: number | null
  recargoAplicadoPct?: number | null
  valorVentaUnitarioSinIgv?: number | null
  valorVentaTotalSinIgv?: number | null
  igvUnitario?: number | null
  igvTotal?: number | null
  precioVentaUnitarioConIgv?: number | null
  precioVentaTotalConIgv?: number | null
  diferenciaComercialSinIgv?: number | null
}

export type SalidaValorizadaOsResumenResponse = {
  ordenTrabajo: string
  cantidadMovimientos: number
  cantidadItems: number
  costoTotalInventario?: number | null
  valorComercialTotalSinIgv?: number | null
  igvTotal?: number | null
  precioTotalConIgv?: number | null
  diferenciaComercialSinIgv?: number | null
}

export type SalidaValorizadaOsReporteResponse = {
  registros: PageResponse<SalidaValorizadaOsResponse>
  resumenPorOs: SalidaValorizadaOsResumenResponse[]
}

export type ProductoBajoMinimoItem = {
  productoId: number
  productoCodigo: string
  productoNombre: string
  categoriaNombre?: string | null
  almacenId?: number | null
  almacenNombre?: string | null
  almacenCodigo?: string | null
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
