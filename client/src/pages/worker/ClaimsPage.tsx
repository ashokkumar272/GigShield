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

const PAGE_SIZE = 6

export function ClaimsPage() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setClaims(await apiClient.getClaims())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load claims')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const paginatedClaims = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return claims.slice(start, start + PAGE_SIZE)
  }, [claims, page])

  return (
    <AppShell mode="worker" title="Claims" subtitle="Track event-triggered claims and statuses.">
      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load claims" message={error} onRetry={() => void load()} />}
      {!loading && !error && claims.length === 0 && (
        <EmptyState title="No claims yet" description="Claims will appear automatically when disruptions are triggered." />
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
