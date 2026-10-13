import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../auth/context/authContextDefinition'
import type { AuthUser } from '../../auth/types/auth.types'
import { almacenService } from '../services/almacenService'
import { ubicacionService } from '../services/ubicacionService'
import type { Almacen } from '../types/almacen.types'
import type { Ubicacion } from '../types/ubicacion.types'
import { AlmacenesPage } from './AlmacenesPage'
import { UbicacionesPage } from './UbicacionesPage'

vi.mock('../services/almacenService', () => ({
  almacenService: {
    activarAlmacen: vi.fn(),
    createAlmacen: vi.fn(),
    desactivarAlmacen: vi.fn(),
    getAlmacen: vi.fn(),
    getAlmacenes: vi.fn(),
    getAlmacenesActivos: vi.fn(),
    updateAlmacen: vi.fn(),
  },
  getAlmacenApiErrorMessage: vi.fn(() => 'No se pudo completar la operacion.'),
}))

vi.mock('../services/ubicacionService', () => ({
  ubicacionService: {
    activarUbicacion: vi.fn(),
    createUbicacion: vi.fn(),
    desactivarUbicacion: vi.fn(),
    getUbicacion: vi.fn(),
    getUbicaciones: vi.fn(),
    updateUbicacion: vi.fn(),
  },
}))

const almacenes: Almacen[] = [
  {
    activo: true,
    codigo: 'ALM1',
    id: 1,
    nombre: 'Almacen principal',
  },
  {
    activo: false,
    codigo: 'ALM2',
    id: 2,
    nombre: 'Almacen secundario',
  },
]

const ubicaciones: Ubicacion[] = [
  {
    activo: true,
    almacenCodigo: 'ALM1',
    almacenId: 1,
    almacenNombre: 'Almacen principal',
    codigo: 'RACK-01',
    id: 10,
    nombre: 'Rack uno',
  },
  {
    activo: false,
    almacenCodigo: 'ALM1',
    almacenId: 1,
    almacenNombre: 'Almacen principal',
    codigo: 'RACK-02',
    id: 11,
    nombre: 'Rack dos',
  },
]

const jefeAlmacen: AuthUser = {
  apellidos: 'Almacen',
  email: 'jefe.almacen@example.com',
  nombres: 'Jefe',
  permisos: [
    'ALMACEN_VER',
    'ALMACEN_CREAR',
    'ALMACEN_EDITAR',
    'ALMACEN_DESACTIVAR',
  ],
  roles: ['JEFE_ALMACEN'],
  username: 'jefe.almacen',
}

function renderPage(page: React.ReactNode, user: AuthUser = jefeAlmacen) {
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
        <MemoryRouter>{page}</MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
}

describe('permisos ALMACEN_* para JEFE_ALMACEN', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(almacenService.getAlmacenes).mockResolvedValue({
      content: almacenes,
      number: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
    })
    vi.mocked(almacenService.getAlmacenesActivos).mockResolvedValue([almacenes[0]])
    vi.mocked(ubicacionService.getUbicaciones).mockResolvedValue({
      content: ubicaciones,
      number: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
    })
  })

  it('muestra crear, editar y activar/desactivar en Almacenes', async () => {
    renderPage(<AlmacenesPage />)

    expect(await screen.findByText('ALM1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo almacen' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument()
  })

  it('muestra crear, editar y activar/desactivar en Ubicaciones', async () => {
    renderPage(<UbicacionesPage />)

    expect(await screen.findByText('RACK-01')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nueva ubicacion' })).toBeEnabled()
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument()
  })

  it('con solo ALMACEN_VER mantiene el listado y oculta acciones de escritura', async () => {
    renderPage(<AlmacenesPage />, {
      ...jefeAlmacen,
      permisos: ['ALMACEN_VER'],
    })

    expect(await screen.findByText('ALM1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo almacen' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activar' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ubicaciones' })).toHaveLength(2)
  })
})
