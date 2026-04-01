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
  const [city, setCity] = useState('Bangalore')
  const [pincode, setPincode] = useState('')
  const [platform, setPlatform] = useState<'swiggy' | 'zomato' | 'dunzo' | 'ola' | 'uber' | 'rapido'>('swiggy')
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
          <SelectField
            label="City"
            value={city}
            onChange={setCity}
            options={[
              { label: 'Bangalore', value: 'Bangalore' },
              { label: 'Hyderabad', value: 'Hyderabad' },
              { label: 'Chennai', value: 'Chennai' },
              { label: 'Pune', value: 'Pune' },
              { label: 'Kolkata', value: 'Kolkata' },
              { label: 'Ahmedabad', value: 'Ahmedabad' },
              { label: 'Surat', value: 'Surat' },
              { label: 'Jaipur', value: 'Jaipur' },
            ]}
          />
          <TextField label="Pincode" value={pincode} onChange={setPincode} />
          <SelectField
            label="Platform"
            value={platform}
            onChange={(value) => setPlatform(value as 'swiggy' | 'zomato' | 'dunzo' | 'ola' | 'uber' | 'rapido')}
            options={[
              { label: 'Swiggy', value: 'swiggy' },
              { label: 'Zomato', value: 'zomato' },
              { label: 'Dunzo', value: 'dunzo' },
              { label: 'Ola', value: 'ola' },
              { label: 'Uber', value: 'uber' },
              { label: 'Rapido', value: 'rapido' },
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
