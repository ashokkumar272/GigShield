import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { ROUTES } from '../../app/routes'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { StatusCard } from '../../components/worker/StatusCard'
import { RiskCard, type RiskItem } from '../../components/worker/RiskCard'
import { SummaryCard } from '../../components/worker/SummaryCard'
import { apiClient } from '../../lib/apiClient'
import { formatDate, formatINR } from '../../lib/format'
import type { Policy, WorkerDashboardResponse } from '../../types/api'

export function WorkerDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<WorkerDashboardResponse | null>(null)
  const [activePolicyDetails, setActivePolicyDetails] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true)
    }
    setError('')

    try {
      const dashboard = await apiClient.getWorkerDashboard()
      setData(dashboard)

      if (!dashboard.active_policy) {
        setActivePolicyDetails(null)
        return
      }

      try {
        const policy = await apiClient.getPolicyById(dashboard.active_policy.id)
        setActivePolicyDetails(policy)
      } catch {
        setActivePolicyDetails(null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load home data')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void load(true)

    const intervalId = window.setInterval(() => {
      void load(false)
    }, 8000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const activePolicy = data?.active_policy ?? null
  const isProtectedToday = Boolean(activePolicy)
  const protectionStatus: 'active' | 'expired' = isProtectedToday ? 'active' : 'expired'
  const validTill = formatDate(activePolicy?.end_date ?? null)
  const maxPayout = Math.round(activePolicy?.coverage_amount_inr ?? 0)
  const weeklyCost = activePolicy?.weekly_premium_inr ?? 0
  const riskToday = data?.risk_today ?? null

  const selectedPlanName = useMemo(() => {
    if (!activePolicyDetails?.risk_factors) {
      return 'Your current plan'
    }

    try {
      const parsed = JSON.parse(activePolicyDetails.risk_factors) as string[]
      const planEntry = parsed.find((item) => item.startsWith('plan:'))
      const planName = planEntry?.split(':')[1]
      return planName ? `${planName} Plan` : 'Your current plan'
    } catch {
      return 'Your current plan'
    }
  }, [activePolicyDetails?.risk_factors])

  const risks = useMemo<RiskItem[]>(() => {
    if (!riskToday) {
      return []
    }

    const weather = riskToday.weather_condition.toLowerCase()
    const traffic = riskToday.traffic_level.toLowerCase()

    const weatherLevel: RiskItem['level'] =
      weather === 'stormy' || weather === 'smog' || weather === 'haze'
        ? 'high'
        : weather === 'rainy' || weather === 'drizzle' || weather === 'cloudy'
          ? 'moderate'
          : 'low'

    const trafficLevel: RiskItem['level'] =
      traffic === 'severe' || traffic === 'gridlock' || traffic === 'strike' || traffic === 'shutdown'
        ? 'high'
        : traffic === 'high'
          ? 'moderate'
          : 'low'

    const precipitationLevel: RiskItem['level'] =
      riskToday.precipitation_mm > 50 ? 'high' : riskToday.precipitation_mm >= 20 ? 'moderate' : 'low'

    const weatherRiskType: RiskItem['type'] =
      weather === 'smog' || weather === 'haze'
        ? 'aqi'
        : weather === 'clear' || weather === 'sunny'
          ? 'heat'
          : 'rain'

    return [
      {
        id: `risk-weather-${riskToday.sample_index}`,
        type: weatherRiskType,
        level: weatherLevel,
      },
      {
        id: `risk-traffic-${riskToday.sample_index}`,
        type: 'disruption',
        level: trafficLevel,
      },
      {
        id: `risk-precip-${riskToday.sample_index}`,
        type: 'rain',
        level: precipitationLevel,
      },
    ]
  }, [riskToday])

  const potentialPayout = Math.round(data?.income_protected_this_week ?? 0)

  return (
    <AppShell
      mode="worker"
      title="Home"
      subtitle="Your safety check for today."
      bannerTone="emerald"
    >
      <div className="mx-auto w-full max-w-xl space-y-4 pb-24 md:max-w-2xl md:pb-28">
        {loading && <LoadingSkeleton lines={5} />}
        {!loading && error && <RetryPanel title="Unable to load home" message={error} onRetry={() => void load(true)} />}

        {!loading && !error && (
          <>
            <StatusCard
              status={protectionStatus}
              validTill={validTill}
              maxPayout={maxPayout}
              onStartProtection={() => navigate(ROUTES.policies)}
            />

            {isProtectedToday && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm shadow-sm">
                <p className="font-semibold text-emerald-900">{selectedPlanName}</p>
                <p className="mt-1 text-emerald-800">Weekly cost {formatINR(weeklyCost)} · Active now</p>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="text-lg font-bold text-slate-900">Risks today</h3>
              <p className="mt-1 text-sm text-slate-600">We watch your area all day.</p>

              {risks.length > 0 ? (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {risks.map((risk) => (
                    <RiskCard key={risk.id} risk={risk} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">No major risk signal right now.</p>
              )}

              {riskToday && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <p>
                    Weather <span className="font-semibold text-slate-900">{riskToday.weather_condition}</span> · Traffic{' '}
                    <span className="font-semibold text-slate-900">{riskToday.traffic_level}</span> · Precipitation{' '}
                    <span className="font-semibold text-slate-900">{riskToday.precipitation_mm.toFixed(1)} mm</span>
                  </p>
                  <p className="mt-1 text-slate-600">
                    Simulation step #{riskToday.sample_index} · Mapped event {riskToday.event_type} ({riskToday.severity})
                  </p>
                </div>
              )}

              {riskToday?.claims_created ? (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                  Auto-claim triggered: {riskToday.claims_created} claim{riskToday.claims_created > 1 ? 's' : ''} created.
                </p>
              ) : riskToday?.note ? (
                <p
                  className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                    riskToday.threshold_crossed
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {riskToday.note}
                </p>
              ) : null}

              <p className="mt-3 text-sm font-medium text-slate-600">We track these to protect your income. Values update every 8 seconds.</p>
            </section>

            <SummaryCard isProtectedToday={isProtectedToday} potentialPayout={potentialPayout} />

            <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm shadow-sm">
              <p className="font-semibold text-sky-900">This month</p>
              <p className="mt-1 text-sky-800">
                {data?.claims_this_month ?? 0} support events · {formatINR(data?.payout_total ?? 0)} sent
              </p>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm">
              No forms. No claims. Money sent automatically.
            </section>

          </>
        )}
      </div>
    </AppShell>
  )
}
