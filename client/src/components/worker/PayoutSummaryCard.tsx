import { formatINR } from '../../lib/format'
import { MetricCard } from '../financial/MetricCard'

export function PayoutSummaryCard({ payoutTotal }: { payoutTotal: number }) {
  return <MetricCard label="Total Payouts" value={formatINR(payoutTotal)} />
}
