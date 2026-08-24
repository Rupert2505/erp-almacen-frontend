import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Movimiento } from '../types/movimiento.types'
import { MovimientoViewModal } from './MovimientoViewModal'

describe('MovimientoViewModal', () => {
  it('muestra datos de cancelacion para movimiento CANCELADO', () => {
    const movimiento: Movimiento = {
      id: 1,
      numero: 'MOV-001',
      tipoMovimiento: 'ENTRADA_COMPRA',
      estado: 'CANCELADO',
      motivoCancelacion: 'Error de digitacion',
      canceladoPor: 'admin',
      canceladoEn: '2026-06-12T10:00:00',
      detalles: [],
    }

    render(
      <MovimientoViewModal
        isLoading={false}
        isOpen
        movimiento={movimiento}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByText('Motivo cancelacion')).toBeInTheDocument()
    expect(screen.getByText('Error de digitacion')).toBeInTheDocument()
    expect(screen.getByText('Cancelado por')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('Cancelado en')).toBeInTheDocument()
  })

  it('muestra motivo y usuario para movimiento ANULADO', () => {
    const movimiento: Movimiento = {
      id: 2,
      numero: 'MOV-002',
      tipoMovimiento: 'SALIDA_CONSUMO',
      estado: 'ANULADO',
      motivoAnulacion: 'Cantidad ingresada por error',
      anuladoPor: 'admin',
      anuladoEn: '2026-08-22T11:30:00',
      detalles: [],
    }

    render(
      <MovimientoViewModal
        isLoading={false}
        isOpen
        movimiento={movimiento}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByText('Motivo anulacion')).toBeInTheDocument()
    expect(screen.getByText('Cantidad ingresada por error')).toBeInTheDocument()
    expect(screen.getByText('Anulado por')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getAllByText('Anulado en')).toHaveLength(2)
  })

  it('muestra snapshots comerciales historicos y no los reconstruye desde Producto', () => {
    const movimiento: Movimiento = {
      id: 2,
      numero: 'MOV-VENTA-001',
      tipoMovimiento: 'SALIDA_VENTA',
      estado: 'CONFIRMADO',
      ordenTrabajo: 'OS-TEST-001',
      detalles: [
        {
          id: 20,
          productoId: 5,
          productoCodigo: 'P-005',
          productoNombre: 'Material OS',
          cantidad: 2,
          costoBaseComercialSinIgv: 12.71,
          recargoComercialPct: 35,
          valorVentaUnitarioSinIgv: 17.16,
          igvUnitario: 3.09,
          precioVentaUnitarioConIgv: 20.25,
          valorVentaTotalSinIgv: 34.32,
          igvTotal: 6.18,
          precioVentaTotalConIgv: 40.5,
          costoInventarioUnitario: 10,
          costoInventarioTotal: 20,
          diferenciaComercialSinIgv: 14.32,
        },
      ],
    }

    render(
      <MovimientoViewModal
        isLoading={false}
        isOpen
        movimiento={movimiento}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByText('Orden de Servicio (OS)')).toBeInTheDocument()
    expect(screen.getByText('OS-TEST-001')).toBeInTheDocument()
    expect(screen.getByText('Costo base comercial sin IGV')).toBeInTheDocument()
    expect(screen.getAllByText(/12\.71/).length).toBeGreaterThan(0)
    expect(screen.getByText('35%')).toBeInTheDocument()
    expect(screen.getAllByText(/40\.50/).length).toBeGreaterThan(0)
    expect(screen.getByText('Cálculo por unidad')).toBeInTheDocument()
    expect(screen.getByText('Totales del detalle')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Diferencia comercial positiva')).toHaveLength(2)
    for (const difference of screen.getAllByLabelText('Diferencia comercial positiva')) {
      expect(difference).toHaveClass('border-blue-200', 'bg-blue-50')
    }
    expect(screen.getAllByLabelText('Costo total inventario destacado')).toHaveLength(2)
    for (const inventoryTotal of screen.getAllByLabelText(
      'Costo total inventario destacado',
    )) {
      expect(inventoryTotal).toHaveClass('border-amber-200', 'bg-amber-50')
    }
    expect(screen.getAllByLabelText('Precio total con IGV destacado')).toHaveLength(2)
    for (const priceTotal of screen.getAllByLabelText('Precio total con IGV destacado')) {
      expect(priceTotal).toHaveClass('border-emerald-200', 'bg-emerald-50')
    }
  })

  it('tolera snapshots pre-V19 nulos sin mostrar undefined ni NaN', () => {
    const movimiento: Movimiento = {
      id: 3,
      numero: 'MOV-HIST-001',
      tipoMovimiento: 'SALIDA_VENTA',
      estado: 'ANULADO',
      ordenTrabajo: 'OS-HIST-001',
      detalles: [
        {
          id: 30,
          productoId: 6,
          productoCodigo: 'P-006',
          productoNombre: 'Material historico',
          cantidad: 1,
          costoBaseComercialSinIgv: null,
          recargoComercialPct: null,
          valorVentaUnitarioSinIgv: null,
          igvUnitario: null,
          precioVentaUnitarioConIgv: null,
          valorVentaTotalSinIgv: null,
          igvTotal: null,
          precioVentaTotalConIgv: null,
          costoInventarioUnitario: null,
          costoInventarioTotal: null,
          diferenciaComercialSinIgv: null,
        },
      ],
    }

    const { container } = render(
      <MovimientoViewModal
        isLoading={false}
        isOpen
        movimiento={movimiento}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByText('Anulado')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('undefined')
    expect(container).not.toHaveTextContent('NaN')
  })

  it('advierte sin bloquear cuando la diferencia comercial snapshot es negativa', () => {
    const movimiento: Movimiento = {
      id: 4,
      numero: 'MOV-VENTA-NEG',
      tipoMovimiento: 'SALIDA_VENTA',
      estado: 'CONFIRMADO',
      ordenTrabajo: 'OS-NEG',
      detalles: [
        {
          id: 40,
          productoId: 7,
          cantidad: 1,
          costoInventarioTotal: 100,
          valorVentaTotalSinIgv: 90,
          diferenciaComercialSinIgv: -10,
        },
      ],
    }

    render(
      <MovimientoViewModal
        isLoading={false}
        isOpen
        movimiento={movimiento}
        onClose={() => undefined}
      />,
    )

    expect(
      screen.getByText('El valor comercial es inferior al costo de inventario.'),
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('Diferencia comercial negativa')).toHaveLength(2)
    for (const difference of screen.getAllByLabelText('Diferencia comercial negativa')) {
      expect(difference).toHaveClass('border-red-200', 'bg-red-50')
    }
  })
})
