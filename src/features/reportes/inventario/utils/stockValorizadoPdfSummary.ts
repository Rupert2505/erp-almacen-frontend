import type { StockValorizadoResumen } from '../types/reporteInventario.types'
import { formatReportCount, formatReportDecimal } from './reportNumberFormat'

type PdfSummaryItem = [string, string]

export function buildStockValorizadoPdfSummary(
  resumen: StockValorizadoResumen | null | undefined,
  showCosts: boolean,
) {
  const items: PdfSummaryItem[] = []

  if (showCosts) {
    items.push([
      'Costo total de inventario',
      `S/ ${formatReportDecimal(resumen?.valorTotalInventario)}`,
    ])
  }

  items.push(
    ['Articulos unicos', formatReportCount(resumen?.cantidadProductos)],
    ['Sin stock (activos)', formatReportCount(resumen?.productosSinStockActivos)],
  )

  return items
}
