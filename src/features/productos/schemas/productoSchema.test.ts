import { describe, expect, it } from 'vitest'
import { productoSchema } from './productoSchema'

const baseProducto = {
  codigo: 'COD-001',
  nombre: 'Codo 2 inox',
  descripcion: '',
  tipoArticuloId: 1,
  familiaId: 2,
  subfamiliaId: '',
  marcaId: '',
  unidadMedidaId: 3,
  stockMinimo: '',
  stockMaximo: '',
  costoReferencial: '',
  controlaLote: false,
  controlaSerie: false,
}

describe('productoSchema', () => {
  it('acepta subfamilia y marca opcionales como null', () => {
    const result = productoSchema.parse(baseProducto)

    expect(result.subfamiliaId).toBeNull()
    expect(result.marcaId).toBeNull()
  })

  it('requiere familia, tipo de articulo y unidad de medida', () => {
    const result = productoSchema.safeParse({
      ...baseProducto,
      tipoArticuloId: '',
      familiaId: '',
      unidadMedidaId: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'Seleccione una opcion valida',
        'Seleccione una opcion valida',
        'Seleccione una opcion valida',
      ]),
    )
  })

  it('rechaza valores negativos y stock maximo menor al minimo', () => {
    const result = productoSchema.safeParse({
      ...baseProducto,
      stockMinimo: 10,
      stockMaximo: 5,
      costoReferencial: -1,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'El stock maximo debe ser mayor o igual al stock minimo',
        'No puede ser negativo',
      ]),
    )
  })
})
