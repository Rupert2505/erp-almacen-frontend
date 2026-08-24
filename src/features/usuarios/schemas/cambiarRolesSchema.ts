import { z } from 'zod'

const roleIdSchema = z.coerce.number().int().positive()

export const cambiarRolesSchema = z.object({
  rolesIds: z.array(roleIdSchema).min(1, 'Seleccione al menos un rol'),
})

export type CambiarRolesInput = z.input<typeof cambiarRolesSchema>
export type CambiarRolesValues = z.infer<typeof cambiarRolesSchema>
