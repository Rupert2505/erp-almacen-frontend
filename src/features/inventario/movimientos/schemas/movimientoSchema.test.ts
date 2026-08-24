import { describe, expect, it } from 'vitest'
import { movimientoSchema } from './movimientoSchema'

const salidaVenta = {
  tipoMovimiento: 'SALIDA_VENTA',
  almacenOrigenId: 1,
  ordenTrabajo: 'OS-001',
  confirmar: true,
  detalles: [
    {
      productoId: 10,
      cantidad: 1,
      costoUnitario: 8,
      costoBaseComercialSinIgv: 12.71,
      recargoComercialPct: 35,
    },
  ],
}

describe('movimientoSchema para SALIDA_VENTA', () => {
  it('requiere OS, costo base y recargo al confirmar', () => {
    const result = movimientoSchema.safeParse({
      ...salidaVenta,
      ordenTrabajo: '',
      detalles: [
        {
          ...salidaVenta.detalles[0],
          costoBaseComercialSinIgv: null,
          recargoComercialPct: null,
        },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'Ingrese la Orden de Servicio (OS)',
        'El producto no tiene costo base comercial sin IGV',
        'Seleccione o ingrese el recargo comercial',
      ]),
    )
  })

  it('requiere OS al guardar borrador, pero permite costo base y recargo pendientes', () => {
    const borradorSinOs = movimientoSchema.safeParse({
      ...salidaVenta,
      confirmar: false,
      ordenTrabajo: '',
      detalles: [
        {
          productoId: 10,
          cantidad: 1,
          costoUnitario: 8,
        },
      ],
    })

    expect(borradorSinOs.success).toBe(false)
    expect(borradorSinOs.error?.issues.map((issue) => issue.message)).toEqual([
      'Ingrese la Orden de Servicio (OS)',
    ])

    expect(
      movimientoSchema.safeParse({
        ...salidaVenta,
        confirmar: false,
        ordenTrabajo: 'OS-BORRADOR',
        detalles: [{ productoId: 10, cantidad: 1, costoUnitario: 8 }],
      }).success,
    ).toBe(true)
  })

  it('acepta recargo cero y rechaza negativos, NaN y mayores a 1000', () => {
    expect(
      movimientoSchema.safeParse({
        ...salidaVenta,
        detalles: [{ ...salidaVenta.detalles[0], recargoComercialPct: 0 }],
      }).success,
    ).toBe(true)

    for (const recargoComercialPct of [-1, Number.NaN, 1000.01]) {
      expect(
        movimientoSchema.safeParse({
          ...salidaVenta,
          detalles: [{ ...salidaVenta.detalles[0], recargoComercialPct }],
        }).success,
      ).toBe(false)
    }
  })

  it('no exige datos comerciales para una salida no comercial', () => {
    expect(
      movimientoSchema.safeParse({
        tipoMovimiento: 'SALIDA_CONSUMO',
        almacenOrigenId: 1,
        motivoMovimiento: 'Consumo interno',
        observacion: 'Uso operativo',
        confirmar: true,
        detalles: [{ productoId: 10, cantidad: 1, costoUnitario: 8 }],
      }).success,
    ).toBe(true)
  })
})
