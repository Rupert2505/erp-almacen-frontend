import { describe, expect, it } from 'vitest'
import {
  normalizeBusinessText,
  normalizeEmail,
  normalizeOptionalBusinessText,
  normalizeOptionalEmail,
  normalizePhone,
} from './textNormalization'

describe('textNormalization', () => {
  it('normaliza campos de negocio a mayusculas', () => {
    expect(normalizeBusinessText(' repuestos inox ')).toBe('REPUESTOS INOX')
    expect(normalizeOptionalBusinessText(' almacen central ')).toBe('ALMACEN CENTRAL')
    expect(normalizeOptionalBusinessText('   ')).toBeNull()
  })

  it('normaliza email a minusculas y no altera telefono', () => {
    expect(normalizeEmail(' Usuario.Mixto@Correo.COM ')).toBe('usuario.mixto@correo.com')
    expect(normalizeOptionalEmail(' Persona@ERP.COM ')).toBe('persona@erp.com')
    expect(normalizePhone(' +51 999 abc ')).toBe('+51 999 abc')
  })
})
