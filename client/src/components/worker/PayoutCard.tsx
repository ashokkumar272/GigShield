import type { Payout } from '../../types/api'
import { formatDate } from '../../lib/format'
import { AmountDisplay } from '../financial/AmountDisplay'
import { StatusBadge } from '../status/StatusBadge'
import { CopyToClipboardButton } from '../common/CopyToClipboardButton'

export function PayoutCard({ payout }: { payout: Payout }) {
  const methodName = payout.payment_method ? payout.payment_method.toUpperCase() : 'Auto Transfer'
  const payoutName = `${methodName} Payout`

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-100/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-sky-900">{payoutName}</p>
          <p className="text-xs text-slate-600">Ref {payout.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={payout.status} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-slate-700">Amount</p>
        <AmountDisplay amount={payout.amount_inr} />
      </div>
      <p className="mt-2 text-xs text-slate-600">Sent {formatDate(payout.processed_at)}</p>
      {payout.transaction_id && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-sky-100/70 px-2 py-1.5">
          <p className="text-xs text-slate-700">Ref: {payout.transaction_id}</p>
          <CopyToClipboardButton value={payout.transaction_id} />
        </div>
      )}
    </div>
  )
}
