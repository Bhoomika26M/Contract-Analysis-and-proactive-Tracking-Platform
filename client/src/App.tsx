import { useState, useEffect } from 'react'
import type { PageId, User, Role } from './types'
import { setToken, authApi } from './api'
import { ThemeProvider } from './context/ThemeContext'
import { RoleProvider } from './context/RoleContext'
import { Layout } from './components/Layout'
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Contracts } from './pages/Contracts'
import { Obligations } from './pages/Obligations'
import { Renewals } from './pages/Renewals'
import { Compliance } from './pages/Compliance'
import { Reports } from './pages/Reports'
import { Notifications } from './pages/Notifications'
import { AuditLogs } from './pages/AuditLogs'
import { Users } from './pages/Users'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'

const ROLE_PAGES: Record<Role, Set<PageId>> = {
  administrator: new Set([
    'dashboard', 'contracts', 'contract-details', 'upload-contract',
    'obligations', 'renewals', 'renewals-all', 'renewals-calendar', 'renewal-details',
    'compliance', 'reports', 'notifications', 'audit-logs', 'users', 'settings', 'profile',
  ]),
  'legal-manager': new Set([
    'dashboard', 'contracts', 'contract-details',
    'obligations', 'renewals', 'renewals-all', 'renewals-calendar', 'renewal-details',
    'reports', 'notifications', 'profile',
  ]),
  'compliance-officer': new Set([
    'dashboard', 'compliance', 'obligations', 'audit-logs',
    'contracts', 'contract-details',
    'reports', 'notifications', 'profile',
  ]),
  'contract-manager': new Set([
    'dashboard', 'contracts', 'contract-details', 'upload-contract',
    'obligations', 'renewals', 'renewals-all', 'renewals-calendar', 'renewal-details',
    'compliance', 'reports', 'notifications', 'profile',
  ]),
  'department-head': new Set([
    'dashboard', 'contracts', 'contract-details', 'obligations',
    'renewals', 'renewals-all', 'renewals-calendar', 'renewal-details',
    'reports', 'notifications', 'profile',
  ]),
  employee: new Set([
    'dashboard', 'contracts', 'contract-details', 'obligations',
    'renewals', 'renewals-all', 'renewals-calendar', 'renewal-details',
    'notifications', 'profile',
  ]),
}

const canAccess = (role: Role, page: PageId) => ROLE_PAGES[role].has(page)

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('reset_token')) return 'forgot-password'
      if (sessionStorage.getItem('reset_token')) return 'forgot-password'
    } catch {}
    return 'login'
  })
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [selectedRole, setSelectedRole] = useState<Role>('administrator')
  const [currentUserData, setCurrentUserData] = useState<any>(null)
  const [initialResetToken, setInitialResetToken] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const rt = params.get('reset_token')
      if (rt) {
        try { sessionStorage.setItem('reset_token', rt) } catch {}
        return rt
      }
      return sessionStorage.getItem('reset_token') || ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      setToken(t)
      authApi.me().then(u => {
        setCurrentUserData(u)
        setSelectedRole((u?.role || 'employee') as Role)
        setIsAuthenticated(true)
        setOnboardingComplete(true)
        setCurrentPage('dashboard')
      }).catch(() => setToken(null))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const navigate = (page: PageId) => {
    if (page === 'login' || page === 'register' || page === 'forgot-password') {
      setIsAuthenticated(false)
      setOnboardingComplete(false)
      setCurrentPage(page)
      window.scrollTo(0, 0)
      return
    }
    // Silently redirect to dashboard if role can't access the target page
    if (isAuthenticated && onboardingComplete && !canAccess(selectedRole, page)) {
      setCurrentPage('dashboard')
      window.scrollTo(0, 0)
      return
    }
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleLogin = async (email: string, password: string, role: Role) => {
    try { sessionStorage.removeItem('reset_token') } catch {}
    const res = await authApi.login(email, password)
    if (res.user?.role !== role) {
      throw new Error('Role not permitted for this account')
    }
    setToken(res.access_token)
    setCurrentUserData(res.user)
    setSelectedRole(role)
    setIsAuthenticated(true)
    setCurrentPage('onboarding')
  }

  const handleRegister = async (payload: any) => {
    const res = await authApi.register(payload)
    setToken(res.access_token)
    setCurrentUserData(res.user)
    setSelectedRole((res.user?.role || payload.role) as Role)
    setIsAuthenticated(true)
    setCurrentPage('onboarding')
  }

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true)
    setCurrentPage('dashboard')
  }

  const currentUser = currentUserData
    ? { name: currentUserData.name, email: currentUserData.email, role: currentUserData.role, avatar: currentUserData.avatar, organization: currentUserData.organization }
    : { name: '', email: '', role: selectedRole, avatar: '', organization: '' }

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <Auth
          currentPage={currentPage as 'login' | 'register' | 'forgot-password'}
          navigate={navigate}
          onLogin={handleLogin}
          onRegister={handleRegister}
          initialResetToken={initialResetToken}
        />
      )
    }

    if (!onboardingComplete) {
      return <Onboarding onComplete={handleOnboardingComplete} />
    }

    const props = { navigate }

    const page = (() => {
      switch (currentPage) {
        case 'dashboard': return <Dashboard {...props} role={selectedRole} />
        case 'contracts': return <Contracts {...props} view="repository" role={selectedRole} />
        case 'contract-details': return <Contracts {...props} view="details" role={selectedRole} />
        case 'upload-contract': return <Contracts {...props} view="upload" role={selectedRole} />
        case 'obligations': return <Obligations {...props} />
        case 'renewals': return <Renewals {...props} tab="overview" />
        case 'renewals-all': return <Renewals {...props} tab="all" />
        case 'renewals-calendar': return <Renewals {...props} tab="calendar" />
        case 'renewal-details': return <Renewals {...props} tab="details" />
        case 'compliance': return <Compliance {...props} />
        case 'reports': return <Reports {...props} />
        case 'notifications': return <Notifications {...props} onUnreadCountChange={setNotificationsCount} />
        case 'audit-logs': return <AuditLogs {...props} />
        case 'users': return <Users {...props} />
        case 'settings': return <Settings {...props} />
        case 'profile': return <Profile {...props} user={currentUser} />
        default: return <Dashboard {...props} role={selectedRole} />
      }
    })()

    return (
      <Layout
        currentPage={currentPage}
        navigate={navigate}
        user={currentUser}
        notificationsCount={notificationsCount}
        role={selectedRole}
      >
        {page}
      </Layout>
    )
  }

  return (
    <ThemeProvider>
      <RoleProvider>
        {renderContent()}
      </RoleProvider>
    </ThemeProvider>
  )
}
