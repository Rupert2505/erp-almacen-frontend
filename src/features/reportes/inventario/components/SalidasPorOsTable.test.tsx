import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
  SalidaValorizadaOsResponse,
  SalidaValorizadaOsResumenResponse,
} from '../types/reporteInventario.types'
import { SalidasPorOsTable } from './SalidasPorOsTable'

const rows: SalidaValorizadaOsResponse[] = [
  {
    fecha: '2026-08-18T10:00:00',
    movimientoId: 1,
    numeroMovimiento: 'MOV-001',
    estado: 'CONFIRMADO',
    ordenTrabajo: 'OS-001',
    productoId: 10,
    codigoProducto: 'P-001',
    descripcionProducto: 'Primer material',
    cantidad: 2,
    unidadMedida: 'UNIDAD',
    costoInventarioUnitario: 10,
    costoInventarioTotal: 20,
    costoBaseComercialUnitarioSinIgv: 12.71,
    recargoAplicadoPct: 35,
    valorVentaUnitarioSinIgv: 17.16,
    valorVentaTotalSinIgv: 34.32,
    igvUnitario: 3.09,
    igvTotal: 6.18,
    precioVentaUnitarioConIgv: 20.25,
    precioVentaTotalConIgv: 40.5,
    diferenciaComercialSinIgv: 14.32,
  },
  {
    fecha: '2026-08-18T11:00:00',
    movimientoId: 2,
    numeroMovimiento: 'MOV-002',
    estado: 'CONFIRMADO',
    ordenTrabajo: 'OS-001',
    productoId: 11,
    codigoProducto: 'P-002',
    descripcionProducto: 'Segundo material',
    cantidad: 1,
    unidadMedida: 'UNIDAD',
    diferenciaComercialSinIgv: null,
  },
  {
    fecha: '2026-08-18T12:00:00',
    movimientoId: 3,
    numeroMovimiento: 'MOV-003',
    estado: 'ANULADO',
    ordenTrabajo: 'OS-002',
    productoId: 12,
    codigoProducto: 'P-003',
    descripcionProducto: 'Tercer material',
    cantidad: 1,
    unidadMedida: 'UNIDAD',
    costoInventarioTotal: 100,
    valorVentaTotalSinIgv: 90,
    diferenciaComercialSinIgv: -10,
  },
]

const resumen: SalidaValorizadaOsResumenResponse[] = [
  {
    ordenTrabajo: 'OS-001',
    cantidadMovimientos: 2,
    cantidadItems: 2,
    costoTotalInventario: 20,
    valorComercialTotalSinIgv: 34.32,
    igvTotal: 6.18,
    precioTotalConIgv: 40.5,
    diferenciaComercialSinIgv: 14.32,
  },
  {
    ordenTrabajo: 'OS-002',
    cantidadMovimientos: 1,
    cantidadItems: 1,
    costoTotalInventario: 100,
    valorComercialTotalSinIgv: 90,
    igvTotal: 16.2,
    precioTotalConIgv: 106.2,
    diferenciaComercialSinIgv: -10,
  },
]

describe('SalidasPorOsTable', () => {
  it('muestra multiples salidas de una OS, diferencia otras OS y usa el resumen backend', () => {
    render(
      <SalidasPorOsTable
        isLoading={false}
        resumenPorOs={resumen}
        rows={rows}
        showCosts
      />,
    )

    expect(screen.getAllByText('OS-001').length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByText('OS-002').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('2 movimiento(s) · 2 item(s)')).toBeInTheDocument()
    expect(screen.getByText('35.00%')).toBeInTheDocument()
    expect(screen.getAllByText('2.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Anulado')).toBeInTheDocument()
    expect(
      screen.getByText('El valor comercial es inferior al costo de inventario.'),
    ).toBeInTheDocument()
  })

  it('tolera campos comerciales nulos sin renderizar NaN ni undefined', () => {
    const { container } = render(
      <SalidasPorOsTable isLoading={false} resumenPorOs={[]} rows={[rows[1]]} showCosts />,
    )

    expect(container).not.toHaveTextContent('NaN')
    expect(container).not.toHaveTextContent('undefined')
  })
})
