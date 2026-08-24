import type { AuthUser } from '../../features/auth/types/auth.types'
import { can } from '../../shared/utils/permissions'

export type RouteAccess = {
  allOf?: string[]
  anyOf?: string[]
}

export const routeAccess = {
  reportesInventario: { allOf: ['REPORTE_VER'] },
  productos: { allOf: ['PRODUCTO_VER'] },
  familias: { allOf: ['PRODUCTO_VER'] },
  tiposArticulo: { allOf: ['PRODUCTO_VER'] },
  marcas: { allOf: ['PRODUCTO_VER'] },
  proveedores: { allOf: ['PROVEEDOR_VER'] },
  almacenes: { allOf: ['ALMACEN_VER'] },
  ubicaciones: { allOf: ['ALMACEN_VER'] },
  movimientos: {
    anyOf: ['STOCK_VER', 'KARDEX_VER', 'INVENTARIO_DEVOLUCION_VER'],
  },
  devolucionProveedor: {
    allOf: ['INVENTARIO_DEVOLUCION_VER', 'INVENTARIO_DEVOLUCION_CREAR'],
  },
  stock: { allOf: ['STOCK_VER'] },
  kardex: { allOf: ['KARDEX_VER'] },
  usuarios: { allOf: ['USUARIO_ADMIN'] },
  personal: { allOf: ['USUARIO_ADMIN'] },
} satisfies Record<string, RouteAccess>

export const authorizedHomeCandidates = [
  { path: '/reportes/inventario', access: routeAccess.reportesInventario },
  { path: '/inventario/movimientos', access: routeAccess.movimientos },
  { path: '/inventario/stock', access: routeAccess.stock },
  { path: '/inventario/kardex', access: routeAccess.kardex },
  { path: '/productos', access: routeAccess.productos },
  { path: '/proveedores', access: routeAccess.proveedores },
  { path: '/almacenes', access: routeAccess.almacenes },
  { path: '/usuarios', access: routeAccess.usuarios },
  { path: '/personal', access: routeAccess.personal },
]

export function canAccessRoute(user: AuthUser | null, access?: RouteAccess) {
  if (!access) {
    return true
  }

  const hasAll = access.allOf?.every((permission) => can(user, permission)) ?? true
  const hasAny = access.anyOf?.some((permission) => can(user, permission)) ?? true

  return hasAll && hasAny
}

export function firstAuthorizedPath(user: AuthUser | null) {
  return authorizedHomeCandidates.find((candidate) => canAccessRoute(user, candidate.access))?.path
}
