import { AmountDisplay } from './AmountDisplay'

type BreakdownRowProps = {
  label: string
  amount?: number
  value?: string
  emphasize?: boolean
}

export function BreakdownRow({ label, amount, value, emphasize = false }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-none">
      <span className="text-sm text-slate-600">{label}</span>
      {typeof amount === 'number' ? <AmountDisplay amount={amount} emphasize={emphasize} /> : <span>{value}</span>}
    </div>
  )
}
