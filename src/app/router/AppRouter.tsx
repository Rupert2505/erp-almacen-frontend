import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage'
import { KardexPage } from '../../features/inventario/pages/KardexPage'
import { MovimientosPage } from '../../features/inventario/pages/MovimientosPage'
import { StockPage } from '../../features/inventario/pages/StockPage'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { ProductosPage } from '../../features/productos/pages/ProductosPage'
import { ReportesInventarioPage } from '../../features/reportes/pages/ReportesInventarioPage'
import { UsuariosPage } from '../../features/usuarios/pages/UsuariosPage'
import { MainLayout } from '../../layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'

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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/productos" element={<ProductosPage />} />
        <Route path="/inventario/movimientos" element={<MovimientosPage />} />
        <Route path="/inventario/stock" element={<StockPage />} />
        <Route path="/inventario/kardex" element={<KardexPage />} />
        <Route path="/reportes/inventario" element={<ReportesInventarioPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
