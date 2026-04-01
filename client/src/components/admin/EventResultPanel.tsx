import type { EventTriggerResponse } from '../../types/api'
import { CopyToClipboardButton } from '../common/CopyToClipboardButton'

export function EventResultPanel({ result }: { result: EventTriggerResponse | null }) {
  if (!result) return null

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-emerald-900">Event Processed</h3>
      <p className="mt-2 text-sm text-emerald-800">{result.claims_created} claims were created.</p>
      <div className="mt-3 space-y-2">
        {result.claim_ids.map((claimId) => (
          <div key={claimId} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
            <p className="text-xs text-slate-700">{claimId}</p>
            <CopyToClipboardButton value={claimId} label="Copy ID" />
          </div>
        ))}
      </div>
    </div>
  )
}
