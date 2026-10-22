import { useState, useEffect } from 'react'
import { auditApi } from '../api'
import type { PageProps } from '../types'
import { Search, Download, Shield, FileText, Settings, Eye, CheckCircle2, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { ExportModal } from '../components/ExportModal'

const TOTAL_RECORDS = 0
const PAGE_SIZE = 20

export function AuditLogs({ navigate }: PageProps) {
  const { theme: t } = useTheme()
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')
  const [page, setPage] = useState(1)
  const [showExportModal, setShowExportModal] = useState(false)
  useEffect(() => {
    auditApi.list().then((data: any) => {
      const normalized = (data || []).map((l: any) => ({
        ...l,
        action: l.action || '',
        user: l.user || l.user_name || 'System',
        role: l.role || '',
        resource: l.resource || '',
        details: l.details || '',
        timestamp: l.timestamp || (l.created_at ? new Date(l.created_at).toLocaleString() : ''),
        ip: l.ip || l.ip_address || '',
        status: l.status || 'success',
        category: l.category || 'contract',
      }))
      setLogs(normalized)
    }).catch(() => setLogs([]))
  }, [])

  const actionConfig: Record<string, { color: string; bg: string; icon: any }> = {
    contract: { color: t.info, bg: t.infoBg, icon: <FileText size={14} /> },
    approval: { color: t.success, bg: t.successBg, icon: <CheckCircle2 size={14} /> },
    auth: { color: t.primary, bg: t.primaryBg, icon: <Shield size={14} /> },
    obligation: { color: t.purple, bg: t.purpleBg, icon: <CheckCircle2 size={14} /> },
    security: { color: t.warning, bg: t.warningBg, icon: <Shield size={14} /> },
    report: { color: t.muted, bg: t.bg, icon: <Eye size={14} /> },
    renewal: { color: t.primary, bg: t.primaryBg, icon: <Clock size={14} /> },
    settings: { color: t.mutedLight, bg: t.bg, icon: <Settings size={14} /> },
    compliance: { color: t.danger, bg: t.dangerBg, icon: <AlertTriangle size={14} /> },
  }

  const statusConfig = {
    success: { bg: t.successBg, text: t.success, label: 'Success' },
    warning: { bg: t.warningBg, text: t.warning, label: 'Warning' },
    error: { bg: t.dangerBg, text: t.danger, label: 'Error' },
  }

  const filtered = logs.filter(l =>
    (categoryFilter === 'all' || l.category === categoryFilter) &&
    ((l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()))
  )

  const totalPages = Math.ceil(TOTAL_RECORDS / PAGE_SIZE)
  const startRecord = (page - 1) * PAGE_SIZE + 1
  const endRecord = Math.min(page * PAGE_SIZE, TOTAL_RECORDS)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Audit Logs</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>Complete activity history · {logs.length} events shown</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>
            <Download size={14} />Export CSV
          </button>
          <div className="flex gap-1 p-1 rounded-xl border" style={{ borderColor: t.border, background: t.surface }}>
            {[['table', 'Table'], ['timeline', 'Timeline']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setViewMode(v as 'table' | 'timeline')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: viewMode === v ? t.borderLight : 'transparent', color: viewMode === v ? t.fg : t.mutedLight }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: '247', sub: 'Today', color: t.info, bg: t.infoBg },
          { label: 'User Actions', value: '189', sub: '14 users', color: t.primary, bg: t.primaryBg },
          { label: 'Security Events', value: '12', sub: '1 warning', color: t.warning, bg: t.warningBg },
          { label: 'System Events', value: '46', sub: 'Automated', color: t.muted, bg: t.bg },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm font-medium" style={{ color: t.fgSecondary }}>{s.label}</div>
            <div className="text-xs" style={{ color: t.mutedLight }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-sm" style={{ borderColor: t.border, background: t.surface }}>
          <Search size={14} style={{ color: t.mutedLight }} />
          <input type="text" placeholder="Search events, users, resources..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none" style={{ color: t.fg }} />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {['all', 'contract', 'auth', 'security', 'compliance', 'approval', 'renewal'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: categoryFilter === cat ? t.primary : t.surface,
                color: categoryFilter === cat ? '#fff' : t.muted,
                borderColor: categoryFilter === cat ? t.primary : t.border,
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.border, background: t.surface }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
                {['EVENT', 'USER', 'RESOURCE', 'TIMESTAMP', 'IP ADDRESS', 'STATUS'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const cfg = actionConfig[log.category] ?? actionConfig.contract
                const status = statusConfig[log.status as keyof typeof statusConfig] ?? statusConfig.success
                return (
                  <tr
                    key={log.id}
                    className="transition-all cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: t.fg }}>{(log.action || '').replace(/_/g, ' ')}</div>
                          <div className="text-xs" style={{ color: t.mutedLight }}>{(log.details || '').substring(0, 45)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: t.primary, fontSize: '10px' }}>
                          {log.user === 'System' || log.user === 'Unknown' || !log.user ? '?' : String(log.user).split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm" style={{ color: t.fg }}>{log.user}</div>
                          <div className="text-xs" style={{ color: t.mutedLight }}>{log.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: t.fgSecondary }}>{log.resource}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm" style={{ color: t.fgSecondary }}>{(log.timestamp || '').split(' ').slice(0, 3).join(' ')}</div>
                      <div className="text-xs" style={{ color: t.mutedLight }}>{(log.timestamp || '').split(' ')[3] || ''}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono" style={{ color: t.muted, fontSize: '12px' }}>{log.ip}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: status.bg, color: status.text }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="space-y-1">
          {filtered.map((log, i) => {
            const cfg = actionConfig[log.category] ?? actionConfig.contract
            const status = statusConfig[log.status as keyof typeof statusConfig] ?? statusConfig.success
            return (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  {i < filtered.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: t.border, minHeight: 24 }} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="rounded-2xl border p-4" style={{ borderColor: t.border, background: t.surface }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: t.fg }}>{log.action.replace(/_/g, ' ')}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: status.bg, color: status.text }}>{status.label}</span>
                        </div>
                        <p className="text-sm" style={{ color: t.muted }}>{log.details}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs" style={{ color: t.mutedLight }}>
                            <strong style={{ color: t.fgSecondary }}>{log.user}</strong> ({log.role})
                          </span>
                          <span className="text-xs" style={{ color: t.mutedLight }}>Resource: <strong style={{ color: t.fgSecondary }}>{log.resource}</strong></span>
                          <span className="text-xs font-mono" style={{ color: t.mutedLight }}>{log.ip}</span>
                        </div>
                      </div>
                      <div className="text-xs text-right flex-shrink-0" style={{ color: t.mutedLight }}>
                        {log.timestamp.split(' ').slice(0, 3).join(' ')}<br />
                        {log.timestamp.split(' ')[3]}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: t.border }}>
        <span className="text-sm" style={{ color: t.muted }}>
          {startRecord}–{endRecord} of {TOTAL_RECORDS} results
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all"
            style={{ borderColor: t.border, color: page === 1 ? t.mutedLight : t.fgSecondary, background: t.surface, opacity: page === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={14} />Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                  style={{ background: p === page ? t.primary : 'transparent', color: p === page ? '#fff' : t.muted }}
                >
                  {p}
                </button>
              )
            })}
            {totalPages > 5 && <span className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: t.mutedLight }}>…</span>}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all"
            style={{ borderColor: t.border, color: page === totalPages ? t.mutedLight : t.fgSecondary, background: t.surface, opacity: page === totalPages ? 0.5 : 1 }}
          >
            Next<ChevronRight size={14} />
          </button>
        </div>
      </div>

      {showExportModal && (
        <ExportModal title="Audit Log Export" onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
