import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProductoFormModal } from './ProductoFormModal'

describe('ProductoFormModal', () => {
  it('muestra el concepto comercial conservando costoReferencial como campo del formulario', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductoFormModal
          canCreateCatalogs={false}
          familias={[]}
          isLoadingOptions={false}
          isOpen
          isSaving={false}
          marcas={[]}
          mode="create"
          onClose={vi.fn()}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          tiposArticulo={[]}
          unidadesMedida={[]}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByLabelText('Costo base comercial sin IGV')).toHaveAttribute(
      'name',
      'costoReferencial',
    )
    expect(
      screen.getByText(
        /Base manual utilizada para calcular el valor comercial de materiales en salidas de venta/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/No modifica el costo promedio del inventario/i)).toBeInTheDocument()
  })

  it('destaca visualmente los botones para crear catalogos relacionados', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <ProductoFormModal
          canCreateCatalogs
          familias={[]}
          isLoadingOptions={false}
          isOpen
          isSaving={false}
          marcas={[]}
          mode="create"
          onClose={vi.fn()}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          tiposArticulo={[]}
          unidadesMedida={[]}
        />
      </QueryClientProvider>,
    )

    const botones = [
      screen.getByRole('button', { name: 'Nueva familia' }),
      screen.getByRole('button', { name: 'Nueva subfamilia' }),
      screen.getByRole('button', { name: 'Nueva marca' }),
      screen.getByRole('button', { name: 'Nuevo tipo de articulo' }),
    ]

    botones.forEach((boton) => {
      expect(boton).toHaveClass('border-cyan-300', 'bg-cyan-50', 'text-cyan-700')
    })
    expect(screen.getByRole('button', { name: 'Nueva subfamilia' })).toBeDisabled()
  })
})
