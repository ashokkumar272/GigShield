import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Claim } from '../../types/api'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { ErrorState } from '../../components/state/ErrorState'
import { BreakdownRow } from '../../components/financial/BreakdownRow'
import { ProcessPayoutPanel } from '../../components/worker/ProcessPayoutPanel'
import { SeverityBadge } from '../../components/status/SeverityBadge'
import { StatusBadge } from '../../components/status/StatusBadge'
import { toTitleCase } from '../../lib/format'

export function ClaimDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      setClaim(await apiClient.getClaimById(id))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load claim')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  return (
    <AppShell mode="worker" title="Claim Detail" subtitle="Inspect claim status and process payout.">
      <button onClick={() => navigate(-1)} className="mb-3 text-sm font-medium text-slate-700 hover:underline">
        Back
      </button>
      {loading && <LoadingSkeleton lines={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && claim && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={claim.status} />
              <SeverityBadge severity={claim.event_severity} />
            </div>
            <div className="mt-3">
              <BreakdownRow label="Claim ID" value={claim.id} />
              <BreakdownRow label="Claim Type" value={toTitleCase(claim.claim_type)} />
              <BreakdownRow label="Event Type" value={toTitleCase(claim.event_type)} />
              <BreakdownRow label="Payout Amount" amount={claim.payout_amount_inr} />
              <BreakdownRow label="Fraud Flag" value={claim.fraud_flag ?? 'None'} />
            </div>
          </div>
          <ProcessPayoutPanel claimId={claim.id} claimStatus={claim.status} onSuccess={load} />
        </div>
      )}
    </AppShell>
  )
}
