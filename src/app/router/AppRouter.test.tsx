import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRouter } from './AppRouter'

vi.mock('./ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../features/auth/context/useAuth', () => ({
  useAuth: () => ({
    user: {
      username: 'admin',
      nombres: 'Admin',
      apellidos: 'Principal',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      permisos: [],
    },
    status: 'authenticated',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('../../layout/MainLayout', async () => {
  const { Outlet } = await import('react-router-dom')

  return {
    MainLayout: () => <Outlet />,
  }
})

vi.mock('../../features/reportes/pages/ReportesInventarioPage', () => ({
  ReportesInventarioPage: () => <div>Reporte de inventario principal</div>,
}))

describe('AppRouter', () => {
  it.each(['/', '/dashboard', '/ruta-inexistente'])(
    'redirige %s al reporte de inventario',
    async (initialEntry) => {
      render(
        <MemoryRouter initialEntries={[initialEntry]}>
          <AppRouter />
        </MemoryRouter>,
      )

      expect(await screen.findByText('Reporte de inventario principal')).toBeInTheDocument()
    },
  )
})
