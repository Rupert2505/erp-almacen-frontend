export function filenameFromDisposition(disposition?: string | null, fallback = 'archivo') {
  if (!disposition) {
    return fallback
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replaceAll('"', '').trim())
  }

  const filenameMatch = /filename="?([^";]+)"?/i.exec(disposition)
  return filenameMatch?.[1]?.trim() || fallback
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export function downloadExcel(blob: Blob, filename: string) {
  downloadBlob(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

export function openPdf(blob: Blob) {
  const url = window.URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
}
