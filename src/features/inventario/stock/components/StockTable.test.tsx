import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StockTable } from './StockTable'

const stockRows = [
  {
    id: 1,
    productoId: 10,
    productoCodigo: 'COD000005',
    productoNombre: 'CODO 2 INOX',
    almacenId: 20,
    almacenCodigo: 'C03',
    almacenNombre: 'Almacen repuestos',
    ubicacionId: 30,
    ubicacionCodigo: 'A1-2-10',
    ubicacionNombre: 'Anaquel 10',
    cantidadActual: 25,
    costoPromedio: 1658.72,
    fechaUltimoMovimiento: '2026-06-12T10:30:00',
  },
  {
    id: 2,
    productoId: 11,
    productoCodigo: 'SIN-STOCK',
    productoNombre: 'Producto sin stock',
    almacenId: 20,
    almacenCodigo: 'C03',
    almacenNombre: 'Almacen repuestos',
    cantidadActual: 0,
    costoPromedio: null,
  },
]

describe('StockTable', () => {
  it('muestra producto, almacen, ubicacion, cantidad, costo promedio y estado', () => {
    render(<StockTable isLoading={false} rows={stockRows} />)

    expect(screen.getByText('COD000005')).toBeInTheDocument()
    expect(screen.getByText('CODO 2 INOX')).toBeInTheDocument()
    expect(screen.getAllByText('C03')).toHaveLength(2)
    expect(screen.getByText('A1-2-10')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText(/S\/\s*1,658\.72/)).toBeInTheDocument()
    expect(screen.getByText('Con stock')).toBeInTheDocument()
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
  })

  it('muestra loading y empty state', () => {
    const { rerender } = render(<StockTable isLoading rows={[]} />)
    expect(screen.getByText('Cargando stock...')).toBeInTheDocument()

    rerender(<StockTable isLoading={false} rows={[]} />)
    expect(screen.getByText('No se encontraron registros de stock.')).toBeInTheDocument()
  })
})
