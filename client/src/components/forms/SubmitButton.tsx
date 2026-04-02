type SubmitButtonProps = {
  children: React.ReactNode
  isLoading?: boolean
  disabled?: boolean
}

export function SubmitButton({ children, isLoading = false, disabled = false }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:py-2.5 sm:text-sm"
    >
      {isLoading ? 'Please wait...' : children}
    </button>
  )
}
