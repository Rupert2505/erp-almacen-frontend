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
  return trimmed === '' ? undefined : trimmed
}, z.string().email('Ingrese un email valido').optional())

export const proveedorSchema = z.object({
  tipoDocumento: z.string().trim().min(1, 'El tipo de documento es obligatorio'),
  numeroDocumento: z.string().trim().min(1, 'El numero de documento es obligatorio'),
  razonSocial: z.string().trim().min(1, 'La razon social es obligatoria'),
  nombreComercial: optionalTrimmedString,
  direccion: optionalTrimmedString,
  telefono: optionalTrimmedString,
  email: optionalEmail,
})

export type ProveedorFormInput = z.input<typeof proveedorSchema>
export type ProveedorFormValues = z.infer<typeof proveedorSchema>
