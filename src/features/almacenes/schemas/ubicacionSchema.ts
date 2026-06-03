import { z } from 'zod'

const requiredId = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z.number('Seleccione un almacen valido').min(1, 'Seleccione un almacen'),
)

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

export const ubicacionSchema = z.object({
  almacenId: requiredId,
  codigo: z.string().trim().min(1, 'El codigo es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  descripcion: optionalTrimmedString,
})

export type UbicacionFormInput = z.input<typeof ubicacionSchema>
export type UbicacionFormValues = z.infer<typeof ubicacionSchema>
