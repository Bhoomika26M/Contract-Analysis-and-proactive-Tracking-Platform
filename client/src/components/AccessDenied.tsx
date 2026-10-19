import type { PageProps, Role } from '../types'
import { useTheme } from '../context/ThemeContext'
import { ShieldOff, ArrowLeft } from 'lucide-react'

interface AccessDeniedProps extends PageProps {
  role: Role
}

const roleLabels: Record<Role, string> = {
  administrator: 'Administrator',
  'legal-manager': 'Legal Manager',
  'compliance-officer': 'Compliance Officer',
  'contract-manager': 'Contract Manager',
  'department-head': 'Department Head',
  employee: 'Employee',
}

export function AccessDenied({ navigate, role }: AccessDeniedProps) {
  const { theme: t } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: t.dangerBg }}
      >
        <ShieldOff size={36} style={{ color: t.danger }} />
      </div>

      <h2 className="text-2xl font-bold mb-2" style={{ color: t.fg }}>
        Access Denied
      </h2>
      <p className="text-base mb-1" style={{ color: t.fgSecondary }}>
        Insufficient permissions to view this page.
      </p>
      <p className="text-sm mb-8" style={{ color: t.muted }}>
        Your role — <span className="font-semibold" style={{ color: t.fg }}>{roleLabels[role]}</span> — does not have access to this section.
        Contact your administrator if you believe this is an error.
      </p>

      <button
        onClick={() => navigate('dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
        style={{ background: t.primary }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primaryHover)}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primary)}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>
    </div>
  )
}
