import type { Policy } from '../../types/api'
import { formatDate } from '../../lib/format'
import { StatusBadge } from '../status/StatusBadge'
import { AmountDisplay } from '../financial/AmountDisplay'

type PolicyCardProps = {
  policy: Policy
  onOpen: (id: string) => void
}

export function PolicyCard({ policy, onOpen }: PolicyCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Policy #{policy.id.slice(0, 8)}</p>
          <p className="text-xs text-slate-500">Created {formatDate(policy.created_at)}</p>
        </div>
        <StatusBadge status={policy.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-600">Coverage</span>
        <AmountDisplay amount={policy.coverage_amount_inr} />
      </div>
      <button
        onClick={() => onOpen(policy.id)}
        className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        View Details
      </button>
    </div>
  )
}
