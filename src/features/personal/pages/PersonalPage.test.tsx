import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../auth/context/authContextDefinition'
import type { AuthUser } from '../../auth/types/auth.types'
import { personalService } from '../services/personalService'
import type { Personal } from '../types/personal.types'
import { PersonalPage } from './PersonalPage'

vi.mock('../services/personalService', () => ({
  getPersonalApiErrorMessage: vi.fn(() => 'No se pudo completar la operacion.'),
  personalService: {
    activarPersonal: vi.fn(),
    createPersonal: vi.fn(),
    desactivarPersonal: vi.fn(),
    getPersonal: vi.fn(),
    getPersonalById: vi.fn(),
    updatePersonal: vi.fn(),
  },
}))

const personal: Personal = {
  activo: true,
  apellidos: 'Ramos Diaz',
  area: 'Almacen',
  cargo: 'Operario',
  email: 'maria.ramos@example.com',
  id: 7,
  nombres: 'Maria',
  numeroDocumento: '70112233',
  telefono: '999888777',
  tipoDocumento: 'DNI',
}

const jefeAlmacen: AuthUser = {
  apellidos: 'Almacen',
  email: 'jefe.almacen@example.com',
  nombres: 'Jefe',
  permisos: [
    'PERSONAL_VER',
    'PERSONAL_CREAR',
    'PERSONAL_EDITAR',
    'PERSONAL_DESACTIVAR',
  ],
  roles: ['JEFE_ALMACEN'],
  username: 'jefe.almacen',
}

function renderPage(user: AuthUser) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        status: 'authenticated',
        user,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PersonalPage />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
}

describe('PersonalPage y permisos PERSONAL_*', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(personalService.getPersonal).mockResolvedValue({
      content: [personal],
      number: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    })
    vi.mocked(personalService.getPersonalById).mockResolvedValue(personal)
  })

  it('renderiza la gestion completa para JEFE_ALMACEN y permite ver el detalle', async () => {
    const user = userEvent.setup()
    renderPage(jefeAlmacen)

    expect(await screen.findByText(/70112233/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo personal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver' }))

    await waitFor(() => {
      expect(personalService.getPersonalById).toHaveBeenCalledWith(7)
    })
    expect(screen.getByRole('heading', { name: 'Detalle de personal' })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText('maria.ramos@example.com')).toBeInTheDocument()
  })

  it('con PERSONAL_VER muestra listado y detalle, pero oculta acciones de escritura', async () => {
    renderPage({
      ...jefeAlmacen,
      permisos: ['PERSONAL_VER'],
    })

    expect(await screen.findByText(/70112233/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo personal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
  })

  it('mantiene la gestion completa para USUARIO_ADMIN', async () => {
    renderPage({
      ...jefeAlmacen,
      permisos: ['USUARIO_ADMIN'],
      roles: ['GESTOR'],
    })

    expect(await screen.findByText(/70112233/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo personal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()
  })
})
