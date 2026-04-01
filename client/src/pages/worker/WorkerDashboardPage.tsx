import { useEffect, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { WorkerDashboardResponse } from '../../types/api'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { WorkerProfileCard } from '../../components/worker/WorkerProfileCard'
import { ActivePolicyCard } from '../../components/worker/ActivePolicyCard'
import { ClaimsSummaryCard } from '../../components/worker/ClaimsSummaryCard'
import { PayoutSummaryCard } from '../../components/worker/PayoutSummaryCard'
import { MetricCard } from '../../components/financial/MetricCard'
import { formatINR } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'

export function WorkerDashboardPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<WorkerDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await apiClient.getWorkerDashboard()
      setData(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <AppShell mode="worker" title="Worker Dashboard" subtitle="Your policy, claims, and payout snapshot.">
      {loading && <LoadingSkeleton lines={6} />}
      {!loading && error && <RetryPanel title="Unable to load dashboard" message={error} onRetry={() => void load()} />}
      {!loading && !error && data && (
        <div className="space-y-4">
          {profile && <WorkerProfileCard profile={profile} />}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Protected This Week" value={formatINR(data.income_protected_this_week)} />
            <ClaimsSummaryCard claimsThisMonth={data.claims_this_month} />
            <PayoutSummaryCard payoutTotal={data.payout_total} />
            <ActivePolicyCard policy={data.active_policy} />
          </div>
        </div>
      )}
    </AppShell>
  )
}
