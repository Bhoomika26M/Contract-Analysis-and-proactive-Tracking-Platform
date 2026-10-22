import { useState } from 'react'
import type { PageProps } from '../types'
import {
  Settings as SettingsIcon, Shield, Bell, Palette, Plug, Database, Building2, Key, Save, CheckCircle2,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const settingsTabs = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={16} /> },
  { id: 'organization', label: 'Organization', icon: <Building2 size={16} /> },
  { id: 'api', label: 'API Keys', icon: <Key size={16} /> },
  { id: 'backup', label: 'Backup', icon: <Database size={16} /> },
]

const integrations: any[] = []
const apiKeys: any[] = []

export function Settings({ navigate }: PageProps) {
  const { theme: t } = useTheme()
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({
    renewalReminders: true,
    obligationDue: true,
    complianceAlerts: true,
    teamUpdates: false,
    weeklyDigest: true,
    emailNotifs: true,
    smsNotifs: false,
    slackNotifs: true,
  })
  const [renewalDays, setRenewalDays] = useState('60')
  const [security, setSecurity] = useState({
    twoFactor: true,
    sso: true,
    ipAllowlist: false,
    sessionTimeout: true,
    auditLogging: true,
    encryption: true,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className="relative flex-shrink-0 transition-all"
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? t.primary : t.border,
      }}
    >
      <div
        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: checked ? 22 : 4 }}
      />
    </button>
  )

  return (
    <div className="p-6 flex gap-6">
      {/* Left sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="rounded-2xl border p-2" style={{ borderColor: t.border, background: t.surface }}>
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: activeTab === tab.id ? t.primaryBg : 'transparent',
                color: activeTab === tab.id ? t.primary : t.muted,
                fontWeight: activeTab === tab.id ? 500 : 400,
              }}
            >
              <span style={{ color: activeTab === tab.id ? t.primary : t.mutedLight }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {activeTab === 'general' && (
          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>General Settings</h3>
            <div className="space-y-4">
              {[
                { label: 'Platform Name', value: 'ContractIQ Enterprise' },
                { label: 'Default Currency', value: 'USD ($)' },
                { label: 'Time Zone', value: 'Pacific Time (UTC-8)' },
                { label: 'Date Format', value: 'MM/DD/YYYY' },
                { label: 'Fiscal Year Start', value: 'January' },
              ].map(field => (
                <div key={field.label} className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm font-medium" style={{ color: t.fgSecondary }}>{field.label}</label>
                  <input
                    defaultValue={field.value}
                    className="col-span-2 px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: t.border, color: t.fg, background: t.surface }}
                    onFocus={e => { e.currentTarget.style.borderColor = t.primary }}
                    onBlur={e => { e.currentTarget.style.borderColor = t.border }}
                  />
                </div>
              ))}

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-sm font-medium" style={{ color: t.fgSecondary }}>Renewal Alert (days)</label>
                <div className="col-span-2 flex gap-2">
                  {['30', '45', '60', '90'].map(d => (
                    <button
                      key={d}
                      onClick={() => setRenewalDays(d)}
                      className="px-3 py-2 rounded-xl border text-sm font-medium transition-all"
                      style={{
                        background: renewalDays === d ? t.primary : t.surface,
                        color: renewalDays === d ? '#fff' : t.muted,
                        borderColor: renewalDays === d ? t.primary : t.border,
                      }}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Security Settings</h3>
            <div className="space-y-5">
              {[
                { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all users' },
                { key: 'sso', label: 'Single Sign-On (SSO)', desc: 'Enable SSO with your identity provider' },
                { key: 'ipAllowlist', label: 'IP Allowlisting', desc: 'Restrict access to specific IP ranges' },
                { key: 'sessionTimeout', label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity' },
                { key: 'auditLogging', label: 'Audit Logging', desc: 'Log all user actions for compliance' },
                { key: 'encryption', label: 'Data Encryption at Rest', desc: 'AES-256 encryption for stored data' },
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: t.borderLight }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: t.fg }}>{setting.label}</div>
                    <div className="text-xs" style={{ color: t.muted }}>{setting.desc}</div>
                  </div>
                  <Toggle checked={security[setting.key as keyof typeof security]} onChange={() => setSecurity(s => ({ ...s, [setting.key]: !s[setting.key as keyof typeof security] }))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
              <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Alert Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'renewalReminders', label: 'Renewal Reminders', desc: `Alert me ${renewalDays} days before contract expiry` },
                  { key: 'obligationDue', label: 'Obligation Due Dates', desc: 'Notify when obligations are approaching' },
                  { key: 'complianceAlerts', label: 'Compliance Alerts', desc: 'Flag compliance issues immediately' },
                  { key: 'teamUpdates', label: 'Team Activity', desc: 'Notify when team members take actions' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of contract portfolio status' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: t.borderLight }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: t.fg }}>{item.label}</div>
                      <div className="text-xs" style={{ color: t.muted }}>{item.desc}</div>
                    </div>
                    <Toggle checked={notifications[item.key as keyof typeof notifications]} onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifications] }))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
              <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Delivery Channels</h3>
              {[
                { key: 'emailNotifs', label: 'Email Notifications', desc: 'Receive alerts via email' },
                { key: 'smsNotifs', label: 'SMS Notifications', desc: 'Critical alerts via text message' },
                { key: 'slackNotifs', label: 'Slack Integration', desc: 'Post notifications to Slack channels' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: t.borderLight }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: t.fg }}>{item.label}</div>
                    <div className="text-xs" style={{ color: t.muted }}>{item.desc}</div>
                  </div>
                  <Toggle checked={notifications[item.key as keyof typeof notifications]} onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifications] }))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: t.fg }}>Connected Integrations</h3>
            <div className="grid grid-cols-2 gap-4">
              {integrations.map(integration => (
                <div key={integration.name} className="p-4 rounded-2xl border" style={{ borderColor: t.border, background: t.bg }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{integration.icon}</div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: t.fg }}>{integration.name}</div>
                        <div className="text-xs" style={{ color: t.mutedLight }}>{integration.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: integration.status === 'connected' ? t.success : t.mutedLight }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: integration.status === 'connected' ? t.success : t.border }} />
                      {integration.status === 'connected' ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: t.muted }}>{integration.description}</p>
                  <button className="w-full py-2 rounded-xl border text-xs font-medium transition-all" style={{ borderColor: integration.status === 'connected' ? t.border : t.primary, color: integration.status === 'connected' ? t.muted : t.primary, background: integration.status === 'connected' ? 'transparent' : t.primaryBg }}>
                    {integration.status === 'connected' ? 'Configure' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="rounded-2xl border p-6" style={{ borderColor: t.border, background: t.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>API Keys</h3>
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
                <Key size={14} />Generate New Key
              </button>
            </div>
            <div className="p-4 rounded-xl mb-5" style={{ background: t.warningBg, border: `1px solid ${t.warning}40` }}>
              <p className="text-sm" style={{ color: t.warning }}>Keep your API keys secure. Never share them in public repositories or client-side code.</p>
            </div>
            <div className="space-y-3">
              {apiKeys.map(key => (
                <div key={key.name} className="p-4 rounded-xl border" style={{ borderColor: t.border, background: t.bg }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold" style={{ color: t.fg }}>{key.name}</div>
                    <div className="flex gap-2">
                      <button className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: t.border, color: t.muted }}>Copy</button>
                      <button className="text-xs px-2.5 py-1 rounded-lg" style={{ background: t.dangerBg, color: t.danger }}>Revoke</button>
                    </div>
                  </div>
                  <code className="text-sm font-mono block mb-2 p-2 rounded-lg" style={{ background: t.tableHeader, color: t.fgSecondary }}>{key.key}</code>
                  <div className="flex items-center gap-4 text-xs" style={{ color: t.mutedLight }}>
                    <span>Created {key.created}</span>
                    <span>Last used {key.lastUsed}</span>
                    <span>Permissions: {key.permissions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!['general', 'security', 'notifications', 'integrations', 'api'].includes(activeTab) && (
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: t.border, background: t.surface }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: t.borderLight }}>
              <SettingsIcon size={20} style={{ color: t.mutedLight }} />
            </div>
            <p className="text-sm" style={{ color: t.muted }}>
              {settingsTabs.find(tab => tab.id === activeTab)?.label} settings
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
            style={{ background: saved ? t.success : t.primary }}
          >
            {saved ? <><CheckCircle2 size={15} />Saved!</> : <><Save size={15} />Save Changes</>}
          </button>
          <button className="px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.muted }}>
            Reset to defaults
          </button>
        </div>
      </div>

      {/* Save success toast */}
      {saved && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl z-50"
          style={{ background: t.success, color: '#fff' }}
        >
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">Settings saved successfully</span>
        </div>
      )}
    </div>
  )
}
