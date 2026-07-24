import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useUppercaseTextInputs } from './useUppercaseTextInputs'

function UppercaseHarness() {
  useUppercaseTextInputs()

  return (
    <form>
      <input aria-label="Nombre" />
      <input aria-label="Buscar" type="search" />
      <textarea aria-label="Observacion" />
      <input aria-label="Telefono" type="tel" />
      <input aria-label="Password" type="password" />
      <input aria-label="Usuario login" data-preserve-case="true" />
    </form>
  )
}

describe('useUppercaseTextInputs', () => {
  it('convierte campos editables de texto a mayuscula y respeta exclusiones', async () => {
    const user = userEvent.setup()
    render(<UppercaseHarness />)

    await user.type(screen.getByLabelText('Nombre'), 'repuesto central')
    await user.type(screen.getByLabelText('Buscar'), 'repuesto')
    await user.type(screen.getByLabelText('Observacion'), 'ingreso por compra')
    await user.type(screen.getByLabelText('Telefono'), 'anexo a')
    await user.type(screen.getByLabelText('Password'), 'Admin123*')
    await user.type(screen.getByLabelText('Usuario login'), 'admin')

    expect(screen.getByLabelText('Nombre')).toHaveValue('REPUESTO CENTRAL')
    expect(screen.getByLabelText('Buscar')).toHaveValue('repuesto')
    expect(screen.getByLabelText('Observacion')).toHaveValue('INGRESO POR COMPRA')
    expect(screen.getByLabelText('Telefono')).toHaveValue('anexo a')
    expect(screen.getByLabelText('Password')).toHaveValue('Admin123*')
    expect(screen.getByLabelText('Usuario login')).toHaveValue('admin')
  })
})
