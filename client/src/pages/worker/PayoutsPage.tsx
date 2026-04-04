import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Payout } from '../../types/api'
import { EmptyState } from '../../components/state/EmptyState'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { PayoutCard } from '../../components/worker/PayoutCard'
import { PaginationControls } from '../../components/common/PaginationControls'

const PAGE_SIZE = 6

export function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      setPayouts(await apiClient.getPayouts())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load money history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return payouts.slice(start, start + PAGE_SIZE)
  }, [payouts, page])

  return (
    <AppShell
      mode="worker"
      title="Money History"
      subtitle="See money we sent to you."
      bannerText="Every transfer is tracked clearly for you."
      bannerTone="sky"
    >
      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load money history" message={error} onRetry={() => void load()} />}
      {!loading && !error && payouts.length === 0 && (
        <EmptyState title="No money sent yet" description="When support is sent, it shows here." />
      )}
      {!loading && !error && payouts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((payout) => (
              <PayoutCard key={payout.id} payout={payout} />
            ))}
          </div>
          <div className="mt-4">
            <PaginationControls page={page} pageSize={PAGE_SIZE} total={payouts.length} onPageChange={setPage} />
          </div>
        </>
      )}
    </AppShell>
  )
}
