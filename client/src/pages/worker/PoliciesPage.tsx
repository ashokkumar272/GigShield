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
      setError(loadError instanceof Error ? loadError.message : 'Unable to load policies')
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
            : 'Unable to load recommended plans',
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
      pushToast({ title: 'Policy created', description: `Policy ${created.id.slice(0, 8)}`, tone: 'success' })
      setOpenCreateConfirm(false)
      void load()
    } catch (createError) {
      pushToast({
        title: 'Could not create policy',
        description: createError instanceof Error ? createError.message : 'Try again',
        tone: 'error',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleSelectRecommendation = async (recommendation: PolicyRecommendation) => {
    setSelectingPlanName(recommendation.plan_name)
    try {
      const created = await apiClient.createPolicyFromRecommendation({
        selected_recommendation: {
          plan_name: recommendation.plan_name,
          recommendation_score: recommendation.recommendation_score,
          parameter_scores: recommendation.parameter_scores,
          weekly_premium_inr: recommendation.weekly_premium_inr,
          coverage_amount_inr: recommendation.coverage_amount_inr,
          risk_score: recommendation.risk_score,
        },
      })
      pushToast({
        title: 'Policy selected',
        description: `${recommendation.plan_name} is now active (${created.id.slice(0, 8)})`,
        tone: 'success',
      })
      void load()
    } catch (selectError) {
      pushToast({
        title: 'Could not activate plan',
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
        title: 'Policy deleted',
        description: `Policy ${selectedPolicy.id.slice(0, 8)} was removed`,
        tone: 'success',
      })
      setOpenDeleteConfirm(false)
      setSelectedPolicy(null)
    } catch (deleteError) {
      pushToast({
        title: 'Could not delete policy',
        description: deleteError instanceof Error ? deleteError.message : 'Try again',
        tone: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell mode="worker" title="Policies" subtitle="Create and review your weekly policy coverage.">
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setOpenCreateConfirm(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          disabled={hasActive || policies.length === 0}
        >
          Create Policy
        </button>
      </div>
      {policies.length === 0 && (
        <p className="mb-3 text-xs text-slate-500">Select one recommended plan to activate your first policy.</p>
      )}
      {hasActive && <p className="mb-3 text-xs text-slate-500">You already have an active policy.</p>}

      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load policies" message={error} onRetry={() => void load()} />}
      {!loading && !error && policies.length === 0 && recommendationsLoading && <LoadingSkeleton lines={4} />}
      {!loading && !error && policies.length === 0 && recommendationsError && (
        <RetryPanel
          title="Unable to load recommended plans"
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
              Complete onboarding by selecting one recommended policy plan.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.plan_name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{recommendation.plan_name}</h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                    Fit {recommendation.recommendation_score}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{recommendation.summary}</p>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>Weekly premium: Rs {recommendation.weekly_premium_inr.toFixed(2)}</p>
                  <p>Coverage amount: Rs {recommendation.coverage_amount_inr.toFixed(2)}</p>
                  <p>Risk score: {recommendation.risk_score}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  {Object.entries(recommendation.parameter_scores).map(([name, value]) => (
                    <div key={name} className="rounded-lg bg-slate-100 px-2 py-1">
                      <p className="font-medium text-slate-700">{name.replaceAll('_', ' ')}</p>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
                  onClick={() => void handleSelectRecommendation(recommendation)}
                  disabled={Boolean(selectingPlanName)}
                >
                  {selectingPlanName === recommendation.plan_name ? 'Selecting...' : 'Select this plan'}
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
        title="Create new policy"
        description="This creates a 7-day active policy using your current profile and pricing engine."
        confirmLabel="Create"
        onCancel={() => setOpenCreateConfirm(false)}
        onConfirm={() => void handleCreatePolicy()}
        loading={creating}
      />

      <ConfirmDialog
        open={openDeleteConfirm}
        title="Delete policy"
        description={
          selectedPolicy
            ? `Delete policy ${selectedPolicy.id.slice(0, 8)}? This action cannot be undone.`
            : 'Delete this policy? This action cannot be undone.'
        }
        confirmLabel="Delete"
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
