import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StockFilters } from './StockFilters'

const productos = [
  {
    id: 1,
    codigo: 'COD000005',
    nombre: 'CODO 2 INOX',
    tipoArticuloId: 1,
    familiaId: 1,
    unidadMedidaId: 1,
    controlaLote: false,
    controlaSerie: false,
    activo: true,
  },
]

const almacenes = [
  {
    id: 10,
    codigo: 'C03',
    nombre: 'Almacen repuestos',
    activo: true,
  },
  {
    id: 11,
    codigo: 'C02',
    nombre: 'Insumos',
    activo: true,
  },
]

const ubicaciones = [
  {
    id: 20,
    almacenId: 10,
    almacenCodigo: 'C03',
    almacenNombre: 'Almacen repuestos',
    codigo: 'A1-2-10',
    nombre: 'Anaquel 10',
    activo: true,
  },
  {
    id: 21,
    almacenId: 11,
    almacenCodigo: 'C02',
    almacenNombre: 'Insumos',
    codigo: 'B1-1',
    nombre: 'Bandeja 1',
    activo: true,
  },
]

function renderFilters(overrides = {}) {
  const props = {
    almacenes,
    productos,
    ubicaciones,
    almacenId: null,
    productoId: null,
    soloConStock: false,
    texto: '',
    ubicacionId: null,
    onAlmacenChange: vi.fn(),
    onProductoChange: vi.fn(),
    onSoloConStockChange: vi.fn(),
    onTextoChange: vi.fn(),
    onUbicacionChange: vi.fn(),
    ...overrides,
  }

  render(<StockFilters {...props} />)
  return props
}

describe('StockFilters', () => {
  it('emite cambios de texto, producto, almacen, ubicacion y solo con stock', async () => {
    const user = userEvent.setup()
    const props = renderFilters()

    await user.type(screen.getByPlaceholderText('Producto, almacen o ubicacion'), 'c')
    await user.selectOptions(screen.getByLabelText('Producto'), '1')
    await user.selectOptions(screen.getByLabelText('Almacen'), '10')
    await user.selectOptions(screen.getByLabelText('Ubicacion'), '20')
    await user.click(screen.getByLabelText('Solo con stock'))

    expect(props.onTextoChange).toHaveBeenLastCalledWith('c')
    expect(props.onProductoChange).toHaveBeenCalledWith(1)
    expect(props.onAlmacenChange).toHaveBeenCalledWith(10)
    expect(props.onUbicacionChange).toHaveBeenCalledWith(20)
    expect(props.onSoloConStockChange).toHaveBeenCalledWith(true)
  })

  it('filtra ubicaciones por almacen seleccionado', () => {
    renderFilters({ almacenId: 10 })

    expect(screen.getByRole('option', { name: 'A1-2-10 - Anaquel 10' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'B1-1 - Bandeja 1' })).not.toBeInTheDocument()
  })
})
