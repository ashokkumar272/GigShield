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
        title: 'Money sent',
        description: `Ref ${response.transaction_id}`,
        tone: 'success',
      })
      await onSuccess?.()
    } catch (error) {
      pushToast({
        title: 'Money send failed',
        description: error instanceof Error ? error.message : 'Unable to send money',
        tone: 'error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-100/30 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-sky-900">Send money</h3>
      <p className="mt-1 text-sm text-slate-700">Money can be sent when this item is pending.</p>
      <button
        onClick={onProcess}
        disabled={disabled || isProcessing}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isProcessing ? 'Sending...' : 'Send money'}
      </button>
      {disabled && <p className="mt-2 text-xs text-slate-500">Current status: {claimStatus}</p>}
    </div>
  )
}
