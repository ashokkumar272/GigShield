export const ROUTES = {
  landing: '/',
  register: '/auth/register',
  login: '/auth/login',
  appDashboard: '/app/dashboard',
  pricing: '/app/pricing',
  policies: '/app/policies',
  policyDetail: (id: string) => `/app/policies/${id}`,
  claims: '/app/claims',
  claimDetail: (id: string) => `/app/claims/${id}`,
  payouts: '/app/payouts',
  adminDashboard: '/admin/dashboard',
  adminEvents: '/admin/events',
  unauthorized: '/401',
  notFound: '/404',
} as const

export const WORKER_NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.appDashboard },
  { label: 'Pricing', to: ROUTES.pricing },
  { label: 'Policies', to: ROUTES.policies },
  { label: 'Claims', to: ROUTES.claims },
  { label: 'Payouts', to: ROUTES.payouts },
]

export const ADMIN_NAV_ITEMS = [
  { label: 'Admin Dashboard', to: ROUTES.adminDashboard },
  { label: 'Event Trigger', to: ROUTES.adminEvents },
]
