type PaginationControlsProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, pageSize, total, onPageChange }: PaginationControlsProps) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm text-slate-600 sm:text-left">
        Page {page} of {maxPage}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => onPageChange(Math.min(maxPage, page + 1))}
          disabled={page >= maxPage}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
