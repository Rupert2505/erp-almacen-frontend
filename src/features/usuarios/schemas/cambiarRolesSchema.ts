import { z } from 'zod'

export const cambiarRolesSchema = z.object({
  rolesIds: z.array(z.number()).min(1, 'Seleccione al menos un rol'),
})

export type CambiarRolesInput = z.input<typeof cambiarRolesSchema>
export type CambiarRolesValues = z.infer<typeof cambiarRolesSchema>
