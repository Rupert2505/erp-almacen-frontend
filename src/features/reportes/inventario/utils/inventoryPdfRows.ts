import { formatMovimientoLabel } from '../../../inventario/movimientos/utils/movimientoLabels'
import type {
  KardexValorizadoDetalle,
  ProductoBajoMinimoItem,
  SalidaInventarioItem,
} from '../types/reporteInventario.types'
import { formatReportDecimal, formatReportPercent } from './reportNumberFormat'

type DateTimeFormatter = (value?: string | null) => string

type SalidaPdfCommercialLayer = {
  costoBaseComercialUnitarioSinIgv?: number | null
  precioVentaTotalConIgv?: number | null
  recargoAplicadoPct?: number | null
}

function numberValue(value?: number | null) {
  return formatReportDecimal(value, '')
}

export function buildKardexPdfRow(
  row: KardexValorizadoDetalle,
  showCosts: boolean,
  formatDateTime: DateTimeFormatter,
) {
  return {
    Fecha: formatDateTime(row.fecha),
    Movimiento: row.numeroMovimiento,
    Tipo: formatMovimientoLabel(row.tipoMovimiento),
    Entrada: numberValue(row.cantidadEntrada),
    Salida: numberValue(row.cantidadSalida),
    'Saldo ant.': numberValue(row.saldoAnterior),
    'Saldo final': numberValue(row.saldoFinal),
    ...(showCosts
      ? {
          'Costo mov.': numberValue(row.costoUnitarioMovimiento),
          'Costo prom.': numberValue(row.costoPromedio),
          'Valor entrada': numberValue(row.valorEntrada),
          'Valor salida': numberValue(row.valorSalida),
          'Valor saldo': numberValue(row.valorSaldo),
        }
      : {}),
  }
}

export function buildSalidaPdfRow(
  row: SalidaInventarioItem,
  showCosts: boolean,
  formatDateTime: DateTimeFormatter,
  commercial?: SalidaPdfCommercialLayer | null,
) {
  return {
    Fecha: formatDateTime(row.fecha),
    Movimiento: row.numeroMovimiento,
    Tipo: formatMovimientoLabel(row.tipoMovimiento),
    Origen: [row.almacenOrigenCodigo ?? row.almacenOrigen, row.ubicacionOrigen]
      .filter(Boolean)
      .join(' / '),
    Producto: [row.codigoProducto, row.nombreProducto].filter(Boolean).join(' - '),
    'U.M.': row.unidadMedidaAbreviatura ?? row.unidadMedida,
    Cantidad: numberValue(row.cantidad),
    ...(showCosts
      ? {
          'Costo aplicado': numberValue(row.costoPromedioAplicado),
          'Valor salida': numberValue(row.valorSalida),
          'Base comercial s/IGV': numberValue(commercial?.costoBaseComercialUnitarioSinIgv),
          Recargo: formatReportPercent(commercial?.recargoAplicadoPct, ''),
          'Precio total c/IGV': numberValue(commercial?.precioVentaTotalConIgv),
        }
      : {}),
    Motivo: row.motivo,
  }
}

export function buildBajoMinimoPdfRow(row: ProductoBajoMinimoItem) {
  return {
    Codigo: row.productoCodigo,
    Producto: row.productoNombre,
    Categoria: row.categoriaNombre,
    Almacen: row.almacenCodigo ?? row.almacenNombre,
    'Cantidad actual': numberValue(row.cantidadActual),
    'Stock minimo': numberValue(row.stockMinimo),
    Diferencia: numberValue(row.diferencia),
  }
}
