export function normalizeBusinessText(value: string) {
  return value.trim().toLocaleUpperCase('es-PE')
}

export function normalizeOptionalBusinessText(value?: string | null) {
  const normalized = value ? normalizeBusinessText(value) : ''
  return normalized || null
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase('es-PE')
}

export function normalizeOptionalEmail(value?: string | null) {
  const normalized = value ? normalizeEmail(value) : ''
  return normalized || null
}

export function normalizePhone(value?: string | null) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}
