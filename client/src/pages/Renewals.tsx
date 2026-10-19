import { useState, useEffect } from 'react'
import type { PageProps } from '../types'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, MoreHorizontal, Filter, Search, Bell, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { renewalsApi } from '../api'

interface RenewalsProps extends PageProps {
  tab: 'overview' | 'all' | 'calendar' | 'details'
}

const TABS = ['overview', 'all', 'calendar', 'details'] as const

function CountdownBadge({ days, t }: { days: number; t: any }) {
  if (days < 0) return <span className="text-xs font-bold" style={{ color: t.danger }}>{Math.abs(days)}d overdue</span>
  if (days <= 7) return <span className="text-xs font-bold" style={{ color: t.warning }}>{days}d left</span>
  if (days <= 30) return <span className="text-xs font-bold" style={{ color: t.info }}>{days}d left</span>
  return <span className="text-xs font-medium" style={{ color: t.muted }}>{days}d left</span>
}

export function Renewals({ navigate, tab }: RenewalsProps) {
  const { theme: t } = useTheme()
  const [renewals, setRenewals] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>(tab)
  useEffect(() => { setActiveTab(tab) }, [tab])
  const [search, setSearch] = useState('')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  useEffect(() => { renewalsApi.list().then(data => { const normalized = (data || []).map((r: any) => ({ ...r, status: r.status || 'scheduled', approvalStatus: r.approvalStatus || r.status || 'draft', value: r.value ? (typeof r.value === 'string' ? r.value : `$${r.value}`) : '$0', daysLeft: r.daysLeft ?? 0 })); setRenewals(normalized) }).catch(() => setRenewals([])) }, [])
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [selectedRenewal, setSelectedRenewal] = useState<typeof renewals[0] | null>(null)
  const [reminderSent, setReminderSent] = useState(false)

  const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    overdue: { bg: t.dangerBg, text: t.danger, label: 'Overdue', icon: <AlertTriangle size={12} /> },
    urgent: { bg: t.warningBg, text: t.warning, label: 'Urgent', icon: <Clock size={12} /> },
    upcoming: { bg: t.infoBg, text: t.info, label: 'Upcoming', icon: <Clock size={12} /> },
    scheduled: { bg: t.successBg, text: t.success, label: 'Scheduled', icon: <CheckCircle2 size={12} /> },
  }

  const approvalConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: t.warningBg, text: t.warning },
    approved: { bg: t.successBg, text: t.success },
    draft: { bg: t.bg, text: t.muted },
  }

  const formatValue = (v: number) =>
    v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`

  const totalUpcomingValue = renewals.filter(r => r.daysLeft > 0 && r.daysLeft <= 90).reduce((s, r) => s + parseInt(r.value.replace(/[$,]/g, '')), 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Renewals</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {renewals.filter(r => r.daysLeft <= 30 && r.daysLeft >= 0).length} renewals due in 30 days · {formatValue(totalUpcomingValue)} total value
          </p>
        </div>
        <button onClick={() => { setSelectedRenewal(null); setShowReminderDialog(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
          <Bell size={14} />Set Reminders
        </button>
      </div>

      <div className="flex gap-1 border-b mb-6" style={{ borderColor: t.border }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'all', label: 'All Renewals' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'details', label: 'Details' },
        ].map(tabItem => (
          <button
            key={tabItem.id}
            onClick={() => {
              setActiveTab(tabItem.id as typeof TABS[number])
              navigate(tabItem.id === 'overview' ? 'renewals' : tabItem.id === 'all' ? 'renewals-all' : tabItem.id === 'calendar' ? 'renewals-calendar' : 'renewal-details')
            }}
            className="px-5 py-2.5 text-sm font-medium border-b-2 transition-all"
            style={{
              borderColor: activeTab === tabItem.id ? t.primary : 'transparent',
              color: activeTab === tabItem.id ? t.primary : t.muted,
            }}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overdue', value: renewals.filter(r => r.daysLeft < 0).length, color: t.danger, bg: t.dangerBg },
              { label: 'Due in 7 days', value: renewals.filter(r => r.daysLeft >= 0 && r.daysLeft <= 7).length, color: t.warning, bg: t.warningBg },
              { label: 'Due in 30 days', value: renewals.filter(r => r.daysLeft >= 0 && r.daysLeft <= 30).length, color: t.info, bg: t.infoBg },
              { label: 'Scheduled', value: renewals.filter(r => r.daysLeft > 30).length, color: t.success, bg: t.successBg },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
                <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm" style={{ color: t.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Requires Immediate Attention</h3>
            </div>
            <div className="space-y-3">
              {renewals.filter(r => r.daysLeft <= 7).map(renewal => (
                <div
                  key={renewal.id}
                  className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                  style={{ borderColor: renewal.daysLeft < 0 ? t.danger + '40' : t.warning + '40', background: renewal.daysLeft < 0 ? t.dangerBg : t.warningBg }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadowHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: renewal.daysLeft < 0 ? t.danger + '30' : t.warning + '30' }}>
                    {renewal.daysLeft < 0 ? <AlertTriangle size={20} style={{ color: t.danger }} /> : <Clock size={20} style={{ color: t.warning }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: t.fg }}>{renewal.contract}</div>
                    <div className="text-xs" style={{ color: t.muted }}>{renewal.dept} · {renewal.owner}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: t.fg }}>{renewal.value}</div>
                    <CountdownBadge days={renewal.daysLeft} t={t} />
                  </div>
                  <button
                    onClick={() => { setSelectedRenewal(renewal); setShowRenewDialog(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-medium flex-shrink-0"
                    style={{ background: renewal.daysLeft < 0 ? t.danger : t.warning }}
                  >
                    <RefreshCw size={12} />Renew Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: t.fg }}>Upcoming Renewal Value by Month</h3>
            <p className="text-sm mb-5" style={{ color: t.muted }}>Next 6 months</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[]} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: t.mutedLight }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${v / 1000}K`} tick={{ fontSize: 11, fill: t.mutedLight }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [formatValue(v), 'Renewal Value']} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {([] as any[]).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? t.danger : i === 1 ? t.warning : t.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* All Renewals */}
      {activeTab === 'all' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ borderColor: t.border, background: t.surface }}>
              <Search size={14} style={{ color: t.mutedLight }} />
              <input type="text" placeholder="Search renewals..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none" style={{ color: t.fg }} />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.muted, background: t.surface }}>
              <Filter size={14} />Filter
            </button>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.border, background: t.surface }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
                  {['CONTRACT', 'DEPARTMENT', 'VALUE', 'EXPIRY', 'STATUS', 'APPROVAL', 'ACTIONS'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renewals.filter(r => r.contract.toLowerCase().includes(search.toLowerCase())).map((r, i) => {
                  const status = statusConfig[r.status] || { bg: t.bg, text: t.muted, label: r.status || 'Unknown', icon: null }
                  const approval = approvalConfig[r.approvalStatus] || { bg: t.bg, text: t.muted }
                  return (
                    <tr key={r.id} className="transition-all" style={{ borderBottom: i < renewals.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium" style={{ color: t.fg }}>{r.contract}</div>
                        <div className="text-xs" style={{ color: t.mutedLight }}>{r.owner}</div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: t.muted }}>{r.dept}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: t.fg }}>{r.value}</td>
                      <td className="px-5 py-4">
                        <div className="text-sm" style={{ color: r.daysLeft < 0 ? t.danger : t.fgSecondary }}>{r.currentExpiry}</div>
                        <CountdownBadge days={r.daysLeft} t={t} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                          {status.icon}{status.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: approval.bg, color: approval.text }}>
                          {r.approvalStatus.charAt(0).toUpperCase() + r.approvalStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedRenewal(r); setShowRenewDialog(true) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: t.primaryBg, color: t.primary }}>
                            <RefreshCw size={12} />Renew
                          </button>
                          <button className="p-1.5 rounded-lg" style={{ color: t.mutedLight }}><MoreHorizontal size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar */}
      {activeTab === 'calendar' && (
        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: t.fg }}>{MONTHS[calMonth]} {calYear}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                className="px-3 py-1.5 rounded-lg border text-sm transition-all"
                style={{ borderColor: t.border, color: t.muted }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >← Prev</button>
              <button
                onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()) }}
                className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
                style={{ borderColor: t.primary, color: t.primary }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primaryBg)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >Today</button>
              <button
                onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                className="px-3 py-1.5 rounded-lg border text-sm transition-all"
                style={{ borderColor: t.border, color: t.muted }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >Next →</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: t.mutedLight }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const firstDay = new Date(calYear, calMonth, 1).getDay()
              const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
              const today = new Date()
              const isCurrentMonth = today.getMonth() === calMonth && today.getFullYear() === calYear
              const todayDay = isCurrentMonth ? today.getDate() : -1
              const monthName = MONTHS[calMonth].substring(0, 3)
              const cells = []
              for (let i = 0; i < firstDay + daysInMonth; i++) {
                const day = i < firstDay ? null : i - firstDay + 1
                const isToday = day === todayDay
                const renewalOnDay = day !== null ? renewals.find(r => {
                  const parts = r.renewalDate.split(' ')
                  const d = parseInt(parts[1]?.replace(',', '') ?? '0')
                  return d === day && r.renewalDate.includes(monthName)
                }) : undefined
                cells.push(
                  <div
                    key={i}
                    className="rounded-xl p-2 min-h-24 transition-all"
                    style={{
                      background: isToday ? t.primaryBg : day ? t.surface : 'transparent',
                      border: isToday ? `2px solid ${t.primary}` : day ? `1px solid ${t.borderLight}` : 'none',
                      cursor: day ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = isToday ? t.primaryBg : t.bg }}
                    onMouseLeave={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = isToday ? t.primaryBg : t.surface }}
                  >
                    {day && (
                      <>
                        <div
                          className="text-sm font-medium w-7 h-7 flex items-center justify-center rounded-lg mb-1"
                          style={{
                            color: isToday ? '#fff' : t.fgSecondary,
                            background: isToday ? t.primary : 'transparent',
                            fontWeight: isToday ? 700 : 400,
                          }}
                        >
                          {day}
                        </div>
                        {renewalOnDay && (
                          <div
                            className="rounded-md px-1.5 py-1 mb-1"
                            style={{
                              background: renewalOnDay.daysLeft < 0 ? t.dangerBg : renewalOnDay.daysLeft <= 7 ? t.warningBg : t.infoBg,
                              borderLeft: `3px solid ${renewalOnDay.daysLeft < 0 ? t.danger : renewalOnDay.daysLeft <= 7 ? t.warning : t.info}`,
                            }}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: renewalOnDay.daysLeft < 0 ? t.danger : renewalOnDay.daysLeft <= 7 ? t.warning : t.info }} />
                              <span className="text-xs font-bold truncate" style={{ color: renewalOnDay.daysLeft < 0 ? t.danger : renewalOnDay.daysLeft <= 7 ? t.warning : t.info, fontSize: '10px' }}>
                                {renewalOnDay.contract.split(' ')[0]}
                              </span>
                            </div>
                            <div className="text-xs font-medium" style={{ color: renewalOnDay.daysLeft < 0 ? t.danger : renewalOnDay.daysLeft <= 7 ? t.warning : t.info, fontSize: '9px' }}>
                              {renewalOnDay.value}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              }
              return cells
            })()}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: t.borderLight }}>
            {[
              { color: t.dangerBg, dot: t.danger, label: 'Overdue' },
              { color: t.warningBg, dot: t.warning, label: 'Urgent (≤7d)' },
              { color: t.infoBg, dot: t.info, label: 'Upcoming' },
              { color: t.successBg, dot: t.success, label: 'Scheduled' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: l.color, border: `1px solid ${l.dot}30` }} />
                <span className="text-xs" style={{ color: t.muted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
              <h3 className="text-base font-semibold mb-4" style={{ color: t.fg }}>Renewal Details – Oracle Database License</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Current Contract Value', value: '$920,000' },
                  { label: 'Proposed Renewal Value', value: '$1,012,000 (+10%)' },
                  { label: 'Current Expiry', value: 'Jul 30, 2025' },
                  { label: 'New Expiry', value: 'Jul 30, 2026' },
                  { label: 'Approval Required From', value: 'CFO, Legal' },
                  { label: 'Auto-Renewal', value: 'No' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl" style={{ background: t.bg }}>
                    <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{item.label}</div>
                    <div className="text-sm font-semibold" style={{ color: t.fg }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Renewal Timeline</h4>
              <div className="space-y-3">
                {[
                  { date: 'Jul 1, 2025', event: 'Renewal notice sent to vendor', done: true },
                  { date: 'Jul 10, 2025', event: 'Internal review initiated', done: true },
                  { date: 'Jul 15, 2025', event: 'CFO approval required', done: false, active: true },
                  { date: 'Jul 20, 2025', event: 'Legal review', done: false },
                  { date: 'Jul 25, 2025', event: 'Final approval & signature', done: false },
                  { date: 'Jul 30, 2025', event: 'Contract expires', done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: step.done ? t.primary : step.active ? t.info : t.borderLight }}>
                        {step.done ? <CheckCircle2 size={14} color="white" /> : <div className="w-2 h-2 rounded-full" style={{ background: step.active ? '#fff' : t.mutedLight }} />}
                      </div>
                      {i < 5 && <div className="w-0.5 h-6 mt-1" style={{ background: step.done ? t.primary : t.border }} />}
                    </div>
                    <div className="pb-4">
                      <div className="text-sm font-medium" style={{ color: step.active ? t.info : t.fg }}>{step.event}</div>
                      <div className="text-xs" style={{ color: t.mutedLight }}>{step.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border p-5" style={{ borderColor: t.danger + '40', background: t.dangerBg }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} style={{ color: t.danger }} />
                <span className="text-sm font-semibold" style={{ color: t.danger }}>Urgent Action Required</span>
              </div>
              <p className="text-sm" style={{ color: t.danger }}>This contract expires in 3 days. Renewal approval is pending from CFO.</p>
              <button className="mt-3 w-full py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.danger }}>
                Escalate Approval
              </button>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Approval Chain</h4>
              {([] as any[]).map(approver => (
                <div key={approver.name} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: t.borderLight }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: t.primary }}>
                    {approver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: t.fg }}>{approver.name}</div>
                    <div className="text-xs" style={{ color: t.mutedLight }}>{approver.role}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: approver.status === 'approved' ? t.successBg : t.warningBg,
                    color: approver.status === 'approved' ? t.success : t.warning,
                  }}>
                    {approver.status.charAt(0).toUpperCase() + approver.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Set Reminder Dialog */}
      {showReminderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowReminderDialog(false)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Set Renewal Reminder</h3>
              <button onClick={() => setShowReminderDialog(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            {!reminderSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Contract</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {renewals.map(r => <option key={r.id}>{r.contract}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Remind me</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['7 days before', '14 days before', '30 days before', '60 days before', '90 days before', 'Custom date'].map(opt => (
                      <button key={opt} className="py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left" style={{ borderColor: t.border, color: t.fg }}
                        onClick={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.primary; (e.currentTarget as HTMLButtonElement).style.background = t.primaryBg; (e.currentTarget as HTMLButtonElement).style.color = t.primary }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Notify</label>
                  <div className="space-y-2">
                    {['Email notification', 'In-app notification', 'SMS notification'].map(n => (
                      <label key={n} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked={n !== 'SMS notification'} className="w-4 h-4" style={{ accentColor: t.primary }} />
                        <span className="text-sm" style={{ color: t.fg }}>{n}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowReminderDialog(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                  <button onClick={() => setReminderSent(true)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Set Reminder</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: t.successBg }}>
                  <CheckCircle2 size={28} style={{ color: t.success }} />
                </div>
                <h4 className="text-base font-semibold mb-2" style={{ color: t.fg }}>Reminder Set!</h4>
                <p className="text-sm mb-5" style={{ color: t.muted }}>You'll be notified before the renewal deadline.</p>
                <button onClick={() => { setShowReminderDialog(false); setReminderSent(false) }} className="px-6 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renew Contract Dialog */}
      {showRenewDialog && selectedRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowRenewDialog(false)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Renew Contract</h3>
              <button onClick={() => setShowRenewDialog(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="p-4 rounded-xl mb-5" style={{ background: t.bg }}>
              <div className="text-sm font-semibold mb-1" style={{ color: t.fg }}>{selectedRenewal.contract}</div>
              <div className="text-xs" style={{ color: t.muted }}>{selectedRenewal.dept} · {selectedRenewal.value}</div>
              <div className="text-xs mt-1" style={{ color: selectedRenewal.daysLeft < 0 ? t.danger : t.warning }}>
                {selectedRenewal.daysLeft < 0 ? `${Math.abs(selectedRenewal.daysLeft)} days overdue` : `Expires in ${selectedRenewal.daysLeft} days`}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>New Start Date</label>
                  <input type="date" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>New End Date</label>
                  <input type="date" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>New Contract Value</label>
                <input type="text" defaultValue={selectedRenewal.value} className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Renewal Notes</label>
                <textarea placeholder="Any special terms or notes for this renewal..." className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowRenewDialog(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                <button onClick={() => setShowRenewDialog(false)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2" style={{ background: t.primary }}>
                  <RefreshCw size={14} />Submit Renewal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
