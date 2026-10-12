import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { PageId, User } from '../types'
import { useTheme } from '../context/ThemeContext'
import {
  CheckSquare, RefreshCw, HelpCircle, Moon, Sun,
  ChevronDown, ChevronRight, ChevronLeft, Zap,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  currentPage: PageId
  navigate: (page: PageId) => void
  user: User
}

interface NavItem {
  id: PageId
  label: string
  icon: ReactNode
  children?: { id: PageId; label: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { id: 'obligations', label: 'Obligation Tracker', icon: <CheckSquare size={18} /> },
  {
    id: 'renewals', label: 'Renewals', icon: <RefreshCw size={18} />,
    children: [
      { id: 'renewals', label: 'Overview' },
      { id: 'renewals-all', label: 'All Renewals' },
      { id: 'renewals-calendar', label: 'Calendar' },
      { id: 'renewal-details', label: 'Renewal Details' },
    ],
  },
]

const pageTitles: Partial<Record<PageId, string>> = {
  obligations: 'Obligation Tracker',
  renewals: 'Renewal Overview',
  'renewals-all': 'All Renewals',
  'renewals-calendar': 'Renewal Calendar',
  'renewal-details': 'Renewal Details',
}

const parentOf: Partial<Record<PageId, PageId>> = {
  'renewals-all': 'renewals',
  'renewals-calendar': 'renewals',
  'renewal-details': 'renewals',
}

export function Layout({ children, currentPage, navigate, user }: LayoutProps) {
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<PageId>>(new Set(['renewals']))
  const [profileOpen, setProfileOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

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
  const title = pageTitles[currentPage] ?? 'Obligation Tracker'

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
      const parent = NAV_ITEMS.find(n => n.id === parentOf[currentPage])
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
              <div className="text-xs" style={{ color: t.sidebarMuted }}>Workspace</div>
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

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const hasChildren = Boolean(item.children && item.children.length > 0)
            const expanded = expandedSections.has(item.id)
            const active = isSectionActive(item.id)

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(item.id)
                      navigate(item.children![0].id)
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
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span style={{ color: active ? t.sidebarActiveBg : t.sidebarMuted, flexShrink: 0 }}>{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
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
                    {item.children!.map(child => {
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
            onClick={() => setProfileOpen(p => !p)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
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
                <div className="text-xs truncate" style={{ color: t.sidebarMuted }}>
                  {user.organization}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ transition: 'background 0.25s ease' }}>
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

          <div className="flex-1" />

          <div className="flex items-center gap-2 ml-auto">
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
                  <div className="text-xs" style={{ color: t.muted }}>{user.organization}</div>
                </div>
                <ChevronDown size={14} style={{ color: t.muted, transition: 'transform 0.15s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl animate-slideDown z-50 overflow-hidden"
                  style={{ background: t.surface, borderColor: t.border, boxShadow: t.cardShadowHover }}
                >
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
                          {user.organization}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5">
                    <button
                      onClick={() => { setShowHelp(true); setProfileOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left"
                      style={{ color: t.fgSecondary }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                    >
                      <span style={{ color: t.muted }}><HelpCircle size={15} /></span>
                      Help &amp; Support
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
                  <h3 className="text-base font-semibold" style={{ color: t.fg }}>Help &amp; Support</h3>
                  <p className="text-xs" style={{ color: t.muted }}>ContractIQ · Obligation &amp; Renewal Tracking</p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} style={{ color: t.mutedLight }}>
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                {
                  icon: '📖', title: 'Obligation Tracker',
                  desc: 'Add obligations with an owner, priority and due date, then move them through To Do, In Progress, In Review and Done.',
                  action: 'Open tracker',
                },
                {
                  icon: '🔄', title: 'Renewals',
                  desc: 'Record renewal dates and values, then track them across the overview, table, calendar and detail views.',
                  action: 'Open renewals',
                },
                {
                  icon: '📅', title: 'Due dates',
                  desc: 'Overdue items are highlighted automatically using the due date stored against each record.',
                  action: 'See overdue',
                },
                {
                  icon: '⬇️', title: 'Exports',
                  desc: 'Export exactly the rows you are looking at as CSV, Excel or PDF. Nothing is added or invented.',
                  action: 'Export data',
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
                Every number shown comes from PostgreSQL. Empty lists are reported as{' '}
                <span style={{ color: t.primary }}>No data available</span>.
              </div>
              <button onClick={() => setShowHelp(false)} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}