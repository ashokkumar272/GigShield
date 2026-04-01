import { useState } from 'react'
import { apiClient } from '../../lib/apiClient'
import { useToast } from '../common/ToastProvider'

type ProcessPayoutPanelProps = {
  claimId: string
  claimStatus: string
  onSuccess?: () => Promise<void> | void
}

export function ProcessPayoutPanel({ claimId, claimStatus, onSuccess }: ProcessPayoutPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { pushToast } = useToast()

  const disabled = claimStatus !== 'pending'

  const onProcess = async () => {
    setIsProcessing(true)
    try {
      const response = await apiClient.processPayout(claimId)
      pushToast({
        title: 'Payout processed',
        description: `Transaction ${response.transaction_id}`,
        tone: 'success',
      })
      await onSuccess?.()
    } catch (error) {
      pushToast({
        title: 'Payout failed',
        description: error instanceof Error ? error.message : 'Unable to process payout',
        tone: 'error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Process Payout</h3>
      <p className="mt-1 text-sm text-slate-600">
        You can process payout only for pending claims that are not fraud-flagged.
      </p>
      <button
        onClick={onProcess}
        disabled={disabled || isProcessing}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isProcessing ? 'Processing...' : 'Process Payout'}
      </button>
      {disabled && <p className="mt-2 text-xs text-slate-500">Current claim status: {claimStatus}</p>}
    </div>
  )
}
