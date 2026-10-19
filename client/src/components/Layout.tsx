import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { PageId, User, Role } from '../types'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, FileText, CheckSquare, RefreshCw, Shield,
  BarChart2, Bell, BookOpen, Users, Settings, HelpCircle,
  Search, Plus, Moon, Sun, ChevronDown, ChevronRight, ChevronLeft,
  LogOut, Zap, User as UserIcon, BellRing,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  currentPage: PageId
  navigate: (page: PageId) => void
  user: User
  notificationsCount: number
  role: Role
}

interface NavItem {
  id: PageId
  label: string
  icon: ReactNode
  children?: { id: PageId; label: string; roles?: Role[] }[]
  roles?: Role[]
  labelFor?: Partial<Record<Role, string>>
}

const ALL_ROLES: Role[] = ['administrator', 'legal-manager', 'compliance-officer', 'contract-manager', 'department-head', 'employee']

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />,
    roles: ALL_ROLES,
  },
  {
    id: 'contracts', label: 'Contracts', icon: <FileText size={18} />,
    roles: ALL_ROLES,
    labelFor: { 'department-head': 'Department Contracts', employee: 'Assigned Contracts' },
    children: [
      { id: 'contracts', label: 'Repository' },
      { id: 'upload-contract', label: 'Upload Contract', roles: ['administrator', 'contract-manager'] },
      { id: 'contract-details', label: 'Contract Details' },
    ],
  },
  {
    id: 'obligations', label: 'Obligation Tracker', icon: <CheckSquare size={18} />,
    roles: ['administrator', 'legal-manager', 'compliance-officer', 'contract-manager', 'department-head', 'employee'],
    labelFor: { 'department-head': 'Assigned Obligations', employee: 'My Obligations' },
  },
  {
    id: 'renewals', label: 'Renewals', icon: <RefreshCw size={18} />,
    roles: ['administrator', 'legal-manager', 'contract-manager', 'department-head', 'employee'],
    labelFor: { 'department-head': 'Renewal Status', employee: 'Renewal Status' },
    children: [
      { id: 'renewals', label: 'Overview' },
      { id: 'renewals-all', label: 'All Renewals' },
      { id: 'renewals-calendar', label: 'Calendar' },
      { id: 'renewal-details', label: 'Renewal Details' },
    ],
  },
  {
    id: 'compliance', label: 'Compliance', icon: <Shield size={18} />,
    roles: ['administrator', 'compliance-officer', 'contract-manager'],
  },
  {
    id: 'reports', label: 'Reports', icon: <BarChart2 size={18} />,
    roles: ['administrator', 'legal-manager', 'compliance-officer', 'contract-manager', 'department-head'],
    labelFor: { 'department-head': 'Department Reports' },
  },
  {
    id: 'notifications', label: 'Notifications', icon: <Bell size={18} />,
    roles: ALL_ROLES,
  },
  {
    id: 'audit-logs', label: 'Audit Logs', icon: <BookOpen size={18} />,
    roles: ['administrator', 'compliance-officer'],
  },
  {
    id: 'users', label: 'User Management', icon: <Users size={18} />,
    roles: ['administrator'],
  },
  {
    id: 'settings', label: 'Settings', icon: <Settings size={18} />,
    roles: ['administrator'],
  },
]

const canCreateContract = (role: Role) => role === 'administrator' || role === 'contract-manager'

const pageTitles: Partial<Record<PageId, string>> = {
  dashboard: 'Dashboard',
  contracts: 'Contract Repository',
  'contract-details': 'Contract Details',
  'upload-contract': 'Upload Contract',
  obligations: 'Obligation Tracker',
  renewals: 'Renewal Overview',
  'renewals-all': 'All Renewals',
  'renewals-calendar': 'Renewal Calendar',
  'renewal-details': 'Renewal Details',
  compliance: 'Compliance Monitoring',
  reports: 'Reports Dashboard',
  notifications: 'Notifications',
  'audit-logs': 'Audit Logs',
  users: 'User Management',
  settings: 'Settings',
  profile: 'My Profile',
}

const parentOf: Partial<Record<PageId, PageId>> = {
  'upload-contract': 'contracts',
  'contract-details': 'contracts',
  'renewals-all': 'renewals',
  'renewals-calendar': 'renewals',
  'renewal-details': 'renewals',
}

const roleLabels: Record<Role, string> = {
  administrator: 'Administrator',
  'legal-manager': 'Legal Manager',
  'compliance-officer': 'Compliance Officer',
  'contract-manager': 'Contract Manager',
  'department-head': 'Department Head',
  employee: 'Employee',
}

export function Layout({ children, currentPage, navigate, user, notificationsCount, role }: LayoutProps) {
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<PageId>>(new Set(['contracts', 'renewals']))
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const visibleNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const effectivePage = parentOf[currentPage] ?? currentPage
  const title = pageTitles[currentPage] ?? 'Dashboard'

  const toggleSection = (id: PageId) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isSectionActive = (id: PageId) => effectivePage === id

  const breadcrumbs = () => {
    const parts: string[] = ['ContractIQ']
    if (parentOf[currentPage]) {
      const parent = visibleNav.find(n => n.id === parentOf[currentPage])
      if (parent) parts.push(parent.label)
    }
    parts.push(title)
    return parts
  }

  const t = theme

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: t.bg, transition: 'background 0.25s ease' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300 sidebar-scroll overflow-y-auto"
        style={{ width: sidebarOpen ? 280 : 72, minWidth: sidebarOpen ? 280 : 72, background: t.sidebar }}
      >
        {/* Brand */}
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5 px-4 border-b flex-shrink-0" style={{ borderColor: t.sidebarBorder, height: 72 }}>
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
            >
              <Zap size={20} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base tracking-tight">ContractIQ</div>
              <div className="text-xs" style={{ color: t.sidebarMuted }}>{roleLabels[role]}</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex-shrink-0 p-1.5 rounded-lg transition-all border"
              style={{ color: t.sidebarMuted, borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.sidebarText; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.sidebarMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              title="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-3 gap-2 border-b flex-shrink-0" style={{ borderColor: t.sidebarBorder }}>
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
            >
              <Zap size={20} color="white" />
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg transition-all border"
              style={{ color: t.sidebarMuted, borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.sidebarText; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.sidebarMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              title="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Quick Add — only for roles that can create contracts */}
        {sidebarOpen && canCreateContract(role) && (
          <div className="px-3 py-3">
            <button
              onClick={() => navigate('upload-contract')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: `rgba(45,106,79,0.25)`, color: t.primaryLight }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = `rgba(45,106,79,0.35)`)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = `rgba(45,106,79,0.25)`)}
            >
              <Plus size={16} />
              New Contract
            </button>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {visibleNav.map(item => {
            const visibleChildren = item.children?.filter(c => !c.roles || c.roles.includes(role))
            const hasChildren = visibleChildren && visibleChildren.length > 0
            const expanded = expandedSections.has(item.id)
            const active = isSectionActive(item.id)
            const label = item.labelFor?.[role] ?? item.label

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(item.id)
                      navigate(visibleChildren![0].id)
                    } else {
                      navigate(item.id)
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    color: active ? t.sidebarActiveText : t.sidebarText,
                    background: active ? t.sidebarActive : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                  title={!sidebarOpen ? label : undefined}
                >
                  <span style={{ color: active ? t.sidebarActiveBg : t.sidebarMuted, flexShrink: 0 }}>{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{label}</span>
                      {item.id === 'notifications' && notificationsCount > 0 && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#EF4444', color: '#fff', fontSize: '10px' }}>
                          {notificationsCount}
                        </span>
                      )}
                      {hasChildren && (
                        <span style={{ color: t.sidebarMuted }}>
                          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {hasChildren && expanded && sidebarOpen && (
                  <div className="mt-0.5 ml-4 pl-3 space-y-0.5" style={{ borderLeft: `1px solid ${t.sidebarBorder}` }}>
                    {visibleChildren!.map(child => {
                      const childActive = currentPage === child.id
                      return (
                        <button
                          key={child.id}
                          onClick={() => navigate(child.id)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                          style={{
                            color: childActive ? t.primaryLight : t.sidebarMuted,
                            background: childActive ? t.sidebarActive : 'transparent',
                          }}
                          onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLButtonElement).style.color = t.sidebarText }}
                          onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLButtonElement).style.color = t.sidebarMuted }}
                        >
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 pb-4 space-y-0.5 border-t pt-2" style={{ borderColor: t.sidebarBorder }}>
          <button
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: t.sidebarMuted }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.sidebarText; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.sidebarMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title={!sidebarOpen ? 'Help & Support' : undefined}
          >
            <HelpCircle size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Help & Support</span>}
          </button>

          <button
            onClick={() => navigate('profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: isSectionActive('profile') ? t.sidebarActive : 'transparent' }}
            onMouseEnter={e => { if (!isSectionActive('profile')) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (!isSectionActive('profile')) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <div
              className="flex items-center justify-center rounded-xl text-white font-semibold text-sm flex-shrink-0"
              style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #2D6A4F, #52B788)', fontSize: '13px' }}
            >
              {user.avatar}
            </div>
            {sidebarOpen && (
              <div className="flex-1 text-left overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs truncate" style={{ color: t.sidebarMuted }}>{roleLabels[role]}</div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ transition: 'background 0.25s ease' }}>
        {/* Top Nav */}
        <header
          className="flex items-center gap-4 px-6 flex-shrink-0 border-b"
          style={{ height: 72, background: t.surface, borderColor: t.border, transition: 'background 0.25s ease, border-color 0.25s ease' }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm flex-shrink-0">
            {breadcrumbs().map((crumb, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <span style={{ color: i === arr.length - 1 ? t.fg : t.mutedLight, fontWeight: i === arr.length - 1 ? 600 : 400 }}>
                  {crumb}
                </span>
                {i < arr.length - 1 && <ChevronRight size={14} style={{ color: t.border }} />}
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{ borderColor: t.border, background: t.bg, transition: 'background 0.25s ease' }}
            >
              <Search size={16} style={{ color: t.mutedLight, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search contracts, obligations..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: t.fg }}
              />
              <kbd className="text-xs px-1.5 py-0.5 rounded border" style={{ color: t.mutedLight, borderColor: t.border, fontSize: '10px' }}>⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* New Contract — admin & contract-manager only */}
            {canCreateContract(role) && (
              <button
                onClick={() => navigate('upload-contract')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: t.primary }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primaryHover)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primary)}
              >
                <Plus size={16} />
                New Contract
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border transition-all"
              style={{ borderColor: t.border, color: t.isDark ? '#FBBF24' : t.muted, background: 'transparent' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              title={t.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {t.isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('notifications')}
              className="relative p-2 rounded-xl border transition-all"
              style={{ borderColor: t.border, color: t.muted }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              <Bell size={18} />
              {notificationsCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white font-bold"
                  style={{ width: 18, height: 18, background: '#EF4444', fontSize: '10px' }}
                >
                  {notificationsCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl border transition-all"
                style={{ borderColor: profileOpen ? t.primary : t.border, background: 'transparent' }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
                onMouseLeave={e => { if (!profileOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <div
                  className="flex items-center justify-center rounded-lg text-white font-semibold"
                  style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2D6A4F, #52B788)', fontSize: '12px' }}
                >
                  {user.avatar}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium" style={{ color: t.fg }}>{user.name.split(' ')[0]}</div>
                  <div className="text-xs" style={{ color: t.muted }}>{roleLabels[role]}</div>
                </div>
                <ChevronDown size={14} style={{ color: t.muted, transition: 'transform 0.15s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl animate-slideDown z-50 overflow-hidden"
                  style={{ background: t.surface, borderColor: t.border, boxShadow: t.cardShadowHover }}
                >
                  {/* User info */}
                  <div className="px-4 py-4 border-b" style={{ borderColor: t.borderLight }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-xl text-white font-bold flex-shrink-0"
                        style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #2D6A4F, #52B788)', fontSize: '14px' }}
                      >
                        {user.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: t.fg }}>{user.name}</div>
                        <div className="text-xs truncate" style={{ color: t.muted }}>{user.email}</div>
                        <div
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                          style={{ background: t.primaryBg, color: t.primary }}
                        >
                          {roleLabels[role]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {[
                      { icon: <UserIcon size={15} />, label: 'My Profile', onClick: () => { navigate('profile'); setProfileOpen(false) } },
                      role === 'administrator' ? { icon: <Settings size={15} />, label: 'Settings', onClick: () => { navigate('settings'); setProfileOpen(false) } } : null,
                      { icon: <BellRing size={15} />, label: 'Notifications', onClick: () => { navigate('notifications'); setProfileOpen(false) } },
                      { icon: <HelpCircle size={15} />, label: 'Help & Support', onClick: () => { setShowHelp(true); setProfileOpen(false) } },
                    ].filter(Boolean).map(item => (
                      <button
                        key={(item as any).label}
                        onClick={(item as any).onClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left"
                        style={{ color: t.fgSecondary }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                      >
                        <span style={{ color: t.muted }}>{(item as any).icon}</span>
                        {(item as any).label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t py-1.5" style={{ borderColor: t.borderLight }}>
                    <button
                      onClick={() => { navigate('login'); setProfileOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left"
                      style={{ color: '#EF4444' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.dangerBg)}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: t.bg, transition: 'background 0.25s ease' }}>
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>

      {/* Help & Support Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.primaryBg }}>
                  <HelpCircle size={18} style={{ color: t.primary }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: t.fg }}>Help & Support</h3>
                  <p className="text-xs" style={{ color: t.muted }}>ContractIQ v2.4.1 · Enterprise Edition</p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} style={{ color: t.mutedLight }}>
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                {
                  icon: '📖', title: 'Help Center',
                  desc: 'Browse articles, guides, and how-to documentation for every ContractIQ feature.',
                  action: 'Open Help Center',
                },
                {
                  icon: '❓', title: 'FAQ',
                  desc: 'Quick answers to the most common questions about contract management and compliance.',
                  action: 'View FAQs',
                },
                {
                  icon: '💬', title: 'Contact Support',
                  desc: 'Reach our support team via live chat or email. Average response time: under 2 hours.',
                  action: 'Chat with Support',
                },
                {
                  icon: '📚', title: 'User Guide',
                  desc: 'Complete documentation including role-based guides and workflow tutorials.',
                  action: 'Read Documentation',
                },
                {
                  icon: '🐛', title: 'Report an Issue',
                  desc: 'Found a bug or unexpected behavior? Let us know so we can fix it fast.',
                  action: 'Submit Report',
                },
                {
                  icon: 'ℹ️', title: 'About ContractIQ',
                  desc: 'Version info, release notes, compliance certifications, and terms of service.',
                  action: 'Learn More',
                },
              ].map(item => (
                <button
                  key={item.title}
                  onClick={() => setShowHelp(false)}
                  className="text-left p-4 rounded-2xl border transition-all group"
                  style={{ borderColor: t.border, background: t.bg }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.primary + '60'; (e.currentTarget as HTMLButtonElement).style.background = t.primaryBg }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; (e.currentTarget as HTMLButtonElement).style.background = t.bg }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: t.fg }}>{item.title}</div>
                  <div className="text-xs leading-relaxed mb-3" style={{ color: t.muted }}>{item.desc}</div>
                  <div className="text-xs font-semibold" style={{ color: t.primary }}>{item.action} →</div>
                </button>
              ))}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: t.border }}>
              <div className="text-xs" style={{ color: t.mutedLight }}>
                Need urgent help? Email <span style={{ color: t.primary }}>support@contractiq.com</span>
              </div>
              <button onClick={() => setShowHelp(false)} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
