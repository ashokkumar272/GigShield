import { toTitleCase } from '../../lib/format'

const COLOR_MAP: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  processed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
  paid: 'bg-sky-100 text-sky-800',
  approved: 'bg-indigo-100 text-indigo-800',
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        COLOR_MAP[normalized] ?? 'bg-slate-200 text-slate-700'
      }`}
    >
      {toTitleCase(normalized)}
    </span>
  )
}
