export const IGV_COMERCIAL = 0.18
export const RECARGO_COMERCIAL_MAXIMO_PCT = 1000

export type ValorizacionComercialPreview = {
  costoBaseComercialSinIgv: number
  recargoComercialPct: number
  valorVentaUnitarioSinIgv: number
  igvUnitario: number
  precioVentaUnitarioConIgv: number
  valorVentaTotalSinIgv: number
  igvTotal: number
  precioVentaTotalConIgv: number
}

function roundHalfUp(value: number, scale = 2) {
  const factor = 10 ** scale
  return Math.floor(value * factor + 0.5 + Number.EPSILON) / factor
}

function isFiniteNonNegative(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function isValidRecargoComercial(value: number | null | undefined): value is number {
  return isFiniteNonNegative(value) && value <= RECARGO_COMERCIAL_MAXIMO_PCT
}

export function calcularValorVentaSinIgv(costoBase: number, recargoPct: number) {
  const base = roundHalfUp(costoBase)
  const recargo = roundHalfUp(recargoPct)
  return roundHalfUp(base * (1 + recargo / 100))
}

export function calcularIgv(valorSinIgv: number) {
  return roundHalfUp(valorSinIgv * IGV_COMERCIAL)
}

export function calcularPrecioConIgv(valorSinIgv: number, igv = calcularIgv(valorSinIgv)) {
  return roundHalfUp(valorSinIgv + igv)
}

export function calcularTotalesComerciales(
  costoBase: number | null | undefined,
  recargoPct: number | null | undefined,
  cantidad: number | null | undefined,
): ValorizacionComercialPreview | null {
  if (
    !isFiniteNonNegative(costoBase) ||
    !isValidRecargoComercial(recargoPct) ||
    typeof cantidad !== 'number' ||
    !Number.isFinite(cantidad) ||
    cantidad <= 0
  ) {
    return null
  }

  const base = roundHalfUp(costoBase)
  const recargo = roundHalfUp(recargoPct)
  const valorVentaUnitarioSinIgv = calcularValorVentaSinIgv(base, recargo)
  const igvUnitario = calcularIgv(valorVentaUnitarioSinIgv)
  const precioVentaUnitarioConIgv = calcularPrecioConIgv(
    valorVentaUnitarioSinIgv,
    igvUnitario,
  )
  const valorVentaTotalSinIgv = roundHalfUp(valorVentaUnitarioSinIgv * cantidad)
  const igvTotal = calcularIgv(valorVentaTotalSinIgv)
  const precioVentaTotalConIgv = calcularPrecioConIgv(valorVentaTotalSinIgv, igvTotal)

  return {
    costoBaseComercialSinIgv: base,
    recargoComercialPct: recargo,
    valorVentaUnitarioSinIgv,
    igvUnitario,
    precioVentaUnitarioConIgv,
    valorVentaTotalSinIgv,
    igvTotal,
    precioVentaTotalConIgv,
  }
}
