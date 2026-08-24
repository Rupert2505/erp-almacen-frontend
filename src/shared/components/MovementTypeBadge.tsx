type MovementTypeBadgeProps = {
  label: string
  type?: string | null
}

function typeClass(type?: string | null) {
  if (!type) {
    return 'border-slate-200 bg-slate-50 text-slate-700'
  }

  if (type.startsWith('ENTRADA')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (type.startsWith('SALIDA')) {
    return 'border-red-200 bg-red-50 text-red-800'
  }

  if (type === 'TRANSFERENCIA') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-800'
  }

  if (type === 'DEVOLUCION_PROVEEDOR') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  if (type.includes('AJUSTE')) {
    return 'border-violet-200 bg-violet-50 text-violet-800'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export function MovementTypeBadge({ label, type }: MovementTypeBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide shadow-sm ${typeClass(
        type,
      )}`}
    >
      {label}
    </span>
  )
}
