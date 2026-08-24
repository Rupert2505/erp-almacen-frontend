import type { Ubicacion } from '../types/ubicacion.types'

export function formatUbicacionLabel(ubicacion: Ubicacion) {
  const almacen = ubicacion.almacenCodigo?.trim() || ubicacion.almacenNombre?.trim()
  const codigo = ubicacion.codigo.trim()

  return almacen ? `${almacen} - ${codigo}` : codigo
}
