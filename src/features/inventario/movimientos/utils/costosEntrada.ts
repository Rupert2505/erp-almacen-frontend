export type CalculoCostoEntradaInput = {
  cantidad?: number | null
  valorUnitarioSinIgv?: number | null
  tasaIgv?: number | null
  igvRecuperable?: boolean | null
}

export type CalculoCostoEntrada = {
  montoIgvUnitario: number
  montoIgvTotal: number
  precioUnitarioConIgv: number
  costoUnitarioInventariable: number
  totalInventariable: number
  totalConIgv: number
  subtotalSinIgv: number
}

function toSafeNonNegativeNumber(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return 0
  }

  return value
}

export function calcularCostoEntrada({
  cantidad,
  valorUnitarioSinIgv,
  tasaIgv,
  igvRecuperable,
}: CalculoCostoEntradaInput): CalculoCostoEntrada {
  const safeCantidad = toSafeNonNegativeNumber(cantidad)
  const safeValorUnitarioSinIgv = toSafeNonNegativeNumber(valorUnitarioSinIgv)
  const safeTasaIgv = toSafeNonNegativeNumber(tasaIgv)
  const recuperable = igvRecuperable ?? true
  const montoIgvUnitario = safeValorUnitarioSinIgv * (safeTasaIgv / 100)
  const precioUnitarioConIgv = safeValorUnitarioSinIgv + montoIgvUnitario
  const costoUnitarioInventariable = recuperable
    ? safeValorUnitarioSinIgv
    : precioUnitarioConIgv

  return {
    costoUnitarioInventariable,
    montoIgvTotal: safeCantidad * montoIgvUnitario,
    montoIgvUnitario,
    precioUnitarioConIgv,
    subtotalSinIgv: safeCantidad * safeValorUnitarioSinIgv,
    totalConIgv: safeCantidad * precioUnitarioConIgv,
    totalInventariable: safeCantidad * costoUnitarioInventariable,
  }
}

export function sumarCostosEntrada(detalles: CalculoCostoEntradaInput[]) {
  return detalles.reduce(
    (totals, detalle) => {
      const calculo = calcularCostoEntrada(detalle)

      return {
        igvTotal: totals.igvTotal + calculo.montoIgvTotal,
        subtotalSinIgv: totals.subtotalSinIgv + calculo.subtotalSinIgv,
        totalDocumento: totals.totalDocumento + calculo.totalConIgv,
        valorInventariable: totals.valorInventariable + calculo.totalInventariable,
      }
    },
    {
      igvTotal: 0,
      subtotalSinIgv: 0,
      totalDocumento: 0,
      valorInventariable: 0,
    },
  )
}
