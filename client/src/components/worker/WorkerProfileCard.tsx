import type { WorkerProfile } from '../../types/api'

export function WorkerProfileCard({ profile }: { profile: WorkerProfile }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Worker Profile</h3>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt>
          <dd className="font-medium text-slate-900">{profile.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Platform</dt>
          <dd className="font-medium text-slate-900">{profile.platform}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">City</dt>
          <dd className="font-medium text-slate-900">{profile.city}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Vehicle</dt>
          <dd className="font-medium text-slate-900">{profile.vehicle_type}</dd>
        </div>
      </dl>
    </div>
  )
}
