import { describe, expect, it } from 'vitest'
import { calcularCostoEntrada, sumarCostosEntrada } from './costosEntrada'

describe('calcularCostoEntrada', () => {
  it('mantiene el costo digitado como valor unitario sin IGV con default recuperable', () => {
    const calculo = calcularCostoEntrada({
      cantidad: 1,
      igvRecuperable: true,
      tasaIgv: 18,
      valorUnitarioSinIgv: 100,
    })

    expect(calculo.montoIgvUnitario).toBe(18)
    expect(calculo.precioUnitarioConIgv).toBe(118)
    expect(calculo.costoUnitarioInventariable).toBe(100)
    expect(calculo.costoUnitarioInventariable).not.toBeCloseTo(84.75)
  })

  it('calcula compra con IGV recuperable', () => {
    const calculo = calcularCostoEntrada({
      cantidad: 10,
      igvRecuperable: true,
      tasaIgv: 18,
      valorUnitarioSinIgv: 100,
    })

    expect(calculo.montoIgvUnitario).toBe(18)
    expect(calculo.precioUnitarioConIgv).toBe(118)
    expect(calculo.montoIgvTotal).toBe(180)
    expect(calculo.costoUnitarioInventariable).toBe(100)
    expect(calculo.totalInventariable).toBe(1000)
    expect(calculo.totalConIgv).toBe(1180)
  })

  it('calcula compra con IGV no recuperable sin modificar el valor sin IGV', () => {
    const calculo = calcularCostoEntrada({
      cantidad: 10,
      igvRecuperable: false,
      tasaIgv: 18,
      valorUnitarioSinIgv: 100,
    })

    expect(calculo.precioUnitarioConIgv).toBe(118)
    expect(calculo.costoUnitarioInventariable).toBe(118)
    expect(calculo.totalInventariable).toBe(1180)
  })

  it('respeta IGV 0 para recuperable y no recuperable', () => {
    expect(
      calcularCostoEntrada({
        cantidad: 1,
        igvRecuperable: true,
        tasaIgv: 0,
        valorUnitarioSinIgv: 100,
      }),
    ).toMatchObject({
      costoUnitarioInventariable: 100,
      montoIgvUnitario: 0,
      precioUnitarioConIgv: 100,
    })

    expect(
      calcularCostoEntrada({
        cantidad: 1,
        igvRecuperable: false,
        tasaIgv: 0,
        valorUnitarioSinIgv: 100,
      }),
    ).toMatchObject({
      costoUnitarioInventariable: 100,
      montoIgvUnitario: 0,
      precioUnitarioConIgv: 100,
    })
  })

  it('suma varias lineas con recuperabilidad por detalle', () => {
    const totals = sumarCostosEntrada([
      {
        cantidad: 2,
        igvRecuperable: true,
        tasaIgv: 18,
        valorUnitarioSinIgv: 100,
      },
      {
        cantidad: 1,
        igvRecuperable: false,
        tasaIgv: 18,
        valorUnitarioSinIgv: 200,
      },
    ])

    expect(totals.subtotalSinIgv).toBe(400)
    expect(totals.igvTotal).toBe(72)
    expect(totals.totalDocumento).toBe(472)
    expect(totals.valorInventariable).toBe(436)
  })

  it('evita NaN o Infinity en la previsualizacion', () => {
    const calculo = calcularCostoEntrada({
      cantidad: Number.NaN,
      tasaIgv: Number.POSITIVE_INFINITY,
      valorUnitarioSinIgv: undefined,
    })

    expect(Object.values(calculo).every(Number.isFinite)).toBe(true)
  })

  it('mantiene precision razonable con decimales', () => {
    const calculo = calcularCostoEntrada({
      cantidad: 7,
      igvRecuperable: true,
      tasaIgv: 18,
      valorUnitarioSinIgv: 13.37,
    })

    expect(calculo.montoIgvUnitario).toBeCloseTo(2.4066)
    expect(calculo.totalConIgv).toBeCloseTo(110.4362)
  })
})
