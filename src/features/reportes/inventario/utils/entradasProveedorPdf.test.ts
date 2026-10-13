import { describe, expect, it } from 'vitest'
import type { EntradaProveedorItem } from '../types/reporteInventario.types'
import { buildEntradasProveedorPdfTable } from './entradasProveedorPdf'

function row(
  overrides: Partial<EntradaProveedorItem> &
    Pick<EntradaProveedorItem, 'movimientoId' | 'numeroMovimiento' | 'proveedorId'>,
): EntradaProveedorItem {
  return { ...overrides }
}

describe('buildEntradasProveedorPdfTable', () => {
  it('agrupa por proveedor y agrega un subtotal por grupo', () => {
    const result = buildEntradasProveedorPdfTable(
      [
        row({
          cantidad: 2,
          movimientoId: 1,
          numeroMovimiento: 'MOV-1',
          proveedorId: 2,
          proveedorRazonSocial: 'Beta',
        }),
        row({
          cantidad: 3,
          movimientoId: 2,
          numeroMovimiento: 'MOV-2',
          proveedorId: 1,
          proveedorRazonSocial: 'Alfa',
        }),
      ],
      false,
      (value) => value ?? '',
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
    expect(result.rows[0].Fecha).toBe('PROVEEDOR: Alfa')
    expect(result.rows[2].Cantidad).toBe('3.00')
    expect(result.rows[3]).toMatchObject({ Fecha: '', Producto: '' })
  })

  it('suma los gastos una sola vez por movimiento con varias lineas', () => {
    const result = buildEntradasProveedorPdfTable(
      [
        row({
          cantidad: 2,
          flete: 10,
          movimientoId: 1,
          numeroMovimiento: 'MOV-1',
          otrosGastos: 3,
          proveedorId: 1,
          proveedorRazonSocial: 'Alfa',
          valorLinea: 20,
        }),
        row({
          cantidad: 1,
          flete: 10,
          movimientoId: 1,
          numeroMovimiento: 'MOV-1',
          otrosGastos: 3,
          proveedorId: 1,
          proveedorRazonSocial: 'Alfa',
          valorLinea: 15,
        }),
      ],
      true,
      (value) => value ?? '',
    )
    const subtotal = result.rows.at(-1)

    expect(subtotal).toMatchObject({
      Cantidad: '3.00',
      Flete: '10.00',
      Otros: '3.00',
      'Valor linea': '35.00',
    })
  })

  it('usa codigo de almacen y abreviatura de unidad en el detalle', () => {
    const result = buildEntradasProveedorPdfTable(
      [
        row({
          almacenDestino: 'ALMACEN GENERAL',
          almacenDestinoCodigo: 'ALM1',
          movimientoId: 1,
          numeroMovimiento: 'MOV-1',
          proveedorId: 1,
          unidadMedida: 'UNIDAD',
          unidadMedidaAbreviatura: 'UND',
        }),
      ],
      false,
      (value) => value ?? '',
    )

    expect(result.rows[1]).toMatchObject({ Almacen: 'ALM1', 'U.M.': 'UND' })
  })
})
