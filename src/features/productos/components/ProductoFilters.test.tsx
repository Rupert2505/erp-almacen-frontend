import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { EstadoProductoFilter } from './ProductoFilters'
import { ProductoFilters } from './ProductoFilters'

function ControlledProductoFilters({ onTextoChange = vi.fn() }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoProductoFilter>('todos')

  return (
    <ProductoFilters
      estado={estado}
      onEstadoChange={setEstado}
      onTextoChange={(value) => {
        setTexto(value)
        onTextoChange(value)
      }}
      texto={texto}
    />
  )
}

describe('ProductoFilters', () => {
  it('emite cambios de busqueda mientras se escribe', async () => {
    const user = userEvent.setup()
    const onTextoChange = vi.fn()

    render(<ControlledProductoFilters onTextoChange={onTextoChange} />)

    await user.type(screen.getByPlaceholderText('Codigo, nombre o descripcion'), 'REP-92')

    expect(onTextoChange).toHaveBeenLastCalledWith('REP-92')
    expect(screen.getByPlaceholderText('Codigo, nombre o descripcion')).toHaveValue('REP-92')
  })
})
