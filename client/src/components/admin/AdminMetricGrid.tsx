import type { AdminDashboardResponse } from '../../types/api'
import { formatINR } from '../../lib/format'
import { MetricCard } from '../financial/MetricCard'

export function AdminMetricGrid({ data }: { data: AdminDashboardResponse }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total Workers" value={data.total_workers} />
      <MetricCard label="Active Policies" value={data.active_policies} />
      <MetricCard label="Claims Today" value={data.claims_triggered_today} />
      <MetricCard label="Payout Liability" value={formatINR(data.payout_liability_inr)} />
    </div>
  )
}
