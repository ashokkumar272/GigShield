import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../lib/apiClient'
import { ROUTES } from '../../app/routes'

export function LandingPage() {
  const [serviceStatus, setServiceStatus] = useState('Checking')

  useEffect(() => {
    apiClient
      .getHealth()
      .then((response) => setServiceStatus(response.status))
      .catch(() => setServiceStatus('Unavailable'))
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff4df,_#f8fafc_55%,_#e2e8f0_100%)] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur sm:p-8 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">GigShield</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
          Parametric income protection for delivery workers.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
          Get automatic claim support during severe rain, air quality spikes, and city disruptions. No
          complex forms. No insurance jargon.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to={ROUTES.register} className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white">
            Create Account
          </Link>
          <Link
            to={ROUTES.login}
            className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700"
          >
            Login
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Fast onboarding</p>
            <p className="mt-1 text-sm text-slate-600">Register once with your worker profile in under 2 minutes.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Auto-claims</p>
            <p className="mt-1 text-sm text-slate-600">Claims are event-triggered and visible instantly in dashboard.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Service status</p>
            <p className="mt-1 text-sm text-slate-600">Backend health: {serviceStatus}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
