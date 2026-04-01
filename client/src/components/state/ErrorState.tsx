type ErrorStateProps = {
  message: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-rose-800">Something went wrong</h3>
      <p className="mt-2 text-sm text-rose-700">{message}</p>
    </div>
  )
}
