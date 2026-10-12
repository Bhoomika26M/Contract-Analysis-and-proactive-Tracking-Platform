/** Response shapes returned by the FastAPI backend. */

export type ObligationStatus = 'todo' | 'in-progress' | 'review' | 'done'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface ApiObligation {
  id: number
  title: string
  description: string
  contract_title: string
  department: string
  owner_name: string
  due_date: string | null
  priority: Priority
  status: ObligationStatus
  completion: number
  created_at: string
  updated_at: string
}

export interface ApiRenewal {
  id: number
  contract_title: string
  counterparty: string
  department: string
  owner_name: string
  current_expiry: string | null
  renewal_date: string | null
  proposed_value: number | null
  currency: string
  auto_renew: boolean
  approval_status: ApprovalStatus
  notes: string
  created_at: string
  updated_at: string
}

export interface ObligationSummary {
  total: number
  by_status: Record<ObligationStatus, number>
  by_priority: Record<Priority, number>
  overdue: number
  completion_average: number
}

export interface RenewalSummary {
  total: number
  buckets: { overdue: number; urgent: number; upcoming: number; scheduled: number }
  by_approval: Record<ApprovalStatus, number>
  due_in_7_days: number
  due_in_30_days: number
  pipeline_value_90d: number
  monthly: { month: string; year: number; value: number; count: number }[]
  has_data: boolean
}

export interface ApiOptions {
  departments: string[]
  obligation_priorities: Priority[]
  obligation_statuses: ObligationStatus[]
  approval_statuses: ApprovalStatus[]
}