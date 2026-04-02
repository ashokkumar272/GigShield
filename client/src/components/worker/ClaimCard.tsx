import type { Claim } from '../../types/api'
import { formatDate, toTitleCase } from '../../lib/format'
import { SeverityBadge } from '../status/SeverityBadge'
import { StatusBadge } from '../status/StatusBadge'

type ClaimCardProps = {
  claim: Claim
  onOpen: (id: string) => void
}

export function ClaimCard({ claim, onOpen }: ClaimCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Claim #{claim.id.slice(0, 8)}</p>
          <p className="text-xs text-slate-500">Triggered {formatDate(claim.triggered_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <SeverityBadge severity={claim.event_severity} />
          <StatusBadge status={claim.status} />
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">Event: {toTitleCase(claim.event_type)}</p>
      <button
        onClick={() => onOpen(claim.id)}
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto sm:py-1.5"
      >
        View Claim
      </button>
    </div>
  )
}
