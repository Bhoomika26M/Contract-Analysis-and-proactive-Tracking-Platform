import { useState } from 'react'
import type { PageProps, Role } from '../types'
import { useTheme } from '../context/ThemeContext'
import { ExportModal } from '../components/ExportModal'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, FileText, RefreshCw, CheckSquare, Shield,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Plus, Download,
  ChevronRight, Users, BarChart2, Bell, BookOpen, Eye,
} from 'lucide-react'

interface DashboardProps extends PageProps {
  role: Role
}

export function Dashboard({ navigate, role }: DashboardProps) {
  const { theme: t } = useTheme()
  const monthlyData: any[] = []
  const complianceTrend: any[] = []
  const departmentData: any[] = []
  const riskData: any[] = []
  const recentActivities: any[] = []
  const upcomingDeadlines: any[] = []
  const approvalQueue: any[] = []
  const highRiskContracts: any[] = []
  const myObligations: any[] = []
  const roleNames: any = {}
  const filterData: any = { all: { kpis: { users:'0', contracts:'0', pending:'0', compliance:'0%', userChange:'', contractChange:'', pendingChange:'', complianceChange:'', userUp:true, contractUp:true, pendingUp:true, complianceUp:true, userSub:'', contractSub:'', pendingSub:'', complianceSub:'' }, chartData: monthlyData, complianceTrendData: complianceTrend, deptData: departmentData, riskData, activities: recentActivities, deadlines: upcomingDeadlines, pieValues: [0,0,0,0] } }
  const [filter, setFilter] = useState('all')
  const [exportOpen, setExportOpen] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const fd = filterData[filter] || filterData.all

  const pieData = [
    { name: 'Active', value: fd.pieValues[0], color: t.success },
    { name: 'Expiring Soon', value: fd.pieValues[1], color: t.warning },
    { name: 'Pending Review', value: fd.pieValues[2], color: t.info },
    { name: 'At Risk', value: fd.pieValues[3], color: t.danger },
  ]

  const priorityColors: Record<string, { bg: string; text: string }> = {
    critical: { bg: t.dangerBg, text: t.dangerText },
    high: { bg: t.warningBg, text: t.warningText },
    medium: { bg: t.infoBg, text: t.infoText },
    low: { bg: t.successBg, text: t.successText },
  }

  const gridColor = t.isDark ? '#2D2D2D' : '#F1F5F9'
  const tickColor = t.mutedLight
  const tooltipBg = t.surface
  const tooltipBorder = t.border

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="p-3 rounded-xl border shadow-lg" style={{ background: tooltipBg, borderColor: tooltipBorder, minWidth: 140 }}>
        <div className="text-xs font-semibold mb-2" style={{ color: t.muted }}>{label}</div>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
            <span style={{ color: entry.color }}>● {entry.name}</span>
            <span className="font-semibold" style={{ color: t.fg }}>{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const Card = ({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <div className={`rounded-2xl border p-6 ${className}`} style={{ background: t.surface, borderColor: t.border, boxShadow: t.cardShadow, ...style }}>
      {children}
    </div>
  )

  const KpiCard = ({ label, value, change, up, icon, color, bg, sub }: any) => (
    <div
      className="rounded-2xl p-4 border transition-all cursor-pointer"
      style={{ background: t.surface, borderColor: t.border, boxShadow: t.cardShadow }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadowHover; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadow; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: bg, color }}>{icon}</div>
        <div className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: up ? t.successText : t.dangerText }}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: t.fg }}>{value}</div>
      <div className="text-xs font-medium mb-0.5" style={{ color: t.fgSecondary }}>{label}</div>
      <div className="text-xs" style={{ color: t.mutedLight }}>{sub}</div>
    </div>
  )

  const SectionHeader = ({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) => (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-base font-semibold" style={{ color: t.fg }}>{title}</h3>
      {action && (
        <button onClick={onClick} className="text-sm font-medium flex items-center gap-1" style={{ color: t.primary }}>
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )

  // ── ADMINISTRATOR ──
  if (role === 'administrator') {
    return (
      <div className="p-6 space-y-6 max-w-[1600px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Good morning, {roleNames[role]} 👋</h1>
            <p className="text-sm" style={{ color: t.muted }}>{today}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
              style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surface)}
            >
              <Download size={15} /> Export Report
            </button>
            <button onClick={() => navigate('upload-contract')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
              <Plus size={15} /> New Contract
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {['all', '30d', '90d', 'ytd'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: filter === f ? t.primary : t.surface, color: filter === f ? '#fff' : t.muted, border: `1px solid ${filter === f ? t.primary : t.border}` }}>
              {{ all: 'All Time', '30d': 'Last 30 Days', '90d': 'Last 90 Days', ytd: 'Year to Date' }[f]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Users" value={fd.kpis.users} change={fd.kpis.userChange} up={fd.kpis.userUp} icon={<Users size={20} />} color={t.info} bg={t.infoBg} sub={fd.kpis.userSub} />
          <KpiCard label="Active Contracts" value={fd.kpis.contracts} change={fd.kpis.contractChange} up={fd.kpis.contractUp} icon={<FileText size={20} />} color={t.primary} bg={t.primaryBg} sub={fd.kpis.contractSub} />
          <KpiCard label="Pending Approvals" value={fd.kpis.pending} change={fd.kpis.pendingChange} up={fd.kpis.pendingUp} icon={<Clock size={20} />} color={t.warning} bg={t.warningBg} sub={fd.kpis.pendingSub} />
          <KpiCard label="Compliance Rate" value={fd.kpis.compliance} change={fd.kpis.complianceChange} up={fd.kpis.complianceUp} icon={<Shield size={20} />} color={t.success} bg={t.successBg} sub={fd.kpis.complianceSub} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <SectionHeader title="Contract Activity" />
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={fd.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="renewals" stroke={t.primary} strokeWidth={2.5} dot={false} name="Renewals" />
                  <Line type="monotone" dataKey="new" stroke={t.info} strokeWidth={2.5} dot={false} name="New" />
                  <Line type="monotone" dataKey="expired" stroke={t.danger} strokeWidth={2} dot={false} strokeDasharray="4 2" name="Expired" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <Card>
            <SectionHeader title="Contract Status" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} contracts`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs" style={{ color: t.muted }}>{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: t.fg }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionHeader title="Department Compliance" action="View all" onClick={() => navigate('compliance')} />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fd.deptData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="compliance" name="Compliance %" radius={[6, 6, 0, 0]}>
                  {departmentData.map((entry, i) => (
                    <Cell key={i} fill={entry.compliance >= 90 ? t.primary : entry.compliance >= 85 ? t.warning : t.danger} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionHeader title="Audit Summary" action="View logs" onClick={() => navigate('audit-logs')} />
            <div className="space-y-3">
              {([] as any[]).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.bg }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.type === 'security' ? t.dangerBg : item.type === 'admin' ? t.purpleBg : t.infoBg }}>
                    <BookOpen size={14} style={{ color: item.type === 'security' ? t.danger : item.type === 'admin' ? t.purple : t.info }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: t.fg }}>{item.action}</p>
                    <p className="text-xs" style={{ color: t.muted }}>{item.user} · {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionHeader title="Recent Activity" action="View logs" onClick={() => navigate('audit-logs')} />
            <div className="space-y-4">
              {fd.activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${activity.color}18`, color: activity.color }}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: t.fg }}>
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                      <span className="font-medium" style={{ color: t.primary }}>{activity.target}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: t.mutedLight }}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Upcoming Deadlines" action="All renewals" onClick={() => navigate('renewals')} />
            <div className="space-y-3">
              {fd.deadlines.map(item => {
                const priority = priorityColors[item.priority] || { bg: t.bg, text: t.muted }
                return (
                  <div key={item.contract} className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                    style={{ borderColor: t.border }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                    onClick={() => navigate('contract-details')}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                      style={{ background: item.daysLeft <= 7 ? t.dangerBg : t.warningBg }}>
                      <Clock size={18} style={{ color: item.daysLeft <= 7 ? t.dangerText : t.warningText }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: t.fg }}>{item.contract}</p>
                      <p className="text-xs" style={{ color: t.muted }}>{item.type} · {item.value}</p>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0" style={{ background: priority.bg, color: priority.text }}>
                      {item.daysLeft}d left
                    </div>
                    <ArrowUpRight size={14} style={{ color: t.mutedLight, flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {showExportModal && (
          <ExportModal title="Dashboard Report" onClose={() => setShowExportModal(false)} />
        )}
      </div>
    )
  }

  // ── LEGAL MANAGER ──
  if (role === 'legal-manager') {
    return (
      <div className="p-6 space-y-6 max-w-[1600px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Good morning, {roleNames[role]} 👋</h1>
            <p className="text-sm" style={{ color: t.muted }}>{today}</p>
          </div>
          <button onClick={() => navigate('contracts')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
            <Eye size={15} /> Review Contracts
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Under Review" value="23" change="+5" up={false} icon={<FileText size={20} />} color={t.info} bg={t.infoBg} sub="pending legal review" />
          <KpiCard label="Approval Queue" value="14" change="+3" up={false} icon={<Clock size={20} />} color={t.warning} bg={t.warningBg} sub="awaiting your sign-off" />
          <KpiCard label="Upcoming Renewals" value="18" change="+4" up icon={<RefreshCw size={20} />} color={t.primary} bg={t.primaryBg} sub="next 30 days" />
          <KpiCard label="Reviewed This Month" value="42" change="+12" up icon={<CheckCircle2 size={20} />} color={t.success} bg={t.successBg} sub="contracts reviewed" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <SectionHeader title="Approval Queue" action="View all" onClick={() => navigate('contracts')} />
              <div className="space-y-3">
                {approvalQueue.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer"
                    style={{ borderColor: t.border }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                    onClick={() => navigate('contract-details')}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.primaryBg }}>
                      <FileText size={18} style={{ color: t.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: t.fg }}>{item.contract}</p>
                      <p className="text-xs" style={{ color: t.muted }}>{item.requestedBy} · {item.dept} · {item.submitted}</p>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: t.fg }}>{item.value}</div>
                    <div className="text-xs font-semibold px-2 py-1 rounded-full" style={{
                      background: item.urgency === 'high' ? t.dangerBg : item.urgency === 'medium' ? t.warningBg : t.successBg,
                      color: item.urgency === 'high' ? t.dangerText : item.urgency === 'medium' ? t.warningText : t.successText,
                    }}>{item.urgency}</div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: t.success }}
                        onClick={e => e.stopPropagation()}>Approve</button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: t.border, color: t.muted }}
                        onClick={e => e.stopPropagation()}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <SectionHeader title="Legal Notices" />
              <div className="space-y-3">
                {[
                  { title: 'Force Majeure clause update required', priority: 'high', due: 'Jul 30' },
                  { title: 'GDPR addendum needed — EU contracts', priority: 'high', due: 'Aug 1' },
                  { title: 'Indemnification review — IT dept', priority: 'medium', due: 'Aug 5' },
                  { title: 'Termination clause standardization', priority: 'low', due: 'Aug 15' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{ background: t.bg }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = t.bg)}>
                    <AlertTriangle size={14} style={{ color: n.priority === 'high' ? t.danger : n.priority === 'medium' ? t.warning : t.info, flexShrink: 0, marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: t.fg }}>{n.title}</p>
                      <p className="text-xs" style={{ color: t.muted }}>Due {n.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Upcoming Renewals" action="Calendar" onClick={() => navigate('renewals-calendar')} />
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 3).map(item => (
                  <div key={item.contract} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('renewal-details')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.daysLeft <= 7 ? t.dangerBg : t.warningBg }}>
                      <RefreshCw size={13} style={{ color: item.daysLeft <= 7 ? t.dangerText : t.warningText }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: t.fg }}>{item.contract}</p>
                      <p className="text-xs" style={{ color: t.muted }}>{item.daysLeft} days · {item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <SectionHeader title="Recent Reviews" action="View all" onClick={() => navigate('contracts')} />
          <div className="space-y-3">
            {recentActivities.map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}18`, color: a.color }}>{a.icon}</div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: t.fg }}><span className="font-medium">{a.user}</span> {a.action} <span style={{ color: t.primary }}>{a.target}</span></p>
                  <p className="text-xs" style={{ color: t.mutedLight }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // ── COMPLIANCE OFFICER ──
  if (role === 'compliance-officer') {
    const complianceScore = 94.2
    return (
      <div className="p-6 space-y-6 max-w-[1600px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Good morning, {roleNames[role]} 👋</h1>
            <p className="text-sm" style={{ color: t.muted }}>{today}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('compliance')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
              <BarChart2 size={15} /> Compliance Reports
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 border col-span-2 lg:col-span-1" style={{ background: t.surface, borderColor: t.border }}>
            <p className="text-xs font-medium mb-2" style={{ color: t.muted }}>Compliance Score</p>
            <div className="text-4xl font-bold mb-1" style={{ color: complianceScore >= 90 ? t.success : t.warning }}>{complianceScore}%</div>
            <div className="w-full h-2 rounded-full mt-2" style={{ background: t.bg }}>
              <div className="h-full rounded-full" style={{ width: `${complianceScore}%`, background: t.primary }} />
            </div>
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: t.successText }}><TrendingUp size={11} /> +2.1% this month</p>
          </div>
          <KpiCard label="High Risk Contracts" value="12" change="-3" up={false} icon={<AlertTriangle size={20} />} color={t.danger} bg={t.dangerBg} sub="need attention" />
          <KpiCard label="Missed Obligations" value="7" change="+2" up={false} icon={<CheckSquare size={20} />} color={t.warning} bg={t.warningBg} sub="overdue tasks" />
          <KpiCard label="Audit Alerts" value="4" change="-1" up={false} icon={<Bell size={20} />} color={t.info} bg={t.infoBg} sub="require review" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionHeader title="High Risk Contracts" action="View all" onClick={() => navigate('compliance')} />
            <div className="space-y-3">
              {highRiskContracts.map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: t.bg }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = t.bg)}
                  onClick={() => navigate('contract-details')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: t.fg }}>{c.name}</p>
                    <p className="text-xs" style={{ color: t.muted }}>{c.category} · {c.issue}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color: c.risk >= 85 ? t.danger : t.warning }}>{c.risk}%</div>
                    <div className="text-xs" style={{ color: t.muted }}>{c.value}</div>
                  </div>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                    <div className="h-full rounded-full" style={{ width: `${c.risk}%`, background: c.risk >= 85 ? t.danger : t.warning }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Risk Heat Map" action="Full view" onClick={() => navigate('compliance')} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={riskData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="high" name="High Risk" fill={t.danger} radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="medium" name="Medium Risk" fill={t.warning} radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="low" name="Low Risk" fill={t.success} radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionHeader title="Compliance Trend" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={complianceTrend}>
                <defs>
                  <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.primary} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis domain={[85, 97]} tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" stroke={t.primary} strokeWidth={2.5} fill="url(#complianceGrad)" name="Compliance %" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionHeader title="Compliance Reports" action="View all" onClick={() => navigate('reports')} />
            <div className="space-y-3">
              {[
                { title: 'Q2 2025 Compliance Summary', date: 'Jul 1, 2025', status: 'published', score: 94 },
                { title: 'High Risk Contract Analysis', date: 'Jun 28, 2025', status: 'draft', score: null },
                { title: 'GDPR Compliance Audit', date: 'Jun 15, 2025', status: 'published', score: 97 },
                { title: 'SOC 2 Readiness Report', date: 'Jun 10, 2025', status: 'review', score: 89 },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: t.bg }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = t.bg)}
                  onClick={() => navigate('reports')}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.infoBg }}>
                    <BarChart2 size={16} style={{ color: t.info }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: t.fg }}>{r.title}</p>
                    <p className="text-xs" style={{ color: t.muted }}>{r.date}</p>
                  </div>
                  {r.score && <span className="text-sm font-bold" style={{ color: r.score >= 90 ? t.success : t.warning }}>{r.score}%</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    background: r.status === 'published' ? t.successBg : r.status === 'review' ? t.warningBg : t.bg,
                    color: r.status === 'published' ? t.successText : r.status === 'review' ? t.warningText : t.muted,
                  }}>{r.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ── CONTRACT MANAGER ──
  if (role === 'contract-manager') {
    return (
      <div className="p-6 space-y-6 max-w-[1600px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Good morning, {roleNames[role]} 👋</h1>
            <p className="text-sm" style={{ color: t.muted }}>{today}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('upload-contract')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
              <Plus size={15} /> Upload Contract
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="My Contracts" value="45" change="+3" up icon={<FileText size={20} />} color={t.primary} bg={t.primaryBg} sub="assigned to me" />
          <KpiCard label="Pending Uploads" value="6" change="+2" up={false} icon={<Plus size={20} />} color={t.warning} bg={t.warningBg} sub="awaiting upload" />
          <KpiCard label="Renewal Timeline" value="8" change="+1" up={false} icon={<RefreshCw size={20} />} color={t.danger} bg={t.dangerBg} sub="expiring in 30d" />
          <KpiCard label="Completed" value="189" change="+27" up icon={<CheckCircle2 size={20} />} color={t.success} bg={t.successBg} sub="this quarter" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <SectionHeader title="Contract Repository" action="View all" onClick={() => navigate('contracts')} />
              <div className="space-y-2">
                {([] as any[]).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    style={{ borderColor: t.border }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                    onClick={() => navigate('contract-details')}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.primaryBg }}>
                      <FileText size={16} style={{ color: t.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: t.fg }}>{c.title}</p>
                      <p className="text-xs" style={{ color: t.muted }}>Expires {c.expiry} · {c.value}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: t.border }}>
                        <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: c.status === 'expiring' ? t.warning : t.primary }} />
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        background: c.status === 'expiring' ? t.warningBg : t.successBg,
                        color: c.status === 'expiring' ? t.warningText : t.successText,
                      }}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <SectionHeader title="Renewal Timeline" action="View calendar" onClick={() => navigate('renewals-calendar')} />
              <div className="space-y-3">
                {upcomingDeadlines.map(item => (
                  <div key={item.contract} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('renewal-details')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.daysLeft <= 7 ? t.dangerBg : item.daysLeft <= 14 ? t.warningBg : t.successBg }}>
                      <Clock size={13} style={{ color: item.daysLeft <= 7 ? t.dangerText : item.daysLeft <= 14 ? t.warningText : t.successText }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: t.fg }}>{item.contract}</p>
                      <p className="text-xs" style={{ color: t.muted }}>{item.daysLeft}d remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Recent Uploads" />
              <div className="space-y-3">
                {recentActivities.filter(a => a.action === 'uploaded').map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}18`, color: a.color }}>{a.icon}</div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: t.fg }}>{a.target}</p>
                      <p className="text-xs" style={{ color: t.mutedLight }}>{a.user} · {a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ── DEPARTMENT HEAD ──
  if (role === 'department-head') {
    return (
      <div className="p-6 space-y-6 max-w-[1600px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Good morning, {roleNames[role]} 👋</h1>
            <p className="text-sm" style={{ color: t.muted }}>{today} — Technology Department</p>
          </div>
          <button onClick={() => navigate('reports')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
            <BarChart2 size={15} /> Department Reports
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Dept Contracts" value="68" change="+4" up icon={<FileText size={20} />} color={t.primary} bg={t.primaryBg} sub="Technology dept" />
          <KpiCard label="Team Compliance" value="91%" change="+1.2%" up icon={<Shield size={20} />} color={t.success} bg={t.successBg} sub="dept average" />
          <KpiCard label="Assigned Obligations" value="23" change="-5" up={false} icon={<CheckSquare size={20} />} color={t.warning} bg={t.warningBg} sub="team pending" />
          <KpiCard label="Upcoming Renewals" value="11" change="+2" up={false} icon={<RefreshCw size={20} />} color={t.info} bg={t.infoBg} sub="next 60 days" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionHeader title="Department Contracts" action="View all" onClick={() => navigate('contracts')} />
            <div className="space-y-3">
              {([] as any[]).map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                  style={{ borderColor: t.border }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                  onClick={() => navigate('contract-details')}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.primaryBg }}>
                    <FileText size={16} style={{ color: t.primary }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: t.fg }}>{c.title}</p>
                    <p className="text-xs" style={{ color: t.muted }}>{c.owner} · Expires {c.expiry}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                    background: c.status === 'expiring' ? t.warningBg : t.successBg,
                    color: c.status === 'expiring' ? t.warningText : t.successText,
                  }}>{c.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Team Compliance" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentData.slice(0, 4)} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="compliance" name="Compliance %" radius={[6, 6, 0, 0]}>
                  {departmentData.map((entry, i) => (
                    <Cell key={i} fill={entry.compliance >= 90 ? t.primary : t.warning} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <SectionHeader title="Assigned Obligations" action="View tracker" onClick={() => navigate('obligations')} />
            <div className="space-y-3">
              {myObligations.map((o, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                  style={{ borderColor: t.border }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}>
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{
                    background: o.status === 'overdue' ? t.danger : o.status === 'in-progress' ? t.primary : t.border
                  }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: t.fg }}>{o.title}</p>
                    <p className="text-xs" style={{ color: t.muted }}>{o.contract} · Due {o.due}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                    background: o.status === 'overdue' ? t.dangerBg : o.status === 'in-progress' ? t.primaryBg : t.warningBg,
                    color: o.status === 'overdue' ? t.dangerText : o.status === 'in-progress' ? t.primary : t.warningText,
                  }}>{o.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Upcoming Renewals" action="Calendar" onClick={() => navigate('renewals-calendar')} />
            <div className="space-y-3">
              {upcomingDeadlines.map(item => {
                const priority = priorityColors[item.priority] || { bg: t.bg, text: t.muted }
                return (
                  <div key={item.contract} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    style={{ borderColor: t.border }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                    onClick={() => navigate('renewal-details')}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.daysLeft <= 7 ? t.dangerBg : t.warningBg }}>
                      <Clock size={18} style={{ color: item.daysLeft <= 7 ? t.dangerText : t.warningText }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: t.fg }}>{item.contract}</p>
                      <p className="text-xs" style={{ color: t.muted }}>{item.type} · {item.value}</p>
                    </div>
                    <div className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: priority.bg, color: priority.text }}>
                      {item.daysLeft}d
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ── EMPLOYEE ──
  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Good morning, {roleNames[role]} 👋</h1>
          <p className="text-sm" style={{ color: t.muted }}>{today}</p>
        </div>
        <button onClick={() => navigate('notifications')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
          <Bell size={15} /> Notifications
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Assigned Contracts" value="5" change="+1" up icon={<FileText size={20} />} color={t.primary} bg={t.primaryBg} sub="assigned to me" />
        <KpiCard label="My Obligations" value="8" change="-2" up={false} icon={<CheckSquare size={20} />} color={t.warning} bg={t.warningBg} sub="pending tasks" />
        <KpiCard label="Upcoming Renewals" value="2" change="0" up icon={<RefreshCw size={20} />} color={t.info} bg={t.infoBg} sub="this quarter" />
        <KpiCard label="Notifications" value="7" change="+3" up={false} icon={<Bell size={20} />} color={t.danger} bg={t.dangerBg} sub="unread" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionHeader title="Assigned Contracts" action="View all" onClick={() => navigate('contracts')} />
          <div className="space-y-3">
            {[
              { title: 'AWS Infrastructure Services', status: 'active', expiry: 'Jun 30, 2026', role: 'Reviewer' },
              { title: 'Slack Business Plan', status: 'expiring', expiry: 'Jul 15, 2025', role: 'Owner' },
              { title: 'Zoom Enterprise License', status: 'active', expiry: 'Dec 31, 2025', role: 'Reviewer' },
              { title: 'Microsoft Azure Services', status: 'active', expiry: 'Jan 15, 2026', role: 'Stakeholder' },
              { title: 'Jira & Confluence Suite', status: 'active', expiry: 'Apr 30, 2026', role: 'Reviewer' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: t.border }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                onClick={() => navigate('contract-details')}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.primaryBg }}>
                  <FileText size={16} style={{ color: t.primary }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: t.fg }}>{c.title}</p>
                  <p className="text-xs" style={{ color: t.muted }}>Expires {c.expiry} · {c.role}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                  background: c.status === 'expiring' ? t.warningBg : t.successBg,
                  color: c.status === 'expiring' ? t.warningText : t.successText,
                }}>{c.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="My Obligations" action="View tracker" onClick={() => navigate('obligations')} />
          <div className="space-y-3">
            {myObligations.map((o, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: t.border }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceHover)}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}>
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{
                  background: o.status === 'overdue' ? t.danger : o.status === 'in-progress' ? t.primary : t.border
                }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: t.fg }}>{o.title}</p>
                  <p className="text-xs" style={{ color: t.muted }}>{o.contract} · Due {o.due}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                  background: o.status === 'overdue' ? t.dangerBg : o.status === 'in-progress' ? t.primaryBg : t.warningBg,
                  color: o.status === 'overdue' ? t.dangerText : o.status === 'in-progress' ? t.primary : t.warningText,
                }}>{o.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionHeader title="Renewal Status" action="View" onClick={() => navigate('renewals')} />
          <div className="space-y-3">
            {[
              { contract: 'Slack Business Plan', daysLeft: 12, status: 'expiring soon' },
              { contract: 'Zoom Enterprise License', daysLeft: 154, status: 'active' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: t.border }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: r.daysLeft <= 30 ? t.warningBg : t.successBg }}>
                  <RefreshCw size={20} style={{ color: r.daysLeft <= 30 ? t.warningText : t.successText }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: t.fg }}>{r.contract}</p>
                  <p className="text-xs" style={{ color: t.muted }}>{r.daysLeft} days remaining</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                  background: r.daysLeft <= 30 ? t.warningBg : t.successBg,
                  color: r.daysLeft <= 30 ? t.warningText : t.successText,
                }}>{r.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recent Activities" action="View all" onClick={() => navigate('notifications')} />
          <div className="space-y-4">
            {recentActivities.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}18`, color: a.color }}>{a.icon}</div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: t.fg }}><span className="font-medium">{a.user}</span> {a.action} <span style={{ color: t.primary }}>{a.target}</span></p>
                  <p className="text-xs" style={{ color: t.mutedLight }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

