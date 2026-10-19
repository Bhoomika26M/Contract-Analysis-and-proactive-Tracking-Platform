import { useState, useEffect } from 'react'
import type { PageProps } from '../types'
import { obligationsApi } from '../api'
import { LayoutGrid, List, Calendar, Plus, Search, Filter, MoreHorizontal, Clock, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type ViewMode = 'kanban' | 'list' | 'calendar'

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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function Obligations({ navigate }: PageProps) {
  const { theme: t } = useTheme()
  const [obligations, setObligations] = useState<any[]>([])
  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedObligation, setSelectedObligation] = useState<any | null>(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  useEffect(() => { obligationsApi.list().then(setObligations).catch(()=>setObligations([])) }, [])

  const columns = [
    { id: 'todo', label: 'To Do', color: t.mutedLight, bg: t.bg },
    { id: 'in-progress', label: 'In Progress', color: t.info, bg: t.infoBg },
    { id: 'review', label: 'In Review', color: t.warning, bg: t.warningBg },
    { id: 'done', label: 'Done', color: t.success, bg: t.successBg },
  ]

  const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: t.dangerBg, text: t.danger, label: 'Critical' },
    high: { bg: t.warningBg, text: t.warning, label: 'High' },
    medium: { bg: t.infoBg, text: t.info, label: 'Medium' },
    low: { bg: t.successBg, text: t.success, label: 'Low' },
  }

  const filtered = obligations.filter(o =>
    (priorityFilter === 'all' || o.priority === priorityFilter) &&
    (o.title.toLowerCase().includes(search.toLowerCase()) || o.contract.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total: obligations.length,
    completed: obligations.filter(o => o.status === 'done').length,
    inProgress: obligations.filter(o => o.status === 'in-progress').length,
    overdue: 3,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Obligation Tracker</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {stats.completed}/{stats.total} completed · {stats.inProgress} in progress · {stats.overdue} overdue
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: showFilterPanel ? t.primary : t.border, color: showFilterPanel ? t.primary : t.fgSecondary, background: t.surface }}>
              <Filter size={14} />Filter
            </button>
            {showFilterPanel && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border shadow-xl z-20 p-4 space-y-3" style={{ background: t.surface, borderColor: t.border }}>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Department</label>
                  <select className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {['All Departments', 'Technology', 'Legal', 'Finance', 'Sales', 'HR', 'Marketing'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Owner</label>
                  <select className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {([] as any[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <button onClick={() => setShowFilterPanel(false)} className="w-full py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Apply</button>
              </div>
            )}
          </div>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
            <Plus size={14} />Add Obligation
          </button>
        </div>
      </div>

      {/* Stats row */}
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

      {/* Toolbar */}
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

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="grid grid-cols-4 gap-4">
          {columns.map(col => {
            const cards = filtered.filter(o => o.status === col.id)
            return (
              <div key={col.id} className="rounded-2xl" style={{ background: col.bg, border: `1px solid ${col.color}20` }}>
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${col.color}20` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold" style={{ color: t.fg }}>{col.label}</span>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${col.color}20`, color: col.color }}
                    >
                      {cards.length}
                    </span>
                  </div>
                  <button className="p-1 rounded-lg" style={{ color: t.mutedLight }}><Plus size={14} /></button>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-40">
                  {cards.map(ob => {
                    const priority = priorityConfig[ob.priority] || { bg: t.bg, text: t.muted, label: ob.priority || 'Unknown' }
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
                          <button style={{ color: t.mutedLight }}><MoreHorizontal size={14} /></button>
                        </div>

                        <p className="text-sm font-medium mb-2 leading-snug" style={{ color: t.fg }}>{ob.title}</p>

                        <p className="text-xs mb-3 truncate" style={{ color: t.mutedLight }}>{ob.contract}</p>

                        {ob.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-3">
                            {ob.tags.map(tag => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: t.borderLight, color: t.muted }}>{tag}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: t.primary, fontSize: '9px' }}>
                              {ob.owner.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs" style={{ color: t.mutedLight }}>{ob.owner.split(' ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} style={{ color: ob.priority === 'critical' ? t.danger : t.mutedLight }} />
                            <span className="text-xs" style={{ color: ob.priority === 'critical' ? t.danger : t.mutedLight }}>{ob.dueDate.split(',')[0]}</span>
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
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.border, background: t.surface }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
                {['OBLIGATION', 'CONTRACT', 'OWNER', 'DUE DATE', 'PRIORITY', 'STATUS', 'PROGRESS'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ob, i) => {
                const priority = priorityConfig[ob.priority] || { bg: t.bg, text: t.muted, label: ob.priority || 'Unknown' }
                const col = columns.find(c => c.id === ob.status)
                return (
                  <tr key={ob.id} className="transition-all" style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: t.fg }}>{ob.title}</div>
                      <div className="flex gap-1 mt-1">{ob.tags.map(tag => <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.borderLight, color: t.muted }}>{tag}</span>)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: t.muted }}>{ob.contract}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: t.primary, fontSize: '10px' }}>
                          {ob.owner.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm" style={{ color: t.fgSecondary }}>{ob.owner.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: ob.priority === 'critical' ? t.danger : t.fgSecondary }}>
                        <Clock size={13} />
                        {ob.dueDate}
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
          </table>
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
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
              const cells = []
              for (let i = 0; i < firstDay + daysInMonth; i++) {
                const day = i < firstDay ? null : i - firstDay + 1
                const isToday = day === todayDay
                const hasObligation = day !== null && [5, 10, 15, 20, 25].includes(day)
                const hasCritical = day !== null && [5, 10].includes(day)
                cells.push(
                  <div
                    key={i}
                    className="rounded-xl p-2 min-h-20 transition-all"
                    style={{
                      background: isToday ? t.primaryBg : day ? 'transparent' : 'transparent',
                      border: isToday ? `2px solid ${t.primary}` : day ? `1px solid ${t.borderLight}` : 'none',
                      cursor: day ? 'pointer' : 'default',
                    }}
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
                        {hasObligation && (
                          <div
                            className="text-xs px-1.5 py-0.5 rounded-md truncate"
                            style={{ background: hasCritical ? t.dangerBg : t.infoBg, color: hasCritical ? t.danger : t.info, fontSize: '10px' }}
                          >
                            {hasCritical ? '⚠ Overdue' : '● Due'}
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

      {/* Add Obligation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Add Obligation</h3>
              <button onClick={() => setShowAddForm(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Obligation Title</label>
                <input type="text" placeholder="e.g. Q4 Compliance Certification" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Contract</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {['ServiceNow MSA', 'Oracle License', 'Microsoft Azure', 'AWS Infrastructure', 'Salesforce CRM'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Owner</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {([] as any[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Due Date</label>
                  <input type="date" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Priority</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Description</label>
                <textarea placeholder="Describe the obligation..." className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Add Obligation</button>
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
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: priorityConfig[selectedObligation.priority]?.bg, color: priorityConfig[selectedObligation.priority]?.text }}>
                    {selectedObligation.priority}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.infoBg, color: t.info }}>{selectedObligation.status}</span>
                </div>
              </div>
              {[
                { label: 'Contract', value: selectedObligation.contract },
                { label: 'Owner', value: selectedObligation.owner },
                { label: 'Department', value: selectedObligation.dept },
                { label: 'Due Date', value: selectedObligation.dueDate },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{item.label}</div>
                  <div className="text-sm font-medium" style={{ color: t.fg }}>{item.value}</div>
                </div>
              ))}
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
                <button className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Mark Complete</button>
                <button className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
