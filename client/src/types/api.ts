export type ApiErrorShape = {
  message: string
  status: number
  details?: unknown
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type WorkerRegisterPayload = {
  name: string
  phone: string
  city: string
  pincode: string
  platform: 'swiggy' | 'zomato' | 'dunzo' | 'ola' | 'uber' | 'rapido'
  avg_weekly_income_inr: number
  vehicle_type: 'bike' | 'scooter' | 'cycle'
}

export type PolicyRecommendation = {
  plan_name: string
  recommendation_score: number
  parameter_scores: Record<string, number>
  weekly_premium_inr: number
  coverage_amount_inr: number
  risk_score: number
  summary: string
}

export type PolicyRecommendationResponse = {
  recommendations: PolicyRecommendation[]
}

export type PolicyCreatePayload = {
  selected_recommendation?: {
    plan_name: string
    recommendation_score: number
    parameter_scores: Record<string, number>
    weekly_premium_inr: number
    coverage_amount_inr: number
    risk_score: number
  }
}

export type WorkerLoginPayload = {
  phone: string
  otp: string
}

export type WorkerProfile = {
  id: string
  name: string
  phone: string
  city: string
  pincode: string
  platform: string
  avg_weekly_income_inr: number
  vehicle_type: string
  created_at: string
}

export type ActivePolicySummary = {
  id: string
  weekly_premium_inr: number
  coverage_amount_inr: number
  start_date: string
  end_date: string | null
}

export type WorkerDashboardResponse = {
  active_policy: ActivePolicySummary | null
  income_protected_this_week: number
  claims_this_month: number
  payout_total: number
}

export type AdminDashboardResponse = {
  total_workers: number
  active_policies: number
  claims_triggered_today: number
  payout_liability_inr: number
  top_disruption_event: string | null
}

export type PremiumBreakdownResponse = {
  weekly_premium_inr: number
  coverage_amount_inr: number
  risk_score: number
  risk_factors: string[]
  base_premium: number
  zone_risk_multiplier: number
  weather_risk_factor: number
}

export type Policy = {
  id: string
  worker_id: string
  status: string
  weekly_premium_inr: number
  coverage_amount_inr: number
  risk_score: number
  risk_factors: string | null
  start_date: string
  end_date: string | null
  created_at: string
}

export type Claim = {
  id: string
  worker_id: string
  policy_id: string
  claim_type: string
  event_type: string
  event_severity: string
  event_description: string | null
  status: string
  payout_amount_inr: number
  fraud_flag: string | null
  triggered_at: string
  created_at: string
}

export type Payout = {
  id: string
  claim_id: string
  worker_id: string
  amount_inr: number
  status: string
  transaction_id: string | null
  payment_method: string
  processed_at: string | null
  created_at: string
}

export type ProcessPayoutResponse = {
  transaction_id: string
  status: string
  amount_inr: number
}

export type EventTriggerPayload = {
  event_type: 'rainfall' | 'aqi' | 'curfew_strike'
  city: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

export type EventTriggerResponse = {
  event_type: string
  city: string
  severity: string
  claims_created: number
  claim_ids: string[]
}
