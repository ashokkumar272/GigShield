import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { OTPField } from '../../components/forms/OTPField'
import { PhoneField } from '../../components/forms/PhoneField'
import { SubmitButton } from '../../components/forms/SubmitButton'
import { InlineError } from '../../components/forms/InlineError'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../app/routes'
import { apiClient } from '../../lib/apiClient'

export function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('1234')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = (location.state as { from?: string } | null)?.from

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login({ phone, otp })
      const existingPolicies = await apiClient.getPolicies()
      if (existingPolicies.length === 0) {
        navigate(ROUTES.policies, { state: { forceRecommendationSelection: true } })
        return
      }
      navigate(fromPath ?? ROUTES.appDashboard)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">GigShield</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Worker Login</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">Use your phone and OTP to continue.</p>
        </div>
        <PhoneField value={phone} onChange={setPhone} />
        <OTPField value={otp} onChange={setOtp} />
        <InlineError message={error} />
        <SubmitButton isLoading={isLoading}>Login</SubmitButton>
        <p className="text-sm text-slate-500">
          New to GigShield? <Link to={ROUTES.register} className="font-semibold text-slate-800">Register</Link>
        </p>
      </form>
    </div>
  )
}
