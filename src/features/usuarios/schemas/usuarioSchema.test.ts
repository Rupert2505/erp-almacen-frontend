import { describe, expect, it } from 'vitest'
import { cambiarRolesSchema } from './cambiarRolesSchema'
import { usuarioCreateSchema } from './usuarioSchema'

describe('usuarioCreateSchema', () => {
  it('coacciona roles seleccionados desde checkboxes HTML', () => {
    const result = usuarioCreateSchema.safeParse({
      username: 'operador',
      password: 'Password123',
      nombres: 'OPERADOR',
      apellidos: 'OPERADOR',
      email: 'operador@erpalmacen.local',
      activo: true,
      rolesIds: ['3'],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rolesIds).toEqual([3])
    }
  })

  it('requiere al menos un rol', () => {
    const result = usuarioCreateSchema.safeParse({
      username: 'operador',
      password: 'Password123',
      nombres: 'OPERADOR',
      apellidos: 'OPERADOR',
      email: 'operador@erpalmacen.local',
      activo: true,
      rolesIds: [],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Seleccione al menos un rol',
    )
  })
})

describe('cambiarRolesSchema', () => {
  it('coacciona roles seleccionados desde checkboxes HTML', () => {
    const result = cambiarRolesSchema.safeParse({
      rolesIds: ['2', '3'],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rolesIds).toEqual([2, 3])
    }
  })
})
