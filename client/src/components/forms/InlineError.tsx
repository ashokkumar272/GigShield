export function InlineError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
}
