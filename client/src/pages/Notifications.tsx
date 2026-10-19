import { useState, useEffect } from 'react'
import type { PageProps } from '../types'
import { Bell, CheckCircle2, AlertTriangle, Clock, RefreshCw, FileText, Users, Shield, Check, X, Filter, Mail, Smartphone, MessageSquare, Zap, UserPlus, AlertCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { notificationsApi } from '../api'

const initialNotifications: any[] = []

interface Toast { id: number; message: string; type: 'success' | 'info' | 'warning' }

interface NotificationsProps extends PageProps {
  onUnreadCountChange?: (count: number) => void
}

export function Notifications({ navigate, onUnreadCountChange }: NotificationsProps) {
  const { theme: t } = useTheme()
  const [filter, setFilter] = useState('all')
  const [notifs, setNotifs] = useState<any[]>([])
  useEffect(() => { notificationsApi.list().then(setNotifs).catch(()=>setNotifs([])) }, [])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPreferences, setShowPreferences] = useState(false)
  const [prefSaved, setPrefSaved] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [toastIdCounter, setToastIdCounter] = useState(0)
  const [showEscalateModal, setShowEscalateModal] = useState<number | null>(null)
  const [showAssignModal, setShowAssignModal] = useState<number | null>(null)
  const [showCertModal, setShowCertModal] = useState<number | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [escalationNote, setEscalationNote] = useState('')

  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: false,
    slack: true,
  })

  const [prefs, setPrefs] = useState({
    emailCritical: true, emailHigh: true, emailMedium: false, emailLow: false,
    inAppAll: true, sms: false, slack: true,
    reminderDays: '3', digestFrequency: 'daily',
  })

  // Keep prefs.sms / prefs.slack in sync with channels when preferences modal opens
  useEffect(() => {
    setPrefs(p => ({ ...p, sms: channels.sms, slack: channels.slack }))
  }, [showPreferences])

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = toastIdCounter + 1
    setToastIdCounter(id)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const markRead = (id: number) => {
    const updated = notifs.map(x => x.id === id ? { ...x, read: true } : x)
    setNotifs(updated)
    onUnreadCountChange?.(updated.filter(n => !n.read).length)
  }

  const markAllRead = () => {
    const updated = notifs.map(x => ({ ...x, read: true }))
    setNotifs(updated)
    onUnreadCountChange?.(0)
    addToast('All notifications marked as read', 'success')
  }

  const dismiss = (id: number) => {
    const updated = notifs.filter(x => x.id !== id)
    setNotifs(updated)
    onUnreadCountChange?.(updated.filter(n => !n.read).length)
    addToast('Notification dismissed', 'info')
  }

  const updateNotifStatus = (id: number, status: string, read = true) => {
    const updated = notifs.map(x => x.id === id ? { ...x, status, read, actionable: false, actions: [] } : x)
    setNotifs(updated)
    onUnreadCountChange?.(updated.filter(n => !n.read).length)
  }

  const handleAction = (e: React.MouseEvent, notif: typeof initialNotifications[0], action: string) => {
    e.stopPropagation()
    markRead(notif.id)

    switch (action) {
      case 'Approve Renewal':
        updateNotifStatus(notif.id, 'approved')
        addToast('Renewal approved — navigating to Renewals', 'success')
        setTimeout(() => navigate('renewals'), 800)
        break

      case 'Escalate':
        setShowEscalateModal(notif.id)
        break

      case 'Review Contract':
        markRead(notif.id)
        addToast('Opening contract details…', 'info')
        setTimeout(() => navigate('contract-details'), 400)
        break

      case 'Dismiss':
        dismiss(notif.id)
        break

      case 'Mark Complete':
        updateNotifStatus(notif.id, 'completed')
        addToast('Obligation marked as complete ✓', 'success')
        break

      case 'Snooze':
        updateNotifStatus(notif.id, 'snoozed', false)
        addToast('Snoozed — will remind you in 24 hours', 'info')
        break

      case 'Start Renewal':
        updateNotifStatus(notif.id, 'renewal-started')
        addToast('Starting renewal workflow…', 'success')
        setTimeout(() => navigate('renewals'), 800)
        break

      case 'Save Renewal':
        updateNotifStatus(notif.id, 'renewal-saved')
        addToast('Renewal saved successfully ✓', 'success')
        break

      case 'Set Reminder':
        updateNotifStatus(notif.id, 'reminder-set', false)
        addToast('Reminder set for 7 days before deadline ✓', 'success')
        break

      case 'Review Document':
      case 'Review Documents':
        markRead(notif.id)
        addToast('Opening document review…', 'info')
        setTimeout(() => navigate('contract-details'), 400)
        break

      case 'Assign Reviewer':
      case 'Assign':
        setShowAssignModal(notif.id)
        break

      case 'Request Certificate':
        setShowCertModal(notif.id)
        break

      case 'Review':
        markRead(notif.id)
        addToast('Opening review screen…', 'info')
        setTimeout(() => navigate('contract-details'), 400)
        break

      case 'Renew Documents':
        updateNotifStatus(notif.id, 'renewal-started')
        addToast('Opening renewal workflow…', 'info')
        setTimeout(() => navigate('renewals'), 600)
        break

      case 'Mark Up Later':
        updateNotifStatus(notif.id, 'marked-later', false)
        addToast('Saved for later ✓', 'info')
        break

      case 'News':
        markRead(notif.id)
        addToast('Opening news/updates…', 'info')
        break

      default:
        markRead(notif.id)
        addToast(`Action "${action}" recorded ✓`, 'success')
    }
  }

  const confirmEscalate = () => {
    if (showEscalateModal === null) return
    updateNotifStatus(showEscalateModal, 'escalated')
    addToast('Issue escalated to Legal Manager ✓', 'warning')
    setShowEscalateModal(null)
    setEscalationNote('')
  }

  const confirmAssign = () => {
    if (showAssignModal === null || !selectedAssignee) return
    updateNotifStatus(showAssignModal, 'assigned')
    addToast(`Assigned to ${selectedAssignee.split(' –')[0]} ✓`, 'success')
    setShowAssignModal(null)
    setSelectedAssignee('')
  }

  const confirmCertRequest = () => {
    if (showCertModal === null) return
    updateNotifStatus(showCertModal, 'cert-requested')
    addToast('Certificate request sent to Baker McKenzie ✓', 'success')
    setShowCertModal(null)
  }

  const savePreferences = () => {
    // Sync channel prefs back to sidebar channels
    setChannels(c => ({ ...c, sms: prefs.sms, slack: prefs.slack }))
    setPrefSaved(true)
    addToast('Notification preferences saved ✓', 'success')
    setTimeout(() => { setPrefSaved(false); setShowPreferences(false) }, 1500)
  }

  const resetPreferences = () => {
    setPrefs({ emailCritical: true, emailHigh: true, emailMedium: false, emailLow: false, inAppAll: true, sms: false, slack: true, reminderDays: '3', digestFrequency: 'daily' })
    addToast('Preferences reset to defaults', 'info')
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="w-10 h-5 rounded-full cursor-pointer transition-all relative flex-shrink-0 select-none"
      style={{ background: checked ? t.primary : t.border }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
        style={{ left: checked ? 'calc(100% - 18px)' : '2px' }}
      />
    </div>
  )

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'actionable') return n.actionable
    if (selectedCategory !== 'all') return n.category === selectedCategory
    return true
  })

  const unreadCount = notifs.filter(n => !n.read).length

  const priorityConfig: Record<string, { color: string; bg: string; label: string; borderColor: string }> = {
    high: { color: t.danger, bg: t.dangerBg, label: 'High', borderColor: t.danger },
    medium: { color: t.warning, bg: t.warningBg, label: 'Medium', borderColor: t.warning },
    low: { color: t.info, bg: t.infoBg, label: 'Low', borderColor: t.info },
  }

  const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
    contract: { color: t.info, bg: t.infoBg, label: 'Contract' },
    renewal: { color: t.purple, bg: t.purpleBg, label: 'Renewal' },
    compliance: { color: t.danger, bg: t.dangerBg, label: 'Compliance' },
    obligation: { color: t.warning, bg: t.warningBg, label: 'Obligation' },
    system: { color: t.muted, bg: t.bg, label: 'System' },
  }

  const statusBadge: Record<string, { label: string; color: string }> = {
    completed: { label: '✓ Completed', color: t.success },
    escalated: { label: '⬆ Escalated', color: t.danger },
    assigned: { label: '👤 Assigned', color: t.info },
    'renewal-started': { label: '↗ Renewal Started', color: t.purple },
    'renewal-saved': { label: '✓ Renewal Saved', color: t.success },
    approved: { label: '✓ Approved', color: t.success },
    snoozed: { label: '⏰ Snoozed', color: t.warning },
    'reminder-set': { label: '🔔 Reminder Set', color: t.warning },
    'cert-requested': { label: '📋 Cert Requested', color: t.info },
    'marked-later': { label: '🔖 Saved for Later', color: t.muted },
  }

  const notifIcon = (icon: string, color: string) => {
    const props = { size: 18 }
    switch (icon) {
      case 'alert': return <AlertTriangle {...props} style={{ color }} />
      case 'shield': return <Shield {...props} style={{ color }} />
      case 'check': return <CheckCircle2 {...props} style={{ color }} />
      case 'refresh': return <RefreshCw {...props} style={{ color }} />
      case 'file': return <FileText {...props} style={{ color }} />
      case 'users': return <Users {...props} style={{ color }} />
      default: return <Bell {...props} style={{ color }} />
    }
  }

  const toastColors: Record<Toast['type'], string> = {
    success: t.success,
    info: t.primary,
    warning: t.warning,
  }

  return (
    <div className="p-6 relative">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto"
            style={{ background: toastColors[toast.type], color: '#fff', minWidth: 240, maxWidth: 340 }}
          >
            <Check size={14} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Notifications</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {unreadCount} unread · {notifs.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>
            <Check size={14} />Mark All Read
          </button>
          <button onClick={() => setShowPreferences(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.muted, background: t.surface }}>
            <Filter size={14} />Preferences
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="w-56 flex-shrink-0 space-y-2">
          <div className="rounded-2xl border p-4" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-xs font-semibold mb-3" style={{ color: t.mutedLight }}>FILTER BY</div>
            {[
              { id: 'all', label: 'All Notifications', count: notifs.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'actionable', label: 'Requires Action', count: notifs.filter(n => n.actionable).length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: filter === f.id ? t.primaryBg : 'transparent',
                  color: filter === f.id ? t.primary : t.fgSecondary,
                }}
              >
                <span>{f.label}</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: filter === f.id ? t.primary + '20' : t.borderLight, color: filter === f.id ? t.primary : t.muted }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-xs font-semibold mb-3" style={{ color: t.mutedLight }}>CATEGORY</div>
            {['all', 'contract', 'renewal', 'compliance', 'obligation', 'system'].map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setFilter('all') }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: selectedCategory === cat ? t.primaryBg : 'transparent',
                  color: selectedCategory === cat ? t.primary : t.muted,
                }}
              >
                {cat !== 'all' && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: categoryConfig[cat]?.color ?? t.muted }} />
                )}
                <span>{cat === 'all' ? 'All Categories' : categoryConfig[cat]?.label ?? cat}</span>
              </button>
            ))}
          </div>

          {/* Delivery channels — fully interactive */}
          <div className="rounded-2xl border p-4" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-xs font-semibold mb-3" style={{ color: t.mutedLight }}>DELIVERY CHANNELS</div>
            {(
              [
                { label: 'In-App', key: 'inApp' },
                { label: 'Email', key: 'email' },
                { label: 'SMS', key: 'sms' },
                { label: 'Slack', key: 'slack' },
              ] as { label: string; key: keyof typeof channels }[]
            ).map(ch => (
              <div key={ch.key} className="flex items-center justify-between py-2">
                <span className="text-sm" style={{ color: t.fgSecondary }}>{ch.label}</span>
                <Toggle
                  checked={channels[ch.key]}
                  onChange={() => {
                    setChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key] }))
                    addToast(`${ch.label} notifications ${!channels[ch.key] ? 'enabled' : 'disabled'}`, 'info')
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border p-12 text-center" style={{ borderColor: t.border, background: t.surface }}>
              <Bell size={32} className="mx-auto mb-3" style={{ color: t.border }} />
              <p className="text-sm" style={{ color: t.mutedLight }}>No notifications in this category</p>
            </div>
          )}

          {filtered.map(notif => {
            const pCfg = priorityConfig[notif.priority] || { color: t.muted, bg: t.bg, label: notif.priority || 'Info', borderColor: t.border }
            const catCfg = categoryConfig[notif.category] || { color: t.muted, bg: t.bg, label: notif.category || 'General' }
            const iconColor = pCfg.color
            const statusInfo = notif.status !== 'active' ? statusBadge[notif.status] : null

            return (
              <div
                key={notif.id}
                className="rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden"
                style={{
                  borderColor: !notif.read ? pCfg.color + '30' : t.border,
                  background: !notif.read ? pCfg.bg : t.surface,
                  borderLeft: `4px solid ${!notif.read ? pCfg.borderColor : t.border}`,
                  opacity: notif.status !== 'active' ? 0.75 : 1,
                }}
                onClick={() => markRead(notif.id)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadowHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: iconColor + '18', color: iconColor }}
                  >
                    {notifIcon(notif.icon, iconColor)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold" style={{ color: t.fg }}>{notif.title}</span>
                      {!notif.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: iconColor }} />}
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: pCfg.bg, color: pCfg.color }}>
                        {pCfg.label}
                      </span>
                      {catCfg && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: catCfg.bg, color: catCfg.color }}>
                          {catCfg.label}
                        </span>
                      )}
                      {statusInfo && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: statusInfo.color + '18', color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      )}
                    </div>

                    <p className="text-sm mb-3 leading-relaxed" style={{ color: t.muted }}>{notif.message}</p>

                    {notif.actionable && notif.actions.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="px-3 py-1.5 rounded-xl text-white text-xs font-medium transition-all hover:opacity-90"
                          style={{ background: iconColor }}
                          onClick={e => handleAction(e, notif, notif.actions[0])}
                        >
                          {notif.actions[0]}
                        </button>
                        {notif.actions[1] && (
                          <button
                            className="px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:opacity-80"
                            style={{ borderColor: t.border, color: t.muted }}
                            onClick={e => handleAction(e, notif, notif.actions[1])}
                          >
                            {notif.actions[1]}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs" style={{ color: t.mutedLight }}>
                      <Clock size={11} />{notif.time}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(notif.id) }}
                      className="p-1 rounded-lg transition-all"
                      style={{ color: t.border }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.mutedLight }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.border }}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPreferences(false)}>
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: t.fg }}>Notification Preferences</h3>
                <p className="text-xs mt-0.5" style={{ color: t.muted }}>Manage how and when you receive notifications</p>
              </div>
              <button onClick={() => setShowPreferences(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Email Notifications */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={15} style={{ color: t.primary }} />
                  <span className="text-sm font-semibold" style={{ color: t.fg }}>Email Notifications</span>
                </div>
                <div className="space-y-3 pl-6">
                  {[
                    { label: 'Critical alerts', key: 'emailCritical', desc: 'Expiring contracts, compliance failures' },
                    { label: 'High priority', key: 'emailHigh', desc: 'Upcoming deadlines, required actions' },
                    { label: 'Medium priority', key: 'emailMedium', desc: 'Reminders, status updates' },
                    { label: 'Low priority', key: 'emailLow', desc: 'General updates, informational' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm" style={{ color: t.fgSecondary }}>{item.label}</div>
                        <div className="text-xs" style={{ color: t.mutedLight }}>{item.desc}</div>
                      </div>
                      <Toggle checked={prefs[item.key as keyof typeof prefs] as boolean} onChange={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof prefs] }))} />
                    </div>
                  ))}
                </div>
              </div>
              {/* In-App */}
              <div className="border-t pt-5" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={15} style={{ color: t.primary }} />
                  <span className="text-sm font-semibold" style={{ color: t.fg }}>In-App Notifications</span>
                </div>
                <div className="pl-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm" style={{ color: t.fgSecondary }}>Show all notifications</div>
                    <div className="text-xs" style={{ color: t.mutedLight }}>Real-time alerts inside the app</div>
                  </div>
                  <Toggle checked={prefs.inAppAll} onChange={() => setPrefs(p => ({ ...p, inAppAll: !p.inAppAll }))} />
                </div>
              </div>
              {/* SMS & Slack */}
              <div className="border-t pt-5" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone size={15} style={{ color: t.primary }} />
                  <span className="text-sm font-semibold" style={{ color: t.fg }}>Other Channels</span>
                </div>
                <div className="space-y-3 pl-6">
                  {[
                    { label: 'SMS alerts', key: 'sms', desc: 'Critical alerts only via text message' },
                    { label: 'Slack notifications', key: 'slack', desc: 'Post to connected Slack workspace' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm" style={{ color: t.fgSecondary }}>{item.label}</div>
                        <div className="text-xs" style={{ color: t.mutedLight }}>{item.desc}</div>
                      </div>
                      <Toggle checked={prefs[item.key as keyof typeof prefs] as boolean} onChange={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof prefs] }))} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Reminder & Digest */}
              <div className="border-t pt-5" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={15} style={{ color: t.primary }} />
                  <span className="text-sm font-semibold" style={{ color: t.fg }}>Reminder Settings</span>
                </div>
                <div className="space-y-4 pl-6">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Remind me before deadlines</label>
                    <select value={prefs.reminderDays} onChange={e => setPrefs(p => ({ ...p, reminderDays: e.target.value }))} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                      {['1', '3', '7', '14', '30'].map(d => <option key={d} value={d}>{d} {d === '1' ? 'day' : 'days'} before</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Email digest frequency</label>
                    <select value={prefs.digestFrequency} onChange={e => setPrefs(p => ({ ...p, digestFrequency: e.target.value }))} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                      {['realtime', 'daily', 'weekly', 'never'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: t.border }}>
              <button onClick={resetPreferences} className="px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Reset Defaults</button>
              <button onClick={() => setShowPreferences(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
              <button onClick={savePreferences} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all" style={{ background: prefSaved ? t.success : t.primary }}>
                {prefSaved ? '✓ Saved!' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowEscalateModal(null)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.dangerBg }}>
                  <AlertCircle size={18} style={{ color: t.danger }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: t.fg }}>Escalate Issue</h3>
                  <p className="text-xs" style={{ color: t.muted }}>This will notify the Legal Manager immediately</p>
                </div>
              </div>
              <button onClick={() => setShowEscalateModal(null)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Escalate to</label>
                <select className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                  <option>Sarah Chen – Legal Manager</option>
                  <option>Marcus Williams – Legal Counsel</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Escalation note (optional)</label>
                <textarea
                  value={escalationNote}
                  onChange={e => setEscalationNote(e.target.value)}
                  rows={3}
                  placeholder="Describe the urgency or context…"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                />
              </div>
              <div className="p-3 rounded-xl text-xs" style={{ background: t.dangerBg, color: t.danger }}>
                ⚠ Escalating will mark this as high priority and send an immediate alert.
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: t.border }}>
              <button onClick={() => setShowEscalateModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
              <button onClick={confirmEscalate} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: t.danger }}>
                Escalate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Reviewer Modal */}
      {showAssignModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAssignModal(null)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.infoBg }}>
                  <UserPlus size={18} style={{ color: t.info }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: t.fg }}>Assign Reviewer</h3>
                  <p className="text-xs" style={{ color: t.muted }}>Select a team member to review this document</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(null)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {([] as any[]).map(member => (
                <label
                  key={member}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: selectedAssignee === member ? t.primaryBg : 'transparent', border: `1px solid ${selectedAssignee === member ? t.primary + '40' : t.border}` }}
                >
                  <input
                    type="radio"
                    name="assignee"
                    value={member}
                    checked={selectedAssignee === member}
                    onChange={() => setSelectedAssignee(member)}
                    className="accent-primary"
                    style={{ accentColor: t.primary }}
                  />
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: t.primary }}>
                    {member[0]}
                  </div>
                  <span className="text-sm" style={{ color: t.fg }}>{member}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: t.border }}>
              <button onClick={() => { setShowAssignModal(null); setSelectedAssignee('') }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
              <button onClick={confirmAssign} disabled={!selectedAssignee} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40" style={{ background: t.primary }}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Certificate Modal */}
      {showCertModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCertModal(null)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.warningBg }}>
                  <FileText size={18} style={{ color: t.warning }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: t.fg }}>Request Insurance Certificate</h3>
                  <p className="text-xs" style={{ color: t.muted }}>Baker McKenzie Retainer</p>
                </div>
              </div>
              <button onClick={() => setShowCertModal(null)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Certificate type</label>
                <select className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                  <option>Certificate of Insurance (COI)</option>
                  <option>Additional Insured Endorsement</option>
                  <option>Waiver of Subrogation</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Requested by date</label>
                <input type="date" defaultValue="2025-08-15" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: t.muted }}>Notes</label>
                <textarea rows={2} placeholder="Any special requirements…" className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: t.border }}>
              <button onClick={() => setShowCertModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
              <button onClick={confirmCertRequest} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: t.primary }}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
