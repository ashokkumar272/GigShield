export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse rounded bg-slate-200"
            style={{ width: `${80 - index * 6}%` }}
          />
        ))}
      </div>
    </div>
  )
}
