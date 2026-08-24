import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { useAuth } from '../../features/auth/context/useAuth'
import { MainLayout } from '../../layout/MainLayout'
import { LoadingScreen } from '../../shared/components/LoadingScreen'
import { AccessDeniedPage } from './AccessDeniedPage'
import { PermissionRoute } from './PermissionRoute'
import { ProtectedRoute } from './ProtectedRoute'
import {
  firstAuthorizedPath,
  routeAccess,
  type RouteAccess,
} from './routeAccess'

const ProductosPage = lazy(() =>
  import('../../features/productos/pages/ProductosPage').then((module) => ({
    default: module.ProductosPage,
  })),
)
const FamiliasPage = lazy(() =>
  import('../../features/familias/pages/FamiliasPage').then((module) => ({
    default: module.FamiliasPage,
  })),
)
const MarcasPage = lazy(() =>
  import('../../features/marcas/pages/MarcasPage').then((module) => ({
    default: module.MarcasPage,
  })),
)
const TiposArticuloPage = lazy(() =>
  import('../../features/tipos-articulo/pages/TiposArticuloPage').then((module) => ({
    default: module.TiposArticuloPage,
  })),
)
const ProveedoresPage = lazy(() =>
  import('../../features/proveedores/pages/ProveedoresPage').then((module) => ({
    default: module.ProveedoresPage,
  })),
)
const AlmacenesPage = lazy(() =>
  import('../../features/almacenes/pages/AlmacenesPage').then((module) => ({
    default: module.AlmacenesPage,
  })),
)
const UbicacionesPage = lazy(() =>
  import('../../features/almacenes/pages/UbicacionesPage').then((module) => ({
    default: module.UbicacionesPage,
  })),
)
const MovimientosPage = lazy(() =>
  import('../../features/inventario/pages/MovimientosPage').then((module) => ({
    default: module.MovimientosPage,
  })),
)
const DevolucionProveedorPage = lazy(() =>
  import('../../features/inventario/devoluciones/pages/DevolucionProveedorPage').then(
    (module) => ({
      default: module.DevolucionProveedorPage,
    }),
  ),
)
const StockPage = lazy(() =>
  import('../../features/inventario/pages/StockPage').then((module) => ({
    default: module.StockPage,
  })),
)
const KardexPage = lazy(() =>
  import('../../features/inventario/pages/KardexPage').then((module) => ({
    default: module.KardexPage,
  })),
)
const UsuariosPage = lazy(() =>
  import('../../features/usuarios/pages/UsuariosPage').then((module) => ({
    default: module.UsuariosPage,
  })),
)
const PersonalPage = lazy(() =>
  import('../../features/personal/pages/PersonalPage').then((module) => ({
    default: module.PersonalPage,
  })),
)
const ReportesInventarioPage = lazy(() =>
  import('../../features/reportes/pages/ReportesInventarioPage').then((module) => ({
    default: module.ReportesInventarioPage,
  })),
)

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>
}

function securedRoute(element: ReactNode, access: RouteAccess) {
  return <PermissionRoute access={access}>{lazyRoute(element)}</PermissionRoute>
}

function DefaultRouteRedirect() {
  const { user } = useAuth()
  return <Navigate to={firstAuthorizedPath(user) ?? '/403'} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DefaultRouteRedirect />} />
        <Route path="/dashboard" element={<DefaultRouteRedirect />} />
        <Route path="/403" element={<AccessDeniedPage />} />
        <Route path="/productos" element={securedRoute(<ProductosPage />, routeAccess.productos)} />
        <Route path="/familias" element={securedRoute(<FamiliasPage />, routeAccess.familias)} />
        <Route path="/subfamilias" element={<Navigate to="/familias" replace />} />
        <Route
          path="/tipos-articulo"
          element={securedRoute(<TiposArticuloPage />, routeAccess.tiposArticulo)}
        />
        <Route path="/marcas" element={securedRoute(<MarcasPage />, routeAccess.marcas)} />
        <Route path="/proveedores" element={securedRoute(<ProveedoresPage />, routeAccess.proveedores)} />
        <Route path="/almacenes" element={securedRoute(<AlmacenesPage />, routeAccess.almacenes)} />
        <Route path="/ubicaciones" element={securedRoute(<UbicacionesPage />, routeAccess.ubicaciones)} />
        <Route
          path="/inventario/movimientos"
          element={securedRoute(<MovimientosPage />, routeAccess.movimientos)}
        />
        <Route
          path="/inventario/entradas/:entradaId/devolucion"
          element={securedRoute(<DevolucionProveedorPage />, routeAccess.devolucionProveedor)}
        />
        <Route path="/inventario/stock" element={securedRoute(<StockPage />, routeAccess.stock)} />
        <Route path="/inventario/kardex" element={securedRoute(<KardexPage />, routeAccess.kardex)} />
        <Route
          path="/reportes/inventario"
          element={securedRoute(<ReportesInventarioPage />, routeAccess.reportesInventario)}
        />
        <Route path="/usuarios" element={securedRoute(<UsuariosPage />, routeAccess.usuarios)} />
        <Route path="/personal" element={securedRoute(<PersonalPage />, routeAccess.personal)} />
      </Route>
      <Route path="*" element={<DefaultRouteRedirect />} />
    </Routes>
  )
}
