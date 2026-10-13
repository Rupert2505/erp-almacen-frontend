import { describe, expect, it } from 'vitest'
import {
  buildEntradasProveedorPdfSummary,
  buildKardexPdfSummary,
  buildSalidasPdfSummary,
} from './inventoryPdfSummaries'

describe('resumenes de PDF de inventario', () => {
  it('resume el kardex y oculta la valorizacion sin permiso', () => {
    const reporte = {
      cabecera: {
        codigoProducto: 'REP-1',
        nombreProducto: 'Repuesto',
        productoId: 1,
        saldoInicialCantidad: 10,
      },
      detalles: [],
      resumen: {
        costoPromedioFinal: 4.25,
        saldoFinalCantidad: 13,
        totalEntradas: 5,
        totalSalidas: 2,
        valorSaldoFinal: 55.25,
      },
    }

    expect(buildKardexPdfSummary(reporte, false)).toEqual([
      ['Saldo inicial', '10.00'],
      ['Total entradas', '5.00'],
      ['Total salidas', '2.00'],
      ['Saldo final', '13.00'],
    ])
    expect(buildKardexPdfSummary(reporte, true)).toContainEqual([
      'Valor saldo final',
      'S/ 55.25',
    ])
  })

  it('resume salidas con conteos, cantidad y valor autorizado', () => {
    const resumen = {
      cantidadLineas: 8,
      cantidadMovimientos: 3,
      cantidadTotalSalida: 25.5,
      valorTotalSalida: 200,
    }

    expect(buildSalidasPdfSummary(resumen, true)).toEqual([
      ['Movimientos', '3'],
      ['Lineas de salida', '8'],
      ['Cantidad total', '25.50'],
      ['Valor total de salida', 'S/ 200.00'],
    ])
  })

  it('resume entradas sin exponer montos cuando no corresponde', () => {
    const resumen = {
      cantidadMovimientos: 4,
      cantidadProductos: 7,
      cantidadProveedores: 2,
      totalDocumentario: 1500,
      valorProductos: 1400,
    }

    expect(buildEntradasProveedorPdfSummary(resumen, false)).toEqual([
      ['Proveedores', '2'],
      ['Movimientos', '4'],
      ['Articulos unicos', '7'],
    ])
  })
})
