import { TextField } from './TextField'

type CurrencyFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}

export function CurrencyField({ label, value, onChange, error }: CurrencyFieldProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      placeholder="8000"
      error={error}
    />
  )
}
