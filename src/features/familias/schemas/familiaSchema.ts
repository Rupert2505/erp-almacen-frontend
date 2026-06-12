import { z } from 'zod'

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

export const familiaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  descripcion: optionalTrimmedString,
})

export type FamiliaFormInput = z.input<typeof familiaSchema>
export type FamiliaFormValues = z.infer<typeof familiaSchema>
