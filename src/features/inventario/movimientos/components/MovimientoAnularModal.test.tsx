import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Movimiento } from '../types/movimiento.types'
import { MovimientoAnularModal } from './MovimientoAnularModal'

const movimiento: Movimiento = {
  id: 1,
  numero: 'MOV-001',
  tipoMovimiento: 'ENTRADA_COMPRA',
  estado: 'CONFIRMADO',
  almacenDestinoNombre: 'ALMACEN CENTRAL',
}

function renderModal(options?: {
  errorMessage?: string | null
  isSaving?: boolean
  onSubmit?: (values: { motivo: string }) => Promise<void>
}) {
  const onSubmit = options?.onSubmit ?? vi.fn(async () => undefined)
  const onClose = vi.fn()

  render(
    <MovimientoAnularModal
      errorMessage={options?.errorMessage}
      isOpen
      isSaving={options?.isSaving ?? false}
      movimiento={movimiento}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  )

  return { onClose, onSubmit }
}

describe('MovimientoAnularModal', () => {
  it('muestra datos, advertencia funcional y exige motivo', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal()

    expect(screen.getAllByText('MOV-001')).toHaveLength(2)
    expect(screen.getByText('Entrada Compra')).toBeInTheDocument()
    expect(screen.getByText('ALMACEN CENTRAL')).toBeInTheDocument()
    expect(screen.getByText(/Si existen movimientos posteriores/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmar anulacion' }))

    expect(await screen.findByText('Ingrese el motivo de anulacion')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('no permite enviar solamente espacios y envia el motivo recortado', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal()
    const motivo = screen.getByLabelText('Motivo')

    await user.type(motivo, '   ')
    await user.click(screen.getByRole('button', { name: 'Confirmar anulacion' }))

    expect(await screen.findByText('Ingrese el motivo de anulacion')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await user.clear(motivo)
    await user.type(motivo, '  ERROR DE INGRESO  ')
    await user.click(screen.getByRole('button', { name: 'Confirmar anulacion' }))

    expect(screen.getByRole('dialog', { name: 'Confirmar anulación' })).toBeInTheDocument()
    expect(screen.getByText(/seguro de anular el movimiento/i)).toBeInTheDocument()
    expect(screen.getByText('ERROR DE INGRESO')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Sí, anular movimiento' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ motivo: 'ERROR DE INGRESO' })
    })
  })

  it('permite volver desde la confirmacion sin perder el motivo', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal()

    await user.type(screen.getByLabelText('Motivo'), 'Error de cantidad')
    await user.click(screen.getByRole('button', { name: 'Confirmar anulacion' }))
    await user.click(screen.getByRole('button', { name: 'No, volver' }))

    expect(screen.queryByRole('dialog', { name: 'Confirmar anulación' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toHaveValue('Error de cantidad')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('deshabilita acciones durante una solicitud y muestra error backend conservando motivo', () => {
    renderModal({
      errorMessage:
        'No se puede anular la entrada porque existen movimientos posteriores que utilizaron el stock o el costo promedio generado. Registre una devolucion al proveedor o un ajuste de inventario.',
      isSaving: true,
    })

    expect(screen.getByText(/No se puede anular la entrada/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anulando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByLabelText('Motivo')).toBeDisabled()
  })

  it('evita doble envio desde el mismo formulario', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise<void>(() => undefined))
    renderModal({ onSubmit })

    await user.type(screen.getByLabelText('Motivo'), 'ERROR DE INGRESO')
    await user.click(screen.getByRole('button', { name: 'Confirmar anulacion' }))
    await user.dblClick(screen.getByRole('button', { name: 'Sí, anular movimiento' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })
})
