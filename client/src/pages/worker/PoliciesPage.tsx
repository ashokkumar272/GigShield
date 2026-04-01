import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type { Policy } from '../../types/api'
import { ROUTES } from '../../app/routes'
import { PolicyCard } from '../../components/worker/PolicyCard'
import { EmptyState } from '../../components/state/EmptyState'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { useToast } from '../../components/common/ToastProvider'

export function PoliciesPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openConfirm, setOpenConfirm] = useState(false)
  const [creating, setCreating] = useState(false)

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

  const hasActive = useMemo(() => policies.some((item) => item.status === 'active'), [policies])

  const handleCreatePolicy = async () => {
    setCreating(true)
    try {
      const created = await apiClient.createPolicy()
      pushToast({ title: 'Policy created', description: `Policy ${created.id.slice(0, 8)}`, tone: 'success' })
      setOpenConfirm(false)
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

  return (
    <AppShell mode="worker" title="Policies" subtitle="Create and review your weekly policy coverage.">
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setOpenConfirm(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          disabled={hasActive}
        >
          Create Policy
        </button>
      </div>
      {hasActive && <p className="mb-3 text-xs text-slate-500">You already have an active policy.</p>}

      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load policies" message={error} onRetry={() => void load()} />}
      {!loading && !error && policies.length === 0 && (
        <EmptyState
          title="No policies yet"
          description="Create your first weekly policy to activate income protection."
          actionLabel="Create Policy"
          onAction={() => setOpenConfirm(true)}
        />
      )}
      {!loading && !error && policies.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {policies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} onOpen={(id) => navigate(ROUTES.policyDetail(id))} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={openConfirm}
        title="Create new policy"
        description="This creates a 7-day active policy using your current profile and pricing engine."
        confirmLabel="Create"
        onCancel={() => setOpenConfirm(false)}
        onConfirm={() => void handleCreatePolicy()}
        loading={creating}
      />
    </AppShell>
  )
}
