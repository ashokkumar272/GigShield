import { Link } from 'react-router-dom'
import { ROUTES } from '../../app/routes'

export function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-amber-900">401 Unauthorized</h1>
        <p className="mt-2 text-sm text-amber-800">Please log in to access this page.</p>
        <Link to={ROUTES.login} className="mt-4 inline-block rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white">
          Go to Login
        </Link>
      </div>
    </div>
  )
}
