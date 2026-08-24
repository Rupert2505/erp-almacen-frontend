import type { MovimientoDetallePayload, TipoMovimiento } from '../types/movimiento.types'

export type MovimientoDetalleFormValue = MovimientoDetallePayload & {
  valorUnitarioSinIgv?: number | null
  tasaIgv?: number | null
  igvRecuperable?: boolean | null
}

type BuildMovimientoDetallePayloadOptions = {
  usaDestino: boolean
  usaOrigen: boolean
}

export function buildMovimientoDetallePayload(
  tipoMovimiento: TipoMovimiento,
  detalle: MovimientoDetalleFormValue,
  options: BuildMovimientoDetallePayloadOptions,
): MovimientoDetallePayload {
  const base = {
    productoId: detalle.productoId,
    ubicacionDestinoId: options.usaDestino ? detalle.ubicacionDestinoId : null,
    ubicacionOrigenId: options.usaOrigen ? detalle.ubicacionOrigenId : null,
    cantidad: detalle.cantidad,
    observacion: detalle.observacion?.trim() || null,
  }

  if (tipoMovimiento === 'ENTRADA_COMPRA') {
    return {
      ...base,
      igvRecuperable: detalle.igvRecuperable ?? true,
      tasaIgv: detalle.tasaIgv ?? null,
      valorUnitarioSinIgv: detalle.valorUnitarioSinIgv ?? null,
    }
  }

  if (tipoMovimiento === 'SALIDA_VENTA') {
    return {
      ...base,
      costoUnitario: detalle.costoUnitario ?? null,
      recargoComercialPct: detalle.recargoComercialPct ?? null,
    }
  }

  return {
    ...base,
    costoUnitario: detalle.costoUnitario ?? null,
  }
}
