type RetryPanelProps = {
  title: string
  message: string
  onRetry: () => void
}

export function RetryPanel({ title, message, onRetry }: RetryPanelProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-amber-900">{title}</h3>
      <p className="mt-1 text-sm text-amber-800">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
      >
        Retry
      </button>
    </div>
  )
}
