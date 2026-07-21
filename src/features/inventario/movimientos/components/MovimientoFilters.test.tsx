import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MovimientoFilters } from './MovimientoFilters'

describe('MovimientoFilters', () => {
  it('incluye estado CANCELADO en el filtro', () => {
    render(
      <MovimientoFilters
        estado=""
        onEstadoChange={vi.fn()}
        onTextoChange={vi.fn()}
        onTipoMovimientoChange={vi.fn()}
        texto=""
        tipoMovimiento=""
      />,
    )

    expect(screen.getByRole('option', { name: 'Cancelado' })).toHaveValue('CANCELADO')
  })
})
