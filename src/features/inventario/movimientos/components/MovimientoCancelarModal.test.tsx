import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Movimiento } from '../types/movimiento.types'
import { MovimientoCancelarModal } from './MovimientoCancelarModal'

const movimiento: Movimiento = {
  id: 1,
  numero: 'MOV-001',
  tipoMovimiento: 'ENTRADA_COMPRA',
  estado: 'BORRADOR',
}

describe('MovimientoCancelarModal', () => {
  it('abre modal, exige motivo y envia cancelacion', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <MovimientoCancelarModal
        isOpen
        isSaving={false}
        movimiento={movimiento}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByText('Cancelar movimiento en borrador')).toBeInTheDocument()
    expect(screen.getByText(/No afectara stock ni kardex/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar borrador' }))
    expect(await screen.findByText('Ingrese el motivo de cancelacion')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Motivo de cancelacion'), 'Error de digitacion')
    await user.click(screen.getByRole('button', { name: 'Cancelar borrador' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { motivoCancelacion: 'Error de digitacion' },
        expect.anything(),
      )
    })
  })

  it('muestra error backend sin cerrar modal', () => {
    render(
      <MovimientoCancelarModal
        errorMessage="Solo se puede cancelar un borrador"
        isOpen
        isSaving={false}
        movimiento={movimiento}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Solo se puede cancelar un borrador')).toBeInTheDocument()
    expect(screen.getByText('Cancelar movimiento en borrador')).toBeInTheDocument()
  })
})
