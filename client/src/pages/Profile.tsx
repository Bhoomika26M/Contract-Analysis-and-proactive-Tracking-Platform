import { useState } from 'react'
import type { PageProps, User } from '../types'
import { Camera, Edit2, Save, Shield, Bell, Download, LogOut, CheckCircle2, TrendingUp } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface ProfileProps extends PageProps {
  user: User
}

const activityHistory: any[] = []

export function Profile({ navigate, user }: ProfileProps) {
  const { theme: t } = useTheme()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)
  const [bio, setBio] = useState('Contract management professional with 8+ years of experience in enterprise SaaS environments. Specializing in compliance, risk management, and contract lifecycle optimization.')

  const typeColors: Record<string, { bg: string; text: string }> = {
    approval: { bg: t.successBg, text: t.success },
    upload: { bg: t.infoBg, text: t.info },
    obligation: { bg: t.purpleBg, text: t.purple },
    renewal: { bg: t.primaryBg, text: t.primary },
    team: { bg: t.warningBg, text: t.warning },
  }

  const handleSave = () => {
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile header card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}
        >
          {/* Cover */}
          <div
            className="h-36 relative"
            style={{ background: t.gradientLeft }}
          >
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 70% 60%, ${t.primaryLight}26, transparent 50%)` }} />
          </div>

          <div className="px-8 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4"
                  style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.info})`, borderColor: t.surface }}
                >
                  {user.avatar}
                </div>
                <button
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ background: t.primary }}
                >
                  <Camera size={14} />
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
                      <Save size={14} />Save Changes
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: 'transparent' }}>
                    <Edit2 size={14} />Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="text-2xl font-bold w-full outline-none border-b pb-1 bg-transparent"
                      style={{ color: t.fg, borderColor: t.primary }}
                    />
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}
                    />
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                      style={{ borderColor: t.border, color: t.muted, background: t.surface }}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>{name}</h2>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium" style={{ color: t.primary }}>{role}</span>
                      <span className="text-sm" style={{ color: t.mutedLight }}>·</span>
                      <span className="text-sm" style={{ color: t.muted }}>{user.organization}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: t.muted }}>{bio}</p>
                    {saved && (
                      <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: t.success }}>
                        <CheckCircle2 size={14} />Profile saved successfully
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Email', value: user.email },
                  { label: 'Member since', value: 'January 15, 2023' },
                  { label: 'Time zone', value: 'Pacific Time (UTC-8)' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl" style={{ background: t.bg }}>
                    <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{item.label}</div>
                    <div className="text-sm font-medium" style={{ color: t.fg }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: '📋', label: 'Contracts Managed', value: '89', trend: '+12 this quarter' },
            { icon: '✅', label: 'Obligations Completed', value: '247', trend: '+34 this month' },
            { icon: '🔄', label: 'Renewals Initiated', value: '31', trend: '+5 this quarter' },
            { icon: '⭐', label: 'Compliance Score', value: '97%', trend: '+2% improvement' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: t.fg }}>{stat.value}</div>
              <div className="text-xs font-medium mb-1" style={{ color: t.fgSecondary }}>{stat.label}</div>
              <div className="flex items-center gap-1 text-xs" style={{ color: t.success }}>
                <TrendingUp size={11} />{stat.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Recent Activity</h3>
            <div className="space-y-3">
              {activityHistory.map((item, i) => {
                const cfg = typeColors[item.type]
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.text }} />
                    <div className="flex-1">
                      <div className="text-sm" style={{ color: t.fg }}>{item.action}</div>
                    </div>
                    <div className="text-xs flex-shrink-0" style={{ color: t.mutedLight }}>{item.time}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Account Settings</h3>
            <div className="space-y-2">
              {[
                { icon: <Shield size={16} />, label: 'Change Password', desc: 'Update your password', color: t.primary, bg: t.primaryBg, onClick: () => navigate('settings') },
                { icon: <Bell size={16} />, label: 'Notification Preferences', desc: 'Manage how you receive alerts', color: t.info, bg: t.infoBg, onClick: () => navigate('settings') },
                { icon: <Download size={16} />, label: 'Export My Data', desc: 'Download all your activity data', color: t.purple, bg: t.purpleBg, onClick: () => {} },
                { icon: <LogOut size={16} />, label: 'Sign Out', desc: 'Log out of this workspace', color: t.danger, bg: t.dangerBg, onClick: () => navigate('login') },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left"
                  style={{ borderColor: t.borderLight, background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.bg }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: action.bg, color: action.color }}>
                    {action.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: action.label === 'Sign Out' ? t.danger : t.fg }}>{action.label}</div>
                    <div className="text-xs" style={{ color: t.mutedLight }}>{action.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
