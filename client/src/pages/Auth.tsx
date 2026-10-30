import { useState, useEffect } from 'react'
import type { PageId, Role } from '../types'
import { Eye, EyeOff, Zap, ArrowRight, CheckCircle2, Mail, Lock, User, Building2, ChevronLeft, Briefcase, ChevronDown } from 'lucide-react'

const P = '#2D6A4F'
const PH = '#245941'

const ROLES: { value: Role; label: string }[] = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'legal-manager', label: 'Legal Manager' },
  { value: 'compliance-officer', label: 'Compliance Officer' },
  { value: 'contract-manager', label: 'Contract Manager' },
  { value: 'department-head', label: 'Department Head' },
  { value: 'employee', label: 'Employee' },
]

interface AuthProps {
  currentPage: 'login' | 'register' | 'forgot-password'
  navigate: (page: PageId) => void
  onLogin: (email: string, password: string, role: Role) => Promise<void>
  onRegister: (payload: any) => Promise<void>
  initialResetToken?: string
}

const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
const inputStyle = { borderColor: '#E5E7EB', color: '#1A1A1A', background: '#fff' }
const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = P
  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(45,106,79,0.12)`
}
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = '#E5E7EB'
  e.currentTarget.style.boxShadow = 'none'
}

const leftPanelStyle = { background: 'linear-gradient(160deg, #1A1A1A 0%, #2C2C2C 40%, #1A3D2B 100%)' }

function LeftPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 w-5/12 relative overflow-hidden" style={leftPanelStyle}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: 100 + i * 50, height: 100 + i * 50,
            border: '1px solid rgba(82,183,136,0.06)',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          }} />
        ))}
      </div>
      {children}
    </div>
  )
}

export function Auth({ currentPage, navigate, onLogin, onRegister, initialResetToken }: AuthProps) {
  const [showPassword, setShowPassword] = useState(false)
  useEffect(() => {
    if (initialResetToken) {
      setResetToken(initialResetToken)
    }
    const params = new URLSearchParams(window.location.search)
    const rt = params.get('reset_token')
    if (rt) {
      setResetToken(rt)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [initialResetToken])

  useEffect(() => {
    fetch('/api/auth/providers').then(r => r.json()).then(setOauthProviders).catch(() => setOauthProviders({}))
  }, [])
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role>('administrator')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetDone, setResetDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regOrg, setRegOrg] = useState('')
  const [regDept, setRegDept] = useState('')
  const [regRole, setRegRole] = useState<Role>('employee')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [oauthProviders, setOauthProviders] = useState<Record<string, boolean>>({})

  if (currentPage === 'forgot-password') {
    return (
      <div className="min-h-screen flex" style={{ background: '#FAFAF7' }}>
        <LeftPanel>
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${P}, #52B788)` }}>
              <Zap size={22} color="white" />
            </div>
            <span className="text-white font-bold text-xl">ContractIQ</span>
          </div>
          <div>
            <div className="text-5xl font-bold text-white leading-tight mb-4">Secure.<br />Reliable.<br />Always on.</div>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>Enterprise-grade contract management with bank-level security.</p>
          </div>
          <div className="flex items-center gap-4">
            {['256-bit AES', 'SOC 2 Type II', 'GDPR Ready'].map(badge => (
              <div key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <CheckCircle2 size={12} color="#52B788" />
                <span className="text-xs text-white font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </LeftPanel>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <button onClick={() => navigate('login')} className="flex items-center gap-1.5 text-sm mb-8 transition-colors" style={{ color: '#6B7280' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = P)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#6B7280')}
            >
              <ChevronLeft size={16} />Back to login
            </button>
                {!resetDone && !resetToken && !forgotSent ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Reset password</h1>
                  <p style={{ color: '#6B7280' }}>Enter your email to receive a reset link.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                      <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                  </div>
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  <button
                    onClick={async () => {
                      setError(''); setLoading(true)
                      try {
                        const res = await fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email: forgotEmail}) })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.detail || 'Failed')
                        setForgotSent(true)
                      } catch (e:any) { setError(e?.message || 'Failed') }
                      finally { setLoading(false) }
                    }}
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: P }}
                  >
                    Send reset instructions
                  </button>
                </div>
              </>
            ) : resetDone ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Password updated</h2>
                <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Your password has been reset successfully. You can now log in.</p>
                <button onClick={() => navigate('login')} className="px-6 py-3 rounded-xl text-white font-medium text-sm" style={{ background: P }}>Return to login</button>
              </div>
            ) : resetToken ? (
              <div className="space-y-4">
                <div className="mb-2">
                  <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Enter new password</h1>
                  <p style={{ color: '#6B7280' }}>Choose a new password for your account.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                    <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                    <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm password" className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <button
                  onClick={async () => {
                    setError(''); setLoading(true)
                    try {
                      if (newPassword !== confirmPassword) throw new Error('Passwords do not match')
                      const res = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token: resetToken, new_password: newPassword, confirm_password: confirmPassword}) })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.detail || 'Failed')
                      setResetDone(true)
                    } catch (e:any) { setError(e?.message || 'Failed') }
                    finally { setLoading(false) }
                  }}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: P }}
                >
                  Reset password
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Check your email</h2>
                <p className="text-sm mb-6" style={{ color: '#6B7280' }}>If an account exists for that email, a password reset link has been sent. Click the link to reset your password.</p>
                <button onClick={() => navigate('login')} className="px-6 py-3 rounded-xl text-white font-medium text-sm" style={{ background: P }}>Return to login</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (currentPage === 'register') {
    return (
      <div className="min-h-screen flex" style={{ background: '#FAFAF7' }}>
        <LeftPanel>
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${P}, #52B788)` }}>
              <Zap size={22} color="white" />
            </div>
            <span className="text-white font-bold text-xl">ContractIQ</span>
          </div>
          <div>
            <div className="text-5xl font-bold text-white leading-tight mb-4">Start managing contracts smarter.</div>
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join 2,400+ enterprises that trust ContractIQ for their contract lifecycle management.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Active Users', value: '12,400+' }, { label: 'Contracts Managed', value: '1.2M+' }, { label: 'Compliance Rate', value: '98.7%' }, { label: 'Time Saved', value: '65%' }].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </LeftPanel>

        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md py-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: P }}>
                <Zap size={18} color="white" />
              </div>
              <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>ContractIQ</span>
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Create your account</h1>
              <p style={{ color: '#6B7280' }}>Fill in your details to get started</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Your full name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="you@company.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Organization</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input type="text" value={regOrg} onChange={e=>setRegOrg(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Company name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Department</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input type="text" value={regDept} onChange={e=>setRegDept(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Your department" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Role</label>
                <div className="relative">
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9CA3AF' }} />
                  <select value={regRole} onChange={e=>setRegRole(e.target.value as Role)} className={`${inputCls} pr-10 appearance-none`} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input type={showPassword ? 'text' : 'password'} value={regPassword} onChange={e=>setRegPassword(e.target.value)} className={`${inputCls} pl-10 pr-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Create password" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input type={showConfirmPassword ? 'text' : 'password'} value={regConfirm} onChange={e=>setRegConfirm(e.target.value)} className={`${inputCls} pl-10 pr-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Confirm password" />
                  <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={async () => {
                  setError('')
                  if (regPassword !== regConfirm) { setError('Passwords do not match'); return }
                  setLoading(true)
                  try {
                    const avatar = regName.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
                    await onRegister({ name: regName, email: regEmail, password: regPassword, role: regRole, organization: regOrg, department: regDept, avatar })
                  } catch (e: any) { setError(e?.message || 'Registration failed') }
                  finally { setLoading(false) }
                }}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: P }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = PH)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = P)}
              >
                Register
                <ArrowRight size={16} />
              </button>
            </div>

            <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
              Already have an account?{' '}
              <button onClick={() => navigate('login')} className="font-medium" style={{ color: P }}>Sign in</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Login
  return (
    <div className="min-h-screen flex">
      <LeftPanel>
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${P}, #52B788)` }}>
            <Zap size={22} color="white" />
          </div>
          <span className="text-white font-bold text-xl">ContractIQ</span>
        </div>

        <div className="relative">
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>CONTRACT OVERVIEW</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{ label: 'Active', value: '247', color: '#4ADE80' }, { label: 'Expiring', value: '18', color: '#FBBF24' }, { label: 'At Risk', value: '12', color: '#F87171' }].map(stat => (
                <div key={stat.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs" style={{ color: stat.color }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="h-1 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: '94%', background: `linear-gradient(90deg, ${P}, #52B788)` }} />
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>94.2% compliance rate</div>
          </div>
          <div className="text-4xl font-bold text-white leading-tight mb-4">Your contracts.<br />Under control.</div>
          <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            Track obligations, automate renewals, and maintain full compliance across your entire contract portfolio.
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          {['SOC 2', 'ISO 27001', 'GDPR'].map(badge => (
            <div key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <CheckCircle2 size={11} style={{ color: '#52B788' }} />
              {badge}
            </div>
          ))}
        </div>
      </LeftPanel>

      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#FAFAF7' }}>
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: P }}>
              <Zap size={18} color="white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>ContractIQ</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Welcome back</h1>
            <p style={{ color: '#6B7280' }}>Sign in to your ContractIQ workspace</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#374151' }}>Password</label>
                <button onClick={() => navigate('forgot-password')} className="text-sm font-medium" style={{ color: P }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = PH)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = P)}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pl-10 pr-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Sign in as</label>
              <div className="relative">
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9CA3AF' }} />
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as Role)}
                  className={`${inputCls} pr-10 appearance-none`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: P }} />
              <label htmlFor="remember" className="text-sm" style={{ color: '#374151' }}>Remember me for 30 days</label>
            </div>
            <button
              onClick={async () => {
                setError(''); setLoading(true)
                try { await onLogin(email, password, selectedRole) }
                catch (e: any) { setError(e?.message || 'Login failed') }
                finally { setLoading(false) }
              }}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: `linear-gradient(135deg, ${P}, #40916C)` }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.92'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
            >
              Sign in to ContractIQ
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            Don't have an account?{' '}
            <button onClick={() => navigate('register')} className="font-medium" style={{ color: P }}>Create Account</button>
          </p>
          <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
            By signing in, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}
