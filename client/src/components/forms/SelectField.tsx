type Option = {
  label: string
  value: string
}

type SelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  error?: string
}

export function SelectField({ label, value, onChange, options, error }: SelectFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm transition ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-slate-500'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </label>
  )
}
