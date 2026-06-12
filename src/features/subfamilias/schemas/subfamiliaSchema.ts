import { z } from 'zod'

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

const requiredId = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z.number('Seleccione una opcion valida').min(1, 'Seleccione una familia'),
)

export const subfamiliaSchema = z.object({
  familiaId: requiredId,
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  descripcion: optionalTrimmedString,
})

export type SubfamiliaFormInput = z.input<typeof subfamiliaSchema>
export type SubfamiliaFormValues = z.infer<typeof subfamiliaSchema>
