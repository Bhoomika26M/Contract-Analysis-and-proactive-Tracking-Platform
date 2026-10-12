import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, MoreHorizontal, Filter, Search, Bell, X, Trash2, Plus } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import {
  daysUntil, formatCompactCurrency, formatCurrency, MONTHS, renewalBucket, titleCase, toDateLabel,
} from '../lib/format'
import type { ApiOptions, ApiRenewal, RenewalSummary } from '../lib/types'
import { EmptyState, ErrorBanner, Field, LoadingState, PageHeader, StatCard, SuccessBanner, TableFrame, TableHead, inputClass } from '../components/ui'
import { CURRENT_USER, type PageProps } from '../types'

interface RenewalsProps extends PageProps {
  tab: 'overview' | 'all' | 'calendar' | 'details'
}

const TABS = ['overview', 'all', 'calendar', 'details'] as const
type Tab = typeof TABS[number]

type Bucket = 'overdue' | 'urgent' | 'upcoming' | 'scheduled'

function CountdownBadge({ days, t }: { days: number | null; t: ReturnType<typeof useTheme>['theme'] }) {
  if (days === null) return <span className="text-xs" style={{ color: t.muted }}>No date</span>
  if (days < 0) return <span className="text-xs font-bold" style={{ color: t.danger }}>{Math.abs(days)}d overdue</span>
  if (days <= 7) return <span className="text-xs font-bold" style={{ color: t.warning }}>{days}d left</span>
  if (days <= 30) return <span className="text-xs font-bold" style={{ color: t.info }}>{days}d left</span>
  return <span className="text-xs font-medium" style={{ color: t.muted }}>{days}d left</span>
}

export function Renewals({ navigate, tab }: RenewalsProps) {
  const { theme: t } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>(tab)
  useEffect(() => { setActiveTab(tab) }, [tab])
  const [search, setSearch] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [selectedRenewal, setSelectedRenewal] = useState<ApiRenewal | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [renewForm, setRenewForm] = useState({ renewal_date: '', current_expiry: '', proposed_value: '', approval_status: 'draft', notes: '' })
  const [reminderForm, setReminderForm] = useState({ contract_title: '', days: '30', note: '' })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    contract_title: '',
    counterparty: '',
    department: '',
    owner_name: '',
    current_expiry: '',
    renewal_date: '',
    proposed_value: '',
    currency: 'USD',
    auto_renew: false,
    approval_status: 'draft',
    notes: '',
  })
  const setCreate = <K extends keyof typeof createForm>(key: K, value: (typeof createForm)[K]) =>
    setCreateForm(prev => ({ ...prev, [key]: value }))

  const renewals = useResource<ApiRenewal[]>(
    () => api.get<ApiRenewal[]>('/renewals', {
      search: search || undefined,
      approval_status: approvalFilter || undefined,
    }),
    [search, approvalFilter],
  )
  const summary = useResource<RenewalSummary>(() => api.get<RenewalSummary>('/renewals/summary'), [])
  const options = useResource<ApiOptions>(() => api.get<ApiOptions>('/options'), [])

  const rows = useMemo(() => {
    const all = renewals.data ?? []
    return [...all].sort((a, b) => {
      const da = daysUntil(a.renewal_date ?? a.current_expiry) ?? Number.MAX_SAFE_INTEGER
      const db = daysUntil(b.renewal_date ?? b.current_expiry) ?? Number.MAX_SAFE_INTEGER
      return da - db
    })
  }, [renewals.data])

  const statusConfig: Record<Bucket, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    overdue: { bg: t.dangerBg, text: t.danger, label: 'Overdue', icon: <AlertTriangle size={12} /> },
    urgent: { bg: t.warningBg, text: t.warning, label: 'Urgent', icon: <Clock size={12} /> },
    upcoming: { bg: t.infoBg, text: t.info, label: 'Upcoming', icon: <Clock size={12} /> },
    scheduled: { bg: t.successBg, text: t.success, label: 'Scheduled', icon: <CheckCircle2 size={12} /> },
  }

  const approvalConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: t.warningBg, text: t.warning },
    approved: { bg: t.successBg, text: t.success },
    rejected: { bg: t.dangerBg, text: t.danger },
    draft: { bg: t.bg, text: t.muted },
  }

  const buckets = summary.data?.buckets ?? { overdue: 0, urgent: 0, upcoming: 0, scheduled: 0 }
  const monthly = summary.data?.monthly ?? []
  const monthlyHasData = monthly.some(m => m.value > 0)
  const totalUpcomingValue = summary.data?.pipeline_value_90d ?? 0
  const immediate = rows.filter(r => {
    const days = daysUntil(r.renewal_date ?? r.current_expiry)
    return days !== null && days <= 7
  })

  /** Calendar grid entries, derived from real renewal dates. */
  const byDay = useMemo(() => {
    const map = new Map<number, ApiRenewal[]>()
    rows.forEach(r => {
      const target = r.renewal_date ?? r.current_expiry
      if (!target) return
      const date = new Date(target)
      if (date.getMonth() !== calMonth || date.getFullYear() !== calYear) return
      const list = map.get(date.getDate()) ?? []
      list.push(r)
      map.set(date.getDate(), list)
    })
    return map
  }, [rows, calMonth, calYear])

  const openRenew = (renewal: ApiRenewal) => {
    setSelectedRenewal(renewal)
    setDialogError(null)
    setRenewForm({
      renewal_date: renewal.renewal_date ?? '',
      current_expiry: renewal.current_expiry ?? '',
      proposed_value: renewal.proposed_value === null ? '' : String(renewal.proposed_value),
      approval_status: renewal.approval_status,
      notes: renewal.notes ?? '',
    })
    setShowRenewDialog(true)
  }

  const submitRenewal = async () => {
    if (!selectedRenewal) return
    setSaving(true)
    setDialogError(null)
    try {
      await api.patch<ApiRenewal>(`/renewals/${selectedRenewal.id}`, {
        renewal_date: renewForm.renewal_date || null,
        current_expiry: renewForm.current_expiry || null,
        proposed_value: renewForm.proposed_value === '' ? null : Number(renewForm.proposed_value),
        approval_status: renewForm.approval_status,
        notes: renewForm.notes,
      })
      setShowRenewDialog(false)
      setNotice('Renewal updated')
      await Promise.all([renewals.reload(), summary.reload()])
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const removeRenewal = async (renewal: ApiRenewal) => {
    try {
      await api.delete(`/renewals/${renewal.id}`)
      setSelectedRenewal(null)
      setShowRenewDialog(false)
      setNotice('Renewal deleted')
      await Promise.all([renewals.reload(), summary.reload()])
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const setApproval = async (renewal: ApiRenewal, status: string) => {
    try {
      await api.patch(`/renewals/${renewal.id}`, { approval_status: status })
      setNotice(`Approval set to ${titleCase(status)}`)
      await Promise.all([renewals.reload(), summary.reload()])
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Update failed')
    }
  }

const createReminder = async () => {
    setSaving(true)
    setDialogError(null)
    try {
      const contract = rows.find(r => r.contract_title === reminderForm.contract_title)
      if (!contract) throw new Error('Select a contract for the reminder')
      const base = contract.renewal_date ?? contract.current_expiry
      if (!base) throw new Error('This renewal has no date to count back from')
      const remindAt = new Date(base)
      remindAt.setDate(remindAt.getDate() - Number(reminderForm.days))
      const stamp = `[Reminder ${reminderForm.days}d before → ${toDateLabel(remindAt.toISOString())}]`
      const merged = contract.notes ? `${contract.notes}\n${stamp}` : stamp
      await api.patch(`/renewals/${contract.id}`, {
        notes: merged,
        approval_status: contract.approval_status === 'draft' ? 'pending' : contract.approval_status,
      })
      setShowReminderDialog(false)
      setNotice(`Reminder saved on ${contract.contract_title}`)
      await Promise.all([renewals.reload(), summary.reload()])
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Could not save the reminder')
    } finally {
      setSaving(false)
    }
  }

  const submitNewRenewal = async () => {
    setSaving(true)
    setDialogError(null)
    try {
      await api.post<ApiRenewal>('/renewals', {
        contract_title: createForm.contract_title,
        counterparty: createForm.counterparty,
        department: createForm.department,
        owner_name: createForm.owner_name,
        current_expiry: createForm.current_expiry || null,
        renewal_date: createForm.renewal_date || null,
        proposed_value: createForm.proposed_value === '' ? null : Number(createForm.proposed_value),
        currency: createForm.currency,
        auto_renew: createForm.auto_renew,
        approval_status: createForm.approval_status,
        notes: createForm.notes,
      })
      setShowCreateDialog(false)
      setNotice('Renewal created')
      await Promise.all([renewals.reload(), summary.reload()])
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Could not create the renewal')
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setCreateForm({
      contract_title: '',
      counterparty: '',
      department: '',
      owner_name: CURRENT_USER.name,
      current_expiry: '',
      renewal_date: '',
      proposed_value: '',
      currency: 'USD',
      auto_renew: false,
      approval_status: 'draft',
      notes: '',
    })
    setDialogError(null)
    setShowCreateDialog(true)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Renewals"
        subtitle={
          rows.length === 0
            ? 'No data available'
            : `${buckets.overdue + buckets.urgent} renewals due in 30 days · ${formatCurrency(totalUpcomingValue)} total value`
        }
        actions={
          <>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: t.primary }}
            >
              <Plus size={14} />New Renewal
            </button>
            <button
              onClick={() => { setReminderForm(prev => ({ ...prev, contract_title: prev.contract_title || rows[0]?.contract_title || '' })); setDialogError(null); setShowReminderDialog(true) }}
              disabled={rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-50"
              style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}
            >
              <Bell size={14} />Set Reminders
            </button>
          </>
        }
      />

      {notice && <div className="mb-4"><SuccessBanner message={notice} onDismiss={() => setNotice(null)} /></div>}
      {renewals.error && <div className="mb-4"><ErrorBanner message={renewals.error} onRetry={renewals.reload} /></div>}

      <div className="flex gap-1 border-b mb-6" style={{ borderColor: t.border }}>
        {[
          { id: 'overview', label: 'Overview', page: 'renewals' },
          { id: 'all', label: 'All Renewals', page: 'renewals-all' },
          { id: 'calendar', label: 'Calendar', page: 'renewals-calendar' },
          { id: 'details', label: 'Details', page: 'renewal-details' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as Tab)
              navigate(item.page as never)
            }}
            className="px-5 py-2.5 text-sm font-medium border-b-2 transition-all"
            style={{
              borderColor: activeTab === item.id ? t.primary : 'transparent',
              color: activeTab === item.id ? t.primary : t.muted,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {renewals.loading && !renewals.data ? (
        <LoadingState label="Loading renewals…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No data available"
          description="Renewal records are created against a contract. Add one from the contract repository to see it here."
          action={
            <button
              onClick={() => navigate('renewals')}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: t.primary }}
            >
              Go to contracts
            </button>
          }
        />
      ) : activeTab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Overdue" value={buckets.overdue} color={t.danger} bg={t.dangerBg} />
            <StatCard label="Due in 7 days" value={buckets.urgent} color={t.warning} bg={t.warningBg} />
            <StatCard label="Due in 30 days" value={buckets.upcoming} color={t.info} bg={t.infoBg} />
            <StatCard label="Scheduled" value={buckets.scheduled} color={t.success} bg={t.successBg} />
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Requires Immediate Attention</h3>
            {immediate.length === 0 ? (
              <p className="text-sm" style={{ color: t.muted }}>No renewals are due within the next 7 days.</p>
            ) : (
              <div className="space-y-3">
                {immediate.map(renewal => {
                  const days = daysUntil(renewal.renewal_date ?? renewal.current_expiry) ?? 0
                  const overdue = days < 0
                  return (
                    <div
                      key={renewal.id}
                      className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: overdue ? t.danger + '40' : t.warning + '40',
                        background: overdue ? t.dangerBg : t.warningBg,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadowHover }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: overdue ? t.danger + '30' : t.warning + '30' }}>
                        {overdue
                          ? <AlertTriangle size={20} style={{ color: t.danger }} />
                          : <Clock size={20} style={{ color: t.warning }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: t.fg }}>
                          {renewal.contract_title}
                        </div>
                        <div className="text-xs" style={{ color: t.muted }}>
                          {renewal.department || 'Unassigned'}
                          {renewal.owner_name ? ` · ${renewal.owner_name}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: t.fg }}>
                          {formatCurrency(renewal.proposed_value, renewal.currency)}
                        </div>
                        <CountdownBadge days={days} t={t} />
                      </div>
                      <button
                        onClick={() => openRenew(renewal)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-medium flex-shrink-0"
                        style={{ background: overdue ? t.danger : t.warning }}
                      >
                        <RefreshCw size={12} />Renew Now
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: t.fg }}>Upcoming Renewal Value by Month</h3>
            <p className="text-sm mb-5" style={{ color: t.muted }}>Next 6 months</p>
            {monthlyHasData ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: t.mutedLight }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: unknown) => formatCompactCurrency(Number(v))} tick={{ fontSize: 11, fill: t.mutedLight }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), 'Renewal Value']} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {monthly.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? t.danger : i === 1 ? t.warning : t.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm" style={{ color: t.muted }}>No data available — no renewal values are scheduled.</p>
            )}
          </div>
        </div>
      ) : activeTab === 'all' ? (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ borderColor: t.border, background: t.surface }}>
              <Search size={14} style={{ color: t.mutedLight }} />
              <input type="text" placeholder="Search renewals..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none" style={{ color: t.fg }} />
            </div>
            <select
              value={approvalFilter}
              onChange={e => setApprovalFilter(e.target.value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}
            >
              <option value="">All approvals</option>
              {(options.data?.approval_statuses ?? []).map(a => <option key={a} value={a}>{titleCase(a)}</option>)}
            </select>
            <span className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.muted, background: t.surface }}>
              <Filter size={14} />{rows.length} record(s)
            </span>
          </div>

          <TableFrame>
            <TableHead columns={['CONTRACT', 'DEPARTMENT', 'VALUE', 'EXPIRY', 'STATUS', 'APPROVAL', 'ACTIONS']} />
            <tbody>
              {rows.map((r, i) => {
                const bucket = renewalBucket(r.renewal_date ?? r.current_expiry)
                const status = statusConfig[bucket]
                const approval = approvalConfig[r.approval_status] ?? approvalConfig.draft
                const days = daysUntil(r.renewal_date ?? r.current_expiry)
                return (
                  <tr
                    key={r.id}
                    className="transition-all"
                    style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium" style={{ color: t.fg }}>{r.contract_title ?? 'Untitled contract'}</div>
                      <div className="text-xs" style={{ color: t.mutedLight }}>{r.owner_name || 'Unassigned'}</div>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: t.muted }}>{r.department || '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold" style={{ color: t.fg }}>
                      {formatCurrency(r.proposed_value, r.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm" style={{ color: days !== null && days < 0 ? t.danger : t.fgSecondary }}>
                        {toDateLabel(r.current_expiry)}
                      </div>
                      <CountdownBadge days={days} t={t} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                        {status.icon}{status.label}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: approval.bg, color: approval.text }}>
                        {titleCase(r.approval_status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openRenew(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: t.primaryBg, color: t.primary }}
                        >
                          <RefreshCw size={12} />Renew
                        </button>
                        <button onClick={() => setApproval(r, r.approval_status === 'approved' ? 'pending' : 'approved')} className="p-1.5 rounded-lg" style={{ color: t.mutedLight }} title="Toggle approval">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableFrame>
        </div>
      ) : activeTab === 'calendar' ? (
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
              const cells: React.ReactNode[] = []
              for (let i = 0; i < firstDay + daysInMonth; i++) {
                const day = i < firstDay ? null : i - firstDay + 1
                const isToday = day === todayDay
                const items = day === null ? [] : byDay.get(day) ?? []
                cells.push(
                  <div
                    key={i}
                    className="rounded-xl p-2 min-h-24 transition-all"
                    style={{
                      background: isToday ? t.primaryBg : day ? t.surface : 'transparent',
                      border: isToday ? `2px solid ${t.primary}` : day ? `1px solid ${t.borderLight}` : 'none',
                      cursor: items.length ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = isToday ? t.primaryBg : t.bg }}
                    onMouseLeave={e => { if (day) (e.currentTarget as HTMLDivElement).style.background = isToday ? t.primaryBg : t.surface }}
                    onClick={() => items[0] && openRenew(items[0])}
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
                        {items.map(item => {
                          const itemDays = daysUntil(item.renewal_date ?? item.current_expiry) ?? 0
                          const tone = itemDays < 0 ? t.danger : itemDays <= 7 ? t.warning : t.info
                          const toneBg = itemDays < 0 ? t.dangerBg : itemDays <= 7 ? t.warningBg : t.infoBg
                          return (
                            <div key={item.id} className="rounded-md px-1.5 py-1 mb-1" style={{ background: toneBg, borderLeft: `3px solid ${tone}` }}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tone }} />
                                <span className="text-xs font-bold truncate" style={{ color: tone, fontSize: '10px' }}>
                                  {(item.contract_title ?? 'Contract').split(' ')[0]}
                                </span>
                              </div>
                              <div className="text-xs font-medium" style={{ color: tone, fontSize: '9px' }}>
                                {formatCompactCurrency(item.proposed_value)}
                              </div>
                            </div>
                          )
                        })}
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
      ) : (
        <RenewalDetails
          renewals={rows}
          onRenew={openRenew}
          options={options.data}
          notice={notice}
          onApprove={setApproval}
        />
      )}

      {/* New Renewal Modal */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowCreateDialog(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: t.surface, borderColor: t.border }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>New Renewal</h3>
              <button onClick={() => setShowCreateDialog(false)} style={{ color: t.mutedLight }}>
                <X size={18} />
              </button>
            </div>

            {dialogError && <div className="mb-4"><ErrorBanner message={dialogError} /></div>}

            <div className="space-y-4">
              <Field label="Contract name">
                <input className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  placeholder="e.g. Northwind Analytics MSA"
                  value={createForm.contract_title}
                  onChange={e => setCreate('contract_title', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Counterparty">
                  <input className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={createForm.counterparty}
                    onChange={e => setCreate('counterparty', e.target.value)} />
                </Field>
                <Field label="Department">
                  <select className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={createForm.department}
                    onChange={e => setCreate('department', e.target.value)}>
                    <option value="">—</option>
                    {(options.data?.departments ?? []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Current expiry">
                  <input type="date" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={createForm.current_expiry}
                    onChange={e => setCreate('current_expiry', e.target.value)} />
                </Field>
                <Field label="Renewal date">
                  <input type="date" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={createForm.renewal_date}
                    onChange={e => setCreate('renewal_date', e.target.value)} />
                </Field>
                <Field label="Renewal value">
                  <input type="number" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={createForm.proposed_value}
                    onChange={e => setCreate('proposed_value', e.target.value)} />
                </Field>
                <Field label="Approval status">
                  <select className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={createForm.approval_status}
                    onChange={e => setCreate('approval_status', e.target.value)}>
                    {(options.data?.approval_statuses ?? []).map(a => <option key={a} value={a}>{titleCase(a)}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Notes">
                <textarea rows={3} className={`${inputClass} resize-none`}
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  placeholder="Renewal terms, uplift, approval owner…"
                  value={createForm.notes}
                  onChange={e => setCreate('notes', e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.auto_renew}
                  onChange={e => setCreate('auto_renew', e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: t.primary }}
                />
                <span className="text-sm" style={{ color: t.fg }}>Renews automatically</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: t.border, color: t.muted }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitNewRenewal}
                  disabled={saving || !createForm.contract_title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: t.primary }}
                >
                  {saving ? 'Saving…' : 'Create renewal'}
                </button>
              </div>
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

            {dialogError && <div className="mb-4"><ErrorBanner message={dialogError} /></div>}

            <div className="space-y-4">
              <Field label="Contract">
                <select
                  className={inputClass}
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={reminderForm.contract_title}
                  onChange={e => setReminderForm(p => ({ ...p, contract_title: e.target.value }))}
                >
                  <option value="">Select a contract…</option>
                  {rows.map(r => (
                    <option key={r.id} value={r.contract_title}>
                      {r.contract_title ?? 'Untitled contract'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Remind me">
                <select
                  className={inputClass}
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={reminderForm.days}
                  onChange={e => setReminderForm(p => ({ ...p, days: e.target.value }))}
                >
                  {['7', '14', '30', '60', '90'].map(d => (
                    <option key={d} value={d}>{d} days before</option>
                  ))}
                </select>
              </Field>
              <Field label="Note">
                <textarea
                  rows={3}
                  placeholder="Anything the owner should know…"
                  className={`${inputClass} resize-none`}
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={reminderForm.note}
                  onChange={e => setReminderForm(p => ({ ...p, note: e.target.value }))}
                />
              </Field>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowReminderDialog(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                <button onClick={createReminder} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: t.primary }}>
                  {saving ? 'Saving…' : 'Set Reminder'}
                </button>
              </div>
            </div>
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

            {dialogError && <div className="mb-4"><ErrorBanner message={dialogError} /></div>}

            <div className="p-4 rounded-xl mb-5" style={{ background: t.bg }}>
              <div className="text-sm font-semibold mb-1" style={{ color: t.fg }}>{selectedRenewal.contract_title ?? 'Untitled contract'}</div>
              <div className="text-xs" style={{ color: t.muted }}>
                {selectedRenewal.department || 'Unassigned'} · {formatCurrency(selectedRenewal.proposed_value, selectedRenewal.currency)}
              </div>
              <RenewCountdown renewal={selectedRenewal} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current Expiry">
                  <input type="date" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={renewForm.current_expiry} onChange={e => setRenewForm(p => ({ ...p, current_expiry: e.target.value }))} />
                </Field>
                <Field label="Renewal Date">
                  <input type="date" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={renewForm.renewal_date} onChange={e => setRenewForm(p => ({ ...p, renewal_date: e.target.value }))} />
                </Field>
              </div>
              <Field label="Renewal Value">
                <input type="number" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={renewForm.proposed_value} onChange={e => setRenewForm(p => ({ ...p, proposed_value: e.target.value }))} />
              </Field>
              <Field label="Approval Status">
                <select className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={renewForm.approval_status}
                  onChange={e => setRenewForm(p => ({ ...p, approval_status: e.target.value }))}>
                  {(options.data?.approval_statuses ?? []).map(a => <option key={a} value={a}>{titleCase(a)}</option>)}
                </select>
              </Field>
              <Field label="Renewal Notes">
                <textarea placeholder="Any special terms or notes for this renewal..." rows={3} className={`${inputClass} resize-none`}
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={renewForm.notes}
                  onChange={e => setRenewForm(p => ({ ...p, notes: e.target.value }))} />
              </Field>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowRenewDialog(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                <button onClick={submitRenewal} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: t.primary }}>
                  <RefreshCw size={14} />{saving ? 'Saving…' : 'Save Renewal'}
                </button>
              </div>
              <button
                onClick={() => removeRenewal(selectedRenewal)}
                className="w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2"
                style={{ borderColor: `${t.danger}40`, color: t.danger }}
              >
                <Trash2 size={14} />Delete renewal record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RenewCountdown({ renewal }: { renewal: ApiRenewal }) {
  const { theme: t } = useTheme()
  const days = daysUntil(renewal.renewal_date ?? renewal.current_expiry)
  const overdue = days !== null && days < 0
  return (
    <div className="text-xs mt-1" style={{ color: overdue ? t.danger : t.warning }}>
      {days === null
        ? 'No renewal date recorded'
        : overdue
          ? `${Math.abs(days)} days overdue`
          : `Expires in ${days} days`}
    </div>
  )
}

function RenewalDetails({
  renewals,
  onRenew,
  options,
  notice,
  onApprove,
}: {
  renewals: ApiRenewal[]
  onRenew: (renewal: ApiRenewal) => void
  options: ApiOptions | null
  notice: string | null
  onApprove: (renewal: ApiRenewal, status: string) => void
}) {
  const { theme: t } = useTheme()
  const [selectedId, setSelectedId] = useState<number | null>(renewals[0]?.id ?? null)
  const selected = renewals.find(r => r.id === selectedId) ?? null

  useEffect(() => {
    if (selectedId === null && renewals[0]) setSelectedId(renewals[0].id)
  }, [renewals, selectedId])

  if (!selected) {
    return <EmptyState title="No data available" description="There are no renewal records to display." />
  }

  const days = daysUntil(selected.renewal_date ?? selected.current_expiry)
  const urgent = days !== null && days <= 30
  const approvalOrder = options?.approval_statuses ?? ['draft', 'pending', 'approved', 'rejected']

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: t.fg }}>
            Renewal Details – {selected.contract_title ?? 'Untitled contract'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Current Contract Value', value: formatCurrency(selected.proposed_value, selected.currency) },
              { label: 'Current Expiry', value: toDateLabel(selected.current_expiry) },
              { label: 'Renewal Date', value: toDateLabel(selected.renewal_date) },
              { label: 'Auto-Renewal', value: selected.auto_renew ? 'Yes' : 'No' },
              { label: 'Approval Status', value: titleCase(selected.approval_status) },
              { label: 'Department', value: selected.department || '—' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl" style={{ background: t.bg }}>
                <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{item.label}</div>
                <div className="text-sm font-semibold" style={{ color: t.fg }}>{item.value}</div>
              </div>
            ))}
          </div>

          {selected.notes && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: t.bg }}>
              <div className="text-xs mb-1" style={{ color: t.mutedLight }}>Notes</div>
              <div className="text-sm whitespace-pre-wrap" style={{ color: t.fgSecondary }}>{selected.notes}</div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Renewal records</h4>
          <div className="space-y-2">
            {renewals.map(renewal => {
              const renewalDays = daysUntil(renewal.renewal_date ?? renewal.current_expiry)
              const active = renewal.id === selected.id
              return (
                <button
                  key={renewal.id}
                  onClick={() => setSelectedId(renewal.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: active ? t.primary : t.border,
                    background: active ? t.primaryBg : t.bg,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: t.fg }}>
                      {renewal.contract_title}
                    </div>
                    <div className="text-xs" style={{ color: t.mutedLight }}>
                      {toDateLabel(renewal.renewal_date ?? renewal.current_expiry)} · {titleCase(renewal.approval_status)}
                    </div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: renewalDays !== null && renewalDays < 0 ? t.danger : t.muted }}>
                    {renewalDays === null ? '—' : `${renewalDays}d`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: urgent ? t.danger + '40' : t.border, background: urgent ? t.dangerBg : t.surface }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} style={{ color: urgent ? t.danger : t.muted }} />
            <span className="text-sm font-semibold" style={{ color: urgent ? t.danger : t.fg }}>
              {urgent ? 'Urgent Action Required' : 'Renewal Timeline'}
            </span>
          </div>
          <p className="text-sm" style={{ color: urgent ? t.danger : t.muted }}>
            {days === null
              ? 'No renewal date is recorded for this contract.'
              : days < 0
                ? `This contract passed its renewal date ${Math.abs(days)} days ago.`
                : `This contract renews in ${days} day(s).`}
          </p>
          <button
            onClick={() => onRenew(selected)}
            className="mt-3 w-full py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: urgent ? t.danger : t.primary }}
          >
            Update Renewal
          </button>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Approval Status</h4>
          <div className="space-y-2">
            {approvalOrder.map(status => (
              <button
                key={status}
                onClick={() => onApprove(selected, status)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all"
                style={{
                  borderColor: selected.approval_status === status ? t.primary : t.borderLight,
                  background: selected.approval_status === status ? t.primaryBg : 'transparent',
                }}
              >
                <span style={{ color: t.fgSecondary }}>{titleCase(status)}</span>
                {selected.approval_status === status && <CheckCircle2 size={15} style={{ color: t.primary }} />}
              </button>
            ))}
          </div>
          {notice && <div className="text-xs mt-3" style={{ color: t.mutedLight }}>{notice}</div>}
        </div>
      </div>
    </div>
  )
}