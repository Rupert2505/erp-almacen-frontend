import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KardexFilters } from './KardexFilters'

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
]

describe('KardexFilters', () => {
  it('muestra almacen y codigo de ubicacion sin cambiar el identificador seleccionado', async () => {
    const onUbicacionChange = vi.fn()
    const noop = vi.fn()

    render(
      <KardexFilters
        almacenId={null}
        almacenes={[]}
        fechaDesde=""
        fechaHasta=""
        onAlmacenChange={noop}
        onFechaDesdeChange={noop}
        onFechaHastaChange={noop}
        onProductoChange={noop}
        onTextoChange={noop}
        onTipoMovimientoChange={noop}
        onUbicacionChange={onUbicacionChange}
        productoId={null}
        productos={[]}
        texto=""
        tipoMovimiento=""
        ubicacionId={null}
        ubicaciones={ubicaciones}
      />,
    )

    const user = userEvent.setup()
    const option = screen.getByRole('option', { name: 'C03 - A1-2-10' })

    expect(option).toHaveValue('20')
    expect(screen.queryByText('Anaquel 10')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Ubicacion'), '20')
    expect(onUbicacionChange).toHaveBeenCalledWith(20)
  })
})
