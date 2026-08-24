import { describe, expect, it } from 'vitest'
import {
  formatReportCount,
  formatReportDecimal,
  formatReportPercent,
} from './reportNumberFormat'

describe('formato numérico de reportes de inventario', () => {
  it('muestra cantidades y valores con exactamente dos decimales', () => {
    expect(formatReportDecimal(1)).toBe('1.00')
    expect(formatReportDecimal(11.3333)).toBe('11.33')
    expect(formatReportDecimal(1473.336)).toBe('1,473.34')
  })

  it('mantiene conteos enteros y porcentajes con dos decimales', () => {
    expect(formatReportCount(3)).toBe('3')
    expect(formatReportPercent(20)).toBe('20.00%')
  })

  it('respeta el texto alternativo para valores no disponibles', () => {
    expect(formatReportDecimal(null)).toBe('-')
    expect(formatReportDecimal(undefined, '')).toBe('')
  })
})
