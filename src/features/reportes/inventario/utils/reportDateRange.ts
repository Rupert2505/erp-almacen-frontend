import type { ReporteInventarioTipo } from '../types/reporteInventario.types'

const REPORTS_WITH_DATE_RANGE: ReporteInventarioTipo[] = [
  'movimientos',
  'kardex-valorizado',
  'entradas-proveedor',
  'salidas-detalle',
  'salidas-por-os',
]

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function reportUsesDateRange(reporte: ReporteInventarioTipo) {
  return REPORTS_WITH_DATE_RANGE.includes(reporte)
}

export function getCurrentMonthDateRange(now = new Date()) {
  return {
    fechaDesde: formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    fechaHasta: formatLocalDate(now),
  }
}
