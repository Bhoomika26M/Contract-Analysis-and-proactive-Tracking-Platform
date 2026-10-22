import { useState } from 'react'
import { CheckCircle2, ArrowRight, Zap, FileText, Users, Shield, BarChart2, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { theme: t } = useTheme()
  const [step, setStep] = useState(1)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['Contract Tracking', 'Renewals', 'Compliance'])

  const features = [
    { label: 'Contract Tracking', icon: <FileText size={20} />, desc: 'Centralize all your contracts' },
    { label: 'Obligation Mgmt', icon: <CheckCircle2 size={20} />, desc: 'Track deadlines and deliverables' },
    { label: 'Renewals', icon: <ArrowRight size={20} />, desc: 'Never miss an expiry date' },
    { label: 'Compliance', icon: <Shield size={20} />, desc: 'Monitor regulatory requirements' },
    { label: 'Analytics', icon: <BarChart2 size={20} />, desc: 'Insights across your portfolio' },
    { label: 'Team Mgmt', icon: <Users size={20} />, desc: 'Collaborate with your team' },
  ]

  const toggleFeature = (label: string) => {
    setSelectedFeatures(prev =>
      prev.includes(label) ? prev.filter(f => f !== label) : [...prev, label]
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.bg} 0%, ${t.primaryBg} 100%)` }}>
      {/* Background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${t.primary}14, transparent)` }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${t.info}0f, transparent)` }} />
      </div>

      <div className="relative w-full max-w-2xl mx-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  background: s <= step ? t.primary : t.border,
                  color: s <= step ? t.surface : t.mutedLight,
                }}
              >
                {s < step ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 2 && <div className="w-16 h-0.5 rounded" style={{ background: step > s ? t.primary : t.border }} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div
            className="rounded-3xl p-10 text-center animate-fadeIn"
            style={{ background: t.surface, boxShadow: t.cardShadowHover }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.primaryLight})` }}
            >
              <Zap size={36} color="white" />
            </div>

            <h1 className="text-3xl font-bold mb-3" style={{ color: t.fg }}>
              Welcome to ContractIQ
            </h1>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: t.muted, lineHeight: 1.7 }}>
              You're just a few steps away from having full visibility over your contract portfolio. Let's get you set up.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: '📋', value: '2 min', label: 'Setup time' },
                { icon: '🔒', value: '256-bit', label: 'Encryption' },
                { icon: '🌍', value: '40+', label: 'Countries' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-2xl" style={{ background: t.bg }}>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xl font-bold" style={{ color: t.fg }}>{item.value}</div>
                  <div className="text-xs" style={{ color: t.muted }}>{item.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-base mx-auto transition-all"
              style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.primary})` }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 24px ${t.primary}4d` }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
            >
              Get started
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            className="rounded-3xl p-10 animate-fadeIn"
            style={{ background: t.surface, boxShadow: t.cardShadowHover }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: t.fg }}>
              What will you use ContractIQ for?
            </h2>
            <p className="mb-6" style={{ color: t.muted }}>
              Select the features most relevant to your work. We'll personalize your experience.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map(feature => {
                const selected = selectedFeatures.includes(feature.label)
                return (
                  <button
                    key={feature.label}
                    onClick={() => toggleFeature(feature.label)}
                    className="flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all"
                    style={{
                      borderColor: selected ? t.primary : t.border,
                      background: selected ? t.primaryBg : t.surface,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                      style={{ width: 36, height: 36, background: selected ? t.primary : t.borderLight, color: selected ? t.surface : t.muted }}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: t.fg }}>{feature.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: t.muted }}>{feature.desc}</div>
                    </div>
                    {selected && (
                      <CheckCircle2 size={18} className="ml-auto flex-shrink-0" style={{ color: t.primary }} />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-2xl text-sm font-medium border transition-all"
                style={{ borderColor: t.border, color: t.muted }}
              >
                Back
              </button>
              <button
                onClick={onComplete}
                disabled={selectedFeatures.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold text-sm transition-all"
                style={{ background: selectedFeatures.length === 0 ? t.mutedLight : t.primary }}
                onMouseEnter={e => { if (selectedFeatures.length > 0) (e.currentTarget as HTMLButtonElement).style.background = t.primaryHover }}
                onMouseLeave={e => { if (selectedFeatures.length > 0) (e.currentTarget as HTMLButtonElement).style.background = t.primary }}
              >
                Go to dashboard
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
