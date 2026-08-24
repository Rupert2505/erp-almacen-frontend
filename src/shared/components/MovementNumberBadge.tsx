type MovementNumberBadgeProps = {
  number?: string | null
}

export function MovementNumberBadge({ number }: MovementNumberBadgeProps) {
  return (
    <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold tracking-wide text-sky-950 shadow-sm">
      {number || '-'}
    </span>
  )
}
