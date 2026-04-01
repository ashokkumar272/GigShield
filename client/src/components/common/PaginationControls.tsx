type PaginationControlsProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, pageSize, total, onPageChange }: PaginationControlsProps) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-600">
        Page {page} of {maxPage}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => onPageChange(Math.min(maxPage, page + 1))}
          disabled={page >= maxPage}
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
