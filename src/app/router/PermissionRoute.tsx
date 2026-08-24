import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/useAuth'
import { canAccessRoute, type RouteAccess } from './routeAccess'

type PermissionRouteProps = {
  access?: RouteAccess
  children: ReactNode
}

export function PermissionRoute({ access, children }: PermissionRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!canAccessRoute(user, access)) {
    return <Navigate to="/403" replace state={{ from: location }} />
  }

  return children
}
