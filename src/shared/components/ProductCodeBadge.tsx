type ProductCodeBadgeProps = {
  code?: string | null
}

export function ProductCodeBadge({ code }: ProductCodeBadgeProps) {
  return (
    <span className="inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-bold tracking-wide text-cyan-900 shadow-sm">
      {code || '-'}
    </span>
  )
}
