import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PermissionRoute } from '../../app/router/PermissionRoute'
import { ProtectedRoute } from '../../app/router/ProtectedRoute'
import {
  canAccessRoute,
  firstAuthorizedPath,
  routeAccess,
} from '../../app/router/routeAccess'
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

const consultaUser = {
  username: 'consulta',
  nombres: 'Consulta',
  apellidos: 'Solo Lectura',
  email: 'consulta@example.com',
  roles: ['CONSULTA'],
  permisos: [
    'ALMACEN_VER',
    'INVENTARIO_DEVOLUCION_VER',
    'KARDEX_VER',
    'PRODUCTO_VER',
    'PROVEEDOR_VER',
    'REPORTE_VER',
    'STOCK_VER',
  ],
}

const jefeAlmacenUser = {
  username: 'jefe.almacen',
  nombres: 'Jefe',
  apellidos: 'Almacen',
  email: 'jefe.almacen@example.com',
  roles: ['JEFE_ALMACEN'],
  permisos: [
    'PERSONAL_VER',
    'PERSONAL_CREAR',
    'PERSONAL_EDITAR',
    'PERSONAL_DESACTIVAR',
  ],
}

const jefeAlmacenGestionUser = {
  username: 'jefe.gestion',
  nombres: 'Jefe',
  apellidos: 'Gestion',
  email: 'jefe.gestion@example.com',
  roles: ['JEFE_ALMACEN'],
  permisos: [
    'ALMACEN_VER',
    'ALMACEN_CREAR',
    'ALMACEN_EDITAR',
    'ALMACEN_DESACTIVAR',
  ],
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

  it('PermissionRoute bloquea una ruta sin permisos suficientes', () => {
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: consultaUser },
      ['/inventario/entradas/121/devolucion'],
      <Routes>
        <Route
          path="/inventario/entradas/:entradaId/devolucion"
          element={
            <PermissionRoute access={routeAccess.devolucionProveedor}>
              <div>Formulario de devolucion</div>
            </PermissionRoute>
          }
        />
        <Route path="/403" element={<div>Acceso no autorizado</div>} />
      </Routes>,
    )

    expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument()
    expect(screen.queryByText('Formulario de devolucion')).not.toBeInTheDocument()
  })

  it('PermissionRoute permite una ruta con todos los permisos requeridos', () => {
    renderWithAuth(
      {
        isAuthenticated: true,
        status: 'authenticated',
        user: {
          ...consultaUser,
          permisos: [
            ...consultaUser.permisos,
            'INVENTARIO_DEVOLUCION_CREAR',
          ],
        },
      },
      ['/inventario/entradas/121/devolucion'],
      <Routes>
        <Route
          path="/inventario/entradas/:entradaId/devolucion"
          element={
            <PermissionRoute access={routeAccess.devolucionProveedor}>
              <div>Formulario de devolucion</div>
            </PermissionRoute>
          }
        />
        <Route path="/403" element={<div>Acceso no autorizado</div>} />
      </Routes>,
    )

    expect(screen.getByText('Formulario de devolucion')).toBeInTheDocument()
    expect(screen.queryByText('Acceso no autorizado')).not.toBeInTheDocument()
  })

  it('PermissionRoute permite Personal al JEFE_ALMACEN con permisos PERSONAL_*', () => {
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: jefeAlmacenUser },
      ['/personal'],
      <Routes>
        <Route
          path="/personal"
          element={
            <PermissionRoute access={routeAccess.personal}>
              <div>Gestion de personal habilitada</div>
            </PermissionRoute>
          }
        />
        <Route path="/403" element={<div>Acceso no autorizado</div>} />
      </Routes>,
    )

    expect(screen.getByText('Gestion de personal habilitada')).toBeInTheDocument()
    expect(screen.queryByText('Acceso no autorizado')).not.toBeInTheDocument()
  })

  it('elige Personal como inicio para JEFE_ALMACEN sin permisos de otros modulos', () => {
    expect(firstAuthorizedPath(jefeAlmacenUser)).toBe('/personal')
  })

  it('permite las rutas de almacenes y ubicaciones al JEFE_ALMACEN con ALMACEN_VER', () => {
    expect(canAccessRoute(jefeAlmacenGestionUser, routeAccess.almacenes)).toBe(true)
    expect(canAccessRoute(jefeAlmacenGestionUser, routeAccess.ubicaciones)).toBe(true)

    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: jefeAlmacenGestionUser },
      ['/almacenes'],
      <Routes>
        <Route
          path="/almacenes"
          element={
            <PermissionRoute access={routeAccess.almacenes}>
              <div>Gestion de almacenes habilitada</div>
            </PermissionRoute>
          }
        />
        <Route path="/403" element={<div>Acceso no autorizado</div>} />
      </Routes>,
    )

    expect(screen.getByText('Gestion de almacenes habilitada')).toBeInTheDocument()
    expect(screen.queryByText('Acceso no autorizado')).not.toBeInTheDocument()
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

    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reporte de inventario' })).toBeInTheDocument()
    expect(screen.getByText('Productos')).toBeInTheDocument()
    expect(screen.getByText('Movimientos')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Contraer menu' }))
    expect(onToggleCollapsed).toHaveBeenCalled()
  })

  it('Sidebar muestra Personal pero no Usuarios al JEFE_ALMACEN', () => {
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: jefeAlmacenUser },
      ['/personal'],
      <Sidebar
        isCollapsed={false}
        isOpen
        onClose={vi.fn()}
        onToggleCollapsed={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: 'Personal' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
  })

  it('Sidebar muestra Almacenes y Ubicaciones pero no Usuarios al JEFE_ALMACEN', () => {
    renderWithAuth(
      { isAuthenticated: true, status: 'authenticated', user: jefeAlmacenGestionUser },
      ['/almacenes'],
      <Sidebar
        isCollapsed={false}
        isOpen
        onClose={vi.fn()}
        onToggleCollapsed={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: 'Almacenes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
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
