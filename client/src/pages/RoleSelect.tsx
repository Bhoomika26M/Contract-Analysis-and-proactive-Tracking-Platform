import type { Role } from '../types'
import { Shield, Users, FileText, BarChart2, Building2, UserCheck, Zap, ArrowRight } from 'lucide-react'

interface RoleSelectProps {
  onSelect: (role: Role) => void
}

const roles: { id: Role; label: string; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    id: 'administrator',
    label: 'Administrator',
    desc: 'Full platform access — user management, settings, all modules',
    icon: <Shield size={28} />,
    color: '#2D6A4F',
    bg: '#E8F5EE',
  },
  {
    id: 'legal-manager',
    label: 'Legal Manager',
    desc: 'Contracts, obligations, renewals, compliance and reports',
    icon: <FileText size={28} />,
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'compliance-officer',
    label: 'Compliance Officer',
    desc: 'Compliance monitoring, obligations, audit logs, reports',
    icon: <BarChart2 size={28} />,
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 'contract-manager',
    label: 'Contract Manager',
    desc: 'Contract repository, upload, renewals, obligation tracking',
    icon: <UserCheck size={28} />,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 'department-head',
    label: 'Department Head',
    desc: 'Dashboard overview, contracts, renewals, compliance, reports',
    icon: <Building2 size={28} />,
    color: '#C65D3B',
    bg: '#FAE8E2',
  },
  {
    id: 'employee',
    label: 'Employee',
    desc: 'View contracts and notifications relevant to your team',
    icon: <Users size={28} />,
    color: '#6B7280',
    bg: '#F3F4F6',
  },
]

export function RoleSelect({ onSelect }: RoleSelectProps) {
  return (
    <div className="min-h-screen flex" style={{ background: '#FAFAF7' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 w-5/12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A1A1A 0%, #2C2C2C 40%, #1A3D2B 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: 120 + i * 60,
              height: 120 + i * 60,
              border: '1px solid rgba(82,183,136,0.06)',
              top: '45%', left: '45%',
              transform: 'translate(-50%, -50%)',
            }} />
          ))}
        </div>

        <div className="relative flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
          >
            <Zap size={22} color="white" />
          </div>
          <span className="text-white font-bold text-xl">ContractIQ</span>
        </div>

        <div className="relative">
          <div className="text-5xl font-bold text-white leading-tight mb-5">
            Who are<br />you today?
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontSize: '17px' }}>
            Select your role to access the right tools and workflows. Your view is tailored to what matters most to you.
          </p>

          <div className="mt-10 space-y-3">
            {['Role-based dashboards', 'Contextual navigation', 'Personalized insights'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#2D6A4F' }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          {['SOC 2', 'ISO 27001', 'GDPR'].map(badge => (
            <div key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#52B788' }}>●</span>
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: '#2D6A4F' }}>
              <Zap size={18} color="white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>ContractIQ</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Select your role</h1>
            <p style={{ color: '#6B7280' }}>Choose the role that best describes your responsibilities</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => onSelect(role.id)}
                className="flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all group"
                style={{ borderColor: '#E5E7EB', background: '#fff' }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = role.color
                  el.style.background = role.bg
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = '#E5E7EB'
                  el.style.background = '#fff'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl mb-4"
                  style={{ width: 52, height: 52, background: role.bg, color: role.color }}
                >
                  {role.icon}
                </div>
                <div className="text-sm font-bold mb-1.5" style={{ color: '#1A1A1A' }}>{role.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{role.desc}</div>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: role.color }}>
                  Select role <ArrowRight size={12} />
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#9CA3AF' }}>
            Your role determines which features and data are visible. You can change it later in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
