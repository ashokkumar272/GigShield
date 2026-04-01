import type { Payout } from '../../types/api'
import { formatDate } from '../../lib/format'
import { AmountDisplay } from '../financial/AmountDisplay'
import { StatusBadge } from '../status/StatusBadge'
import { CopyToClipboardButton } from '../common/CopyToClipboardButton'

export function PayoutCard({ payout }: { payout: Payout }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Payout #{payout.id.slice(0, 8)}</p>
        <StatusBadge status={payout.status} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-slate-600">Amount</p>
        <AmountDisplay amount={payout.amount_inr} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Processed {formatDate(payout.processed_at)}</p>
      {payout.transaction_id && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-100 px-2 py-1.5">
          <p className="text-xs text-slate-700">Txn: {payout.transaction_id}</p>
          <CopyToClipboardButton value={payout.transaction_id} />
        </div>
      )}
    </div>
  )
}
