import { MetricCard } from '../financial/MetricCard'

export function ClaimsSummaryCard({ claimsThisMonth }: { claimsThisMonth: number }) {
  return <MetricCard label="Claims This Month" value={claimsThisMonth} hint="Auto-triggered by disruption events" />
}
