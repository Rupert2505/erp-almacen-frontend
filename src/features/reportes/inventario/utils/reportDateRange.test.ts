import { describe, expect, it } from 'vitest'
import { getCurrentMonthDateRange, reportUsesDateRange } from './reportDateRange'

describe('getCurrentMonthDateRange', () => {
  it('usa el primer dia del mes y la fecha local actual', () => {
    expect(getCurrentMonthDateRange(new Date(2026, 7, 24, 23, 30))).toEqual({
      fechaDesde: '2026-08-01',
      fechaHasta: '2026-08-24',
    })
  })

  it('respeta el cambio de año', () => {
    expect(getCurrentMonthDateRange(new Date(2027, 0, 2))).toEqual({
      fechaDesde: '2027-01-01',
      fechaHasta: '2027-01-02',
    })
  })

  it('no aplica el rango de fechas al stock valorizado', () => {
    expect(reportUsesDateRange('stock-valorizado')).toBe(false)
    expect(reportUsesDateRange('movimientos')).toBe(true)
  })
})
