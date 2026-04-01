import { TextField } from './TextField'

type OTPFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function OTPField({ value, onChange, error }: OTPFieldProps) {
  return (
    <TextField label="OTP" value={value} onChange={onChange} placeholder="1234" error={error} />
  )
}
