import type { ActivePolicySummary } from '../../types/api'
import { formatDate } from '../../lib/format'
import { AmountDisplay } from '../financial/AmountDisplay'

export function ActivePolicyCard({ policy }: { policy: ActivePolicySummary | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Active Policy</h3>
      {!policy ? (
        <p className="mt-2 text-sm text-slate-600">No active policy yet.</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>
            Coverage: <AmountDisplay amount={policy.coverage_amount_inr} />
          </p>
          <p>
            Weekly premium: <AmountDisplay amount={policy.weekly_premium_inr} />
          </p>
          <p>Valid till: {formatDate(policy.end_date)}</p>
        </div>
      )}
    </div>
  )
}
