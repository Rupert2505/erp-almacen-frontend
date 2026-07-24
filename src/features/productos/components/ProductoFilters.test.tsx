import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductoFilters } from './ProductoFilters'

describe('ProductoFilters', () => {
  it('emite cambios de busqueda mientras se escribe', async () => {
    const user = userEvent.setup()
    const onTextoChange = vi.fn()

    render(
      <ProductoFilters
        estado="todos"
        onEstadoChange={vi.fn()}
        onTextoChange={onTextoChange}
        texto=""
      />,
    )

    await user.type(screen.getByPlaceholderText('Codigo, nombre o descripcion'), 'rep')

    expect(onTextoChange).toHaveBeenCalledTimes(3)
    expect(onTextoChange).toHaveBeenNthCalledWith(1, 'r')
    expect(onTextoChange).toHaveBeenNthCalledWith(2, 'e')
    expect(onTextoChange).toHaveBeenNthCalledWith(3, 'p')
  })
})
