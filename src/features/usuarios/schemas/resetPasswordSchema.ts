import { z } from 'zod'

export const resetPasswordSchema = z.object({
  nuevaPassword: z.string().min(8, 'La nueva password debe tener al menos 8 caracteres'),
})

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
