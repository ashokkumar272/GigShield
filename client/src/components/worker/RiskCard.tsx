export type RiskType = 'rain' | 'aqi' | 'heat' | 'disruption'
export type RiskLevel = 'high' | 'moderate' | 'low'

export type RiskItem = {
  id: string
  type: RiskType
  level: RiskLevel
}

type RiskCardProps = {
  risk: RiskItem
}

const riskCopyMap: Record<RiskType, { icon: string; text: string }> = {
  rain: { icon: '🌧️', text: 'Rain likely today - work may be slow' },
  aqi: { icon: '🌫️', text: 'Air quality is poor today' },
  heat: { icon: '☀️', text: 'Very hot today - fewer orders expected' },
  disruption: { icon: '🚫', text: 'Area issue reported nearby' },
}

const levelClassMap: Record<RiskLevel, string> = {
  high: 'border-rose-300 bg-rose-50 text-rose-800',
  moderate: 'border-amber-300 bg-amber-50 text-amber-900',
  low: 'border-emerald-300 bg-emerald-50 text-emerald-800',
}

export function RiskCard({ risk }: RiskCardProps) {
  const riskContent = riskCopyMap[risk.type]

  return (
    <article
      className={`min-w-[17rem] rounded-2xl border p-4 shadow-sm sm:min-w-[19rem] ${levelClassMap[risk.level]}`}
      aria-label={`${risk.type} risk ${risk.level}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          {riskContent.icon}
        </span>
        <p className="text-sm font-medium leading-6">{riskContent.text}</p>
      </div>
    </article>
  )
}
