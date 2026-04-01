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
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pricing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <AppShell mode="worker" title="Pricing Preview" subtitle="Your premium is calculated from your profile.">
      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to fetch pricing" message={error} onRetry={() => void load()} />}
      {!loading && !error && data && <PremiumBreakdownCard data={data} />}
    </AppShell>
  )
}
