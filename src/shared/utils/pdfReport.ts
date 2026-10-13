import { downloadBlob, openPdf } from './downloads'

export type PdfReportRowKind = 'detail' | 'group' | 'spacer' | 'subtotal'

type PdfReportOptions = {
  centerAlignedColumns?: string[]
  columnWeights?: Record<string, number>
  filename: string
  filters: Array<[string, string | number | boolean | null | undefined]>
  infoColumns?: number
  infoMaxItems?: number
  infoTitle?: string
  logoSrc: string
  recordCount?: number
  rightAlignedColumns?: string[]
  rowKinds?: PdfReportRowKind[]
  rows: Array<Record<string, unknown>>
  subtitle?: string
  summary?: Array<[string, string | number | boolean | null | undefined]>
  summaryColumns?: number
  summaryTitle?: string
  tableHeaderFontSize?: number
  tableRowFontSize?: number
  tableRowHeight?: number
  tableRowLineHeight?: number
  tableRowMaxLines?: number
  title: string
}

type RenderedPage = {
  dataUrl: string
  height: number
  width: number
}

type PaginatedPdfRow<T> = {
  height: number
  kind: PdfReportRowKind
  row: T
}

type PaginatePdfRowsOptions = {
  firstPageHeight: number
  nextPageHeight: number
  rowHeight: number
}

const A4_PAGE = {
  height: 842,
  width: 595,
}

const SCALE = 2

function pdfRowHeight(kind: PdfReportRowKind, rowHeight: number) {
  if (kind === 'group') {
    return 26
  }

  if (kind === 'spacer') {
    return 10
  }

  if (kind === 'subtotal') {
    return Math.max(24, rowHeight - 8)
  }

  return rowHeight
}

export function paginatePdfTableRows<T>(
  rows: T[],
  rowKinds: PdfReportRowKind[],
  { firstPageHeight, nextPageHeight, rowHeight }: PaginatePdfRowsOptions,
) {
  const pages: Array<Array<PaginatedPdfRow<T>>> = []
  let cursor = 0
  let currentGroup: PaginatedPdfRow<T> | null = null

  while (cursor < rows.length) {
    while ((rowKinds[cursor] ?? 'detail') === 'spacer') {
      cursor += 1
    }

    if (cursor >= rows.length) {
      break
    }

    const availableHeight = pages.length === 0 ? firstPageHeight : nextPageHeight
    const page: Array<PaginatedPdfRow<T>> = []
    let usedHeight = 0
    const firstKind = rowKinds[cursor] ?? 'detail'

    if (firstKind !== 'group' && currentGroup) {
      page.push(currentGroup)
      usedHeight += currentGroup.height
    }

    while (cursor < rows.length) {
      const kind = rowKinds[cursor] ?? 'detail'
      const height = pdfRowHeight(kind, rowHeight)

      if (kind === 'spacer') {
        const nextKind = rowKinds[cursor + 1] ?? 'detail'
        const nextHeight = pdfRowHeight(nextKind, rowHeight)
        const followingHeight =
          nextKind === 'group' && cursor + 2 < rows.length
            ? pdfRowHeight(rowKinds[cursor + 2] ?? 'detail', rowHeight)
            : 0

        if (usedHeight + height + nextHeight + followingHeight > availableHeight) {
          break
        }
      }

      if (kind === 'group' && page.length > 0) {
        const followingHeight =
          cursor + 1 < rows.length
            ? pdfRowHeight(rowKinds[cursor + 1] ?? 'detail', rowHeight)
            : 0

        if (usedHeight + height + followingHeight > availableHeight) {
          break
        }
      }

      if (usedHeight + height > availableHeight && page.length > 0) {
        break
      }

      const entry = { height, kind, row: rows[cursor] }
      page.push(entry)
      usedHeight += height
      cursor += 1

      if (kind === 'group') {
        currentGroup = entry
      }
    }

    if (page.length === 0) {
      const kind = rowKinds[cursor] ?? 'detail'
      const entry = { height: pdfRowHeight(kind, rowHeight), kind, row: rows[cursor] }
      page.push(entry)
      cursor += 1

      if (kind === 'group') {
        currentGroup = entry
      }
    }

    pages.push(page)
  }

  return pages
}

function textValue(value: unknown) {
  return String(value ?? '').trim()
}

function activeFilters(filters: PdfReportOptions['filters']) {
  return filters.filter(([, value]) => value !== undefined && value !== null && value !== '')
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word

    if (lines.length >= maxLines) {
      break
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  if (lines.length === 0 && text) {
    lines.push(text)
  }

  const lastIndex = lines.length - 1

  if (lastIndex >= 0 && (words.join(' ') !== lines.join(' ') || context.measureText(lines[lastIndex]).width > maxWidth)) {
    let truncated = lines[lastIndex]

    while (truncated.length > 0 && context.measureText(`${truncated}...`).width > maxWidth) {
      truncated = truncated.slice(0, -1)
    }

    lines[lastIndex] = `${truncated}...`
  }

  return lines
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options?: {
    align?: CanvasTextAlign
    color?: string
    font?: string
    maxLines?: number
    maxWidth?: number
    rowHeight?: number
  },
) {
  context.fillStyle = options?.color ?? '#0f172a'
  context.font = options?.font ?? '10px Arial'
  context.textAlign = options?.align ?? 'left'
  context.textBaseline = 'top'

  if (!options?.maxWidth) {
    context.fillText(text, x, y)
    return
  }

  const lines = wrapText(context, text, options.maxWidth, options.maxLines ?? 1)

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * (options.rowHeight ?? 12))
  })
}

function sanitizePdfText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replace(/[^\x20-\x7E]/g, '')
}

function makePageCanvas(pageSize: { height: number; width: number }) {
  const canvas = document.createElement('canvas')

  canvas.width = pageSize.width * SCALE
  canvas.height = pageSize.height * SCALE

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('No se pudo preparar el lienzo para generar el PDF.')
  }

  context.scale(SCALE, SCALE)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, pageSize.width, pageSize.height)

  return { canvas, context }
}

function columnWidths(
  columns: string[],
  contentWidth: number,
  customWeights: Record<string, number> = {},
) {
  const explicitWeights: Record<string, number> = {
    'almacen destino': 1.4,
    'almacen origen': 1.4,
    cantidad: 0.82,
    codigo: 1.05,
    'costo doc.': 0.95,
    'costo promedio': 1.05,
    'costo unit.': 0.95,
    'costo unitario': 1,
    diferencia: 0.92,
    entrada: 0.78,
    fecha: 1.05,
    movimiento: 1.15,
    origen: 1.05,
    destino: 1.05,
    producto: 2.15,
    proveedor: 1.8,
    salida: 0.78,
    'saldo anterior': 1.05,
    'saldo final': 1.02,
    stock: 0.75,
    tipo: 1.1,
    total: 0.78,
    'valor doc.': 0.92,
    'valor documento': 1,
    'valor saldo': 1,
    'valor stock': 0.92,
    ubicacion: 1.15,
  }
  const minWidth = columns.length > 9 ? 24 : 34
  const maxLabel = Math.max(...columns.map((column) => column.length), 1)
  const weighted = columns.map((column) => {
    const lowerColumn = column.toLowerCase()
    const explicitWeight = customWeights[lowerColumn] ?? explicitWeights[lowerColumn]

    if (explicitWeight) {
      return explicitWeight * 72
    }

    const baseWeight = Math.max(minWidth, (column.length / maxLabel) * 84)

    if (['producto', 'proveedor', 'almacen', 'ubicacion'].some((label) => lowerColumn.includes(label))) {
      return baseWeight * 1.45
    }

    if (['fecha', 'movimiento', 'codigo'].some((label) => lowerColumn.includes(label))) {
      return baseWeight * 1.2
    }

    return baseWeight
  })
  const total = weighted.reduce((sum, width) => sum + width, 0)

  return weighted.map((width) => (width / total) * contentWidth)
}

function renderPdfReportPages({
  centerAlignedColumns = [],
  columnWeights,
  filters,
  infoColumns = 2,
  infoMaxItems = 8,
  infoTitle = 'Filtros aplicados',
  logo,
  recordCount,
  rightAlignedColumns = [],
  rowKinds = [],
  rows,
  subtitle,
  summary = [],
  summaryColumns = 3,
  summaryTitle = 'Resumen',
  tableHeaderFontSize,
  tableRowFontSize,
  tableRowHeight,
  tableRowLineHeight,
  tableRowMaxLines,
  title,
}: PdfReportOptions & { logo: HTMLImageElement | null }) {
  const pages: RenderedPage[] = []
  const pageSize = A4_PAGE
  const columns = rows.length > 0 ? Object.keys(rows[0]) : ['Mensaje']
  const safeRows = rows.length > 0 ? rows : [{ Mensaje: 'No hay datos para los filtros seleccionados.' }]
  const safeRowKinds = safeRows.map((_, index) => rowKinds[index] ?? 'detail')
  const margin = 14
  const contentWidth = pageSize.width - margin * 2
  const widths = columnWidths(columns, contentWidth, columnWeights)
  const centered = new Set(centerAlignedColumns.map((column) => column.toLowerCase()))
  const rightAligned = new Set(rightAlignedColumns.map((column) => column.toLowerCase()))
  const headerHeight = 118
  const filterRows = activeFilters(filters)
  const summaryRows = activeFilters(summary)
  const filterColumns = Math.max(1, infoColumns)
  const visibleFilterRows = filterRows.slice(0, infoMaxItems)
  const filterHeight = Math.min(
    220,
    visibleFilterRows.length > 0
      ? Math.ceil(visibleFilterRows.length / filterColumns) * 26 + 34
      : 40,
  )
  const summaryTop = headerHeight + filterHeight + 14
  const resolvedSummaryColumns = Math.max(1, Math.min(summaryColumns, summaryRows.length || 1))
  const summaryHeight =
    summaryRows.length > 0
      ? 30 + Math.ceil(summaryRows.length / resolvedSummaryColumns) * 30
      : 0
  const tableTop = summaryRows.length > 0 ? summaryTop + summaryHeight + 14 : summaryTop
  const tableHeaderHeight = 34
  const tableCellPadding = columns.length > 9 ? 3 : 5
  const rowHeight = tableRowHeight ?? (columns.length > 9 ? 38 : 42)
  const resolvedHeaderFontSize = tableHeaderFontSize ?? 6.8
  const resolvedRowFontSize = tableRowFontSize ?? (columns.length > 9 ? 6.2 : 7)
  const resolvedRowLineHeight = tableRowLineHeight ?? (columns.length > 9 ? 8.5 : 9.5)
  const resolvedRowMaxLines = tableRowMaxLines ?? 3
  const footerTop = pageSize.height - 26
  const nextPageTableTop = summaryTop
  const pageRows = paginatePdfTableRows(safeRows, safeRowKinds, {
    firstPageHeight: footerTop - tableTop - tableHeaderHeight,
    nextPageHeight: footerTop - nextPageTableTop - tableHeaderHeight,
    rowHeight,
  })
  const generatedAt = new Date().toLocaleString('es-PE')
  const totalPages = pageRows.length

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const { canvas, context } = makePageCanvas(pageSize)
    const currentPageRows = pageRows[pageIndex]

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, pageSize.width, 86)
    context.strokeStyle = '#cbd5e1'
    context.beginPath()
    context.moveTo(0, 84)
    context.lineTo(pageSize.width, 84)
    context.stroke()

    if (logo) {
      context.drawImage(logo, margin + 2, 14, 52, 52)
    }

    drawText(context, 'ERP ALMACEN', margin + 70, 18, {
      color: '#0891b2',
      font: 'bold 9px Arial',
    })
    const titleMaxWidth = 300
    context.font = 'bold 18px Arial'
    const titleLines = wrapText(context, title, titleMaxWidth, 2)
    const titleHeight = titleLines.length * 19

    drawText(context, title, margin + 70, 32, {
      color: '#111827',
      font: 'bold 18px Arial',
      maxLines: 2,
      maxWidth: titleMaxWidth,
      rowHeight: 19,
    })
    drawText(context, subtitle ?? 'Informe operativo de inventario', margin + 70, 34 + titleHeight, {
      color: '#475569',
      font: '9px Arial',
      maxLines: 1,
      maxWidth: 310,
    })
    drawText(context, `Generado: ${generatedAt}`, pageSize.width - margin, 22, {
      align: 'right',
      color: '#334155',
      font: '8.5px Arial',
    })
    drawText(context, `Registros: ${recordCount ?? rows.length}`, pageSize.width - margin, 40, {
      align: 'right',
      color: '#334155',
      font: '8.5px Arial',
    })

    context.fillStyle = '#ffffff'
    context.fillRect(margin, 102, contentWidth, filterHeight)
    context.strokeStyle = '#cbd5e1'
    context.strokeRect(margin, 102, contentWidth, filterHeight)
    drawText(context, infoTitle, margin + 12, 112, {
      color: '#334155',
      font: 'bold 9px Arial',
    })

    if (visibleFilterRows.length === 0) {
      drawText(context, 'Sin informacion registrada', margin + 12, 130, {
        color: '#64748b',
        font: '9px Arial',
      })
    } else {
      visibleFilterRows.forEach(([label, value], index) => {
        const column = index % filterColumns
        const row = Math.floor(index / filterColumns)
        const x = margin + 12 + column * (contentWidth / filterColumns)
        const y = 128 + row * 26

        drawText(context, `${label}:`, x, y, {
          color: '#64748b',
          font: 'bold 8px Arial',
          maxLines: 1,
          maxWidth: contentWidth / filterColumns - 18,
        })
        drawText(context, textValue(value), x, y + 10, {
          color: '#0f172a',
          font: '8px Arial',
          maxLines: 1,
          maxWidth: contentWidth / filterColumns - 18,
        })
      })
    }

    if (summaryRows.length > 0 && pageIndex === 0) {
      context.fillStyle = '#ecfeff'
      context.fillRect(margin, summaryTop, contentWidth, summaryHeight)
      context.strokeStyle = '#67e8f9'
      context.strokeRect(margin, summaryTop, contentWidth, summaryHeight)
      drawText(context, summaryTitle, margin + 12, summaryTop + 9, {
        color: '#155e75',
        font: 'bold 9px Arial',
      })

      summaryRows.forEach(([label, value], index) => {
        const column = index % resolvedSummaryColumns
        const row = Math.floor(index / resolvedSummaryColumns)
        const columnWidth = contentWidth / resolvedSummaryColumns
        const x = margin + 12 + column * columnWidth
        const y = summaryTop + 27 + row * 30

        drawText(context, `${label}:`, x, y, {
          color: '#64748b',
          font: 'bold 7px Arial',
          maxLines: 1,
          maxWidth: columnWidth - 20,
        })
        drawText(context, textValue(value), x, y + 11, {
          color: '#0f172a',
          font: 'bold 10px Arial',
          maxLines: 1,
          maxWidth: columnWidth - 20,
        })
      })
    }

    let y = pageIndex === 0 ? tableTop : nextPageTableTop
    let x = margin
    const leadingGroup = currentPageRows[0]?.kind === 'group' ? currentPageRows[0] : null
    const rowsAfterHeader = leadingGroup ? currentPageRows.slice(1) : currentPageRows
    const drawGroupRow = (row: Record<string, unknown>, groupY: number, groupHeight: number) => {
      context.fillStyle = '#e0f2fe'
      context.fillRect(margin, groupY, contentWidth, groupHeight)
      context.strokeStyle = '#7dd3fc'
      context.strokeRect(margin, groupY, contentWidth, groupHeight)

      const groupLabel = columns.map((column) => textValue(row[column])).find(Boolean) ?? ''
      drawText(context, groupLabel, margin + 9, groupY + 6, {
        color: '#075985',
        font: `bold ${Math.max(resolvedRowFontSize + 0.8, 7)}px Arial`,
        maxLines: 2,
        maxWidth: contentWidth - 18,
        rowHeight: resolvedRowLineHeight,
      })
    }

    if (leadingGroup) {
      drawGroupRow(leadingGroup.row, y, leadingGroup.height)
      y += leadingGroup.height
    }

    context.fillStyle = '#f1f5f9'
    context.fillRect(margin, y, contentWidth, tableHeaderHeight)
    context.strokeStyle = '#cbd5e1'
    context.strokeRect(margin, y, contentWidth, tableHeaderHeight)

    columns.forEach((column, index) => {
      const normalizedColumn = column.toLowerCase()
      const align = rightAligned.has(normalizedColumn)
        ? 'right'
        : centered.has(normalizedColumn)
          ? 'center'
          : 'left'
      const textX =
        align === 'right'
          ? x + widths[index] - tableCellPadding
          : align === 'center'
            ? x + widths[index] / 2
            : x + tableCellPadding

      drawText(context, column.toUpperCase(), textX, y + 8, {
        align,
        color: '#334155',
        font: `bold ${resolvedHeaderFontSize}px Arial`,
        maxLines: 2,
        maxWidth: widths[index] - tableCellPadding * 2,
        rowHeight: 9,
      })
      x += widths[index]
    })

    y += tableHeaderHeight

    rowsAfterHeader.forEach(({ height: currentRowHeight, kind: rowKind, row }, rowIndex) => {
      x = margin

      if (rowKind === 'spacer') {
        y += currentRowHeight
        return
      }

      context.fillStyle =
        rowKind === 'group'
          ? '#e0f2fe'
          : rowKind === 'subtotal'
            ? '#fefce8'
            : rowIndex % 2 === 0
              ? '#ffffff'
              : '#f8fafc'
      context.fillRect(margin, y, contentWidth, currentRowHeight)
      context.strokeStyle = rowKind === 'group' ? '#7dd3fc' : '#e2e8f0'
      context.strokeRect(margin, y, contentWidth, currentRowHeight)

      if (rowKind === 'group') {
        drawGroupRow(row, y, currentRowHeight)
        y += currentRowHeight
        return
      }

      columns.forEach((column, columnIndex) => {
        const value = textValue(row[column])
        const normalizedColumn = column.toLowerCase()
        const align = rightAligned.has(normalizedColumn)
          ? 'right'
          : centered.has(normalizedColumn)
            ? 'center'
            : 'left'
        const textX =
          align === 'right'
            ? x + widths[columnIndex] - tableCellPadding
            : align === 'center'
              ? x + widths[columnIndex] / 2
              : x + tableCellPadding

        drawText(context, value || (rowKind === 'subtotal' ? '' : '-'), textX, y + 7, {
          align,
          color: columnIndex === 0 ? '#0f172a' : '#334155',
          font: `${columnIndex === 0 || rowKind === 'subtotal' ? 'bold ' : ''}${resolvedRowFontSize}px Arial`,
          maxLines: resolvedRowMaxLines,
          maxWidth: widths[columnIndex] - tableCellPadding * 2,
          rowHeight: resolvedRowLineHeight,
        })
        x += widths[columnIndex]
      })

      y += currentRowHeight
    })

    context.strokeStyle = '#cbd5e1'
    context.beginPath()
    context.moveTo(margin, footerTop - 7)
    context.lineTo(pageSize.width - margin, footerTop - 7)
    context.stroke()
    drawText(context, 'Informe generado desde ERP Almacen', margin, footerTop, {
      color: '#64748b',
      font: '8px Arial',
    })
    drawText(context, `Pagina ${pageIndex + 1} de ${totalPages}`, pageSize.width - margin, footerTop, {
      align: 'right',
      color: '#64748b',
      font: '8px Arial',
    })

    pages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      height: pageSize.height,
      width: pageSize.width,
    })
  }

  return pages
}

function jpegDataFromUrl(dataUrl: string) {
  const [, base64 = ''] = dataUrl.split(',')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value)
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  chunks.forEach((chunk) => {
    output.set(chunk, offset)
    offset += chunk.length
  })

  return output
}

function buildPdfFromPages(pages: RenderedPage[], title: string) {
  const chunks: Uint8Array[] = []
  const offsets: number[] = [0]
  let objectNumber = 1

  const append = (value: string | Uint8Array) => {
    chunks.push(typeof value === 'string' ? asciiBytes(value) : value)
  }

  const offset = () => chunks.reduce((sum, chunk) => sum + chunk.length, 0)

  const addObject = (body: string | Uint8Array | Array<string | Uint8Array>) => {
    const id = objectNumber
    objectNumber += 1
    offsets[id] = offset()
    append(`${id} 0 obj\n`)

    if (Array.isArray(body)) {
      body.forEach(append)
    } else {
      append(body)
    }

    append('\nendobj\n')
    return id
  }

  append('%PDF-1.4\n')

  const catalogId = objectNumber++
  const pagesId = objectNumber++
  const pageIds: number[] = []

  pages.forEach((page, index) => {
    const imageBytes = jpegDataFromUrl(page.dataUrl)
    const imageId = addObject([
      `<< /Type /XObject /Subtype /Image /Width ${page.width * SCALE} /Height ${page.height * SCALE} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
      imageBytes,
      '\nendstream',
    ])
    const content = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/Im${index} Do\nQ`
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )

    pageIds.push(pageId)
  })

  offsets[pagesId] = offset()
  append(`${pagesId} 0 obj\n`)
  append(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`)
  append('\nendobj\n')

  offsets[catalogId] = offset()
  append(`${catalogId} 0 obj\n`)
  append(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  append('\nendobj\n')

  const infoId = addObject(
    `<< /Title (${sanitizePdfText(title)}) /Creator (ERP Almacen) /Producer (ERP Almacen Frontend) >>`,
  )

  const xrefOffset = offset()
  append(`xref\n0 ${objectNumber}\n`)
  append('0000000000 65535 f \n')

  for (let index = 1; index < objectNumber; index += 1) {
    append(`${String(offsets[index] ?? 0).padStart(10, '0')} 00000 n \n`)
  }

  append(
    `trailer\n<< /Size ${objectNumber} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  )

  return new Blob([concatBytes(chunks)], { type: 'application/pdf' })
}

export async function downloadPdfReport(options: PdfReportOptions) {
  const logo = await loadImage(options.logoSrc)
  const pages = renderPdfReportPages({ ...options, logo })
  const pdf = buildPdfFromPages(pages, options.title)

  downloadBlob(pdf, options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`)
}

export async function openPdfReport(options: PdfReportOptions) {
  const logo = await loadImage(options.logoSrc)
  const pages = renderPdfReportPages({ ...options, logo })
  const pdf = buildPdfFromPages(pages, options.title)

  openPdf(pdf)
}
