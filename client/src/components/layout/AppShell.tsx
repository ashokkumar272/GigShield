import { NavLink } from 'react-router-dom'
import { ADMIN_NAV_ITEMS, WORKER_NAV_ITEMS } from '../../app/routes'
import { useAuth } from '../../contexts/AuthContext'

type AppShellProps = {
  mode: 'worker' | 'admin'
  title: string
  subtitle?: string
  bannerText?: string
  bannerTone?: 'emerald' | 'amber' | 'sky' | 'indigo' | 'rose'
  children: React.ReactNode
}

const bannerStyles: Record<NonNullable<AppShellProps['bannerTone']>, string> = {
  emerald: 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-teal-50 text-emerald-950',
  amber: 'border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 text-amber-950',
  sky: 'border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 text-sky-950',
  indigo: 'border-indigo-200 bg-gradient-to-r from-indigo-50 via-violet-50 to-cyan-50 text-indigo-950',
  rose: 'border-rose-200 bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 text-rose-950',
}

export function AppShell({ mode, title, subtitle, bannerText, bannerTone = 'emerald', children }: AppShellProps) {
  const { logout } = useAuth()
  const navItems = mode === 'admin' ? ADMIN_NAV_ITEMS : WORKER_NAV_ITEMS

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-3 py-3 sm:px-4 md:grid-cols-[16rem_1fr] md:gap-6 md:px-6 md:py-6">
        <aside className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:sticky md:top-6 md:block md:h-[calc(100vh-3rem)] md:overflow-y-auto md:p-5">
          <div className="flex items-start justify-between gap-3 md:block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">GigShield</p>
              <p className="mt-1 text-sm text-slate-600 md:mt-2">Income protection made simple.</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:mt-4"
            >
              Logout
            </button>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 md:mt-6 md:flex-col md:overflow-visible md:pb-0 md:space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition md:block md:shrink-0 md:rounded-xl md:px-3 md:py-3 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 md:border-0 md:bg-transparent md:hover:bg-slate-100 md:hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="space-y-4 pb-24 md:pb-0">
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
            <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-[env(safe-area-inset-bottom)]">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>}
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </header>

          {bannerText && (
            <section
              className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${bannerStyles[bannerTone]}`}
            >
              <p className="text-lg font-semibold leading-8 sm:text-xl">{bannerText}</p>
            </section>
          )}

          <main>{children}</main>
        </section>
      </div>
    </div>
  )
}
