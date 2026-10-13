import { describe, expect, it } from 'vitest'
import type { ReporteMovimientoItem } from '../types/reporteInventario.types'
import { buildMovimientoPdfRow } from './movimientoPdfRow'

const movimiento: ReporteMovimientoItem = {
  almacenDestinoNombre: 'Almacen destino',
  almacenOrigenNombre: 'Almacen origen',
  cantidad: 2,
  costoUnitario: 10,
  documentoReferencia: 'FAC-F001-000123',
  estado: 'CONFIRMADO',
  fechaMovimiento: '2026-08-24T10:30:00',
  movimientoId: 1,
  numero: 'MOV-000001',
  productoCodigo: 'REP-1004',
  productoNombre: 'Producto con descripcion extensa',
  tipoMovimiento: 'ENTRADA_COMPRA',
  totalLinea: 20,
}

describe('buildMovimientoPdfRow', () => {
  it('omite estado y conserva documento y datos principales', () => {
    const row = buildMovimientoPdfRow(movimiento, false)

    expect(row).not.toHaveProperty('Estado')
    expect(row).toMatchObject({
      Documento: 'FAC-F001-000123',
      Movimiento: 'MOV-000001',
      Producto: 'REP-1004 - Producto con descripcion extensa',
    })
    expect(row).not.toHaveProperty('Costo unitario')
  })

  it('mantiene las columnas de costos cuando el usuario tiene permiso', () => {
    expect(buildMovimientoPdfRow(movimiento, true)).toMatchObject({
      'Costo unitario': '10.00',
      'Total linea': '20.00',
    })
  })
})
