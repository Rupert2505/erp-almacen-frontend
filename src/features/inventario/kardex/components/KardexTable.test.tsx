import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { KardexItem } from '../types/kardex.types'
import { KardexTable } from './KardexTable'

const baseRow: KardexItem = {
  id: 1,
  movimientoId: 2,
  productoId: 3,
  productoCodigo: 'REP-1004',
  productoNombre: 'VALVULA',
  almacenId: 10,
  almacenCodigo: 'ALM1',
  almacenNombre: 'ALMACEN GENERAL',
  ubicacionId: 20,
  ubicacionCodigo: 'A1-1',
  ubicacionNombre: 'ANAQUEL PRINCIPAL',
  fechaMovimiento: '2026-08-21T16:55:00',
  tipoMovimiento: 'ENTRADA_COMPRA',
  numeroMovimiento: 'MOV-000001',
  entrada: 100,
  salida: 0,
  saldoAnterior: 0,
  saldoFinal: 100,
  costoUnitario: 10,
  costoPromedio: 10,
}

describe('KardexTable', () => {
  it('muestra solo los nombres de almacen y ubicacion', () => {
    render(<KardexTable isLoading={false} rows={[baseRow]} />)

    expect(screen.getByText('ALMACEN GENERAL')).toBeInTheDocument()
    expect(screen.getByText('ANAQUEL PRINCIPAL')).toBeInTheDocument()
    expect(screen.queryByText('ALM1 - ALMACEN GENERAL')).not.toBeInTheDocument()
    expect(screen.queryByText('A1-1 - ANAQUEL PRINCIPAL')).not.toBeInTheDocument()
  })

  it('usa el codigo como respaldo cuando no existe el nombre', () => {
    render(
      <KardexTable
        isLoading={false}
        rows={[
          {
            ...baseRow,
            almacenNombre: '',
            ubicacionNombre: null,
          },
        ]}
      />,
    )

    expect(screen.getByText('ALM1')).toBeInTheDocument()
    expect(screen.getByText('A1-1')).toBeInTheDocument()
  })
})
