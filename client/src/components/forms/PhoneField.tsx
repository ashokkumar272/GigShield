import { TextField } from './TextField'

type PhoneFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function PhoneField({ value, onChange, error }: PhoneFieldProps) {
  return (
    <TextField
      label="Phone"
      value={value}
      onChange={onChange}
      placeholder="+919876543210"
      error={error}
    />
  )
}
