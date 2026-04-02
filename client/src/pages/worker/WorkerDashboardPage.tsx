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
import type { Policy, PremiumBreakdownResponse, WorkerDashboardResponse } from '../../types/api'

export function WorkerDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<WorkerDashboardResponse | null>(null)
  const [activePolicyDetails, setActivePolicyDetails] = useState<Policy | null>(null)
  const [pricingPreview, setPricingPreview] = useState<PremiumBreakdownResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const dashboard = await apiClient.getWorkerDashboard()
      setData(dashboard)

      if (!dashboard.active_policy) {
        setActivePolicyDetails(null)
        setPricingPreview(null)
        return
      }

      const [policyResult, pricingResult] = await Promise.allSettled([
        apiClient.getPolicyById(dashboard.active_policy.id),
        apiClient.getPricingPreview(),
      ])

      if (policyResult.status === 'fulfilled') {
        setActivePolicyDetails(policyResult.value)
      } else {
        setActivePolicyDetails(null)
      }

      if (pricingResult.status === 'fulfilled') {
        setPricingPreview(pricingResult.value)
      } else {
        setPricingPreview(null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load home data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const activePolicy = data?.active_policy ?? null
  const isProtectedToday = Boolean(activePolicy)
  const protectionStatus: 'active' | 'expired' = isProtectedToday ? 'active' : 'expired'
  const validTill = formatDate(activePolicy?.end_date ?? null)
  const maxPayout = Math.round(activePolicy?.coverage_amount_inr ?? 0)
  const weeklyCost = activePolicy?.weekly_premium_inr ?? 0

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
    if (!pricingPreview) {
      return []
    }

    const score = pricingPreview.risk_score
    const level: RiskItem['level'] = score >= 6.5 ? 'high' : score >= 3.5 ? 'moderate' : 'low'
    const factors = pricingPreview.risk_factors.map((item) => item.toLowerCase())
    const mapped: RiskItem[] = []

    if (factors.some((item) => item.includes('rain'))) {
      mapped.push({ id: 'risk-rain', type: 'rain', level })
    }
    if (factors.some((item) => item.includes('aqi') || item.includes('air'))) {
      mapped.push({ id: 'risk-aqi', type: 'aqi', level })
    }
    if (factors.some((item) => item.includes('heat') || item.includes('temp'))) {
      mapped.push({ id: 'risk-heat', type: 'heat', level })
    }
    if (factors.some((item) => item.includes('zone') || item.includes('disruption') || item.includes('curfew') || item.includes('strike'))) {
      mapped.push({ id: 'risk-disruption', type: 'disruption', level })
    }

    return mapped.slice(0, 4)
  }, [pricingPreview])

  const potentialPayout = Math.round(data?.income_protected_this_week ?? 0)

  return (
    <AppShell mode="worker" title="Home" subtitle="Your safety check for today.">
      <div className="mx-auto w-full max-w-xl space-y-4 pb-24 md:max-w-2xl md:pb-28">
        {loading && <LoadingSkeleton lines={5} />}
        {!loading && error && <RetryPanel title="Unable to load home" message={error} onRetry={() => void load()} />}

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

              <p className="mt-3 text-sm font-medium text-slate-600">We track these to protect your income</p>
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

            <div className="fixed inset-x-0 bottom-[4.75rem] z-30 px-3 md:bottom-5 md:px-6">
              <div className="mx-auto w-full max-w-xl md:max-w-2xl">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.policies)}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800"
                >
                  {isProtectedToday ? 'Manage Protection' : 'Start Protection'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
