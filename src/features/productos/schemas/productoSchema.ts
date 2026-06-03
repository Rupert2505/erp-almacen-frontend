import { z } from 'zod'

const optionalNumber = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z.number('Ingrese un numero valido').min(0, 'No puede ser negativo').optional(),
)

const optionalId = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value)
}, z.number('Seleccione una opcion valida').nullable())

const requiredId = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z.number('Seleccione una opcion valida').min(1, 'Seleccione una unidad de medida'),
)

export const productoSchema = z
  .object({
    codigo: z.string().trim().min(1, 'El codigo es obligatorio'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().trim().optional(),
    categoriaId: optionalId,
    marcaId: optionalId,
    unidadMedidaId: requiredId,
    stockMinimo: optionalNumber,
    stockMaximo: optionalNumber,
    costoReferencial: optionalNumber,
    controlaLote: z.boolean(),
    controlaSerie: z.boolean(),
  })
  .refine(
    (values) =>
      values.stockMinimo === undefined ||
      values.stockMaximo === undefined ||
      values.stockMaximo >= values.stockMinimo,
    {
      message: 'El stock maximo debe ser mayor o igual al stock minimo',
      path: ['stockMaximo'],
    },
  )

export type ProductoFormInput = z.input<typeof productoSchema>
export type ProductoFormValues = z.infer<typeof productoSchema>
