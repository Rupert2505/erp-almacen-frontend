import { z } from 'zod'

const requiredText = (message: string) => z.string().trim().min(1, message)

export const usuarioCreateSchema = z.object({
  username: requiredText('El username es obligatorio'),
  password: z.string().min(8, 'La password debe tener al menos 8 caracteres'),
  nombres: requiredText('Los nombres son obligatorios'),
  apellidos: requiredText('Los apellidos son obligatorios'),
  email: requiredText('El email es obligatorio').email('Ingrese un email valido'),
  activo: z.boolean(),
  rolesIds: z.array(z.number()).min(1, 'Seleccione al menos un rol'),
})

export const usuarioEditSchema = z.object({
  nombres: requiredText('Los nombres son obligatorios'),
  apellidos: requiredText('Los apellidos son obligatorios'),
  email: requiredText('El email es obligatorio').email('Ingrese un email valido'),
  activo: z.boolean(),
})

export type UsuarioCreateInput = z.input<typeof usuarioCreateSchema>
export type UsuarioCreateValues = z.infer<typeof usuarioCreateSchema>
export type UsuarioEditInput = z.input<typeof usuarioEditSchema>
export type UsuarioEditValues = z.infer<typeof usuarioEditSchema>
export type UsuarioFormInput = UsuarioCreateInput | UsuarioEditInput
export type UsuarioFormValues = UsuarioCreateValues | UsuarioEditValues
