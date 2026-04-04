import { tokenStorage } from './storage'
import type {
  AdminDashboardResponse,
  ApiErrorShape,
  Claim,
  EventTriggerPayload,
  EventTriggerResponse,
  ManualClaimPayload,
  Payout,
  Policy,
  PolicyCreatePayload,
  PolicyRecommendationResponse,
  PremiumBreakdownResponse,
  ProcessPayoutResponse,
  SeverityPredictionPayload,
  SeverityPredictionResponse,
  TokenResponse,
  WorkerDashboardResponse,
  WorkerLoginPayload,
  WorkerProfile,
  WorkerRegisterPayload,
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export class ApiError extends Error implements ApiErrorShape {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, headers, ...rest } = options
  const requestHeaders = new Headers(headers ?? {})

  if (!requestHeaders.has('Content-Type') && rest.body) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = tokenStorage.get()
    if (!token) {
      throw new ApiError('You need to sign in first.', 401)
    }
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
  })

  const data = await response
    .json()
    .catch(() => ({ detail: 'Failed to parse server response' }))

  if (!response.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'Request failed'
    throw new ApiError(detail, response.status, data)
  }

  return data as T
}

export const apiClient = {
  getHealth: () => request<{ service: string; status: string; version: string }>('/'),
  registerWorker: (payload: WorkerRegisterPayload) =>
    request<WorkerProfile>('/api/v1/workers/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginWorker: (payload: WorkerLoginPayload) =>
    request<TokenResponse>('/api/v1/workers/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyProfile: () => request<WorkerProfile>('/api/v1/workers/me', { auth: true }),
  getWorkerDashboard: () =>
    request<WorkerDashboardResponse>('/api/v1/dashboard/worker', { auth: true }),
  getAdminDashboard: () => request<AdminDashboardResponse>('/api/v1/dashboard/admin', { auth: true }),
  getPricingPreview: () =>
    request<PremiumBreakdownResponse>('/api/v1/pricing/calculate', {
      method: 'POST',
      auth: true,
    }),
  predictSeverity: (payload: SeverityPredictionPayload) =>
    request<SeverityPredictionResponse>('/api/v1/pricing/predict-severity', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  createPolicy: () =>
    request<Policy>('/api/v1/policies', {
      method: 'POST',
      auth: true,
    }),
  createPolicyFromRecommendation: (payload: PolicyCreatePayload) =>
    request<Policy>('/api/v1/policies', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  getPolicyRecommendations: () =>
    request<PolicyRecommendationResponse>('/api/v1/policies/recommendations', {
      auth: true,
    }),
  getPolicies: () => request<Policy[]>('/api/v1/policies/me', { auth: true }),
  getPolicyById: (policyId: string) => request<Policy>(`/api/v1/policies/${policyId}`, { auth: true }),
  deletePolicy: (policyId: string) =>
    request<Policy>(`/api/v1/policies/${policyId}`, {
      method: 'DELETE',
      auth: true,
    }),
  getClaims: () => request<Claim[]>('/api/v1/claims/me', { auth: true }),
  manualClaimMoney: (payload: ManualClaimPayload) =>
    request<Claim>('/api/v1/claims/me/manual', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  getClaimById: (claimId: string) => request<Claim>(`/api/v1/claims/${claimId}`, { auth: true }),
  getPayouts: () => request<Payout[]>('/api/v1/payouts/me', { auth: true }),
  processPayout: (claimId: string) =>
    request<ProcessPayoutResponse>(`/api/v1/payouts/${claimId}/process`, {
      method: 'POST',
      auth: true,
    }),
  triggerEvent: (payload: EventTriggerPayload) =>
    request<EventTriggerResponse>('/api/v1/events/trigger', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
}
