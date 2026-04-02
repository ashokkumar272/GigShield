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
  const planFromRisk = (() => {
    if (!policy.risk_factors) return null
    try {
      const factors = JSON.parse(policy.risk_factors) as string[]
      const planFactor = factors.find((item) => item.startsWith('plan:'))
      return planFactor?.split(':')[1] ?? null
    } catch {
      return null
    }
  })()
  const planName = planFromRisk ? `${planFromRisk} Plan` : 'Income Protection Plan'

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">{planName}</p>
          <p className="text-xs text-slate-600">Ref {policy.id.slice(0, 8)} · Created {formatDate(policy.created_at)}</p>
        </div>
        <StatusBadge status={policy.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-700">Max support</span>
        <AmountDisplay amount={policy.coverage_amount_inr} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={() => onOpen(policy.id)}
          className="rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:py-1.5"
        >
          Open details
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(policy)}
            className="rounded-lg border border-rose-300 px-3 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 sm:py-1.5"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
