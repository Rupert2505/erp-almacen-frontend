import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Movimiento } from '../types/movimiento.types'
import { MovimientoTable } from './MovimientoTable'

const baseMovimiento: Movimiento = {
  id: 1,
  numero: 'MOV-001',
  tipoMovimiento: 'ENTRADA_COMPRA',
  estado: 'BORRADOR',
  fechaMovimiento: '2026-06-12T10:00:00',
}

function renderTable(movimientos: Movimiento[], canAnular = true) {
  const props = {
    isLoading: false,
    movimientos,
    onAnular: vi.fn(),
    onCancelar: vi.fn(),
    onConfirmar: vi.fn(),
    onView: vi.fn(),
    puedeAnularMovimiento: vi.fn(() => canAnular),
    puedeCancelarMovimiento: vi.fn(() => true),
    puedeConfirmarMovimiento: vi.fn(() => true),
  }

  render(<MovimientoTable {...props} />)
  return props
}

describe('MovimientoTable', () => {
  it('BORRADOR muestra Cancelar y Confirmar', async () => {
    const user = userEvent.setup()
    const props = renderTable([baseMovimiento])

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
    expect(props.onCancelar).toHaveBeenCalledWith(baseMovimiento)
  })

  it('CONFIRMADO muestra Anular y no muestra Cancelar', () => {
    renderTable([{ ...baseMovimiento, estado: 'CONFIRMADO' }])

    expect(screen.getByRole('button', { name: 'Anular' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('CONFIRMADO no muestra Anular sin permiso', () => {
    renderTable([{ ...baseMovimiento, estado: 'CONFIRMADO' }], false)

    expect(screen.queryByRole('button', { name: 'Anular' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument()
  })

  it('ANULADO y CANCELADO solo permiten ver detalle', () => {
    renderTable([
      { ...baseMovimiento, id: 2, numero: 'MOV-002', estado: 'ANULADO' },
      { ...baseMovimiento, id: 3, numero: 'MOV-003', estado: 'CANCELADO' },
    ])

    expect(screen.getByText('Cancelado')).toHaveClass('bg-amber-100', 'text-amber-700')
    expect(screen.getAllByRole('button', { name: 'Ver' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Anular' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument()
  })
})
