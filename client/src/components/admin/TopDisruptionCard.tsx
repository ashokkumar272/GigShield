import { toTitleCase } from '../../lib/format'

export function TopDisruptionCard({ eventType }: { eventType: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Top Disruption Event</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{eventType ? toTitleCase(eventType) : 'No events yet'}</p>
    </div>
  )
}
