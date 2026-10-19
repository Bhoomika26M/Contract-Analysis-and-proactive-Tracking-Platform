import { useState, useRef, useEffect } from 'react'
import type { PageProps } from '../types'
import {
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Download, FileText, Calendar, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ExportModal } from '../components/ExportModal'

export function Reports({ navigate }: PageProps) {
  const { theme: t } = useTheme()
  const contractValueByRange: any = {}
  const kpiByRange: any = {}
  const categoryBreakdown: any[] = []
  const obligationPerf: any[] = []
  const savedReports: any[] = []
  const reportTemplates: any[] = []
  const [dateRange, setDateRange] = useState('ytd')
  const [generating, setGenerating] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportModalTitle, setExportModalTitle] = useState('Export Report')
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const exportRef = useRef<HTMLDivElement>(null)

  const openExport = (title = 'Export Report') => {
    setExportModalTitle(title)
    setShowExportModal(true)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleGenerate = (name: string) => {
    setGenerating(name)
    setTimeout(() => setGenerating(null), 2000)
  }

  // Assign theme colors to category breakdown
  const categoryWithColors = categoryBreakdown.map((c, i) => ({
    ...c,
    color: [t.info, t.primary, t.purple, t.warning, t.mutedLight][i] ?? t.mutedLight,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Reports Dashboard</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>Analytics, insights, and exportable reports</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          {[
            { id: 'today', label: 'Today' },
            { id: 'last-7', label: 'Last 7d' },
            { id: 'last-30', label: 'Last 30d' },
            { id: 'this-month', label: 'This Month' },
            { id: 'last-month', label: 'Last Month' },
            { id: 'this-quarter', label: 'This Quarter' },
            { id: 'this-year', label: 'This Year' },
            { id: 'ytd', label: 'YTD' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className="px-3 py-2 rounded-xl text-sm font-medium border transition-all"
              style={{
                background: dateRange === r.id ? t.primary : t.surface,
                color: dateRange === r.id ? '#fff' : t.muted,
                borderColor: dateRange === r.id ? t.primary : t.border,
              }}
            >
              {r.label}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowCustomRange(p => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all"
              style={{ borderColor: showCustomRange ? t.primary : t.border, color: showCustomRange ? t.primary : t.muted, background: t.surface }}>
              <Calendar size={14} />Custom Range
            </button>
            {showCustomRange && (
              <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl border shadow-xl z-20 p-4 space-y-3" style={{ background: t.surface, borderColor: t.border }}>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.muted }}>Start Date</label>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: t.muted }}>End Date</label>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCustomRange(false)} className="flex-1 py-2 rounded-xl border text-xs font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                  <button onClick={() => { setDateRange('custom'); setShowCustomRange(false) }} className="flex-1 py-2 rounded-xl text-white text-xs font-medium" style={{ background: t.primary }}>Apply</button>
                </div>
              </div>
            )}
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => openExport('Export Report')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: t.primary }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primaryHover)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primary)}
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {(() => {
          const kpi = kpiByRange[dateRange] ?? kpiByRange.ytd ?? { value: '-', avgDuration: '-', renewalRate: '-', complianceScore: '-', valueChange: '', durationChange: '', renewalChange: '', complianceChange: '' }
          return [
            { label: 'Total Contract Value', value: kpi.value, change: kpi.valueChange, up: true },
            { label: 'Avg Contract Duration', value: kpi.avgDuration, change: kpi.durationChange, up: true },
            { label: 'Renewal Rate', value: kpi.renewalRate, change: kpi.renewalChange, up: true },
            { label: 'Avg Compliance Score', value: kpi.complianceScore, change: kpi.complianceChange, up: true },
          ]
        })().map(kpi => (
          <div key={kpi.label} className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-2xl font-bold mb-1" style={{ color: t.fg }}>{kpi.value}</div>
            <div className="text-sm mb-2" style={{ color: t.muted }}>{kpi.label}</div>
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: kpi.up ? t.success : t.danger }}>
              {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {kpi.change} vs last period
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-1" style={{ color: t.fg }}>Contract Portfolio Value</h3>
          <p className="text-sm mb-5" style={{ color: t.muted }}>Total value in $M by month</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={contractValueByRange[dateRange] ?? contractValueByRange.ytd ?? []}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.info} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={t.info} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: t.mutedLight }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: t.mutedLight }} axisLine={false} tickLine={false} unit="M" />
              <Tooltip formatter={(v: any) => [`$${v}M`, 'Portfolio Value']} />
              <Area type="monotone" dataKey="value" stroke={t.info} strokeWidth={2.5} fill="url(#valueGrad)" name="Value ($M)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>By Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryWithColors} innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {categoryWithColors.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {categoryWithColors.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: t.muted }}>{item.name}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: t.fg }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Obligation performance */}
      <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
        <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Obligation Completion by Department</h3>
        <div className="space-y-3">
          {obligationPerf.map(item => {
            const pct = Math.round((item.completed / item.total) * 100)
            return (
              <div key={item.dept} className="flex items-center gap-4">
                <div className="text-sm font-medium w-24 flex-shrink-0" style={{ color: t.fgSecondary }}>{item.dept}</div>
                <div className="flex-1 h-2.5 rounded-full" style={{ background: t.borderLight }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: pct >= 90 ? t.primary : pct >= 75 ? t.info : t.warning }}
                  />
                </div>
                <div className="text-sm font-semibold w-12 text-right" style={{ color: t.fg }}>{pct}%</div>
                <div className="text-xs w-16 text-right" style={{ color: t.mutedLight }}>{item.completed}/{item.total}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Report templates + saved */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Generate Reports</h3>
          <div className="grid grid-cols-2 gap-3">
            {reportTemplates.map(template => (
              <button
                key={template.name}
                onClick={() => openExport(template.name)}
                className="flex flex-col items-start p-4 rounded-xl border text-left transition-all"
                style={{ borderColor: t.border, background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.primary; (e.currentTarget as HTMLButtonElement).style.background = t.primaryBg }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <span className="text-2xl mb-2">{template.icon}</span>
                <span className="text-sm font-semibold mb-1" style={{ color: t.fg }}>{template.name}</span>
                <span className="text-xs mb-2" style={{ color: t.muted }}>{template.desc}</span>
                <div className="flex items-center gap-1 text-xs" style={{ color: t.mutedLight }}>
                  <Clock size={10} />{template.time}
                </div>
                {generating === template.name && (
                  <div className="mt-2 w-full h-1 rounded-full overflow-hidden" style={{ background: t.border }}>
                    <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: t.primary }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold" style={{ color: t.fg }}>Download Center</h3>
            <span className="text-sm" style={{ color: t.muted }}>{savedReports.length} reports</span>
          </div>
          <div className="space-y-3">
            {savedReports.map(report => (
              <div key={report.name} className="flex items-center gap-3 p-3 rounded-xl border transition-all" style={{ borderColor: t.borderLight }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = t.bg }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: report.type === 'PDF' ? t.dangerBg : report.type === 'Excel' ? t.successBg : t.infoBg }}>
                  <FileText size={16} style={{ color: report.type === 'PDF' ? t.danger : report.type === 'Excel' ? t.success : t.info }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: t.fg }}>{report.name}</div>
                  <div className="text-xs" style={{ color: t.mutedLight }}>{report.size} · {report.created} · {report.schedule}</div>
                </div>
                <button
                  onClick={() => openExport(report.name)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: t.primary }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.primaryBg }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showExportModal && (
        <ExportModal title={exportModalTitle} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
