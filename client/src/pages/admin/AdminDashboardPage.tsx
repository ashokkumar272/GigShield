import { useEffect, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { AdminDashboardResponse } from '../../types/api'
import { AdminMetricGrid } from '../../components/admin/AdminMetricGrid'
import { TopDisruptionCard } from '../../components/admin/TopDisruptionCard'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await apiClient.getAdminDashboard())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <AppShell
      mode="admin"
      title="Admin Dashboard"
      subtitle="Platform-wide metrics for operations teams."
      bannerText="Operations stay visible in one place."
      bannerTone="indigo"
    >
      {loading && <LoadingSkeleton lines={6} />}
      {!loading && error && <RetryPanel title="Unable to load admin metrics" message={error} onRetry={() => void load()} />}
      {!loading && !error && data && (
        <div className="space-y-4">
          <AdminMetricGrid data={data} />
          <TopDisruptionCard eventType={data.top_disruption_event} />
        </div>
      )}
    </AppShell>
  )
}
