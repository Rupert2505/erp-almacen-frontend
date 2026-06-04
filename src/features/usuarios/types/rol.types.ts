import type { Permiso } from './permiso.types'

export type Rol = {
  id: number
  nombre: string
  descripcion?: string | null
  activo: boolean
  permisos?: Permiso[]
  creadoEn?: string | null
  actualizadoEn?: string | null
}
