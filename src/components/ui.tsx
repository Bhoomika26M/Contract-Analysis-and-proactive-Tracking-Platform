import type { ReactNode } from 'react'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/** Centered spinner used while a screen loads its first payload. */
export function LoadingState({ label = 'Loading data…' }: { label?: string }) {
  const { theme: t } = useTheme()
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={22} style={{ color: t.primary }} className="animate-spin" />
      <span className="text-sm" style={{ color: t.muted }}>{label}</span>
    </div>
  )
}

/**
 * Shown whenever the API has no rows to render. Never substitutes sample data.
 */
export function EmptyState({
  title = 'No data available',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  const { theme: t } = useTheme()
  return (
    <div
      className="rounded-2xl border flex flex-col items-center justify-center text-center px-6 py-14"
      style={{ borderColor: t.border, background: t.surface }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: t.bg }}>
        <Inbox size={24} style={{ color: t.mutedLight }} />
      </div>
      <div className="text-base font-semibold mb-1" style={{ color: t.fg }}>{title}</div>
      {description && (
        <p className="text-sm max-w-md" style={{ color: t.muted }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Inline banner for request failures. */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { theme: t } = useTheme()
  return (
    <div
      className="rounded-2xl border p-4 flex items-start gap-3"
      style={{ borderColor: `${t.danger}40`, background: t.dangerBg }}
    >
      <AlertCircle size={18} style={{ color: t.danger, flexShrink: 0 }} />
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: t.danger }}>Something went wrong</div>
        <div className="text-sm mt-0.5" style={{ color: t.fgSecondary }}>{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-xl border text-xs font-medium flex-shrink-0"
          style={{ borderColor: `${t.danger}55`, color: t.danger }}
        >
          Retry
        </button>
      )}
    </div>
  )
}

/** Small transient confirmation strip, used after a successful write. */
export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  const { theme: t } = useTheme()
  return (
    <div
      className="rounded-2xl border p-3.5 flex items-center gap-3"
      style={{ borderColor: `${t.success}40`, background: t.successBg }}
    >
      <span className="text-sm flex-1" style={{ color: t.successText }}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xs font-medium" style={{ color: t.successText }}>
          Dismiss
        </button>
      )}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

/** Title + supporting line + right-aligned actions, as used across the app. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { theme: t } = useTheme()
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: t.fg }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: t.muted }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: ReactNode
  color: string
  bg: string
}

export function StatCard({ label, value, color, bg }: StatCardProps) {
  const { theme: t } = useTheme()
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: t.border, background: bg }}>
      <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
      <div className="text-sm" style={{ color: t.muted }}>{label}</div>
    </div>
  )
}

/**
 * Wraps table content so empty rows can be replaced by an EmptyState.
 * Renders a real <table> because <thead>/<tbody> are only valid table children.
 */
export function TableFrame({ children }: { children: ReactNode }) {
  const { theme: t } = useTheme()
  return (
    <table
      className="w-full rounded-2xl border overflow-hidden"
      style={{ borderColor: t.border, background: t.surface }}
    >
      {children}
    </table>
  )
}

export function TableHead({ columns }: { columns: string[] }) {
  const { theme: t } = useTheme()
  return (
    <thead>
      <tr style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
        {columns.map(c => (
          <th key={c} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export const inputStyle = (t: ReturnType<typeof useTheme>['theme']) => ({
  borderColor: t.border,
  color: t.fg,
  background: t.bg,
})

export const inputClass =
  'w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-current'

export const labelClass = 'block text-sm font-medium mb-1.5'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const { theme: t } = useTheme()
  return (
    <label className="block">
      <span className={labelClass} style={{ color: t.fgSecondary }}>{label}</span>
      {children}
    </label>
  )
}