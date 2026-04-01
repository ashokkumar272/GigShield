const COLOR_MAP: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-rose-100 text-rose-800',
}

export function SeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase()
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        COLOR_MAP[normalized] ?? 'bg-slate-200 text-slate-700'
      }`}
    >
      {normalized.toUpperCase()}
    </span>
  )
}
