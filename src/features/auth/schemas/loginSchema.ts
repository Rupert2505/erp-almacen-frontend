import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Ingrese su usuario'),
  password: z.string().min(1, 'Ingrese su contrasena'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
