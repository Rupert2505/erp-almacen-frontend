import { describe, expect, it } from 'vitest'
import { personalSchema } from './personalSchema'

describe('personalSchema', () => {
  it('valida obligatorios y normaliza email a minusculas', () => {
    const result = personalSchema.parse({
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombres: 'JUAN',
      apellidos: '',
      cargo: '',
      area: '',
      telefono: '',
      email: 'Juan.Perez@EMPRESA.COM',
    })

    expect(result.email).toBe('juan.perez@empresa.com')
    expect(result.apellidos).toBeUndefined()
  })

  it('rechaza documento, nombres y email invalido', () => {
    const result = personalSchema.safeParse({
      tipoDocumento: '',
      numeroDocumento: '',
      nombres: '',
      email: 'correo-invalido',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'El tipo de documento es obligatorio',
        'El numero de documento es obligatorio',
        'Los nombres son obligatorios',
        'Ingrese un email valido',
      ]),
    )
  })
})
