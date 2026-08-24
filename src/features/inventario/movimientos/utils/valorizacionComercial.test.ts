import { describe, expect, it } from 'vitest'
import {
  calcularTotalesComerciales,
  calcularValorVentaSinIgv,
  isValidRecargoComercial,
} from './valorizacionComercial'

describe('valorizacionComercial', () => {
  it('calcula 12.71 con recargo 35% usando HALF_UP e IGV 18%', () => {
    expect(calcularTotalesComerciales(12.71, 35, 2)).toEqual({
      costoBaseComercialSinIgv: 12.71,
      recargoComercialPct: 35,
      valorVentaUnitarioSinIgv: 17.16,
      igvUnitario: 3.09,
      precioVentaUnitarioConIgv: 20.25,
      valorVentaTotalSinIgv: 34.32,
      igvTotal: 6.18,
      precioVentaTotalConIgv: 40.5,
    })
  })

  it.each([
    [25, 18.75],
    [50, 22.5],
    [100, 30],
    [0, 15],
  ])('calcula base 15 con recargo %s%%', (recargo, esperado) => {
    expect(calcularValorVentaSinIgv(15, recargo)).toBe(esperado)
  })

  it('acepta un recargo personalizado decimal', () => {
    expect(calcularTotalesComerciales(10, 12.5, 1)?.valorVentaUnitarioSinIgv).toBe(11.25)
  })

  it('rechaza recargos fuera de 0-1000 y evita NaN/null', () => {
    expect(isValidRecargoComercial(1000)).toBe(true)
    expect(isValidRecargoComercial(1000.01)).toBe(false)
    expect(isValidRecargoComercial(-1)).toBe(false)
    expect(isValidRecargoComercial(Number.NaN)).toBe(false)
    expect(calcularTotalesComerciales(null, 35, 1)).toBeNull()
    expect(calcularTotalesComerciales(10, Number.NaN, 1)).toBeNull()
    expect(calcularTotalesComerciales(10, 35, null)).toBeNull()
  })
})
