import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Claim } from '../../types/api'
import { ClaimCard } from '../../components/worker/ClaimCard'
import { EmptyState } from '../../components/state/EmptyState'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { PaginationControls } from '../../components/common/PaginationControls'
import { ROUTES } from '../../app/routes'
import { SelectField } from '../../components/forms/SelectField'

const PAGE_SIZE = 6
const MANUAL_CLAIM_SEVERITY_OPTIONS = [
  { label: 'Low (25% payout)', value: 'low' },
  { label: 'Medium (50% payout)', value: 'medium' },
  { label: 'High (75% payout)', value: 'high' },
  { label: 'Critical (100% payout)', value: 'critical' },
] as const

type ClaimSeverity = 'low' | 'medium' | 'high' | 'critical'

export function ClaimsPage() {
  const showManualTools = import.meta.env.DEV
  const navigate = useNavigate()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [manualSeverity, setManualSeverity] = useState<ClaimSeverity>('high')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setClaims(await apiClient.getClaims())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load support history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleManualClaim = async () => {
    setClaiming(true)
    setError('')
    try {
      await apiClient.manualClaimMoney({ severity: manualSeverity })
      setPage(1)
      await load()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to request support right now')
    } finally {
      setClaiming(false)
    }
  }

  const paginatedClaims = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return claims.slice(start, start + PAGE_SIZE)
  }, [claims, page])

  return (
    <AppShell mode="worker" title="Support History" subtitle="See when we sent help money.">
      <section className="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-amber-900">If work slows, help appears here fast.</p>
      </section>
      {showManualTools && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <SelectField
              label="Test support level"
              value={manualSeverity}
              onChange={(value) => setManualSeverity(value as ClaimSeverity)}
              options={MANUAL_CLAIM_SEVERITY_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
            <button
              type="button"
              onClick={() => void handleManualClaim()}
              disabled={claiming || loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claiming ? 'Sending...' : 'Send Test Support'}
            </button>
          </div>
        </div>
      )}
      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && (
        <RetryPanel title="Unable to load support history" message={error} onRetry={() => void load()} />
      )}
      {!loading && !error && claims.length === 0 && (
        <EmptyState title="No support events yet" description="If work slows down, help shows here automatically." />
      )}
      {!loading && !error && claims.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {paginatedClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} onOpen={(id) => navigate(ROUTES.claimDetail(id))} />
            ))}
          </div>
          <div className="mt-4">
            <PaginationControls page={page} pageSize={PAGE_SIZE} total={claims.length} onPageChange={setPage} />
          </div>
        </>
      )}
    </AppShell>
  )
}
