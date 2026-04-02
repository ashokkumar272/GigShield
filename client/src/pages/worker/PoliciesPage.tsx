import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Policy, PolicyRecommendation } from '../../types/api'
import { ROUTES } from '../../app/routes'
import { PolicyCard } from '../../components/worker/PolicyCard'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { useToast } from '../../components/common/ToastProvider'

export function PoliciesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pushToast } = useToast()
  const forceRecommendationSelection =
    (location.state as { forceRecommendationSelection?: boolean } | null)?.forceRecommendationSelection ?? false
  const [policies, setPolicies] = useState<Policy[]>([])
  const [recommendations, setRecommendations] = useState<PolicyRecommendation[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [recommendationsError, setRecommendationsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openCreateConfirm, setOpenCreateConfirm] = useState(false)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectingPlanName, setSelectingPlanName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      setPolicies(await apiClient.getPolicies())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (loading || policies.length > 0) {
      return
    }

    const loadRecommendations = async () => {
      setRecommendationsError('')
      setRecommendationsLoading(true)
      try {
        const response = await apiClient.getPolicyRecommendations()
        setRecommendations(response.recommendations)
      } catch (loadRecommendationError) {
        setRecommendationsError(
          loadRecommendationError instanceof Error
            ? loadRecommendationError.message
            : 'Unable to load suggested plans',
        )
      } finally {
        setRecommendationsLoading(false)
      }
    }

    void loadRecommendations()
  }, [loading, policies.length])

  const hasActive = useMemo(() => policies.some((item) => item.status === 'active'), [policies])

  const handleCreatePolicy = async () => {
    setCreating(true)
    try {
      const created = await apiClient.createPolicy()
      pushToast({ title: 'Protection started', description: `Ref ${created.id.slice(0, 8)}`, tone: 'success' })
      setOpenCreateConfirm(false)
      void load()
    } catch (createError) {
      pushToast({
        title: 'Could not start protection',
        description: createError instanceof Error ? createError.message : 'Try again',
        tone: 'error',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleSelectRecommendation = async (recommendation: PolicyRecommendation) => {
    setSelectingPlanName(recommendation.plan_type)
    try {
      const created = await apiClient.createPolicyFromRecommendation({
        selected_recommendation: {
          plan_type: recommendation.plan_type,
          premium: recommendation.premium,
          max_payout: recommendation.max_payout,
          expected_payout: recommendation.expected_payout,
          value_score: recommendation.value_score,
        },
      })
      pushToast({
        title: 'Plan started',
        description: `${recommendation.plan_type} is now active (${created.id.slice(0, 8)})`,
        tone: 'success',
      })
      void load()
    } catch (selectError) {
      pushToast({
        title: 'Could not start plan',
        description: selectError instanceof Error ? selectError.message : 'Try again',
        tone: 'error',
      })
    } finally {
      setSelectingPlanName('')
    }
  }

  const handleDeletePolicy = async () => {
    if (!selectedPolicy) {
      return
    }

    setDeleting(true)
    try {
      await apiClient.deletePolicy(selectedPolicy.id)
      setPolicies((current) => current.filter((item) => item.id !== selectedPolicy.id))
      pushToast({
        title: 'Plan removed',
        description: `Ref ${selectedPolicy.id.slice(0, 8)} was removed`,
        tone: 'success',
      })
      setOpenDeleteConfirm(false)
      setSelectedPolicy(null)
    } catch (deleteError) {
      pushToast({
        title: 'Could not remove plan',
        description: deleteError instanceof Error ? deleteError.message : 'Try again',
        tone: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell mode="worker" title="Protection Plans" subtitle="Pick a plan. Stay safe this week.">
      <section className="mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-emerald-900">Choose once. Stay protected all week.</p>
      </section>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setOpenCreateConfirm(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          disabled={hasActive || policies.length === 0}
        >
          Start Protection
        </button>
      </div>
      {policies.length === 0 && (
        <p className="mb-3 text-xs text-slate-500">Pick one suggested plan to get protected.</p>
      )}
      {hasActive && <p className="mb-3 text-xs text-slate-500">You are already protected right now.</p>}

      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load plans" message={error} onRetry={() => void load()} />}
      {!loading && !error && policies.length === 0 && recommendationsLoading && <LoadingSkeleton lines={4} />}
      {!loading && !error && policies.length === 0 && recommendationsError && (
        <RetryPanel
          title="Unable to load suggested plans"
          message={recommendationsError}
          onRetry={() => {
            setRecommendations([])
            setPolicies([])
            void load()
          }}
        />
      )}
      {!loading && !error && policies.length === 0 && !recommendationsLoading && !recommendationsError && (
        <div className="space-y-3">
          {forceRecommendationSelection && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Finish setup by picking one suggested plan.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.plan_type}
                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-100/30 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{recommendation.plan_type}</h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                    Value {recommendation.value_score.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{recommendation.why_recommended}</p>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>Weekly cost: ₹{recommendation.premium.toFixed(2)}</p>
                  <p>Max support: ₹{recommendation.max_payout.toFixed(2)}</p>
                  <p>Likely support: ₹{recommendation.expected_payout.toFixed(2)}</p>
                </div>
                <button
                  className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
                  onClick={() => void handleSelectRecommendation(recommendation)}
                  disabled={Boolean(selectingPlanName)}
                >
                  {selectingPlanName === recommendation.plan_type ? 'Starting...' : 'Choose this plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!loading && !error && policies.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onOpen={(id) => navigate(ROUTES.policyDetail(id))}
              onDelete={(chosenPolicy) => {
                setSelectedPolicy(chosenPolicy)
                setOpenDeleteConfirm(true)
              }}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={openCreateConfirm}
        title="Start protection"
        description="This starts a 7-day protection plan from your current details."
        confirmLabel="Start"
        onCancel={() => setOpenCreateConfirm(false)}
        onConfirm={() => void handleCreatePolicy()}
        loading={creating}
      />

      <ConfirmDialog
        open={openDeleteConfirm}
        title="Remove plan"
        description={
          selectedPolicy
            ? `Remove plan ${selectedPolicy.id.slice(0, 8)}? This cannot be undone.`
            : 'Remove this plan? This cannot be undone.'
        }
        confirmLabel="Remove"
        onCancel={() => {
          setOpenDeleteConfirm(false)
          setSelectedPolicy(null)
        }}
        onConfirm={() => void handleDeletePolicy()}
        loading={deleting}
      />
    </AppShell>
  )
}
