import type { PremiumBreakdownResponse } from '../../types/api'
import { BreakdownRow } from '../financial/BreakdownRow'

export function PremiumBreakdownCard({ data }: { data: PremiumBreakdownResponse }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Premium Breakdown</h3>
      <div className="mt-3">
        <BreakdownRow label="Base Premium" amount={data.base_premium} />
        <BreakdownRow label="Coverage Amount" amount={data.coverage_amount_inr} />
        <BreakdownRow label="Zone Risk Multiplier" value={data.zone_risk_multiplier.toFixed(2)} />
        <BreakdownRow label="Weather Risk Factor" value={data.weather_risk_factor.toFixed(2)} />
        <BreakdownRow label="Weekly Premium" amount={data.weekly_premium_inr} emphasize />
      </div>
      <p className="mt-3 text-sm text-slate-600">Risk factors: {data.risk_factors.join(', ') || 'None'}</p>
    </div>
  )
}
