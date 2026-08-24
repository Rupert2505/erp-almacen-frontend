import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
  StockValorizadoItem,
  StockValorizadoResumen,
} from '../types/reporteInventario.types'
import { StockValorizadoTable } from './StockValorizadoTable'

const rows: StockValorizadoItem[] = [
  {
    productoId: 1,
    codigoProducto: 'REP-1004',
    nombreProducto: 'Valvula relay',
    almacenId: 1,
    almacen: 'ALMACEN GENERAL',
    ubicacionId: 1,
    ubicacion: 'A1 - 1',
    cantidadActual: 130,
    stockMinimo: 10,
    costoPromedio: 11.3333,
    valorTotal: 1473.3333,
    estadoStock: 'CON_STOCK',
  },
]

const resumen: StockValorizadoResumen = {
  cantidadProductos: 1,
  cantidadUnidades: 130,
  valorTotalInventario: 1473.3333,
  productosBajoMinimo: 0,
}

describe('StockValorizadoTable', () => {
  it('muestra el resumen del backend y formatea los conteos como enteros', () => {
    render(
      <StockValorizadoTable
        isLoading={false}
        resumen={resumen}
        rows={rows}
        showCosts
        totalLines={1}
      />,
    )

    expect(screen.getByText('Productos').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Productos').nextElementSibling).not.toHaveTextContent('1.00')
    expect(screen.getByText('Lineas').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Cantidad total').nextElementSibling).toHaveTextContent('130.00')
    expect(screen.getAllByText('Valor total')[0].nextElementSibling).toHaveTextContent(
      'S/ 1,473.33',
    )
    expect(screen.queryByText(/11\.3333/)).not.toBeInTheDocument()
    expect(screen.getByText('11.33')).toBeInTheDocument()
  })
})
