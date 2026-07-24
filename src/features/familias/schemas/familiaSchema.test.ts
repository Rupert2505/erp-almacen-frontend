import { describe, expect, it } from 'vitest'
import { familiaSchema } from './familiaSchema'

describe('familiaSchema', () => {
  it('requiere prefijo alfanumerico de maximo 20 caracteres', () => {
    expect(
      familiaSchema.parse({
        nombre: 'Repuestos',
        prefijo: 'REP',
        descripcion: '',
      }),
    ).toMatchObject({
      nombre: 'Repuestos',
      prefijo: 'REP',
    })

    const result = familiaSchema.safeParse({
      nombre: 'Repuestos',
      prefijo: 'REP-01',
      descripcion: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'El prefijo solo puede contener letras y numeros',
    )
  })
})
