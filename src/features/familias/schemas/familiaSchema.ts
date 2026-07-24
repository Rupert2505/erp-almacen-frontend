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
  prefijo: z
    .string()
    .trim()
    .min(1, 'El prefijo es obligatorio')
    .max(20, 'El prefijo no puede superar 20 caracteres')
    .regex(/^[A-Za-z0-9]+$/, 'El prefijo solo puede contener letras y numeros'),
  descripcion: optionalTrimmedString,
})

export type FamiliaFormInput = z.input<typeof familiaSchema>
export type FamiliaFormValues = z.infer<typeof familiaSchema>
