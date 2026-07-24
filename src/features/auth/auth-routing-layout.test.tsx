import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '../../app/router/ProtectedRoute'
import { Header } from '../../layout/Header'
import { Sidebar } from '../../layout/Sidebar'
import { AUTH_ACCESS_TOKEN_KEY, AUTH_USER_KEY } from '../../shared/utils/storageKeys'
import { AuthContext, type AuthContextValue } from './context/authContextDefinition'
import { LoginPage } from './pages/LoginPage'
import {
  clearAuthSession,
  getStoredUser,
  persistAuthSession,
} from './services/authService'

const adminUser = {
  username: 'admin',
  nombres: 'Admin',
  apellidos: 'Principal',
  email: 'admin@example.com',
  roles: ['ADMIN'],
  permisos: ['PRODUCTO_VER'],
}

function renderWithAuth(
  value: Partial<AuthContextValue>,
  initialEntries = ['/'],
  ui: React.ReactNode,
) {
  const authValue: AuthContextValue = {
    user: null,
    status: 'unauthenticated',
    isAuthenticated: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    ...value,
  }

  return {
    authValue,
    ...render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </AuthContext.Provider>,
    ),
  }
}

describe('auth, rutas protegidas y layout', () => {
  it('Login renderiza usuario, contrasena y llama login', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithAuth({ login }, ['/login'], <LoginPage />)

    await user.type(screen.getByPlaceholderText('admin'), 'admin')
    await user.type(screen.getByPlaceholderText('Ingrese su contrasena'), 'Admin123*')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'Admin123*',
      })
    })
  })

  it('ProtectedRoute redirige a login si no hay sesion', () => {
    renderWithAuth(
      { isAuthenticated: false, status: 'unauthenticated' },
      ['/dashboard'],
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Privado</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login publico</div>} />
      </Routes>,
    )

    expect(screen.getByText('Login publico')).toBeInTheDocument()
    expect(screen.queryByText('Privado')).not.toBeInTheDocument()
  })

  it('ProtectedRoute renderiza contenido con usuario autenticado', () => {
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: adminUser },
      ['/dashboard'],
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Privado</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
    )

    expect(screen.getByText('Privado')).toBeInTheDocument()
  })

  it('Header muestra usuario y ejecuta logout', async () => {
    const logout = vi.fn()
    const user = userEvent.setup()
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: adminUser, logout },
      ['/dashboard'],
      <Header onOpenSidebar={vi.fn()} />,
    )

    expect(screen.getByText('Admin Principal')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Cerrar sesion/i }))
    expect(logout).toHaveBeenCalled()
  })

  it('Sidebar renderiza opciones principales y toggle de colapso', async () => {
    const onToggleCollapsed = vi.fn()
    const user = userEvent.setup()
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: adminUser },
      ['/dashboard'],
      <Sidebar
        isCollapsed={false}
        isOpen
        onClose={vi.fn()}
        onToggleCollapsed={onToggleCollapsed}
      />,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Productos')).toBeInTheDocument()
    expect(screen.getByText('Movimientos')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Contraer menu' }))
    expect(onToggleCollapsed).toHaveBeenCalled()
  })

  it('persistAuthSession guarda token y usuario; clearAuthSession limpia ambos', () => {
    persistAuthSession({
      ...adminUser,
      accessToken: 'token-123',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })

    expect(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)).toBe('token-123')
    expect(getStoredUser()).toEqual(adminUser)

    clearAuthSession()

    expect(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
  })
})
