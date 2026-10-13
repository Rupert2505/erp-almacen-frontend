import type { SalidaValorizadaOsResponse } from '../types/reporteInventario.types'
import { formatReportDecimal, formatReportPercent } from './reportNumberFormat'

type PdfReportRowKind = 'detail' | 'group' | 'spacer' | 'subtotal'

type SalidasPorOsPdfTable = {
  recordCount: number
  rowKinds: PdfReportRowKind[]
  rows: Array<Record<string, unknown>>
}

function finiteNumber(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function productLabel(row: SalidaValorizadaOsResponse) {
  return [row.codigoProducto, row.descripcionProducto].filter(Boolean).join(' - ')
}

function osLabel(row: SalidaValorizadaOsResponse) {
  return row.ordenTrabajo?.trim() || 'SIN OS'
}

function lineTotal(
  row: SalidaValorizadaOsResponse,
  total: number | null | undefined,
  unit: number | null | undefined,
) {
  const totalValue = finiteNumber(total)

  if (totalValue !== null) {
    return totalValue
  }

  const unitValue = finiteNumber(unit)
  const quantity = finiteNumber(row.cantidad)
  return unitValue !== null && quantity !== null ? unitValue * quantity : null
}

function sumAvailable(values: Array<number | null>) {
  if (values.some((value) => value === null)) {
    return null
  }

  return (values as number[]).reduce((total, value) => total + value, 0)
}

function unitValue(total: number | null, quantity: number, fallback?: number | null) {
  if (total !== null && quantity !== 0) {
    return total / quantity
  }

  return finiteNumber(fallback)
}

function currency(value: number | null) {
  const formatted = formatReportDecimal(value)
  return formatted === '-' ? '-' : `S/ ${formatted}`
}

function buildProductRow(rows: SalidaValorizadaOsResponse[], showCosts: boolean) {
  const first = rows[0]
  const singleRow = rows.length === 1
  const quantity = rows.reduce((total, row) => total + (finiteNumber(row.cantidad) ?? 0), 0)

  if (!showCosts) {
    return {
      Producto: productLabel(first),
      Cantidad: formatReportDecimal(quantity),
    }
  }

  const inventoryTotal = sumAvailable(
    rows.map((row) =>
      lineTotal(row, row.costoInventarioTotal, row.costoInventarioUnitario),
    ),
  )
  const baseTotal = sumAvailable(
    rows.map((row) => lineTotal(row, null, row.costoBaseComercialUnitarioSinIgv)),
  )
  const commercialTotal = sumAvailable(
    rows.map((row) =>
      lineTotal(row, row.valorVentaTotalSinIgv, row.valorVentaUnitarioSinIgv),
    ),
  )
  const finalTotal = sumAvailable(
    rows.map((row) =>
      lineTotal(row, row.precioVentaTotalConIgv, row.precioVentaUnitarioConIgv),
    ),
  )
  const effectiveMarkup =
    baseTotal !== null && commercialTotal !== null && baseTotal !== 0
      ? (commercialTotal / baseTotal - 1) * 100
      : singleRow
        ? finiteNumber(first.recargoAplicadoPct)
        : null

  return {
    Producto: productLabel(first),
    Cantidad: formatReportDecimal(quantity),
    'Costo inventario': currency(
      unitValue(inventoryTotal, quantity, singleRow ? first.costoInventarioUnitario : null),
    ),
    'Precio base s/IGV': currency(
      unitValue(baseTotal, quantity, singleRow ? first.costoBaseComercialUnitarioSinIgv : null),
    ),
    Recargo: formatReportPercent(effectiveMarkup),
    'Precio final c/IGV': currency(
      unitValue(finalTotal, quantity, singleRow ? first.precioVentaUnitarioConIgv : null),
    ),
  }
}

function buildOsSubtotalRow(
  os: string,
  rows: SalidaValorizadaOsResponse[],
  columns: string[],
  showCosts: boolean,
) {
  const subtotal = emptyRow(columns)

  subtotal.Producto = `SUBTOTAL ${os}`
  subtotal.Cantidad = formatReportDecimal(
    rows.reduce((total, row) => total + (finiteNumber(row.cantidad) ?? 0), 0),
  )

  if (!showCosts) {
    return subtotal
  }

  const inventoryTotal = sumAvailable(
    rows.map((row) =>
      lineTotal(row, row.costoInventarioTotal, row.costoInventarioUnitario),
    ),
  )
  const baseTotal = sumAvailable(
    rows.map((row) => lineTotal(row, null, row.costoBaseComercialUnitarioSinIgv)),
  )
  const commercialTotal = sumAvailable(
    rows.map((row) =>
      lineTotal(row, row.valorVentaTotalSinIgv, row.valorVentaUnitarioSinIgv),
    ),
  )
  const finalTotal = sumAvailable(
    rows.map((row) =>
      lineTotal(row, row.precioVentaTotalConIgv, row.precioVentaUnitarioConIgv),
    ),
  )
  const effectiveMarkup =
    baseTotal !== null && commercialTotal !== null && baseTotal !== 0
      ? (commercialTotal / baseTotal - 1) * 100
      : null

  subtotal['Costo inventario'] = currency(inventoryTotal)
  subtotal['Precio base s/IGV'] = currency(baseTotal)
  subtotal.Recargo = formatReportPercent(effectiveMarkup)
  subtotal['Precio final c/IGV'] = currency(finalTotal)

  return subtotal
}

function emptyRow(columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, '']))
}

export function buildSalidasPorOsPdfTable(
  items: SalidaValorizadaOsResponse[],
  showCosts: boolean,
): SalidasPorOsPdfTable {
  if (items.length === 0) {
    return { recordCount: 0, rowKinds: [], rows: [] }
  }

  const byOs = new Map<string, SalidaValorizadaOsResponse[]>()

  items.forEach((item) => {
    const key = osLabel(item)
    const osRows = byOs.get(key) ?? []
    osRows.push(item)
    byOs.set(key, osRows)
  })

  const orderedOs = [...byOs.entries()].sort(([first], [second]) =>
    first.localeCompare(second, 'es', { numeric: true, sensitivity: 'base' }),
  )
  const firstProductRow = buildProductRow([orderedOs[0][1][0]], showCosts)
  const columns = Object.keys(firstProductRow)
  const rows: Array<Record<string, unknown>> = []
  const rowKinds: PdfReportRowKind[] = []
  let recordCount = 0

  orderedOs.forEach(([os, osRows], osIndex) => {
    if (osIndex > 0) {
      rows.push(emptyRow(columns))
      rowKinds.push('spacer')
    }

    const header = emptyRow(columns)
    header.Producto = `ORDEN DE SERVICIO: ${os}`
    rows.push(header)
    rowKinds.push('group')

    const byProduct = new Map<number, SalidaValorizadaOsResponse[]>()

    osRows.forEach((item) => {
      const productRows = byProduct.get(item.productoId) ?? []
      productRows.push(item)
      byProduct.set(item.productoId, productRows)
    })

    const orderedProducts = [...byProduct.values()].sort((first, second) =>
      productLabel(first[0]).localeCompare(productLabel(second[0]), 'es', {
        numeric: true,
        sensitivity: 'base',
      }),
    )

    orderedProducts.forEach((productRows) => {
      rows.push(buildProductRow(productRows, showCosts))
      rowKinds.push('detail')
      recordCount += 1
    })

    rows.push(buildOsSubtotalRow(os, osRows, columns, showCosts))
    rowKinds.push('subtotal')
  })

  return { recordCount, rowKinds, rows }
}
