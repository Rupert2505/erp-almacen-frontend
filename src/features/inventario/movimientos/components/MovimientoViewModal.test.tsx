import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Movimiento } from '../types/movimiento.types'
import { MovimientoViewModal } from './MovimientoViewModal'

describe('MovimientoViewModal', () => {
  it('muestra datos de cancelacion para movimiento CANCELADO', () => {
    const movimiento: Movimiento = {
      id: 1,
      numero: 'MOV-001',
      tipoMovimiento: 'ENTRADA_COMPRA',
      estado: 'CANCELADO',
      motivoCancelacion: 'Error de digitacion',
      canceladoPor: 'admin',
      canceladoEn: '2026-06-12T10:00:00',
      detalles: [],
    }

    render(
      <MovimientoViewModal
        isLoading={false}
        isOpen
        movimiento={movimiento}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByText('Motivo cancelacion')).toBeInTheDocument()
    expect(screen.getByText('Error de digitacion')).toBeInTheDocument()
    expect(screen.getByText('Cancelado por')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('Cancelado en')).toBeInTheDocument()
  })
})
