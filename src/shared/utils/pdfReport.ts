import { downloadBlob, openPdf } from './downloads'

type PdfReportOptions = {
  filename: string
  filters: Array<[string, string | number | boolean | null | undefined]>
  infoColumns?: number
  infoMaxItems?: number
  infoTitle?: string
  logoSrc: string
  rows: Array<Record<string, unknown>>
  subtitle?: string
  title: string
}

type RenderedPage = {
  dataUrl: string
  height: number
  width: number
}

const A4_PAGE = {
  height: 842,
  width: 595,
}

const SCALE = 2

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

function makePageCanvas() {
  const canvas = document.createElement('canvas')

  canvas.width = A4_PAGE.width * SCALE
  canvas.height = A4_PAGE.height * SCALE

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('No se pudo preparar el lienzo para generar el PDF.')
  }

  context.scale(SCALE, SCALE)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, A4_PAGE.width, A4_PAGE.height)

  return { canvas, context }
}

function columnWidths(columns: string[], contentWidth: number) {
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
    const explicitWeight = explicitWeights[lowerColumn]

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
  filters,
  infoColumns = 2,
  infoMaxItems = 8,
  infoTitle = 'Filtros aplicados',
  logo,
  rows,
  subtitle,
  title,
}: PdfReportOptions & { logo: HTMLImageElement | null }) {
  const pages: RenderedPage[] = []
  const columns = rows.length > 0 ? Object.keys(rows[0]) : ['Mensaje']
  const safeRows = rows.length > 0 ? rows : [{ Mensaje: 'No hay datos para los filtros seleccionados.' }]
  const margin = 28
  const contentWidth = A4_PAGE.width - margin * 2
  const widths = columnWidths(columns, contentWidth)
  const headerHeight = 118
  const filterRows = activeFilters(filters)
  const filterColumns = Math.max(1, infoColumns)
  const visibleFilterRows = filterRows.slice(0, infoMaxItems)
  const filterHeight = Math.min(
    220,
    visibleFilterRows.length > 0
      ? Math.ceil(visibleFilterRows.length / filterColumns) * 26 + 34
      : 40,
  )
  const tableTop = headerHeight + filterHeight + 14
  const tableHeaderHeight = 34
  const rowHeight = columns.length > 9 ? 38 : 42
  const footerTop = A4_PAGE.height - 26
  const rowsPerPage = Math.max(1, Math.floor((footerTop - tableTop - tableHeaderHeight) / rowHeight))
  const generatedAt = new Date().toLocaleString('es-PE')
  const totalPages = Math.max(1, Math.ceil(safeRows.length / rowsPerPage))

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const { canvas, context } = makePageCanvas()
    const pageRows = safeRows.slice(pageIndex * rowsPerPage, pageIndex * rowsPerPage + rowsPerPage)

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, A4_PAGE.width, 86)
    context.strokeStyle = '#cbd5e1'
    context.beginPath()
    context.moveTo(0, 84)
    context.lineTo(A4_PAGE.width, 84)
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
    drawText(context, `Generado: ${generatedAt}`, A4_PAGE.width - margin, 22, {
      align: 'right',
      color: '#334155',
      font: '8.5px Arial',
    })
    drawText(context, `Registros: ${safeRows.length}`, A4_PAGE.width - margin, 40, {
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

    let y = tableTop
    let x = margin

    context.fillStyle = '#f1f5f9'
    context.fillRect(margin, y, contentWidth, tableHeaderHeight)
    context.strokeStyle = '#cbd5e1'
    context.strokeRect(margin, y, contentWidth, tableHeaderHeight)

    columns.forEach((column, index) => {
      drawText(context, column.toUpperCase(), x + 5, y + 8, {
        color: '#334155',
        font: 'bold 6.8px Arial',
        maxLines: 2,
        maxWidth: widths[index] - 10,
        rowHeight: 9,
      })
      x += widths[index]
    })

    y += tableHeaderHeight

    pageRows.forEach((row, rowIndex) => {
      x = margin
      context.fillStyle = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc'
      context.fillRect(margin, y, contentWidth, rowHeight)
      context.strokeStyle = '#e2e8f0'
      context.strokeRect(margin, y, contentWidth, rowHeight)

      columns.forEach((column, columnIndex) => {
        const value = textValue(row[column])
        drawText(context, value || '-', x + 5, y + 7, {
          color: columnIndex === 0 ? '#0f172a' : '#334155',
          font:
            columnIndex === 0
              ? columns.length > 9
                ? 'bold 6.2px Arial'
                : 'bold 7px Arial'
              : columns.length > 9
                ? '6.2px Arial'
                : '7px Arial',
          maxLines: 3,
          maxWidth: widths[columnIndex] - 10,
          rowHeight: columns.length > 9 ? 8.5 : 9.5,
        })
        x += widths[columnIndex]
      })

      y += rowHeight
    })

    context.strokeStyle = '#cbd5e1'
    context.beginPath()
    context.moveTo(margin, footerTop - 7)
    context.lineTo(A4_PAGE.width - margin, footerTop - 7)
    context.stroke()
    drawText(context, 'Informe generado desde ERP Almacen', margin, footerTop, {
      color: '#64748b',
      font: '8px Arial',
    })
    drawText(context, `Pagina ${pageIndex + 1} de ${totalPages}`, A4_PAGE.width - margin, footerTop, {
      align: 'right',
      color: '#64748b',
      font: '8px Arial',
    })

    pages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      height: A4_PAGE.height,
      width: A4_PAGE.width,
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
