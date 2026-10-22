import { useState, useEffect } from 'react'
import type { PageProps } from '../types'
import { usersApi } from '../api'
import { Search, Plus, MoreHorizontal, Mail, CheckCircle2, Clock, UserX, Key, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const allPermissions = ['view', 'upload', 'edit', 'approve', 'export', 'compliance', 'manage_users', 'admin']

const permLabels: Record<string, string> = {
  view: 'View',
  upload: 'Upload',
  edit: 'Edit',
  approve: 'Approve',
  export: 'Export',
  compliance: 'Compliance',
  manage_users: 'Manage Users',
  admin: 'Admin',
}

export function Users({ navigate }: PageProps) {
  const { theme: t } = useTheme()
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  useEffect(() => { usersApi.list().then(setUsers).catch(()=>setUsers([])) }, [])
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdResetSent, setPwdResetSent] = useState(false)

  const roleColors: Record<string, { bg: string; text: string }> = {
    'Admin': { bg: t.purpleBg, text: t.purple },
    'CFO': { bg: t.dangerBg, text: t.danger },
    'Contract Manager': { bg: t.infoBg, text: t.info },
    'Legal Counsel': { bg: t.successBg, text: t.success },
    'Compliance Officer': { bg: t.warningBg, text: t.warning },
    'Contract Reviewer': { bg: t.bg, text: t.muted },
  }

  const statusConfig = {
    active: { bg: t.successBg, text: t.success, label: 'Active', icon: <CheckCircle2 size={11} /> },
    pending: { bg: t.warningBg, text: t.warning, label: 'Pending', icon: <Clock size={11} /> },
    inactive: { bg: t.bg, text: t.mutedLight, label: 'Inactive', icon: <UserX size={11} /> },
  }

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    ((u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.dept || '').toLowerCase().includes(search.toLowerCase()))
  )

  const avatarColors = [t.primary, t.info, t.purple, t.warning, t.danger, t.success]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>User Management</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            {users.filter(u => u.status === 'active').length} active · {users.filter(u => u.status === 'pending').length} pending · {users.length} total
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: t.primary }}
        >
          <Plus size={15} />Invite User
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: t.info, bg: t.infoBg },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: t.success, bg: t.successBg },
          { label: 'Pending Invite', value: users.filter(u => u.status === 'pending').length, color: t.warning, bg: t.warningBg },
          { label: 'Departments', value: [...new Set(users.map(u => u.dept))].length, color: t.primary, bg: t.primaryBg },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ borderColor: t.border, background: t.surface }}>
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm" style={{ color: t.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-sm" style={{ borderColor: t.border, background: t.surface }}>
          <Search size={14} style={{ color: t.mutedLight }} />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none" style={{ color: t.fg }} />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm outline-none"
          style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}
        >
          <option value="all">All Roles</option>
          {[...new Set(users.map(u => u.role))].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.border, background: t.surface }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
              {['USER', 'ROLE', 'DEPARTMENT', 'CONTRACTS', 'LAST LOGIN', 'STATUS', 'PERMISSIONS', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: t.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const role = roleColors[user.role] ?? { bg: t.borderLight, text: t.muted }
              const status = statusConfig[user.status as keyof typeof statusConfig] ?? statusConfig.active
              const avatarColor = avatarColors[i % avatarColors.length]

              return (
                <tr
                  key={user.id}
                  className="transition-all cursor-pointer"
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ background: avatarColor, fontSize: '12px' }}>
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: t.fg }}>{user.name}</div>
                        <div className="text-xs" style={{ color: t.mutedLight }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: role.bg, color: role.text }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: t.fgSecondary }}>{user.dept}</td>
                  <td className="px-5 py-4 text-sm font-semibold" style={{ color: t.fg }}>{user.contracts}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: t.muted }}>{user.lastLogin}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                      {status.icon}{status.label}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(user.permissions || []).slice(0, 3).map(p => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: t.borderLight, color: t.muted }}>{permLabels[p] ?? p}</span>
                      ))}
                      {(user.permissions || []).length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: t.borderLight, color: t.muted }}>+{user.permissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg" style={{ color: t.mutedLight }} onClick={e => e.stopPropagation()}>
                        <Mail size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg" style={{ color: t.mutedLight }} onClick={e => { e.stopPropagation(); setSelectedUser(user); setShowResetPwd(true) }}>
                        <Key size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg" style={{ color: t.mutedLight }} onClick={e => { e.stopPropagation(); setSelectedUser(user) }}>
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* User detail drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelectedUser(null)}>
          <div className="flex-1" />
          <div
            className="w-96 h-full overflow-y-auto p-6 space-y-5 animate-slideIn"
            style={{ background: t.surface, boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>User Details</h3>
              <button onClick={() => setSelectedUser(null)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>

            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3" style={{ background: t.primary }}>
                {selectedUser.avatar}
              </div>
              <div className="text-lg font-bold" style={{ color: t.fg }}>{selectedUser.name}</div>
              <div className="text-sm" style={{ color: t.muted }}>{selectedUser.email}</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: roleColors[selectedUser.role]?.bg ?? t.borderLight, color: roleColors[selectedUser.role]?.text ?? t.muted }}>
                  {selectedUser.role}
                </span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: t.borderLight, color: t.muted }}>{selectedUser.dept}</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Contracts Managed', value: selectedUser.contracts },
                { label: 'Last Login', value: selectedUser.lastLogin },
                { label: 'Account Status', value: selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: t.borderLight }}>
                  <span className="text-sm" style={{ color: t.muted }}>{item.label}</span>
                  <span className="text-sm font-medium" style={{ color: t.fg }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Permissions</div>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(perm => {
                  const hasIt = selectedUser.permissions.includes(perm)
                  return (
                    <div key={perm} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: hasIt ? t.primaryBg : t.bg }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: hasIt ? t.primary : t.border }}>
                        {hasIt && <CheckCircle2 size={10} color="white" />}
                      </div>
                      <span className="text-xs" style={{ color: hasIt ? t.fg : t.mutedLight }}>{permLabels[perm]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button className="w-full py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: 'transparent' }}>
                Edit Role & Permissions
              </button>
              <button onClick={() => setShowResetPwd(true)} className="w-full py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: 'transparent' }}>
                Reset Password
              </button>
              <button onClick={() => setShowDeactivate(true)} className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ background: t.dangerBg, color: t.danger }}>
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {showDeactivate && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDeactivate(false)}>
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Deactivate Account</h3>
              <button onClick={() => setShowDeactivate(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4" style={{ background: t.dangerBg }}>
              <UserX size={28} style={{ color: t.danger }} />
            </div>
            <p className="text-center text-sm mb-2" style={{ color: t.fg }}>Deactivate <strong>{selectedUser.name}</strong>?</p>
            <p className="text-center text-xs mb-6" style={{ color: t.muted }}>The user will lose access to ContractIQ immediately. This can be reversed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeactivate(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
              <button onClick={() => { setShowDeactivate(false); setSelectedUser(null) }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.danger }}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {showResetPwd && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowResetPwd(false)}>
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Reset Password</h3>
              <button onClick={() => setShowResetPwd(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            {!pwdResetSent ? (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: t.muted }}>Reset password for <strong style={{ color: t.fg }}>{selectedUser.name}</strong></p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPwdResetSent(true) }}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: t.border, color: t.fg }}>
                    Send Reset Email
                  </button>
                  <button
                    onClick={() => setShowNewPwd(p => !p)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: t.primary, color: t.primary }}>
                    Set New Password
                  </button>
                </div>
                {showNewPwd && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: t.fgSecondary }}>New Password</label>
                      <div className="relative">
                        <input type="password" placeholder="New password" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: t.fgSecondary }}>Confirm Password</label>
                      <input type="password" placeholder="Confirm password" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} />
                    </div>
                    <button onClick={() => { setPwdResetSent(true) }} className="w-full py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Set Password</button>
                  </div>
                )}
                <button onClick={() => setShowResetPwd(false)} className="w-full py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: t.successBg }}>
                  <CheckCircle2 size={24} style={{ color: t.success }} />
                </div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: t.fg }}>Password Reset Sent</h4>
                <p className="text-xs mb-4" style={{ color: t.muted }}>A reset link has been sent to {selectedUser.email}</p>
                <button onClick={() => { setShowResetPwd(false); setPwdResetSent(false); setShowNewPwd(false) }} className="px-6 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New User modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowInvite(false)}>
          <div className="rounded-2xl border p-6 w-full max-w-md" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Add New User</h3>
              <button onClick={() => setShowInvite(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Full Name', placeholder: 'Jane Smith', type: 'text' }, { label: 'Email Address', placeholder: 'jane@company.com', type: 'email' }].map(f => (
                  <div key={f.label} className="col-span-2 first:col-span-1 last:col-span-1">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }} onFocus={e => { e.currentTarget.style.borderColor = t.primary }} onBlur={e => { e.currentTarget.style.borderColor = t.border }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Department</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    {['Technology', 'Legal', 'Finance', 'Sales', 'Human Resources', 'Marketing', 'Operations'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Role</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                    <option>Contract Manager</option>
                    <option>Contract Reviewer</option>
                    <option>Legal Counsel</option>
                    <option>Compliance Officer</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: t.fgSecondary }}>Send invitation via</label>
                <div className="flex gap-3">
                  {['Email', 'SMS', 'Both'].map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="invite-method" defaultChecked={m === 'Email'} className="w-4 h-4" style={{ accentColor: t.primary }} />
                      <span className="text-sm" style={{ color: t.fg }}>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
                <button onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>Add User</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
