import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Claim } from '../../types/api'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { ErrorState } from '../../components/state/ErrorState'
import { BreakdownRow } from '../../components/financial/BreakdownRow'
import { SeverityBadge } from '../../components/status/SeverityBadge'
import { StatusBadge } from '../../components/status/StatusBadge'
import { toTitleCase } from '../../lib/format'

export function ClaimDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setClaim(await apiClient.getClaimById(id))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load support details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AppShell
      mode="worker"
      title="Support Details"
      subtitle="Check status and money updates."
      bannerText="You can track each support event clearly."
      bannerTone="amber"
    >
      <button onClick={() => navigate(-1)} className="mb-3 text-sm font-medium text-slate-700 hover:underline">
        Back
      </button>
      {loading && <LoadingSkeleton lines={4} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && claim && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-100/30 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={claim.status} />
              <SeverityBadge severity={claim.event_severity} />
            </div>
            <div className="mt-3">
              <BreakdownRow label="Claim ID" value={claim.id} />
              <BreakdownRow label="Support type" value={toTitleCase(claim.claim_type)} />
              <BreakdownRow label="Reason" value={toTitleCase(claim.event_type)} />
              <BreakdownRow label="Money amount" amount={claim.payout_amount_inr} />
              <BreakdownRow label="Safety check" value={claim.fraud_flag ?? 'None'} />
            </div>
          </div>
          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 shadow-sm">
            Money is sent automatically to your account.
          </section>
        </div>
      )}
    </AppShell>
  )
}
