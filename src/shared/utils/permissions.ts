import type { AuthUser } from '../../features/auth/types/auth.types'

export function hasPermission(user: AuthUser | null, permission: string) {
  return Boolean(user?.permisos.includes(permission))
}

export function hasRole(user: AuthUser | null, role: string) {
  return Boolean(user?.roles.includes(role))
}
