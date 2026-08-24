const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

export function toFiniteNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export function formatOptionalCurrency(value: number | string | null | undefined) {
  const numberValue = toFiniteNumber(value)
  return numberValue === null ? '-' : currencyFormatter.format(numberValue)
}

export function formatOptionalNumber(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
) {
  const numberValue = toFiniteNumber(value)
  return numberValue === null ? '-' : new Intl.NumberFormat('es-PE', options).format(numberValue)
}
