import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Rol } from '../types/rol.types'
import { UsuarioFormModal } from './UsuarioFormModal'

const roles: Rol[] = [
  {
    id: 3,
    nombre: 'OPERADOR_ALMACEN',
    descripcion: 'Operador de procesos de almacen',
    activo: true,
  },
]

describe('UsuarioFormModal', () => {
  it('envia creacion con roles seleccionados como numeros', async () => {
    const user = userEvent.setup()
    const onCreateSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <UsuarioFormModal
        isOpen
        isSaving={false}
        mode="create"
        onClose={vi.fn()}
        onCreateSubmit={onCreateSubmit}
        onEditSubmit={vi.fn()}
        roles={roles}
      />,
    )

    await user.type(screen.getByLabelText('Username'), 'operador')
    await user.type(screen.getByLabelText('Password'), 'Password123')
    await user.type(screen.getByLabelText('Nombres'), 'OPERADOR')
    await user.type(screen.getByLabelText('Apellidos'), 'OPERADOR')
    await user.type(screen.getByLabelText('Email'), 'operador@erpalmacen.local')
    await user.click(screen.getByRole('checkbox', { name: /OPERADOR_ALMACEN/i }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onCreateSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'operador',
          rolesIds: [3],
        }),
        expect.anything(),
      )
    })
  })
})
