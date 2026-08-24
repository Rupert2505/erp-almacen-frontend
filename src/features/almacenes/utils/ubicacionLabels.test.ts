import { describe, expect, it } from 'vitest'
import type { Ubicacion } from '../types/ubicacion.types'
import { formatUbicacionLabel } from './ubicacionLabels'

const ubicacion: Ubicacion = {
  id: 1,
  almacenId: 10,
  almacenCodigo: 'ALM-01',
  almacenNombre: 'Principal',
  codigo: 'UB-01',
  nombre: 'Recepcion',
  activo: true,
}

describe('formatUbicacionLabel', () => {
  it('combina el codigo del almacen con el codigo de ubicacion', () => {
    expect(formatUbicacionLabel(ubicacion)).toBe('ALM-01 - UB-01')
  })

  it('usa el nombre del almacen solo como respaldo y nunca concatena el nombre de ubicacion', () => {
    expect(formatUbicacionLabel({ ...ubicacion, almacenCodigo: null })).toBe('Principal - UB-01')
    expect(formatUbicacionLabel({ ...ubicacion, almacenCodigo: null, almacenNombre: null })).toBe(
      'UB-01',
    )
  })
})
