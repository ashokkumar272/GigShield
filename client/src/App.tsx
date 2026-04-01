import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from './app/routes'
import { AuthGuard } from './components/guards/AuthGuard'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/common/ToastProvider'
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { WorkerDashboardPage } from './pages/worker/WorkerDashboardPage'
import { PricingPage } from './pages/worker/PricingPage'
import { PoliciesPage } from './pages/worker/PoliciesPage'
import { PolicyDetailPage } from './pages/worker/PolicyDetailPage'
import { ClaimsPage } from './pages/worker/ClaimsPage'
import { ClaimDetailPage } from './pages/worker/ClaimDetailPage'
import { PayoutsPage } from './pages/worker/PayoutsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { UnauthorizedPage } from './pages/system/UnauthorizedPage'
import { NotFoundPage } from './pages/system/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path={ROUTES.landing} element={<LandingPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />

          <Route element={<AuthGuard />}>
            <Route path={ROUTES.appDashboard} element={<WorkerDashboardPage />} />
            <Route path={ROUTES.pricing} element={<PricingPage />} />
            <Route path={ROUTES.policies} element={<PoliciesPage />} />
            <Route path="/app/policies/:id" element={<PolicyDetailPage />} />
            <Route path={ROUTES.claims} element={<ClaimsPage />} />
            <Route path="/app/claims/:id" element={<ClaimDetailPage />} />
            <Route path={ROUTES.payouts} element={<PayoutsPage />} />
            <Route path={ROUTES.adminDashboard} element={<AdminDashboardPage />} />
            <Route path={ROUTES.adminEvents} element={<AdminEventsPage />} />
          </Route>

          <Route path={ROUTES.notFound} element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to={ROUTES.notFound} replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
