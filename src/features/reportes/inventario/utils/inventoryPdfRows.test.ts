import { describe, expect, it } from 'vitest'
import type {
  KardexValorizadoDetalle,
  ProductoBajoMinimoItem,
  SalidaInventarioItem,
} from '../types/reporteInventario.types'
import { buildBajoMinimoPdfRow, buildKardexPdfRow, buildSalidaPdfRow } from './inventoryPdfRows'

describe('filas de los PDF de inventario', () => {
  it('omite usuario del kardex y mantiene los valores a dos decimales', () => {
    const row: KardexValorizadoDetalle = {
      estadoMovimiento: 'CONFIRMADO',
      movimientoId: 1,
      numeroMovimiento: 'MOV-1',
      saldoFinal: 3,
      tipoMovimiento: 'ENTRADA_COMPRA',
      usuario: 'admin',
    }

    const result = buildKardexPdfRow(row, true, () => '24/08/2026')

    expect(result).not.toHaveProperty('Usuario')
    expect(result['Saldo final']).toBe('3.00')
  })

  it('en salidas omite estado y usuario, y usa codigo y abreviatura', () => {
    const row: SalidaInventarioItem = {
      almacenOrigen: 'ALMACEN GENERAL',
      almacenOrigenCodigo: 'ALM1',
      estado: 'CONFIRMADO',
      movimientoId: 1,
      numeroMovimiento: 'MOV-1',
      tipoMovimiento: 'SALIDA_VENTA',
      unidadMedida: 'UNIDAD',
      unidadMedidaAbreviatura: 'UND',
      usuario: 'admin',
    }

    const result = buildSalidaPdfRow(row, false, () => '24/08/2026')

    expect(result).not.toHaveProperty('Estado')
    expect(result).not.toHaveProperty('Usuario')
    expect(result).toMatchObject({ Origen: 'ALM1', 'U.M.': 'UND' })
  })

  it('agrega solo los campos comerciales esenciales a las salidas', () => {
    const row: SalidaInventarioItem = {
      movimientoId: 1,
      numeroMovimiento: 'MOV-1',
      tipoMovimiento: 'SALIDA_VENTA',
    }

    const result = buildSalidaPdfRow(row, true, () => '24/08/2026', {
      costoBaseComercialUnitarioSinIgv: 12.71,
      precioVentaTotalConIgv: 40.5,
      recargoAplicadoPct: 35,
    })

    expect(result).toMatchObject({
      'Base comercial s/IGV': '12.71',
      'Precio total c/IGV': '40.50',
      Recargo: '35.00%',
    })
    expect(result).not.toHaveProperty('Venta unitaria s/IGV')
    expect(result).not.toHaveProperty('IGV')
  })

  it('usa el codigo de almacen en bajo minimo', () => {
    const row: ProductoBajoMinimoItem = {
      almacenCodigo: 'ALM1',
      almacenNombre: 'ALMACEN GENERAL',
      productoCodigo: 'REP-1',
      productoId: 1,
      productoNombre: 'Repuesto',
    }

    expect(buildBajoMinimoPdfRow(row).Almacen).toBe('ALM1')
  })
})
