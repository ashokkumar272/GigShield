import { Link, NavLink, useLocation } from 'react-router-dom'
import { ADMIN_NAV_ITEMS, ROUTES, WORKER_NAV_ITEMS } from '../../app/routes'
import { useAuth } from '../../contexts/AuthContext'

type AppShellProps = {
  mode: 'worker' | 'admin'
  title: string
  subtitle?: string
  children: React.ReactNode
}

function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <nav className="text-xs text-slate-500">
      <ol className="flex items-center gap-2">
        <li>
          <Link to={ROUTES.landing} className="hover:text-slate-700">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join('/')}`
          const label = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase())

          return (
            <li key={to} className="flex items-center gap-2">
              <span>/</span>
              <Link to={to} className="hover:text-slate-700">
                {label}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function AppShell({ mode, title, subtitle, children }: AppShellProps) {
  const { profile, logout } = useAuth()
  const navItems = mode === 'admin' ? ADMIN_NAV_ITEMS : WORKER_NAV_ITEMS

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-4 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">GigShield</p>
            <p className="mt-2 text-sm text-slate-600">Income protection made simple.</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="space-y-4">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Breadcrumbs />
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-800">{profile?.name ?? 'Worker'}</p>
                  <p className="text-xs text-slate-500">{profile?.phone ?? 'No phone'}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </section>
      </div>
    </div>
  )
}
