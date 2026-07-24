import { z } from 'zod'

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}, z.string().optional())

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed.toLowerCase()
}, z.string().email('Ingrese un email valido').optional())

export const personalSchema = z.object({
  tipoDocumento: z.string().trim().min(1, 'El tipo de documento es obligatorio'),
  numeroDocumento: z.string().trim().min(1, 'El numero de documento es obligatorio'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios'),
  apellidos: optionalTrimmedString,
  cargo: optionalTrimmedString,
  area: optionalTrimmedString,
  telefono: optionalTrimmedString,
  email: optionalEmail,
})

export type PersonalFormInput = z.input<typeof personalSchema>
export type PersonalFormValues = z.infer<typeof personalSchema>
