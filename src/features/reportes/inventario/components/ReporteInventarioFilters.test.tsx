import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ReporteInventarioFilters } from './ReporteInventarioFilters'

type FiltersProps = ComponentProps<typeof ReporteInventarioFilters>

function renderFilters(overrides: Partial<FiltersProps> = {}) {
  const noop = vi.fn()
  const props: FiltersProps = {
    almacenId: null,
    almacenes: [],
    estado: '',
    familiaId: null,
    familias: [],
    fechaDesde: '',
    fechaHasta: '',
    marcaId: null,
    marcas: [],
    onAlmacenChange: noop,
    onClear: noop,
    onConsult: noop,
    onEstadoChange: noop,
    onFamiliaChange: noop,
    onFechaDesdeChange: noop,
    onFechaHastaChange: noop,
    onMarcaChange: noop,
    onOrdenTrabajoChange: noop,
    onProductoChange: noop,
    onProveedorChange: noop,
    onSoloBajoMinimoChange: noop,
    onSoloConStockChange: noop,
    onSubfamiliaChange: noop,
    onTextoChange: noop,
    onTipoArticuloChange: noop,
    onTipoComprobanteChange: noop,
    onTipoMovimientoChange: noop,
    onUbicacionChange: noop,
    ordenTrabajo: '',
    productoId: null,
    productos: [],
    proveedorId: null,
    proveedores: [],
    reporte: 'salidas-por-os',
    soloBajoMinimo: false,
    soloConStock: false,
    subfamiliaId: null,
    subfamilias: [],
    texto: '',
    tipoArticuloId: null,
    tipoComprobante: '',
    tipoMovimiento: '',
    tiposArticulo: [],
    ubicacionId: null,
    ubicaciones: [],
    ...overrides,
  }

  render(<ReporteInventarioFilters {...props} />)
  return props
}

describe('ReporteInventarioFilters', () => {
  it('muestra solo los filtros aceptados por el endpoint y comunica el estado por defecto', async () => {
    const onOrdenTrabajoChange = vi.fn()
    renderFilters({ onOrdenTrabajoChange })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Orden de Servicio (OS)'), 'OS-001')

    expect(onOrdenTrabajoChange).toHaveBeenCalled()
    expect(screen.getByLabelText('Fecha desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha hasta')).toBeInTheDocument()
    expect(screen.getByLabelText('Producto')).toBeInTheDocument()
    expect(screen.getByLabelText('Estado')).toHaveDisplayValue('Confirmado (por defecto)')
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Almacen')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Tipo')).not.toBeInTheDocument()
  })

  it('muestra almacen y codigo de ubicacion en stock valorizado', async () => {
    const onUbicacionChange = vi.fn()
    renderFilters({
      onUbicacionChange,
      reporte: 'stock-valorizado',
      ubicaciones: [
        {
          id: 20,
          almacenId: 10,
          almacenCodigo: 'C03',
          almacenNombre: 'Almacen repuestos',
          codigo: 'A1-2-10',
          nombre: 'Anaquel 10',
          activo: true,
        },
      ],
    })

    const user = userEvent.setup()
    expect(
      screen.getByRole('option', { name: 'C03 - A1-2-10' }),
    ).toHaveValue('20')

    await user.selectOptions(screen.getByLabelText('Ubicacion'), '20')
    expect(onUbicacionChange).toHaveBeenCalledWith(20)
  })
})
