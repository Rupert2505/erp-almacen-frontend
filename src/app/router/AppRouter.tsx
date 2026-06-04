import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { MainLayout } from '../../layout/MainLayout'
import { LoadingScreen } from '../../shared/components/LoadingScreen'
import { ProtectedRoute } from './ProtectedRoute'

const DashboardPage = lazy(() =>
  import('../../features/dashboard/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ProductosPage = lazy(() =>
  import('../../features/productos/pages/ProductosPage').then((module) => ({
    default: module.ProductosPage,
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
const ReportesInventarioPage = lazy(() =>
  import('../../features/reportes/pages/ReportesInventarioPage').then((module) => ({
    default: module.ReportesInventarioPage,
  })),
)
const UsuariosPage = lazy(() =>
  import('../../features/usuarios/pages/UsuariosPage').then((module) => ({
    default: module.UsuariosPage,
  })),
)

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={lazyRoute(<DashboardPage />)} />
        <Route path="/productos" element={lazyRoute(<ProductosPage />)} />
        <Route path="/proveedores" element={lazyRoute(<ProveedoresPage />)} />
        <Route path="/almacenes" element={lazyRoute(<AlmacenesPage />)} />
        <Route path="/ubicaciones" element={lazyRoute(<UbicacionesPage />)} />
        <Route path="/inventario/movimientos" element={lazyRoute(<MovimientosPage />)} />
        <Route path="/inventario/stock" element={lazyRoute(<StockPage />)} />
        <Route path="/inventario/kardex" element={lazyRoute(<KardexPage />)} />
        <Route path="/reportes/inventario" element={lazyRoute(<ReportesInventarioPage />)} />
        <Route path="/usuarios" element={lazyRoute(<UsuariosPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
