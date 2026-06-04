import type { Permiso } from './permiso.types'
import type { Rol } from './rol.types'

export type Usuario = {
  id: number
  username: string
  nombres: string
  apellidos: string
  email: string
  activo: boolean
  roles: Rol[]
  permisos: Permiso[]
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export type UsuarioCreatePayload = {
  username: string
  password: string
  nombres: string
  apellidos: string
  email: string
  activo: boolean
  rolesIds: number[]
}

export type UsuarioUpdatePayload = {
  nombres: string
  apellidos: string
  email: string
  activo: boolean
}

export type UsuarioRolesPayload = {
  rolesIds: number[]
}

export type UsuarioResetPasswordPayload = {
  nuevaPassword: string
}

export type UsuarioFilters = {
  texto?: string
  activo?: boolean
  rolId?: number | null
  page: number
  size: number
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first?: boolean
  last?: boolean
  empty?: boolean
  numberOfElements?: number
}
