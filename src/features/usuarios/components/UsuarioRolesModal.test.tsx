import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Rol } from '../types/rol.types'
import type { Usuario } from '../types/usuario.types'
import { UsuarioRolesModal } from './UsuarioRolesModal'

const roles: Rol[] = [
  {
    id: 3,
    nombre: 'OPERADOR_ALMACEN',
    descripcion: 'Operador de procesos de almacen',
    activo: true,
  },
  {
    id: 4,
    nombre: 'CONSULTA',
    descripcion: 'Usuario de consulta',
    activo: true,
  },
]

const usuario: Usuario = {
  id: 10,
  username: 'operador',
  nombres: 'OPERADOR',
  apellidos: 'OPERADOR',
  email: 'operador@erpalmacen.local',
  activo: true,
  roles: [roles[0]],
  permisos: [],
}

describe('UsuarioRolesModal', () => {
  it('muestra roles actuales y envia ids como numeros', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <UsuarioRolesModal
        isOpen
        isSaving={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        roles={roles}
        usuario={usuario}
      />,
    )

    expect(screen.getByRole('checkbox', { name: /OPERADOR_ALMACEN/i })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: /CONSULTA/i }))
    await user.click(screen.getByRole('button', { name: 'Guardar roles' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          rolesIds: [3, 4],
        },
        expect.anything(),
      )
    })
  })
})
