import { describe, expect, it } from 'vitest'
import type { StockValorizadoResumen } from '../types/reporteInventario.types'
import { buildStockValorizadoPdfSummary } from './stockValorizadoPdfSummary'

const resumen: StockValorizadoResumen = {
  cantidadProductos: 18,
  cantidadUnidades: 130,
  productosBajoMinimo: 2,
  productosSinStockActivos: 4,
  valorTotalInventario: 1473.3333,
}

describe('buildStockValorizadoPdfSummary', () => {
  it('muestra costo, articulos unicos y productos activos sin stock', () => {
    expect(buildStockValorizadoPdfSummary(resumen, true)).toEqual([
      ['Costo total de inventario', 'S/ 1,473.33'],
      ['Articulos unicos', '18'],
      ['Sin stock (activos)', '4'],
    ])
  })

  it('no expone el costo cuando el usuario no tiene permiso', () => {
    expect(buildStockValorizadoPdfSummary(resumen, false)).toEqual([
      ['Articulos unicos', '18'],
      ['Sin stock (activos)', '4'],
    ])
  })
})
