import { z } from 'zod'

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

export const marcaSchema = z.object({
  codigo: optionalTrimmedString,
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  descripcion: optionalTrimmedString,
})

export type MarcaFormInput = z.input<typeof marcaSchema>
export type MarcaFormValues = z.infer<typeof marcaSchema>
