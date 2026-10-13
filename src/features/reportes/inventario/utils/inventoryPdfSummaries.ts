import type {
  EntradaProveedorResumen,
  KardexValorizadoReporte,
  SalidaInventarioResumen,
} from '../types/reporteInventario.types'
import { formatReportCount, formatReportDecimal } from './reportNumberFormat'

type PdfSummaryItem = [string, string]

export function buildKardexPdfSummary(
  reporte: KardexValorizadoReporte | null | undefined,
  showCosts: boolean,
) {
  const items: PdfSummaryItem[] = [
    ['Saldo inicial', formatReportDecimal(reporte?.cabecera?.saldoInicialCantidad)],
    ['Total entradas', formatReportDecimal(reporte?.resumen?.totalEntradas)],
    ['Total salidas', formatReportDecimal(reporte?.resumen?.totalSalidas)],
    ['Saldo final', formatReportDecimal(reporte?.resumen?.saldoFinalCantidad)],
  ]

  if (showCosts) {
    items.push(
      [
        'Costo promedio final',
        `S/ ${formatReportDecimal(reporte?.resumen?.costoPromedioFinal)}`,
      ],
      ['Valor saldo final', `S/ ${formatReportDecimal(reporte?.resumen?.valorSaldoFinal)}`],
    )
  }

  return items
}

export function buildSalidasPdfSummary(
  resumen: SalidaInventarioResumen | null | undefined,
  showCosts: boolean,
) {
  const items: PdfSummaryItem[] = [
    ['Movimientos', formatReportCount(resumen?.cantidadMovimientos)],
    ['Lineas de salida', formatReportCount(resumen?.cantidadLineas)],
    ['Cantidad total', formatReportDecimal(resumen?.cantidadTotalSalida)],
  ]

  if (showCosts) {
    items.push(['Valor total de salida', `S/ ${formatReportDecimal(resumen?.valorTotalSalida)}`])
  }

  return items
}

export function buildEntradasProveedorPdfSummary(
  resumen: EntradaProveedorResumen | null | undefined,
  showCosts: boolean,
) {
  const items: PdfSummaryItem[] = [
    ['Proveedores', formatReportCount(resumen?.cantidadProveedores)],
    ['Movimientos', formatReportCount(resumen?.cantidadMovimientos)],
    ['Articulos unicos', formatReportCount(resumen?.cantidadProductos)],
  ]

  if (showCosts) {
    items.push(
      ['Valor de productos', `S/ ${formatReportDecimal(resumen?.valorProductos)}`],
      ['Total documentario', `S/ ${formatReportDecimal(resumen?.totalDocumentario)}`],
    )
  }

  return items
}
