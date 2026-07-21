export const TIPOS_MOVIMIENTO = [
  'ENTRADA_COMPRA',
  'ENTRADA_AJUSTE',
  'SALIDA_CONSUMO',
  'SALIDA_VENTA',
  'SALIDA_AJUSTE',
  'TRANSFERENCIA',
  'AJUSTE_POSITIVO',
  'AJUSTE_NEGATIVO',
] as const

export const ESTADOS_MOVIMIENTO = ['BORRADOR', 'CONFIRMADO', 'ANULADO', 'CANCELADO'] as const

export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number]
export type EstadoMovimiento = (typeof ESTADOS_MOVIMIENTO)[number]

export type MovimientoDetalle = {
  id: number
  productoId: number
  productoCodigo?: string | null
  productoNombre?: string | null
  ubicacionOrigenId?: number | null
  ubicacionOrigenCodigo?: string | null
  ubicacionOrigenNombre?: string | null
  ubicacionDestinoId?: number | null
  ubicacionDestinoCodigo?: string | null
  ubicacionDestinoNombre?: string | null
  cantidad: number
  costoUnitario?: number | null
  totalLinea?: number | null
  observacion?: string | null
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type Movimiento = {
  id: number
  numero: string
  tipoMovimiento: TipoMovimiento
  estado: EstadoMovimiento
  fechaMovimiento?: string | null
  proveedorId?: number | null
  proveedorNumeroDocumento?: string | null
  proveedorRazonSocial?: string | null
  almacenOrigenId?: number | null
  almacenOrigenCodigo?: string | null
  almacenOrigenNombre?: string | null
  almacenDestinoId?: number | null
  almacenDestinoCodigo?: string | null
  almacenDestinoNombre?: string | null
  documentoReferencia?: string | null
  motivoMovimiento?: string | null
  ordenTrabajo?: string | null
  areaSolicitante?: string | null
  solicitante?: string | null
  responsableEntrega?: string | null
  responsableRecepcion?: string | null
  guiaSerie?: string | null
  guiaNumero?: string | null
  guiaFecha?: string | null
  comprobanteTipo?: 'FACTURA' | 'BOLETA' | 'OTRO' | null
  comprobanteSerie?: string | null
  comprobanteNumero?: string | null
  comprobanteFechaEmision?: string | null
  ordenCompra?: string | null
  ordenCompraNumero?: string | null
  fechaPedido?: string | null
  fechaRecepcion?: string | null
  flete?: number | null
  movilidad?: number | null
  otrosGastos?: number | null
  observacionDocumentaria?: string | null
  observacion?: string | null
  usuarioId?: number | null
  username?: string | null
  confirmadoEn?: string | null
  anuladoEn?: string | null
  motivoCancelacion?: string | null
  canceladoPor?: string | null
  canceladoEn?: string | null
  creadoEn?: string | null
  actualizadoEn?: string | null
  detalles?: MovimientoDetalle[]
}

export type MovimientoDetallePayload = {
  productoId: number
  ubicacionOrigenId?: number | null
  ubicacionDestinoId?: number | null
  cantidad: number
  costoUnitario?: number | null
  observacion?: string | null
}

export type MovimientoPayload = {
  tipoMovimiento: TipoMovimiento
  fechaMovimiento?: string | null
  proveedorId?: number | null
  almacenOrigenId?: number | null
  almacenDestinoId?: number | null
  documentoReferencia?: string | null
  motivoMovimiento?: string | null
  ordenTrabajo?: string | null
  areaSolicitante?: string | null
  solicitante?: string | null
  responsableEntrega?: string | null
  responsableRecepcion?: string | null
  guiaSerie?: string | null
  guiaNumero?: string | null
  guiaFecha?: string | null
  comprobanteTipo?: 'FACTURA' | 'BOLETA' | 'OTRO' | null
  comprobanteSerie?: string | null
  comprobanteNumero?: string | null
  comprobanteFechaEmision?: string | null
  ordenCompra?: string | null
  ordenCompraNumero?: string | null
  fechaPedido?: string | null
  fechaRecepcion?: string | null
  flete?: number | null
  movilidad?: number | null
  otrosGastos?: number | null
  observacionDocumentaria?: string | null
  confirmar?: boolean
  observacion?: string | null
  detalles: MovimientoDetallePayload[]
}

export type MovimientoFilters = {
  texto?: string
  tipoMovimiento?: TipoMovimiento | ''
  estado?: EstadoMovimiento | ''
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
