import { useEffect, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { PremiumBreakdownResponse } from '../../types/api'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { PremiumBreakdownCard } from '../../components/worker/PremiumBreakdownCard'

export function PricingPage() {
  const [data, setData] = useState<PremiumBreakdownResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      setData(await apiClient.getPricingPreview())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load weekly cost')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <AppShell mode="worker" title="Weekly Cost" subtitle="Simple view of your weekly amount.">
      <section className="mb-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-cyan-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-indigo-900">Easy weekly cost. No hidden surprises.</p>
      </section>
      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load weekly cost" message={error} onRetry={() => void load()} />}
      {!loading && !error && data && <PremiumBreakdownCard data={data} />}
    </AppShell>
  )
}
