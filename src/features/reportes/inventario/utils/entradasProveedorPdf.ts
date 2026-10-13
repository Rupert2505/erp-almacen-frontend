import type { EntradaProveedorItem } from '../types/reporteInventario.types'
import { formatReportDecimal } from './reportNumberFormat'

export type PdfReportRowKind = 'detail' | 'group' | 'spacer' | 'subtotal'

type EntradaProveedorPdfTable = {
  recordCount: number
  rowKinds: PdfReportRowKind[]
  rows: Array<Record<string, unknown>>
}

function numberValue(value?: number | null) {
  return Number.isFinite(value) ? Number(value) : 0
}

function proveedorLabel(row: EntradaProveedorItem) {
  const label = [row.proveedorNumeroDocumento, row.proveedorRazonSocial]
    .filter(Boolean)
    .join(' - ')

  return label || 'Proveedor sin identificar'
}

function detailRow(
  row: EntradaProveedorItem,
  showCosts: boolean,
  formatDateTime: (value?: string | null) => string,
) {
  return {
    Fecha: formatDateTime(row.fechaMovimiento),
    Movimiento: row.numeroMovimiento,
    Guia: [row.guiaSerie, row.guiaNumero].filter(Boolean).join('-'),
    Comprobante: [row.comprobanteTipo, row.comprobanteSerie, row.comprobanteNumero]
      .filter(Boolean)
      .join(' '),
    Almacen: row.almacenDestinoCodigo ?? row.almacenDestino,
    Producto: [row.codigoProducto, row.nombreProducto].filter(Boolean).join(' - '),
    'U.M.': row.unidadMedidaAbreviatura ?? row.unidadMedida,
    Cantidad: formatReportDecimal(row.cantidad),
    ...(showCosts
      ? {
          'Costo unit.': formatReportDecimal(row.costoUnitario),
          'Valor linea': formatReportDecimal(row.valorLinea),
          Flete: formatReportDecimal(row.flete),
          Movilidad: formatReportDecimal(row.movilidad),
          Otros: formatReportDecimal(row.otrosGastos),
        }
      : {}),
  }
}

function emptyRow(columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, '']))
}

export function buildEntradasProveedorPdfTable(
  items: EntradaProveedorItem[],
  showCosts: boolean,
  formatDateTime: (value?: string | null) => string,
): EntradaProveedorPdfTable {
  if (items.length === 0) {
    return { recordCount: 0, rowKinds: [], rows: [] }
  }

  const groups = new Map<string, EntradaProveedorItem[]>()

  items.forEach((item) => {
    const key = `${item.proveedorId ?? 'sin-id'}|${proveedorLabel(item)}`
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  })

  const orderedGroups = [...groups.values()].sort((first, second) =>
    proveedorLabel(first[0]).localeCompare(proveedorLabel(second[0]), 'es', {
      sensitivity: 'base',
    }),
  )
  const firstDetail = detailRow(orderedGroups[0][0], showCosts, formatDateTime)
  const columns = Object.keys(firstDetail)
  const rows: Array<Record<string, unknown>> = []
  const rowKinds: PdfReportRowKind[] = []

  orderedGroups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      rows.push(emptyRow(columns))
      rowKinds.push('spacer')
    }

    const groupHeader = emptyRow(columns)
    groupHeader.Fecha = `PROVEEDOR: ${proveedorLabel(group[0])}`
    rows.push(groupHeader)
    rowKinds.push('group')

    group.forEach((item) => {
      rows.push(detailRow(item, showCosts, formatDateTime))
      rowKinds.push('detail')
    })

    const subtotal = emptyRow(columns)
    const movements = new Map<number, EntradaProveedorItem>()

    group.forEach((item) => movements.set(item.movimientoId, item))
    subtotal.Fecha = 'Subtotal'
    subtotal.Movimiento = `${movements.size} mov.`
    subtotal.Producto = `${group.length} lineas`
    subtotal.Cantidad = formatReportDecimal(
      group.reduce((total, item) => total + numberValue(item.cantidad), 0),
    )

    if (showCosts) {
      subtotal['Valor linea'] = formatReportDecimal(
        group.reduce((total, item) => total + numberValue(item.valorLinea), 0),
      )
      subtotal.Flete = formatReportDecimal(
        [...movements.values()].reduce((total, item) => total + numberValue(item.flete), 0),
      )
      subtotal.Movilidad = formatReportDecimal(
        [...movements.values()].reduce((total, item) => total + numberValue(item.movilidad), 0),
      )
      subtotal.Otros = formatReportDecimal(
        [...movements.values()].reduce((total, item) => total + numberValue(item.otrosGastos), 0),
      )
    }

    rows.push(subtotal)
    rowKinds.push('subtotal')
  })

  return { recordCount: items.length, rowKinds, rows }
}
