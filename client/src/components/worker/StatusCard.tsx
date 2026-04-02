type StatusCardProps = {
  status: 'active' | 'expired'
  validTill: string
  maxPayout: number
  onStartProtection?: () => void
}

export function StatusCard({ status, validTill, maxPayout, onStartProtection }: StatusCardProps) {
  const isActive = status === 'active'

  return (
    <section
      className={`w-full rounded-3xl p-5 shadow-sm sm:p-6 ${
        isActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
      }`}
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85">Protection status</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
        {isActive ? "You're Protected 👍" : "You're Not Protected ⚠️"}
      </h2>
      <p className="mt-2 text-base leading-6 text-white/95">
        {isActive ? 'Your income is safe for this week' : 'Activate protection to stay safe'}
      </p>

      {isActive ? (
        <div className="mt-4 space-y-1 text-sm sm:text-base">
          <p>Valid till {validTill}</p>
          <p>Up to ₹{maxPayout.toLocaleString('en-IN')} covered</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStartProtection}
          className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          Start Protection
        </button>
      )}
    </section>
  )
}
