import { describe, expect, it } from 'vitest'
import { formatOptionalCurrency, formatOptionalNumber } from './numberFormat'

describe('numberFormat', () => {
  it('formatea importes opcionales sin mostrar valores invalidos', () => {
    expect(formatOptionalCurrency(null)).toBe('-')
    expect(formatOptionalCurrency(undefined)).toBe('-')
    expect(formatOptionalCurrency(Number.NaN)).toBe('-')
    expect(formatOptionalCurrency('99.123456')).toMatch(/S\/\s*99\.12/)
  })

  it('formatea numeros opcionales sin NaN', () => {
    expect(formatOptionalNumber(null)).toBe('-')
    expect(formatOptionalNumber('no-numero')).toBe('-')
    expect(formatOptionalNumber('12.5', { maximumFractionDigits: 2 })).toBe('12.5')
  })
})
