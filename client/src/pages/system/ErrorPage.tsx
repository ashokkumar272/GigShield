import { Link } from 'react-router-dom'
import { ROUTES } from '../../app/routes'

export function ErrorPage({ message = 'Something unexpected happened.' }: { message?: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-rose-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-rose-800">{message}</p>
        <Link to={ROUTES.appDashboard} className="mt-4 inline-block rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
