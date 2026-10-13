import { describe, expect, it } from 'vitest'
import type { SalidaValorizadaOsResponse } from '../types/reporteInventario.types'
import { buildSalidasPorOsPdfTable } from './salidasPorOsPdf'

function row(overrides: Partial<SalidaValorizadaOsResponse>): SalidaValorizadaOsResponse {
  return {
    cantidad: 1,
    codigoProducto: 'P-1',
    descripcionProducto: 'Producto',
    estado: 'CONFIRMADO',
    movimientoId: 1,
    numeroMovimiento: 'MOV-1',
    productoId: 1,
    unidadMedida: 'UNIDAD',
    ...overrides,
  }
}

describe('buildSalidasPorOsPdfTable', () => {
  it('agrupa por OS y deja cada producto una sola vez', () => {
    const result = buildSalidasPorOsPdfTable(
      [
        row({ ordenTrabajo: 'OS-2', productoId: 2 }),
        row({ movimientoId: 2, ordenTrabajo: 'OS-1', productoId: 1 }),
        row({ movimientoId: 3, ordenTrabajo: 'OS-1', productoId: 1 }),
      ],
      true,
    )

    expect(result.recordCount).toBe(2)
    expect(result.rowKinds).toEqual([
      'group',
      'detail',
      'subtotal',
      'spacer',
      'group',
      'detail',
      'subtotal',
    ])
    expect(result.rows[0].Producto).toBe('ORDEN DE SERVICIO: OS-1')
  })

  it('pondera los valores unitarios y calcula el recargo efectivo', () => {
    const result = buildSalidasPorOsPdfTable(
      [
        row({
          cantidad: 2,
          costoBaseComercialUnitarioSinIgv: 10,
          costoInventarioTotal: 20,
          costoInventarioUnitario: 10,
          ordenTrabajo: 'OS-1',
          precioVentaTotalConIgv: 28.32,
          precioVentaUnitarioConIgv: 14.16,
          recargoAplicadoPct: 20,
          valorVentaTotalSinIgv: 24,
        }),
        row({
          cantidad: 1,
          costoBaseComercialUnitarioSinIgv: 20,
          costoInventarioTotal: 20,
          costoInventarioUnitario: 20,
          movimientoId: 2,
          ordenTrabajo: 'OS-1',
          precioVentaTotalConIgv: 35.4,
          precioVentaUnitarioConIgv: 35.4,
          recargoAplicadoPct: 50,
          valorVentaTotalSinIgv: 30,
        }),
      ],
      true,
    )

    expect(result.rows[1]).toEqual({
      Producto: 'P-1 - Producto',
      Cantidad: '3.00',
      'Costo inventario': 'S/ 13.33',
      'Precio base s/IGV': 'S/ 13.33',
      Recargo: '35.00%',
      'Precio final c/IGV': 'S/ 21.24',
    })
    expect(result.rows[2]).toEqual({
      Producto: 'SUBTOTAL OS-1',
      Cantidad: '3.00',
      'Costo inventario': 'S/ 40.00',
      'Precio base s/IGV': 'S/ 40.00',
      Recargo: '35.00%',
      'Precio final c/IGV': 'S/ 63.72',
    })
  })

  it('no expone importes sin permiso de costos', () => {
    const result = buildSalidasPorOsPdfTable([row({ ordenTrabajo: 'OS-1' })], false)

    expect(result.rows[1]).toEqual({ Producto: 'P-1 - Producto', Cantidad: '1.00' })
    expect(result.rows[2]).toEqual({ Producto: 'SUBTOTAL OS-1', Cantidad: '1.00' })
  })
})
