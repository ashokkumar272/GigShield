import type { PremiumBreakdownResponse } from '../../types/api'
import { BreakdownRow } from '../financial/BreakdownRow'

export function PremiumBreakdownCard({ data }: { data: PremiumBreakdownResponse }) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-100/30 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-indigo-900">How weekly cost is set</h3>
      <div className="mt-3">
        <BreakdownRow label="Base amount" amount={data.base_premium} />
        <BreakdownRow label="Max support" amount={data.coverage_amount_inr} />
        <BreakdownRow label="Area check" value={data.zone_risk_multiplier.toFixed(2)} />
        <BreakdownRow label="Weather check" value={data.weather_risk_factor.toFixed(2)} />
        <BreakdownRow label="Weekly cost" amount={data.weekly_premium_inr} emphasize />
      </div>
      <p className="mt-3 text-sm text-slate-700">Today we checked: {data.risk_factors.join(', ') || 'None'}</p>
    </div>
  )
}
