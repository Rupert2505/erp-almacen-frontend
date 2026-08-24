import { toFiniteNumber } from '../../../../shared/utils/numberFormat'

const decimalFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const countFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 0,
})

type ReportNumber = number | string | null | undefined

export function formatReportDecimal(value: ReportNumber, fallback = '-') {
  const numberValue = toFiniteNumber(value)
  return numberValue === null ? fallback : decimalFormatter.format(numberValue)
}

export function formatReportCount(value: ReportNumber, fallback = '-') {
  const numberValue = toFiniteNumber(value)
  return numberValue === null ? fallback : countFormatter.format(numberValue)
}

export function formatReportPercent(value: ReportNumber, fallback = '-') {
  const formatted = formatReportDecimal(value, fallback)
  return formatted === fallback ? formatted : `${formatted}%`
}
