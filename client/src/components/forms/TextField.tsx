type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'password' | 'datetime-local'
  error?: string
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: TextFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className={`w-full rounded-xl border px-3 py-3 text-base text-slate-900 shadow-sm transition touch-manipulation sm:py-2.5 sm:text-sm ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-slate-500'
        }`}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </label>
  )
}
