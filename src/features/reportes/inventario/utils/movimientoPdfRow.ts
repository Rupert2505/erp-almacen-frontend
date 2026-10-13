import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type { ReporteMovimientoItem } from '../types/reporteInventario.types'
import { formatReportDecimal } from './reportNumberFormat'

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-PE') : ''
}

function formatNumber(value?: number | null) {
  return formatReportDecimal(value, '')
}

export function buildMovimientoPdfRow(row: ReporteMovimientoItem, showCosts: boolean) {
  return {
    Movimiento: row.numero,
    Tipo: formatMovimientoLabel(row.tipoMovimiento),
    Fecha: formatDateTime(row.fechaMovimiento),
    Documento: row.documentoReferencia,
    Producto: [row.productoCodigo, row.productoNombre].filter(Boolean).join(' - '),
    'Almacen origen': row.almacenOrigenNombre,
    'Almacen destino': row.almacenDestinoNombre,
    Cantidad: formatNumber(row.cantidad),
    ...(showCosts
      ? {
          'Costo unitario': formatNumber(row.costoUnitario),
          'Total linea': formatNumber(row.totalLinea),
        }
      : {}),
  }
}
