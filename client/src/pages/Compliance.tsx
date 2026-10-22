import { useState, useEffect } from 'react'
import type { PageProps } from '../types'
import { complianceApi } from '../api'
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, AreaChart, Area,
} from 'recharts'
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, MoreHorizontal, ChevronRight, Filter, Download } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ExportModal } from '../components/ExportModal'

export function Compliance({ navigate }: PageProps) {
  const { theme: t } = useTheme()
  const departmentCompliance: any[] = []
  const radarData: any[] = []
  const trendData: any[] = []
  const [alerts, setAlerts] = useState<any[]>([])
  const riskMatrix: any[] = []
  useEffect(() => { complianceApi.list().then(setAlerts).catch(()=>setAlerts([])) }, [])
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState('all')

  const alertColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    critical: { bg: t.dangerBg, text: t.danger, border: t.danger + '40', icon: <AlertTriangle size={16} /> },
    high: { bg: t.warningBg, text: t.warning, border: t.warning + '40', icon: <AlertTriangle size={16} /> },
    medium: { bg: t.infoBg, text: t.info, border: t.info + '40', icon: <Shield size={16} /> },
    low: { bg: t.successBg, text: t.success, border: t.success + '40', icon: <CheckCircle2 size={16} /> },
  }

  const overall = 94.2
  const totalIssues = departmentCompliance.reduce((s, d) => s + d.issues, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Compliance Monitoring</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>Real-time compliance health across all contracts and departments</p>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setShowFilterPanel(p => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
            style={{ borderColor: showFilterPanel ? t.primary : t.border, color: showFilterPanel ? t.primary : t.fgSecondary, background: t.surface }}>
            <Filter size={14} />Filter
          </button>
          {showFilterPanel && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl border shadow-xl z-20 p-4 space-y-3" style={{ background: t.surface, borderColor: t.border }}>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Severity</label>
                <div className="space-y-1">
                  {['all', 'critical', 'high', 'medium', 'low'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterSeverity(s)}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
                      style={{ background: filterSeverity === s ? t.primaryBg : 'transparent', color: filterSeverity === s ? t.primary : t.fgSecondary }}>
                      {s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowFilterPanel(false)} className="w-full py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Apply</button>
            </div>
          )}
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
            <Download size={14} />Export Report
          </button>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 rounded-2xl border p-6 flex flex-col items-center justify-center" style={{ borderColor: t.border, background: t.surface }}>
          <div className="relative w-28 h-28 mb-3">
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke={t.borderLight} strokeWidth="10" />
              <circle
                cx="56" cy="56" r="48"
                fill="none"
                stroke={t.primary}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - overall / 100)}`}
                transform="rotate(-90 56 56)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: t.fg }}>{overall}%</span>
              <span className="text-xs" style={{ color: t.muted }}>Overall</span>
            </div>
          </div>
          <div className="text-sm font-semibold" style={{ color: t.fg }}>Compliance Score</div>
          <div className="flex items-center gap-1 text-xs mt-1" style={{ color: t.success }}>
            <TrendingUp size={12} />+2.1% vs last month
          </div>
        </div>

        {[
          { label: 'Open Issues', value: totalIssues, sub: 'Across all depts', color: t.danger, bg: t.dangerBg, trend: '-3 this week' },
          { label: 'At Risk Contracts', value: 12, sub: 'Need remediation', color: t.warning, bg: t.warningBg, trend: '-2 resolved' },
          { label: 'Passed Reviews', value: 187, sub: 'This quarter', color: t.primary, bg: t.primaryBg, trend: '+27 this month' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <div className="p-2.5 rounded-xl w-fit mb-4" style={{ background: card.bg }}>
              <Shield size={20} style={{ color: card.color }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: t.fg }}>{card.value}</div>
            <div className="text-sm font-medium mb-1" style={{ color: t.fgSecondary }}>{card.label}</div>
            <div className="text-xs" style={{ color: t.mutedLight }}>{card.sub}</div>
            <div className="text-xs mt-2 font-medium" style={{ color: t.success }}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Department Compliance Rate</h3>
              <p className="text-sm" style={{ color: t.muted }}>Click a department for details</p>
            </div>
            <button className="p-2 rounded-lg" style={{ color: t.mutedLight }}><MoreHorizontal size={16} /></button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={departmentCompliance} barSize={28} onClick={data => setSelectedDept(data?.activeLabel != null ? String(data.activeLabel) : null)}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: t.mutedLight }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: t.mutedLight }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Compliance Rate']} />
              <Bar dataKey="compliance" radius={[6, 6, 0, 0]}>
                {departmentCompliance.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={selectedDept === entry.dept ? t.primary : entry.compliance >= 90 ? t.primaryLight : entry.compliance >= 85 ? t.warning : t.danger}
                    opacity={selectedDept && selectedDept !== entry.dept ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[[`≥90% — Compliant`, t.primaryLight], [`85–89% — Monitor`, t.warning], [`<85% — At Risk`, t.danger]].map(([label, color]) => (
              <div key={label as string} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color as string }} />
                <span className="text-xs" style={{ color: t.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-1" style={{ color: t.fg }}>Compliance by Category</h3>
          <p className="text-sm mb-4" style={{ color: t.muted }}>Portfolio coverage</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={t.borderLight} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: t.muted }} />
              <Radar name="Score" dataKey="score" stroke={t.primary} fill={t.primary} fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {radarData.map(item => (
              <div key={item.subject} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: t.muted }}>{item.subject}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: t.borderLight }}>
                    <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: item.score >= 90 ? t.primary : item.score >= 80 ? t.warning : t.danger }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: t.fg, minWidth: 28 }}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend + Risk Matrix */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-1" style={{ color: t.fg }}>Compliance Trend (7-month)</h3>
          <p className="text-sm mb-5" style={{ color: t.muted }}>Rate and open issues</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.primary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.mutedLight }} axisLine={false} tickLine={false} />
              <YAxis domain={[84, 96]} tick={{ fontSize: 11, fill: t.mutedLight }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip />
              <Area type="monotone" dataKey="rate" stroke={t.primary} strokeWidth={2.5} fill="url(#trendGrad)" name="Compliance %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold mb-1" style={{ color: t.fg }}>Risk Matrix</h3>
          <p className="text-sm mb-4" style={{ color: t.muted }}>Likelihood vs. Impact</p>
          <div className="relative">
            <div className="grid grid-cols-5 gap-1">
              {[...Array(25)].map((_, i) => {
                const row = Math.floor(i / 5)
                const col = i % 5
                const risk = row + col
                const deptInCell = riskMatrix.find(d => d.likelihood - 1 === 4 - row && d.impact - 1 === col)
                return (
                  <div
                    key={i}
                    className="h-12 rounded-lg flex items-center justify-center"
                    style={{
                      background: risk >= 7 ? t.danger + '26' : risk >= 5 ? t.warning + '26' : risk >= 3 ? t.info + '1a' : t.success + '1a',
                    }}
                  >
                    {deptInCell && (
                      <span className="text-xs font-bold" style={{ color: risk >= 7 ? t.danger : risk >= 5 ? t.warning : risk >= 3 ? t.info : t.success, fontSize: '9px' }}>
                        {deptInCell.dept}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              {['Low', '', 'Medium', '', 'High'].map((l, i) => (
                <div key={i} className="text-xs text-center" style={{ color: t.mutedLight, fontSize: '9px' }}>{l}</div>
              ))}
            </div>
            <div className="text-xs text-center mt-1" style={{ color: t.mutedLight }}>← Impact →</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold" style={{ color: t.fg }}>Compliance Alerts</h3>
            <p className="text-sm" style={{ color: t.muted }}>{alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} require immediate action</p>
          </div>
          <button onClick={() => navigate('notifications')} className="text-sm font-medium flex items-center gap-1" style={{ color: t.primary }}>
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity).map(alert => {
            const cfg = alertColors[alert.severity] || { bg: t.bg, text: t.muted, border: t.border, icon: null }
            return (
              <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl border" style={{ borderColor: cfg.border, background: cfg.bg }}>
                <div style={{ color: cfg.text, flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: t.fg }}>{alert.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.text + '20', color: cfg.text }}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: t.muted }}>
                      {alert.dept}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: t.muted }}>{alert.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs" style={{ color: t.mutedLight }}>{alert.date}</div>
                  <button className="mt-1 text-xs font-medium" style={{ color: t.primary }}>Resolve →</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showExportModal && (
        <ExportModal title="Compliance Report" onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
