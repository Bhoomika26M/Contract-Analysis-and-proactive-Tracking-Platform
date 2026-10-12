import { useMemo, useState } from 'react'
import { LayoutGrid, List, Calendar, Plus, Search, Filter, MoreHorizontal, Clock, X, Trash2, Pencil, CheckCircle2, Download } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import { useResource } from '../lib/useResource'
import { daysUntil, initials, MONTHS, toDateLabel } from '../lib/format'
import type { ApiObligation, ApiOptions, ObligationStatus, ObligationSummary, Priority } from '../lib/types'
import { EmptyState, ErrorBanner, Field, LoadingState, SuccessBanner, TableFrame, TableHead, inputClass } from '../components/ui'
import { ExportModal } from '../components/ExportModal'
import { CURRENT_USER, type PageProps } from '../types'

type ViewMode = 'kanban' | 'list' | 'calendar'

const COLUMNS: ObligationStatus[] = ['todo', 'in-progress', 'review', 'done']

const COLUMN_LABEL: Record<ObligationStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'In Review',
  done: 'Done',
}

const PRIORITY_LABEL: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function ProgressRing({ percent, size = 36, stroke = 3 }: { percent: number; size?: number; stroke?: number }) {
  const { theme: t } = useTheme()
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - percent / 100)
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.borderLight} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={percent === 100 ? t.success : t.primary}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={9} fill={t.fg} fontWeight="600">
        {percent}%
      </text>
    </svg>
  )
}

interface FormState {
  id: number | null
  title: string
  description: string
  contract_title: string
  owner_name: string
  department: string
  due_date: string
  priority: Priority
  status: ObligationStatus
  completion: number
}

const blankForm: FormState = {
  id: null, title: '', description: '', contract_title: '', owner_name: '',
  department: '', due_date: '', priority: 'medium', status: 'todo', completion: 0,
}

export function Obligations(_: PageProps) {
  const { theme: t } = useTheme()
  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedObligation, setSelectedObligation] = useState<ApiObligation | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [showExport, setShowExport] = useState(false)

  const obligations = useResource<ApiObligation[]>(
    () => api.get<ApiObligation[]>('/obligations', {
      search: search || undefined,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      status: statusFilter || undefined,
      department: departmentFilter || undefined,
    }),
    [search, priorityFilter, statusFilter, departmentFilter],
  )
  const summary = useResource<ObligationSummary>(
    () => api.get<ObligationSummary>('/obligations/summary', {
      department: departmentFilter || undefined,
    }),
    [departmentFilter],
  )
  const options = useResource<ApiOptions>(() => api.get<ApiOptions>('/options'), [])

  const rows = obligations.data ?? []
  const stats = {
    total: summary.data?.total ?? rows.length,
    completed: rows.filter(o => o.status === 'done').length,
    inProgress: rows.filter(o => o.status === 'in-progress').length,
    overdue: rows.filter(o => {
      const days = daysUntil(o.due_date)
      return o.status !== 'done' && days !== null && days < 0
    }).length,
  }

  const columns = COLUMNS.map(id => {
    const color = id === 'todo' ? t.mutedLight : id === 'in-progress' ? t.info : id === 'review' ? t.warning : t.success
    const bg = id === 'todo' ? t.bg : id === 'in-progress' ? t.infoBg : id === 'review' ? t.warningBg : t.successBg
    return { id, label: COLUMN_LABEL[id], color, bg }
  })

  const priorityConfig = useMemo<Record<Priority, { bg: string; text: string; label: string }>>(() => ({
    critical: { bg: t.dangerBg, text: t.danger, label: 'Critical' },
    high: { bg: t.warningBg, text: t.warning, label: 'High' },
    medium: { bg: t.infoBg, text: t.info, label: 'Medium' },
    low: { bg: t.successBg, text: t.success, label: 'Low' },
  }), [t])

  const setFormField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))

  const openCreate = () => {
    setFormError(null)
    setForm({ ...blankForm, owner_name: CURRENT_USER.name })
    setShowAddForm(true)
  }

  const openEdit = (obligation: ApiObligation) => {
    setFormError(null)
    setForm({
      id: obligation.id,
      title: obligation.title,
      description: obligation.description,
      contract_title: obligation.contract_title,
      owner_name: obligation.owner_name,
      department: obligation.department,
      due_date: obligation.due_date ?? '',
      priority: obligation.priority,
      status: obligation.status,
      completion: obligation.completion,
    })
    setShowAddForm(true)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        contract_title: form.contract_title,
        owner_name: form.owner_name,
        department: form.department,
        due_date: form.due_date || null,
        priority: form.priority,
        status: form.status,
        completion: form.completion,
      }
      if (form.id === null) {
        await api.post<ApiObligation>('/obligations', payload)
        setNotice('Obligation added')
      } else {
        await api.patch<ApiObligation>(`/obligations/${form.id}`, payload)
        setNotice('Obligation updated')
      }
      setShowAddForm(false)
      setForm(null)
      await Promise.all([obligations.reload(), summary.reload()])
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const patch = async (id: number, changes: Partial<ApiObligation>) => {
    try {
      await api.patch<ApiObligation>(`/obligations/${id}`, changes)
      await Promise.all([obligations.reload(), summary.reload()])
      setSelectedObligation(prev => (prev && prev.id === id ? { ...prev, ...changes } : prev))
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const remove = async (obligation: ApiObligation) => {
    try {
      await api.delete(`/obligations/${obligation.id}`)
      setSelectedObligation(null)
      setNotice('Obligation deleted')
      await Promise.all([obligations.reload(), summary.reload()])
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  /** Obligations bucketed by calendar day for the month currently in view. */
  const byDay = useMemo(() => {
    const map = new Map<number, ApiObligation[]>()
    rows.forEach(o => {
      if (!o.due_date) return
      const date = new Date(o.due_date)
      if (date.getMonth() !== calMonth || date.getFullYear() !== calYear) return
      const list = map.get(date.getDate()) ?? []
      list.push(o)
      map.set(date.getDate(), list)
    })
    return map
  }, [rows, calMonth, calYear])

  const header = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Obligation Tracker</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {stats.total === 0
              ? 'No data available'
              : `${stats.completed}/${stats.total} completed · ${stats.inProgress} in progress · ${stats.overdue} overdue`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: showFilterPanel ? t.primary : t.border, color: showFilterPanel ? t.primary : t.fgSecondary, background: t.surface }}
            >
              <Filter size={14} />Filter
            </button>
            {showFilterPanel && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border shadow-xl z-20 p-4 space-y-3" style={{ background: t.surface, borderColor: t.border }}>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Department</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={departmentFilter}
                    onChange={e => setDepartmentFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {(options.data?.departments ?? []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Status</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {(options.data?.obligation_statuses ?? []).map(s => (
                      <option key={s} value={s}>{COLUMN_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { setDepartmentFilter(''); setStatusFilter('') }}
                  className="w-full py-2 rounded-xl text-white text-sm font-medium"
                  style={{ background: t.primary }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
            <Plus size={14} />Add Obligation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: t.info, bg: t.infoBg },
          { label: 'Completed', value: stats.completed, color: t.success, bg: t.successBg },
          { label: 'In Progress', value: stats.inProgress, color: t.primary, bg: t.primaryBg },
          { label: 'Overdue', value: stats.overdue, color: t.danger, bg: t.dangerBg },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-2xl border" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-2xl font-bold mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm" style={{ color: t.muted }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </>
  )

  const toolbar = (
<div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ borderColor: t.border, background: t.surface }}>
          <Search size={14} style={{ color: t.mutedLight }} />
          <input
            type="text"
            placeholder="Search obligations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: t.fg }}
          />
        </div>

        <button
          onClick={() => setShowExport(true)}
          disabled={rows.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-50"
          style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}
        >
          <Download size={14} />Export
        </button>

        <div className="flex gap-1.5">
        {['all', 'critical', 'high', 'medium', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{
              background: priorityFilter === p ? t.primary : t.surface,
              color: priorityFilter === p ? t.surface : t.muted,
              borderColor: priorityFilter === p ? t.primary : t.border,
            }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="ml-auto flex gap-1 p-1 rounded-xl border" style={{ borderColor: t.border, background: t.surface }}>
        {([['kanban', <LayoutGrid size={15} />], ['list', <List size={15} />], ['calendar', <Calendar size={15} />]] as [ViewMode, React.ReactNode][]).map(([v, icon]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="p-1.5 rounded-lg transition-all"
            style={{ background: view === v ? t.borderLight : 'transparent', color: view === v ? t.fg : t.mutedLight }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {header}
      {notice && <div className="mb-4"><SuccessBanner message={notice} onDismiss={() => setNotice(null)} /></div>}
      {obligations.error && <div className="mb-4"><ErrorBanner message={obligations.error} onRetry={obligations.reload} /></div>}
      {toolbar}

      {obligations.loading && !obligations.data ? (
        <LoadingState label="Loading obligations…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No data available"
          description={
            search || priorityFilter !== 'all' || statusFilter || departmentFilter
              ? 'No obligations match the current filters.'
              : 'No obligations have been created yet.'
          }
          action={
            search || priorityFilter !== 'all' || statusFilter || departmentFilter ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setSearch(''); setPriorityFilter('all'); setStatusFilter(''); setDepartmentFilter('') }}
                  className="px-5 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: t.border, color: t.muted }}
                >
                  Clear filters
                </button>
                <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
                  Add obligation
                </button>
              </div>
            ) : (
              <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
                Add obligation
              </button>
            )
          }
        />
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {columns.map(col => {
            const cards = rows.filter(o => o.status === col.id)
            return (
              <div key={col.id} className="rounded-2xl" style={{ background: col.bg, border: `1px solid ${col.color}20` }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${col.color}20` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold" style={{ color: t.fg }}>{col.label}</span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${col.color}20`, color: col.color }}>
                      {cards.length}
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-2 min-h-40">
                  {cards.map(ob => {
                    const priority = priorityConfig[ob.priority]
                    const days = daysUntil(ob.due_date)
                    const overdue = ob.status !== 'done' && days !== null && days < 0
                    return (
                      <div
                        key={ob.id}
                        className="rounded-xl p-3 border cursor-pointer transition-all"
                        style={{ background: t.surface, borderColor: t.border }}
                        onClick={() => setSelectedObligation(ob)}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadowHover; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: priority.bg, color: priority.text }}>
                            {priority.label}
                          </span>
                          <MoreHorizontal size={14} style={{ color: t.mutedLight }} />
                        </div>

                        <p className="text-sm font-medium mb-2 leading-snug" style={{ color: t.fg }}>{ob.title}</p>

                        <p className="text-xs mb-3 truncate" style={{ color: t.mutedLight }}>
                          {ob.contract_title || 'No contract linked'}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: t.primary, fontSize: '9px' }}>
                              {ob.owner_name ? initials(ob.owner_name) : '?'}
                            </div>
                            <span className="text-xs" style={{ color: t.mutedLight }}>
                              {ob.owner_name ? ob.owner_name.split(' ')[0] : 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} style={{ color: overdue ? t.danger : t.mutedLight }} />
                            <span className="text-xs" style={{ color: overdue ? t.danger : t.mutedLight }}>
                              {ob.due_date ? toDateLabel(ob.due_date).split(',')[0] : 'No due date'}
                            </span>
                          </div>
                        </div>

                        {ob.completion > 0 && ob.status !== 'done' && (
                          <div className="mt-2">
                            <div className="h-1 rounded-full" style={{ background: t.borderLight }}>
                              <div className="h-full rounded-full" style={{ width: `${ob.completion}%`, background: t.primary }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {cards.length === 0 && (
                    <div className="h-20 flex items-center justify-center">
                      <span className="text-xs" style={{ color: t.mutedLight }}>No items</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : view === 'list' ? (
        <TableFrame>
          <TableHead columns={['OBLIGATION', 'CONTRACT', 'OWNER', 'DUE DATE', 'PRIORITY', 'STATUS', 'PROGRESS']} />
          <tbody>
            {rows.map((ob, i) => {
              const priority = priorityConfig[ob.priority]
              const col = columns.find(c => c.id === ob.status)
              const days = daysUntil(ob.due_date)
              const overdue = ob.status !== 'done' && days !== null && days < 0
              return (
                <tr
                  key={ob.id}
                  className="transition-all cursor-pointer"
                  style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                  onClick={() => setSelectedObligation(ob)}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: t.fg }}>{ob.title}</div>
                    {ob.description && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: t.mutedLight }}>{ob.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: t.muted }}>{ob.contract_title || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: t.primary, fontSize: '10px' }}>
                        {ob.owner_name ? initials(ob.owner_name) : '?'}
                      </div>
                      <span className="text-sm" style={{ color: t.fgSecondary }}>{ob.owner_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: overdue ? t.danger : t.fgSecondary }}>
                      <Clock size={13} />
                      {toDateLabel(ob.due_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: priority.bg, color: priority.text }}>{priority.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${col?.color}20`, color: col?.color }}>{col?.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressRing percent={ob.completion} size={32} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableFrame>
      ) : (
        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold" style={{ color: t.fg }}>{MONTHS[calMonth]} {calYear}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                className="px-3 py-1.5 rounded-lg border text-sm transition-all"
                style={{ borderColor: t.border, color: t.muted }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
              >←</button>
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
              >→</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs font-semibold py-2" style={{ color: t.mutedLight }}>{d}</div>
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
                const dayItems = day === null ? [] : byDay.get(day) ?? []
                const hasCritical = dayItems.some(o => o.priority === 'critical')
                cells.push(
                  <div
                    key={i}
                    className="rounded-xl p-2 min-h-20 transition-all"
                    style={{
                      background: isToday ? t.primaryBg : 'transparent',
                      border: isToday ? `2px solid ${t.primary}` : day ? `1px solid ${t.borderLight}` : 'none',
                      cursor: dayItems.length ? 'pointer' : 'default',
                    }}
                    onClick={() => dayItems[0] && setSelectedObligation(dayItems[0])}
                  >
                    {day && (
                      <>
                        <div
                          className="text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-lg"
                          style={{
                            color: isToday ? '#fff' : t.fgSecondary,
                            background: isToday ? t.primary : 'transparent',
                            fontWeight: isToday ? 700 : 400,
                          }}
                        >
                          {day}
                        </div>
                        {dayItems.slice(0, 2).map(item => (
                          <div
                            key={item.id}
                            className="text-xs px-1.5 py-0.5 rounded-md truncate"
                            style={{
                              background: item.status === 'done' ? t.successBg : hasCritical && item.priority === 'critical' ? t.dangerBg : t.infoBg,
                              color: item.status === 'done' ? t.success : item.priority === 'critical' ? t.danger : t.info,
                              fontSize: '10px',
                            }}
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <div className="text-xs" style={{ color: t.mutedLight, fontSize: '10px' }}>
                            +{dayItems.length - 2} more
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
        </div>
      )}

      {/* Export the exact rows on screen */}
      {showExport && (
        <ExportModal
          title="Obligation Tracker Export"
          fileBaseName="ContractIQ_Obligations"
          rows={rows}
          columns={[
            { header: 'ID', value: r => r.id },
            { header: 'Obligation', value: r => r.title },
            { header: 'Contract', value: r => r.contract_title ?? '' },
            { header: 'Owner', value: r => r.owner_name ?? '' },
            { header: 'Department', value: r => r.department },
            { header: 'Due Date', value: r => r.due_date ?? '' },
            { header: 'Priority', value: r => r.priority },
            { header: 'Status', value: r => r.status },
            { header: 'Completion %', value: r => r.completion, align: 'right' },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Add / Edit Obligation Modal */}
      {showAddForm && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowAddForm(false); setForm(null) }}>
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>{form.id === null ? 'Add Obligation' : 'Edit Obligation'}</h3>
              <button onClick={() => { setShowAddForm(false); setForm(null) }} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>

            {formError && <div className="mb-4"><ErrorBanner message={formError} /></div>}

            <div className="space-y-4">
              <Field label="Obligation Title">
                <input className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  placeholder="e.g. Q4 Compliance Certification"
                  value={form.title}
                  onChange={e => setFormField('title', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contract">
                  <input className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    placeholder="e.g. Northwind Analytics MSA"
                    value={form.contract_title}
                    onChange={e => setFormField('contract_title', e.target.value)} />
                </Field>
                <Field label="Owner">
                  <input className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    placeholder="Full name"
                    value={form.owner_name}
                    onChange={e => setFormField('owner_name', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Due Date">
                  <input type="date" className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={form.due_date} onChange={e => setFormField('due_date', e.target.value)} />
                </Field>
                <Field label="Priority">
                  <select className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={form.priority}
                    onChange={e => setFormField('priority', e.target.value as Priority)}>
                    {(options.data?.obligation_priorities ?? []).map(p => (
                      <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <input className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={form.department}
                    onChange={e => setFormField('department', e.target.value)} />
                </Field>
                <Field label="Status">
                  <select className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                    value={form.status}
                    onChange={e => setFormField('status', e.target.value as ObligationStatus)}>
                    {(options.data?.obligation_statuses ?? []).map(s => (
                      <option key={s} value={s}>{COLUMN_LABEL[s]}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Completion (%)">
                <input type="number" min={0} max={100} className={inputClass} style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={form.completion}
                  onChange={e => setFormField('completion', Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
              </Field>
              <Field label="Description">
                <textarea placeholder="Describe the obligation..." rows={3} className={`${inputClass} resize-none`}
                  style={{ borderColor: t.border, color: t.fg, background: t.bg }}
                  value={form.description}
                  onChange={e => setFormField('description', e.target.value)} />
              </Field>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowAddForm(false); setForm(null) }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: t.primary }}>
                  {saving ? 'Saving…' : form.id === null ? 'Add Obligation' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Panel */}
      {selectedObligation && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedObligation(null)}>
          <div className="w-full max-w-sm h-full overflow-y-auto border-l p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Task Details</h3>
              <button onClick={() => setSelectedObligation(null)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: t.fg }}>{selectedObligation.title}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: priorityConfig[selectedObligation.priority].bg, color: priorityConfig[selectedObligation.priority].text }}>
                    {PRIORITY_LABEL[selectedObligation.priority]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.infoBg, color: t.info }}>
                    {COLUMN_LABEL[selectedObligation.status]}
                  </span>
                </div>
              </div>
              {[
                { label: 'Contract', value: selectedObligation.contract_title || 'No contract linked' },
                { label: 'Owner', value: selectedObligation.owner_name || 'Unassigned' },
                { label: 'Department', value: selectedObligation.department || '—' },
                { label: 'Due Date', value: toDateLabel(selectedObligation.due_date) },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{item.label}</div>
                  <div className="text-sm font-medium" style={{ color: t.fg }}>{item.value}</div>
                </div>
              ))}
              {selectedObligation.description && (
                <div>
                  <div className="text-xs mb-1" style={{ color: t.mutedLight }}>Description</div>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: t.fgSecondary }}>{selectedObligation.description}</div>
                </div>
              )}
              <div>
                <div className="text-xs mb-2" style={{ color: t.mutedLight }}>Completion</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ background: t.border }}>
                    <div className="h-full rounded-full" style={{ width: `${selectedObligation.completion}%`, background: t.primary }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.fg }}>{selectedObligation.completion}%</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {selectedObligation.status !== 'done' ? (
                  <button
                    onClick={() => patch(selectedObligation.id, { status: 'done', completion: 100 })}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2"
                    style={{ background: t.primary }}
                  >
                    <CheckCircle2 size={14} />Mark Complete
                  </button>
                ) : (
                  <button
                    onClick={() => patch(selectedObligation.id, { status: 'todo', completion: 0 })}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                    style={{ background: t.muted }}
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => { setSelectedObligation(null); openEdit(selectedObligation) }}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2"
                  style={{ borderColor: t.border, color: t.muted }}
                >
                  <Pencil size={14} />Edit
                </button>
              </div>
              <button
                onClick={() => remove(selectedObligation)}
                className="w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2"
                style={{ borderColor: `${t.danger}40`, color: t.danger }}
              >
                <Trash2 size={14} />Delete obligation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}