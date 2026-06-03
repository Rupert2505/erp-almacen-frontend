import { z } from 'zod'
import { TIPOS_MOVIMIENTO } from '../types/movimiento.types'

const requiredId = (message: string) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined
      }

      return Number(value)
    },
    z.number('Seleccione una opcion valida').min(1, message),
  )

const optionalId = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number('Seleccione una opcion valida').nullable())

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number('Ingrese un numero valido').min(0, 'No puede ser negativo').optional())

const positiveNumber = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z.number('Ingrese un numero valido').positive('La cantidad debe ser mayor a 0'),
)

export const movimientoDetalleSchema = z.object({
  productoId: requiredId('Seleccione un producto'),
  ubicacionOrigenId: optionalId,
  ubicacionDestinoId: optionalId,
  cantidad: positiveNumber,
  costoUnitario: optionalNumber,
  observacion: z.string().trim().optional(),
})

export const movimientoSchema = z
  .object({
    tipoMovimiento: z.enum(TIPOS_MOVIMIENTO, 'Seleccione un tipo de movimiento'),
    proveedorId: optionalId,
    almacenOrigenId: optionalId,
    almacenDestinoId: optionalId,
    documentoReferencia: z.string().trim().optional(),
    observacion: z.string().trim().optional(),
    detalles: z.array(movimientoDetalleSchema).min(1, 'Agregue al menos un detalle'),
  })
  .superRefine((values, context) => {
    const requireProveedor = values.tipoMovimiento === 'ENTRADA_COMPRA'
    const requireDestino = [
      'ENTRADA_COMPRA',
      'ENTRADA_AJUSTE',
      'AJUSTE_POSITIVO',
      'TRANSFERENCIA',
    ].includes(values.tipoMovimiento)
    const requireOrigen = [
      'SALIDA_CONSUMO',
      'SALIDA_VENTA',
      'SALIDA_AJUSTE',
      'AJUSTE_NEGATIVO',
      'TRANSFERENCIA',
    ].includes(values.tipoMovimiento)

    if (requireProveedor && !values.proveedorId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione un proveedor',
        path: ['proveedorId'],
      })
    }

    if (requireOrigen && !values.almacenOrigenId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione un almacen origen',
        path: ['almacenOrigenId'],
      })
    }

    if (requireDestino && !values.almacenDestinoId) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione un almacen destino',
        path: ['almacenDestinoId'],
      })
    }

    if (
      values.tipoMovimiento === 'TRANSFERENCIA' &&
      values.almacenOrigenId &&
      values.almacenDestinoId &&
      values.almacenOrigenId === values.almacenDestinoId
    ) {
      context.addIssue({
        code: 'custom',
        message: 'El almacen destino debe ser diferente al almacen origen',
        path: ['almacenDestinoId'],
      })
    }
  })

export const anularMovimientoSchema = z.object({
  motivo: z.string().trim().min(1, 'Ingrese el motivo de anulacion'),
})

export type MovimientoFormInput = z.input<typeof movimientoSchema>
export type MovimientoFormValues = z.infer<typeof movimientoSchema>
export type AnularMovimientoValues = z.infer<typeof anularMovimientoSchema>
