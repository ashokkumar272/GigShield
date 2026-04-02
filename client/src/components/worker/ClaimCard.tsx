import type { Claim } from '../../types/api'
import { formatDate, toTitleCase } from '../../lib/format'
import { SeverityBadge } from '../status/SeverityBadge'
import { StatusBadge } from '../status/StatusBadge'

type ClaimCardProps = {
  claim: Claim
  onOpen: (id: string) => void
}

export function ClaimCard({ claim, onOpen }: ClaimCardProps) {
  const reason = toTitleCase(claim.event_type)
  const claimName = `${reason} Support`

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-amber-900">{claimName}</p>
          <p className="text-xs text-slate-600">Ref {claim.id.slice(0, 8)} · Started {formatDate(claim.triggered_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <SeverityBadge severity={claim.event_severity} />
          <StatusBadge status={claim.status} />
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-700">Reason: {reason}</p>
      <button
        onClick={() => onOpen(claim.id)}
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto sm:py-1.5"
      >
        Open details
      </button>
    </div>
  )
}
