export function formatMovimientoLabel(value: string) {
  const labels: Record<string, string> = {
    DEVOLUCION_PROVEEDOR: 'Devolucion a proveedor',
  }

  if (labels[value]) {
    return labels[value]
  }

  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}
