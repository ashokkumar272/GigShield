import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import { CurrencyField } from '../../components/forms/CurrencyField'
import { InlineError } from '../../components/forms/InlineError'
import { PhoneField } from '../../components/forms/PhoneField'
import { SelectField } from '../../components/forms/SelectField'
import { SubmitButton } from '../../components/forms/SubmitButton'
import { TextField } from '../../components/forms/TextField'
import { useAuth } from '../../contexts/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Mumbai')
  const [pincode, setPincode] = useState('')
  const [platform, setPlatform] = useState<'zomato' | 'swiggy'>('zomato')
  const [income, setIncome] = useState('8000')
  const [vehicleType, setVehicleType] = useState<'bike' | 'scooter' | 'cycle'>('bike')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await register({
        name,
        phone,
        city,
        pincode,
        platform,
        avg_weekly_income_inr: Number(income),
        vehicle_type: vehicleType,
      })
      navigate(ROUTES.login)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to register')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Worker Registration</h1>
        <p className="text-sm text-slate-600">Create your account using your delivery worker profile.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField label="Name" value={name} onChange={setName} />
          <PhoneField value={phone} onChange={setPhone} />
          <TextField label="City" value={city} onChange={setCity} />
          <TextField label="Pincode" value={pincode} onChange={setPincode} />
          <SelectField
            label="Platform"
            value={platform}
            onChange={(value) => setPlatform(value as 'zomato' | 'swiggy')}
            options={[
              { label: 'Zomato', value: 'zomato' },
              { label: 'Swiggy', value: 'swiggy' },
            ]}
          />
          <SelectField
            label="Vehicle Type"
            value={vehicleType}
            onChange={(value) => setVehicleType(value as 'bike' | 'scooter' | 'cycle')}
            options={[
              { label: 'Bike', value: 'bike' },
              { label: 'Scooter', value: 'scooter' },
              { label: 'Cycle', value: 'cycle' },
            ]}
          />
          <CurrencyField label="Average Weekly Income (INR)" value={income} onChange={setIncome} />
        </div>
        <InlineError message={error} />
        <SubmitButton isLoading={isLoading}>Register Account</SubmitButton>
        <p className="text-xs text-slate-500">
          Already registered? <Link to={ROUTES.login} className="font-semibold text-slate-800">Login</Link>
        </p>
      </form>
    </div>
  )
}
