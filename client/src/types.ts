export type PageId =
  | 'role-select'
  | 'login' | 'register' | 'forgot-password'
  | 'onboarding'
  | 'dashboard'
  | 'contracts' | 'contract-details' | 'upload-contract'
  | 'obligations'
  | 'renewals' | 'renewals-all' | 'renewals-calendar' | 'renewal-details'
  | 'compliance'
  | 'reports'
  | 'notifications'
  | 'audit-logs'
  | 'users'
  | 'settings'
  | 'profile'

export interface PageProps {
  navigate: (page: PageId) => void
}

export interface User {
  name: string
  email: string
  role: string
  avatar: string
  organization: string
}

export type Role =
  | 'administrator'
  | 'legal-manager'
  | 'compliance-officer'
  | 'contract-manager'
  | 'department-head'
  | 'employee'
