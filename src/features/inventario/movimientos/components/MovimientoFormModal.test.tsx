import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { productoService } from '../../../productos/services/productoService'
import { proveedorService } from '../../../proveedores/services/proveedorService'
import { stockService } from '../../stock/services/stockService'
import { MovimientoFormModal } from './MovimientoFormModal'

vi.mock('../../../productos/services/productoService', () => ({
  productoService: {
    getProductos: vi.fn(),
  },
}))

vi.mock('../../../proveedores/services/proveedorService', () => ({
  proveedorService: {
    getProveedores: vi.fn(),
  },
}))

vi.mock('../../stock/services/stockService', () => ({
  stockService: {
    getStock: vi.fn(),
  },
}))

const almacenes = [
  {
    id: 1,
    codigo: 'ALM-01',
    nombre: 'Principal',
    direccion: null,
    responsable: null,
    activo: true,
  },
  {
    id: 2,
    codigo: 'ALM-02',
    nombre: 'Secundario',
    direccion: null,
    responsable: null,
    activo: true,
  },
]

const proveedores = [
  {
    id: 10,
    tipoDocumento: 'RUC',
    numeroDocumento: '20123456789',
    razonSocial: 'Proveedor Acme',
    nombreComercial: 'Acme',
    direccion: null,
    telefono: null,
    email: null,
    activo: true,
  },
]

const productos = [
  {
    id: 20,
    codigo: 'P-001',
    nombre: 'Producto prueba',
    descripcion: 'Producto para tests',
    tipoArticuloId: 1,
    familiaId: 1,
    unidadMedidaId: 1,
    controlaLote: false,
    controlaSerie: false,
    activo: true,
  },
]

const ubicaciones = [
  {
    id: 30,
    almacenId: 1,
    almacenCodigo: 'ALM-01',
    almacenNombre: 'Principal',
    codigo: 'UB-01',
    nombre: 'Recepcion',
    descripcion: null,
    activo: true,
  },
  {
    id: 31,
    almacenId: 2,
    almacenCodigo: 'ALM-02',
    almacenNombre: 'Secundario',
    codigo: 'UB-02',
    nombre: 'Otra ubicacion',
    descripcion: null,
    activo: true,
  },
]

function renderModal(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MovimientoFormModal
      almacenes={almacenes}
      isOpen
      isSaving={false}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      productos={productos}
      proveedores={proveedores}
      ubicaciones={ubicaciones}
    />,
  )

  return onSubmit
}

type MovimientoFormModalProps = ComponentProps<typeof MovimientoFormModal>

function ToggleMovimientoModal({ onSubmit }: { onSubmit: MovimientoFormModalProps['onSubmit'] }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      <button onClick={() => setIsOpen(true)} type="button">
        Abrir nuevo
      </button>
      <MovimientoFormModal
        almacenes={almacenes}
        isOpen={isOpen}
        isSaving={false}
        onClose={() => setIsOpen(false)}
        onSubmit={onSubmit}
        productos={productos}
        proveedores={proveedores}
        ubicaciones={ubicaciones}
      />
    </>
  )
}

async function selectProveedorAndProducto() {
  const user = userEvent.setup()

  await user.type(screen.getByPlaceholderText('Buscar proveedor'), 'Acme')
  await user.click(await screen.findByText('20123456789 - Proveedor Acme'))

  await user.type(screen.getByPlaceholderText('Buscar producto'), 'P-001')
  await user.click(await screen.findByText('P-001 - Producto prueba'))

  return user
}

async function fillEntradaCompraBasica() {
  const user = await selectProveedorAndProducto()

  await user.selectOptions(screen.getByLabelText('Almacen destino'), '1')
  await user.type(screen.getByLabelText('Fecha recepcion'), '2026-06-11')
  await user.type(screen.getByLabelText('Costo unitario linea 1'), '12.345678')

  return user
}

describe('MovimientoFormModal', () => {
  beforeEach(() => {
    vi.mocked(productoService.getProductos).mockResolvedValue({
      content: productos,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    })
    vi.mocked(proveedorService.getProveedores).mockResolvedValue({
      content: proveedores,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    })
    vi.mocked(stockService.getStock).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
    })
  })

  it('renderiza secciones principales para entrada compra', () => {
    renderModal()

    expect(screen.getByText('Datos generales del movimiento')).toBeInTheDocument()
    expect(screen.getByText('Documentos de compra y recepcion')).toBeInTheDocument()
    expect(screen.getByText('Detalles')).toBeInTheDocument()
    expect(screen.getByText('Guia de remision')).toBeInTheDocument()
    expect(screen.getByText('Comprobante de compra')).toBeInTheDocument()
    expect(screen.getByText('Orden y recepcion')).toBeInTheDocument()
    expect(screen.getByText('Costos adicionales')).toBeInTheDocument()
  })

  it('muestra tipo comprobante como select con valores productivos', async () => {
    const user = userEvent.setup()
    renderModal()

    const tipoComprobante = screen.getByLabelText('Tipo comprobante (opcional)')
    expect(tipoComprobante).toHaveDisplayValue('Sin comprobante')
    expect(screen.getByRole('option', { name: 'Sin comprobante' })).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Factura' })).toHaveValue('FACTURA')
    expect(screen.getByRole('option', { name: 'Boleta' })).toHaveValue('BOLETA')
    expect(screen.getByRole('option', { name: 'Otro' })).toHaveValue('OTRO')

    await user.selectOptions(tipoComprobante, 'BOLETA')
    expect(tipoComprobante).toHaveValue('BOLETA')
  })

  it('guarda borrador con confirmar false y boton ambar', async () => {
    const onSubmit = renderModal()
    const user = await fillEntradaCompraBasica()

    const guardarBorrador = screen.getByRole('button', { name: 'Guardar borrador' })
    expect(guardarBorrador.className).toContain('bg-amber-600')
    expect(guardarBorrador.className).toContain('text-white')

    await user.click(guardarBorrador)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          proveedorId: 10,
          almacenDestinoId: 1,
          detalles: expect.arrayContaining([expect.objectContaining({ productoId: 20 })]),
        }),
        { confirmar: false },
      )
    })
  })

  it('inicia con una sola linea y resetea detalles al cerrar y reabrir', async () => {
    const user = userEvent.setup()
    render(<ToggleMovimientoModal onSubmit={vi.fn().mockResolvedValue(undefined)} />)

    expect(screen.getByText('Lineas:').parentElement).toHaveTextContent('Lineas: 1')

    await user.click(screen.getByRole('button', { name: 'Agregar linea' }))
    expect(screen.getByText('Lineas:').parentElement).toHaveTextContent('Lineas: 2')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Abrir nuevo' }))

    expect(screen.getByText('Lineas:').parentElement).toHaveTextContent('Lineas: 1')

    await user.click(screen.getByRole('button', { name: 'Agregar linea' }))
    expect(screen.getByText('Lineas:').parentElement).toHaveTextContent('Lineas: 2')
  })

  it('pide confirmacion y guarda con confirmar true', async () => {
    const onSubmit = renderModal()
    const user = await fillEntradaCompraBasica()
    await user.click(screen.getByRole('button', { name: 'Guardar y confirmar' }))

    expect(
      screen.getByText(/Esta accion guardara y confirmara el movimiento/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Si, guardar y confirmar' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.any(Object), { confirmar: true })
    })
  })

  it('valida fechas y costos adicionales', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Fecha pedido (opcional)'), '2026-06-11')
    await user.type(screen.getByLabelText('Fecha recepcion'), '2026-06-10')
    await user.clear(screen.getByLabelText('Flete (opcional)'))
    await user.type(screen.getByLabelText('Flete (opcional)'), '-1')
    await user.clear(screen.getByLabelText('Movilidad (opcional)'))
    await user.type(screen.getByLabelText('Movilidad (opcional)'), '-2')
    await user.clear(screen.getByLabelText('Otros gastos (opcional)'))
    await user.type(screen.getByLabelText('Otros gastos (opcional)'), '-3')
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    expect(
      await screen.findByText('La fecha de recepcion no puede ser menor que la fecha de pedido'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('No puede ser negativo')).toHaveLength(3)
  })

  it('ENTRADA_COMPRA muestra solo campos de entrada y documentos', () => {
    renderModal()

    expect(screen.getByText('Documentos de compra y recepcion')).toBeInTheDocument()
    expect(screen.getByLabelText('Proveedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Almacen destino')).toBeInTheDocument()
    expect(screen.queryByLabelText('Almacen origen')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Motivo movimiento/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Orden trabajo/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Responsable entrega/i)).not.toBeInTheDocument()
  })

  it('SALIDA_CONSUMO muestra campos de consumo y oculta documentos', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'SALIDA_CONSUMO')

    expect(screen.queryByText('Documentos de compra y recepcion')).not.toBeInTheDocument()
    expect(screen.getByText('Datos complementarios')).toBeInTheDocument()
    expect(screen.getByLabelText('Almacen origen')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo movimiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Observacion')).toBeInTheDocument()
    expect(screen.getByLabelText('Orden trabajo (opcional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Area solicitante (opcional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Solicitante (opcional)')).toBeInTheDocument()
    expect(screen.queryByLabelText('Almacen destino')).not.toBeInTheDocument()
  })

  it('SALIDA_VENTA no carga costo sin almacen origen', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'SALIDA_VENTA')
    await user.type(screen.getByPlaceholderText('Buscar producto'), 'P-001')
    await user.click(await screen.findByText('P-001 - Producto prueba'))

    const costoInput = screen.getByLabelText('Costo unitario linea 1')
    expect(costoInput).toHaveAttribute('readonly')
    expect(
      await screen.findByText(
        'Seleccione el almacen origen en Datos generales para cargar el costo actual.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Seleccione el almacen origen en Datos generales para habilitar ubicaciones.',
      ),
    ).toBeInTheDocument()
    expect(stockService.getStock).not.toHaveBeenCalled()
  })

  it('SALIDA_VENTA carga costo actual desde stock con producto y almacen origen', async () => {
    const onSubmit = renderModal()
    const user = userEvent.setup()
    vi.mocked(stockService.getStock).mockResolvedValue({
      content: [
        {
          id: 50,
          productoId: 20,
          productoCodigo: 'P-001',
          productoNombre: 'Producto prueba',
          almacenId: 1,
          almacenCodigo: 'ALM-01',
          almacenNombre: 'Principal',
          ubicacionId: 30,
          ubicacionCodigo: 'UB-01',
          ubicacionNombre: 'Recepcion',
          cantidadActual: 25,
          costoPromedio: 99.123456,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    })

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'SALIDA_VENTA')
    await user.selectOptions(screen.getByLabelText('Almacen origen'), '1')
    await user.type(screen.getByPlaceholderText('Buscar producto'), 'P-001')
    await user.click(await screen.findByText('P-001 - Producto prueba'))

    const costoInput = screen.getByLabelText('Costo unitario linea 1')
    expect(costoInput).toHaveAttribute('readonly')

    await waitFor(() => {
      expect(stockService.getStock).toHaveBeenCalledWith(
        expect.objectContaining({
          almacenId: 1,
          productoId: 20,
        }),
      )
      expect(costoInput).toHaveValue(99.123456)
    })
    expect(screen.getByDisplayValue('UB-01 - Recepcion')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'UB-02 - Otra ubicacion' })).not.toBeInTheDocument()
    expect(screen.getByText('Stock disponible: 25')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimiento: 'SALIDA_VENTA',
          detalles: expect.arrayContaining([
            expect.objectContaining({
              costoUnitario: 99.123456,
              productoId: 20,
            }),
          ]),
        }),
        { confirmar: false },
      )
    })
  })

  it('SALIDA_VENTA recalcula costo al cambiar almacen origen', async () => {
    renderModal()
    const user = userEvent.setup()
    vi.mocked(stockService.getStock)
      .mockResolvedValueOnce({
        content: [
          {
            id: 50,
            productoId: 20,
            productoCodigo: 'P-001',
            productoNombre: 'Producto prueba',
            almacenId: 1,
            almacenCodigo: 'ALM-01',
            almacenNombre: 'Principal',
            ubicacionId: null,
            cantidadActual: 25,
            costoPromedio: 99.123456,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 51,
            productoId: 20,
            productoCodigo: 'P-001',
            productoNombre: 'Producto prueba',
            almacenId: 2,
            almacenCodigo: 'ALM-02',
            almacenNombre: 'Secundario',
            ubicacionId: null,
            cantidadActual: 10,
            costoPromedio: 120.5,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      })

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'SALIDA_VENTA')
    await user.selectOptions(screen.getByLabelText('Almacen origen'), '1')
    await user.type(screen.getByPlaceholderText('Buscar producto'), 'P-001')
    await user.click(await screen.findByText('P-001 - Producto prueba'))

    const costoInput = screen.getByLabelText('Costo unitario linea 1')
    await waitFor(() => expect(costoInput).toHaveValue(99.123456))

    await user.selectOptions(screen.getByLabelText('Almacen origen'), '2')

    await waitFor(() => expect(costoInput).toHaveValue(120.5))
  })

  it('SALIDA_VENTA muestra advertencia cuando stock es cero', async () => {
    renderModal()
    const user = userEvent.setup()
    vi.mocked(stockService.getStock).mockResolvedValueOnce({
      content: [
        {
          id: 50,
          productoId: 20,
          productoCodigo: 'P-001',
          productoNombre: 'Producto prueba',
          almacenId: 1,
          almacenCodigo: 'ALM-01',
          almacenNombre: 'Principal',
          ubicacionId: null,
          cantidadActual: 0,
          costoPromedio: 99.123456,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    })

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'SALIDA_VENTA')
    await user.selectOptions(screen.getByLabelText('Almacen origen'), '1')
    await user.type(screen.getByPlaceholderText('Buscar producto'), 'P-001')
    await user.click(await screen.findByText('P-001 - Producto prueba'))

    const costoInput = screen.getByLabelText('Costo unitario linea 1')

    await waitFor(() => {
      expect(screen.getByText('Producto sin stock en el almacen seleccionado.')).toBeInTheDocument()
      expect(costoInput).toHaveValue(null)
    })
  })

  it('TRANSFERENCIA muestra origen y destino con responsables opcionales', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'TRANSFERENCIA')

    expect(screen.getByLabelText('Almacen origen')).toBeInTheDocument()
    expect(screen.getByLabelText('Almacen destino')).toBeInTheDocument()
    expect(screen.getByLabelText('Responsable entrega (opcional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Responsable recepcion (opcional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo movimiento (opcional)')).toBeInTheDocument()
  })

  it('AJUSTE_POSITIVO muestra solo destino operativo', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'AJUSTE_POSITIVO')

    expect(screen.getByLabelText('Almacen destino')).toBeInTheDocument()
    expect(screen.queryByLabelText('Almacen origen')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Motivo movimiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Observacion')).toBeInTheDocument()
  })

  it('AJUSTE_NEGATIVO muestra solo origen operativo', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'AJUSTE_NEGATIVO')

    expect(screen.getByLabelText('Almacen origen')).toBeInTheDocument()
    expect(screen.queryByLabelText('Almacen destino')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Motivo movimiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Observacion')).toBeInTheDocument()
  })

  it('cambiar tipo limpia campos que no aplican', async () => {
    const onSubmit = renderModal()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Serie guia (opcional)'), 'T001')
    await user.type(screen.getByLabelText('Numero guia (opcional)'), '123')
    await user.type(screen.getByLabelText('Fecha recepcion'), '2026-06-11')
    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'SALIDA_CONSUMO')

    expect(screen.queryByLabelText('Serie guia (opcional)')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Almacen origen'), '1')
    await user.type(screen.getByLabelText('Motivo movimiento'), 'Consumo interno')
    await user.type(screen.getByLabelText('Observacion'), 'Salida para operacion')
    await user.type(screen.getByPlaceholderText('Buscar producto'), 'P-001')
    await user.click(await screen.findByText('P-001 - Producto prueba'))
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          guiaSerie: '',
          guiaNumero: '',
          fechaRecepcion: '',
          tipoMovimiento: 'SALIDA_CONSUMO',
        }),
        { confirmar: false },
      )
    })
  })

  it('valida obligatorios por tipo', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText('Tipo movimiento'), 'AJUSTE_POSITIVO')
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    expect(await screen.findByText('Seleccione un almacen destino')).toBeInTheDocument()
    expect(screen.getByText('Ingrese el motivo del movimiento')).toBeInTheDocument()
    expect(screen.getByText('Ingrese la observacion')).toBeInTheDocument()
  })

  it('valida coherencia de guia y comprobante', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Serie guia (opcional)'), 'T001')
    await user.type(screen.getByLabelText('Serie comprobante (opcional)'), 'F001')
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    expect(await screen.findByText('Ingrese el numero de guia')).toBeInTheDocument()
    expect(screen.getByText('Ingrese el numero de comprobante')).toBeInTheDocument()
  })

  it('busca proveedor y producto por texto', async () => {
    renderModal()
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Buscar proveedor'), '201234')
    await user.click(await screen.findByText('20123456789 - Proveedor Acme'))

    await user.type(screen.getByPlaceholderText('Buscar producto'), 'Producto')
    await user.click(await screen.findByText('P-001 - Producto prueba'))

    await waitFor(() => {
      expect(proveedorService.getProveedores).toHaveBeenCalledWith(
        expect.objectContaining({ size: 10, texto: '201234' }),
      )
      expect(productoService.getProductos).toHaveBeenCalledWith(
        expect.objectContaining({ size: 10, texto: 'Producto' }),
      )
    })
  })

  it('al escribir filtra proveedor y producto sin mantener opciones precargadas arriba', async () => {
    vi.mocked(proveedorService.getProveedores).mockResolvedValue({
      content: [
        {
          ...proveedores[0],
          id: 11,
          numeroDocumento: '20999999999',
          razonSocial: 'Implementos Industriales SAC',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    })
    vi.mocked(productoService.getProductos).mockResolvedValue({
      content: [
        {
          ...productos[0],
          id: 21,
          codigo: 'IMP-001',
          nombre: 'Implemento filtrado',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    })

    renderModal()
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Buscar proveedor'), 'implementos')
    expect(await screen.findByText('20999999999 - Implementos Industriales SAC')).toBeInTheDocument()
    expect(screen.queryByText('20123456789 - Proveedor Acme')).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Buscar producto'), 'implemento')
    expect(await screen.findByText('IMP-001 - Implemento filtrado')).toBeInTheDocument()
    expect(screen.queryByText('P-001 - Producto prueba')).not.toBeInTheDocument()
  })
})
