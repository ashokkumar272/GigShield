import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Policy } from '../../types/api'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { ErrorState } from '../../components/state/ErrorState'
import { BreakdownRow } from '../../components/financial/BreakdownRow'
import { StatusBadge } from '../../components/status/StatusBadge'
import { formatDate } from '../../lib/format'

export function PolicyDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient
      .getPolicyById(id)
      .then(setPolicy)
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : 'Unable to load plan details'),
      )
      .finally(() => setLoading(false))
  }, [id])

  return (
    <AppShell
      mode="worker"
      title="Plan Details"
      subtitle="Your protection details for this week."
      bannerText="Your plan is active for this week."
      bannerTone="emerald"
    >
      <button onClick={() => navigate(-1)} className="mb-3 text-sm font-medium text-slate-700 hover:underline">
        Back
      </button>
      {loading && <LoadingSkeleton lines={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && policy && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-100/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emerald-900">{policy.risk_factors?.includes('Basic') ? 'Basic Plan' : policy.risk_factors?.includes('Standard') ? 'Standard Plan' : policy.risk_factors?.includes('High') ? 'High Plan' : `Plan #${policy.id.slice(0, 8)}`}</h3>
            <StatusBadge status={policy.status} />
          </div>
          <div className="mt-3">
            <BreakdownRow label="Weekly cost" amount={policy.weekly_premium_inr} />
            <BreakdownRow label="Max support" amount={policy.coverage_amount_inr} />
            <BreakdownRow label="Risk level" value={policy.risk_score.toFixed(2)} />
            <BreakdownRow label="Starts" value={formatDate(policy.start_date)} />
            <BreakdownRow label="Ends" value={formatDate(policy.end_date)} />
          </div>
        </div>
      )}
    </AppShell>
  )
}
