import { formatINR } from '../../lib/format'

export function AmountDisplay({ amount, emphasize = false }: { amount: number; emphasize?: boolean }) {
  return (
    <span className={emphasize ? 'text-xl font-bold text-slate-900' : 'text-sm font-semibold text-slate-800'}>
      {formatINR(amount)}
    </span>
  )
}
