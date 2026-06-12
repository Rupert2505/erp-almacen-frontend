import { z } from 'zod'

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

export const tipoArticuloSchema = z.object({
  codigo: z.string().trim().min(1, 'El codigo es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  descripcion: optionalTrimmedString,
})

export type TipoArticuloFormInput = z.input<typeof tipoArticuloSchema>
export type TipoArticuloFormValues = z.infer<typeof tipoArticuloSchema>
