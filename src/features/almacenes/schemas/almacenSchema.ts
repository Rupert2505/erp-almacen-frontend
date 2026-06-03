import { z } from 'zod'

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

export const almacenSchema = z.object({
  codigo: z.string().trim().min(1, 'El codigo es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  direccion: optionalTrimmedString,
  responsable: optionalTrimmedString,
})

export type AlmacenFormInput = z.input<typeof almacenSchema>
export type AlmacenFormValues = z.infer<typeof almacenSchema>
