import { z } from 'zod'

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()

const positiveQuantity = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z.number('Ingrese una cantidad valida').positive('La cantidad debe ser mayor que cero').optional(),
)

export const devolucionProveedorDetalleSchema = z
  .object({
    seleccionado: z.boolean(),
    movimientoDetalleOrigenId: z.number(),
    productoId: z.number(),
    cantidadPendienteDevolver: z.number(),
    cantidad: positiveQuantity,
    observacion: optionalText(255, 'La observacion no debe superar 255 caracteres'),
  })
  .superRefine((detalle, context) => {
    if (!detalle.seleccionado) {
      return
    }

    if (detalle.cantidad === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Ingrese la cantidad a devolver',
        path: ['cantidad'],
      })
      return
    }

    if (detalle.cantidad > detalle.cantidadPendienteDevolver) {
      context.addIssue({
        code: 'custom',
        message: 'La cantidad no puede superar la pendiente',
        path: ['cantidad'],
      })
    }
  })

export const devolucionProveedorSchema = z
  .object({
    motivo: z
      .string()
      .trim()
      .min(1, 'Ingrese el motivo de devolucion')
      .max(150, 'El motivo no debe superar 150 caracteres'),
    observacion: optionalText(500, 'La observacion no debe superar 500 caracteres'),
    numeroNotaCredito: optionalText(
      50,
      'El numero de nota de credito no debe superar 50 caracteres',
    ),
    fechaDocumento: z.string().trim().optional(),
    detalles: z.array(devolucionProveedorDetalleSchema),
  })
  .superRefine((values, context) => {
    if (!values.detalles.some((detalle) => detalle.seleccionado)) {
      context.addIssue({
        code: 'custom',
        message: 'Seleccione al menos una linea para devolver',
        path: ['detalles'],
      })
    }
  })

export type DevolucionProveedorFormInput = z.input<typeof devolucionProveedorSchema>
export type DevolucionProveedorFormValues = z.infer<typeof devolucionProveedorSchema>
