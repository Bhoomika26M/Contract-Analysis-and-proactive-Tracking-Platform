export type PageId =
  | 'obligations'
  | 'renewals' | 'renewals-all' | 'renewals-calendar' | 'renewal-details'

export interface PageProps {
  navigate: (page: PageId) => void
}

export interface User {
  name: string
  email: string
  avatar: string
  organization: string
}

/** No authentication - a single local profile drives the header. */
export const CURRENT_USER: User = {
  name: 'ContractIQ User',
  email: 'user@contractiq.local',
  avatar: 'CU',
  organization: 'ContractIQ',
}
