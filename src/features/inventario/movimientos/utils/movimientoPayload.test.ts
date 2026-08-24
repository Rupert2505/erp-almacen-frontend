import { describe, expect, it } from 'vitest'
import { buildMovimientoDetallePayload } from './movimientoPayload'

describe('buildMovimientoDetallePayload', () => {
  it('envia valorUnitarioSinIgv, tasaIgv e igvRecuperable para compra sin costoUnitario', () => {
    const payload = buildMovimientoDetallePayload(
      'ENTRADA_COMPRA',
      {
        cantidad: 3,
        costoUnitario: 118,
        igvRecuperable: true,
        observacion: ' Compra con IGV recuperable ',
        productoId: 10,
        tasaIgv: 18,
        ubicacionDestinoId: 5,
        valorUnitarioSinIgv: 100,
      },
      { usaDestino: true, usaOrigen: false },
    )

    expect(payload).toEqual({
      cantidad: 3,
      igvRecuperable: true,
      observacion: 'Compra con IGV recuperable',
      productoId: 10,
      tasaIgv: 18,
      ubicacionDestinoId: 5,
      ubicacionOrigenId: null,
      valorUnitarioSinIgv: 100,
    })
    expect(payload).not.toHaveProperty('costoUnitario')
    expect(payload).not.toHaveProperty('montoIgvUnitario')
    expect(payload).not.toHaveProperty('montoIgvTotal')
    expect(payload).not.toHaveProperty('precioUnitarioConIgv')
    expect(payload).not.toHaveProperty('costoUnitarioInventariable')
    expect(payload).not.toHaveProperty('totalInventariable')
    expect(payload).not.toHaveProperty('totalConIgv')
  })

  it('envia costoUnitario y recargo comercial para SALIDA_VENTA', () => {
    expect(
      buildMovimientoDetallePayload(
        'SALIDA_VENTA',
        {
          cantidad: 1,
          costoUnitario: 99.123456,
          productoId: 20,
          recargoComercialPct: 35,
          tasaIgv: 18,
          valorUnitarioSinIgv: 100,
        },
        { usaDestino: false, usaOrigen: true },
      ),
    ).toEqual({
      cantidad: 1,
      costoUnitario: 99.123456,
      observacion: null,
      productoId: 20,
      recargoComercialPct: 35,
      ubicacionDestinoId: null,
      ubicacionOrigenId: undefined,
    })
  })

  it('no envia recargo comercial para una salida no comercial', () => {
    const payload = buildMovimientoDetallePayload(
      'SALIDA_CONSUMO',
      {
        cantidad: 2,
        costoUnitario: 10,
        productoId: 20,
        recargoComercialPct: 50,
      },
      { usaDestino: false, usaOrigen: true },
    )

    expect(payload).not.toHaveProperty('recargoComercialPct')
  })
})
