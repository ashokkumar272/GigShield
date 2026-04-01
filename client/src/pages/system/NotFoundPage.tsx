import { Link } from 'react-router-dom'
import { ROUTES } from '../../app/routes'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">404 Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">This page does not exist.</p>
        <Link to={ROUTES.landing} className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
