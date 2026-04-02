import type { Policy } from '../../types/api'
import { formatDate } from '../../lib/format'
import { StatusBadge } from '../status/StatusBadge'
import { AmountDisplay } from '../financial/AmountDisplay'

type PolicyCardProps = {
  policy: Policy
  onOpen: (id: string) => void
  onDelete?: (policy: Policy) => void
}

export function PolicyCard({ policy, onOpen, onDelete }: PolicyCardProps) {
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
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={() => onOpen(policy.id)}
          className="rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:py-1.5"
        >
          View Details
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(policy)}
            className="rounded-lg border border-rose-300 px-3 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 sm:py-1.5"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
