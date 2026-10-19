import { useState, useRef } from 'react'
import type { PageProps, Role } from '../types'
import {
  Search, Filter, Grid, List, Upload, Plus, Download, Eye, MoreHorizontal,
  FileText, X, CheckCircle2, Clock, AlertTriangle, ArrowUpDown,
  Paperclip, History, MessageSquare, Shield, RefreshCw, Tag, ChevronLeft, ChevronRight,
  GitBranch, Check,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useEffect } from 'react'
import { contractsApi } from '../api'
import { ExportModal } from '../components/ExportModal'

interface ContractsProps extends PageProps {
  view: 'repository' | 'upload' | 'details'
  role: Role
}

const canEdit = (role: Role) => role === 'administrator' || role === 'contract-manager'
const canApprove = (role: Role) => role === 'administrator' || role === 'legal-manager'
const canCreate = (role: Role) => role === 'administrator' || role === 'contract-manager'

const detailTabs = ['Overview', 'Documents', 'Versions', 'Obligations', 'Renewals', 'Compliance', 'History']

function UploadView({ navigate }: PageProps & { role: Role }) {
  const { theme: t } = useTheme()
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<any>({
    title: '', reference_number: '', contract_type: '', department: '', owner: '', status: 'draft',
    provider_name: '', provider_email: '', customer_name: '', customer_email: '', additional_parties: '',
    value: '', currency: 'USD', payment_terms: '', payment_frequency: '',
    effective_date: '', expiry_date: '', auto_renewal: 'No', renewal_period: '', renewal_notice_period: '', termination_notice_period: '',
    description: '', summary: '', governing_law: '', sla_uptime: '', key_terms: '', compliance_requirements: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.title) { setError('Contract title is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, value: form.value ? Number(form.value) : 0 }
      if (file) {
        await contractsApi.upload(file, payload)
      } else {
        await contractsApi.create(payload)
      }
      setSuccess('Contract saved successfully')
      setTimeout(() => navigate('contracts'), 800)
    } catch (err: any) {
      setError(err?.message || 'Failed to save contract')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
  const labelCls = "block text-sm font-medium mb-1.5"
  const sectionCls = "rounded-2xl border p-6 space-y-4"

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ color: t.fg }}>New Contract</h2>
        <p style={{ color: t.muted }}>Enter all contract information during creation</p>
      </div>
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-600">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={sectionCls} style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>Basic Contract Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls} style={{ color: t.fgSecondary }}>Contract Title *</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Reference Number</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.reference_number} onChange={e => set('reference_number', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Contract Type</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.contract_type} onChange={e => set('contract_type', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Department</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Contract Owner</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.owner} onChange={e => set('owner', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Status</label>
              <select className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="pending">Pending Review</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </div>

        <div className={sectionCls} style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>Parties</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Service Provider / Company</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.provider_name} onChange={e => set('provider_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Provider Email</label>
              <input type="email" className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.provider_email} onChange={e => set('provider_email', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Customer / Company</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Customer Email</label>
              <input type="email" className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={{ color: t.fgSecondary }}>Additional Parties</label>
              <textarea className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={2} value={form.additional_parties} onChange={e => set('additional_parties', e.target.value)} />
            </div>
          </div>
        </div>

        <div className={sectionCls} style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>Financial Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Contract Value</label>
              <input type="number" className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Currency</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.currency} onChange={e => set('currency', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Payment Terms</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Payment Frequency</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.payment_frequency} onChange={e => set('payment_frequency', e.target.value)} />
            </div>
          </div>
        </div>

        <div className={sectionCls} style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>Contract Duration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Effective / Start Date</label>
              <input type="date" className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.effective_date} onChange={e => set('effective_date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Expiry / End Date</label>
              <input type="date" className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Auto-Renewal</label>
              <select className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.auto_renewal} onChange={e => set('auto_renewal', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Renewal Period</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.renewal_period} onChange={e => set('renewal_period', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Renewal Notice Period</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.renewal_notice_period} onChange={e => set('renewal_notice_period', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Termination Notice Period</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.termination_notice_period} onChange={e => set('termination_notice_period', e.target.value)} />
            </div>
          </div>
        </div>

        <div className={sectionCls} style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>Contract Terms</h3>
          <div className="space-y-4">
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Description</label>
              <textarea className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Summary</label>
              <textarea className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} value={form.summary} onChange={e => set('summary', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Governing Law</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.governing_law} onChange={e => set('governing_law', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>SLA Uptime / Service Level</label>
              <input className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} value={form.sla_uptime} onChange={e => set('sla_uptime', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Additional Key Terms</label>
              <textarea className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} value={form.key_terms} onChange={e => set('key_terms', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={{ color: t.fgSecondary }}>Compliance Requirements</label>
              <textarea className={inputCls} style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} value={form.compliance_requirements} onChange={e => set('compliance_requirements', e.target.value)} />
            </div>
          </div>
        </div>

        <div className={sectionCls} style={{ borderColor: t.border, background: t.surface }}>
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>Documents</h3>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="block" onChange={e => setFile(e.target.files?.[0] || null)} />
          {file && <div className="text-sm" style={{ color: t.muted }}>{file.name}</div>}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('contracts')} className="px-5 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>{saving ? 'Saving...' : 'Save Contract'}</button>
        </div>
      </form>
    </div>
  )
}

function DetailsView({ navigate, role }: PageProps & { role: Role }) {
  const { theme: t } = useTheme()
  const [activeTab, setActiveTab] = useState('Overview')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [approved, setApproved] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editSaved, setEditSaved] = useState(false)
  const [contractData, setContractData] = useState<any>({
    title: '',
    category: '',
    dept: '',
    owner: '',
    value: '',
    effectiveDate: '',
    expiryDate: '',
    paymentTerms: '',
    autoRenewal: '',
    governingLaw: '',
    terminationNotice: '',
    slaUptime: '',
    summary: '',
    reference_number: '',
    provider_name: '',
    provider_email: '',
    customer_name: '',
    customer_email: '',
    additional_parties: '',
    currency: '',
    payment_frequency: '',
    renewal_period: '',
    renewal_notice_period: '',
    description: '',
    key_terms: '',
    compliance_requirements: '',
    sla_uptime: '',
  })
  useEffect(() => {
    const id = Number(localStorage.getItem('selectedContractId'))
    if (!id) return
    contractsApi.get(id).then((c: any) => setContractData({
      title: c.title || '',
      category: c.contract_type || '',
      dept: c.department || '',
      owner: c.owner || '',
      value: c.value ? (typeof c.value === 'string' ? c.value : `$${c.value}`) : '',
      effectiveDate: c.effective_date || '',
      expiryDate: c.expiry_date || '',
      paymentTerms: c.payment_terms || '',
      autoRenewal: c.auto_renewal || '',
      governingLaw: c.governing_law || '',
      terminationNotice: c.termination_notice_period || '',
      slaUptime: c.sla_uptime || '',
      summary: c.summary || '',
      reference_number: c.reference_number || '',
      provider_name: c.provider_name || '',
      provider_email: c.provider_email || '',
      customer_name: c.customer_name || '',
      customer_email: c.customer_email || '',
      additional_parties: c.additional_parties || '',
      currency: c.currency || '',
      payment_frequency: c.payment_frequency || '',
      renewal_period: c.renewal_period || '',
      renewal_notice_period: c.renewal_notice_period || '',
      description: c.description || '',
      key_terms: c.key_terms || '',
      compliance_requirements: c.compliance_requirements || '',
    })).catch(() => {})
  }, [])

  const handleEditSave = () => {
    setEditSaved(true)
    setTimeout(() => { setEditSaved(false); setEditing(false) }, 1500)
  }

  const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold" style={{ color: t.fg }}>{title}</h3>
          <button onClick={onClose} style={{ color: t.mutedLight }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )

  const riskConfig: Record<string, { color: string }> = {
    low: { color: t.success },
    medium: { color: t.warning },
    high: { color: t.danger },
    critical: { color: t.danger },
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: t.infoBg }}>
            <FileText size={22} style={{ color: t.info }} />
          </div>
          <div>
            {editing ? (
              <input value={contractData.title} onChange={e => setContractData(d => ({ ...d, title: e.target.value }))} className="text-xl font-bold bg-transparent border-b outline-none w-full" style={{ color: t.fg, borderColor: t.primary }} />
            ) : (
              <h2 className="text-xl font-bold" style={{ color: t.fg }}>{contractData.title}</h2>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm" style={{ color: t.muted }}>{contractData.category} · {contractData.dept}</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: t.successBg }}>
                <CheckCircle2 size={11} style={{ color: t.success }} />
                <span className="text-xs font-medium" style={{ color: t.success }}>Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: t.borderLight }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: riskConfig.low.color }} />
                <span className="text-xs font-medium" style={{ color: t.muted }}>Low Risk</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { const a = document.createElement('a'); a.href = '#'; a.download = 'ServiceNow_MSA_v3.2.pdf'; a.click() }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>
            <Download size={15} />Download
          </button>
          {canEdit(role) && !editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>Edit</button>
          )}
          {editing && (
            <>
              <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted, background: t.surface }}>Cancel</button>
              <button onClick={handleEditSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all" style={{ background: editSaved ? t.success : t.primary }}>
                {editSaved ? <><Check size={14} />Saved!</> : 'Save Changes'}
              </button>
            </>
          )}
          <button
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>
            <GitBranch size={15} />Versions
          </button>
          {canApprove(role) && (!approved && !rejected ? (
            <>
              <button onClick={() => setShowApproveDialog(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.success }}><CheckCircle2 size={15} />Approve</button>
              <button onClick={() => setShowRejectDialog(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.danger }}><X size={15} />Reject</button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: approved ? t.success : t.danger }}>
              {approved ? <><Check size={15} />Approved</> : <><X size={15} />Rejected</>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Contract Value', field: 'value' as const, value: contractData.value },
          { label: 'Owner', field: 'owner' as const, value: contractData.owner },
          { label: 'Effective Date', field: 'effectiveDate' as const, value: new Date(contractData.effectiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'Expiry Date', field: 'expiryDate' as const, value: new Date(contractData.expiryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-2xl border" style={{ borderColor: editing ? t.primary + '50' : t.border, background: t.surface }}>
            <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{item.label}</div>
            {editing && (item.field === 'effectiveDate' || item.field === 'expiryDate') ? (
              <input type="date" value={contractData[item.field]} onChange={e => setContractData(d => ({ ...d, [item.field]: e.target.value }))} className="text-sm font-semibold bg-transparent outline-none w-full" style={{ color: t.fg }} />
            ) : editing && (item.field === 'value' || item.field === 'owner') ? (
              <input value={contractData[item.field]} onChange={e => setContractData(d => ({ ...d, [item.field]: e.target.value }))} className="text-sm font-semibold bg-transparent border-b outline-none w-full" style={{ color: t.fg, borderColor: t.border }} />
            ) : (
              <div className="text-sm font-semibold" style={{ color: t.fg }}>{item.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-4 mb-6 flex items-center gap-4" style={{ borderColor: t.border, background: t.surface }}>
        <div className="text-sm font-medium" style={{ color: t.fgSecondary }}>Obligation Progress</div>
        <div className="flex-1 h-2 rounded-full" style={{ background: t.border }}>
          <div className="h-full rounded-full" style={{ width: '87%', background: t.primary }} />
        </div>
        <div className="text-sm font-semibold" style={{ color: t.primary }}>87%</div>
        <div className="text-xs" style={{ color: t.mutedLight }}>7 of 8 completed</div>
      </div>

      <div className="flex gap-1 border-b mb-6" style={{ borderColor: t.border }}>
        {detailTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
            style={{
              borderColor: activeTab === tab ? t.primary : 'transparent',
              color: activeTab === tab ? t.primary : t.muted,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {activeTab === 'Overview' && (
            <>
              <div className="rounded-2xl border p-5" style={{ borderColor: editing ? t.primary + '50' : t.border, background: t.surface }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Contract Summary</h4>
                {editing ? (
                  <textarea rows={4} value={contractData.summary} onChange={e => setContractData(d => ({ ...d, summary: e.target.value }))} className="w-full text-sm leading-relaxed bg-transparent border rounded-xl p-3 outline-none resize-none" style={{ color: t.muted, borderColor: t.border }} />
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: t.muted }}>{contractData.summary}</p>
                )}
              </div>
              <div className="rounded-2xl border p-5" style={{ borderColor: editing ? t.primary + '50' : t.border, background: t.surface }}>
                <h4 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Key Terms</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Payment Terms', field: 'paymentTerms' as const },
                    { label: 'Auto-renewal', field: 'autoRenewal' as const },
                    { label: 'Governing Law', field: 'governingLaw' as const },
                    { label: 'Termination Notice', field: 'terminationNotice' as const },
                    { label: 'SLA Uptime', field: 'slaUptime' as const },
                  ].map(term => (
                    <div key={term.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: t.borderLight }}>
                      <span className="text-sm flex-shrink-0 mr-4" style={{ color: t.muted }}>{term.label}</span>
                      {editing ? (
                        <input value={contractData[term.field]} onChange={e => setContractData(d => ({ ...d, [term.field]: e.target.value }))} className="text-sm font-medium bg-transparent border-b outline-none text-right flex-1" style={{ color: t.fg, borderColor: t.border }} />
                      ) : (
                        <span className="text-sm font-medium" style={{ color: t.fg }}>{contractData[term.field]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {activeTab === 'Obligations' && (
            <div className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Obligations (8)</h4>
              <div className="space-y-3">
                {([] as any[]).map(obl => (
                  <div key={obl.title} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.bg }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: obl.status === 'completed' ? t.success : obl.status === 'in-progress' ? t.info : t.warning }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: t.fg }}>{obl.title}</div>
                      <div className="text-xs" style={{ color: t.mutedLight }}>Due {obl.due} · {obl.owner}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: obl.status === 'completed' ? t.successBg : obl.status === 'in-progress' ? t.infoBg : t.warningBg, color: obl.status === 'completed' ? t.success : obl.status === 'in-progress' ? t.info : t.warning }}>
                      {obl.status === 'in-progress' ? 'In Progress' : obl.status.charAt(0).toUpperCase() + obl.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(activeTab !== 'Overview' && activeTab !== 'Obligations') && (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: t.border, background: t.surface }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: t.borderLight }}>
                {activeTab === 'Documents' ? <Paperclip size={20} style={{ color: t.mutedLight }} /> :
                  activeTab === 'History' ? <History size={20} style={{ color: t.mutedLight }} /> :
                    <Tag size={20} style={{ color: t.mutedLight }} />}
              </div>
              <p className="text-sm" style={{ color: t.muted }}>{activeTab} content for this contract</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Parties</h4>
            {[
              { role: 'Service Provider', name: 'ServiceNow, Inc.', contact: 'legal@servicenow.com' },
              { role: 'Customer', name: 'ContractIQ Enterprise', contact: 'james.okafor@contractiq.com' },
            ].map(party => (
              <div key={party.role} className="mb-3 last:mb-0">
                <div className="text-xs mb-1" style={{ color: t.mutedLight }}>{party.role}</div>
                <div className="text-sm font-medium" style={{ color: t.fg }}>{party.name}</div>
                <div className="text-xs" style={{ color: t.muted }}>{party.contact}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: t.border, background: t.surface }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: t.fg }}>Quick Actions</h4>
            <div className="space-y-2">
              {[
                { icon: <RefreshCw size={14} />, label: 'Initiate Renewal', onClick: () => navigate('renewals'), roles: ['administrator', 'legal-manager', 'contract-manager', 'department-head', 'employee'] },
                { icon: <Shield size={14} />, label: 'Run Compliance Check', onClick: () => navigate('compliance'), roles: ['administrator', 'compliance-officer', 'contract-manager'] },
                { icon: <MessageSquare size={14} />, label: 'Add Comment', onClick: () => {}, roles: ['administrator', 'legal-manager', 'compliance-officer', 'contract-manager', 'department-head', 'employee'] },
              ].filter(action => action.roles.includes(role)).map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={{ borderColor: t.border, color: t.fgSecondary, background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.bg }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <span style={{ color: t.primary }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      {showApproveDialog && (
        <Modal title="Approve Contract" onClose={() => setShowApproveDialog(false)}>
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4" style={{ background: t.successBg }}>
            <CheckCircle2 size={28} style={{ color: t.success }} />
          </div>
          <p className="text-center text-sm mb-2" style={{ color: t.fg }}>You're approving <strong>ServiceNow Master Agreement</strong></p>
          <p className="text-center text-xs mb-6" style={{ color: t.muted }}>This action will notify all stakeholders and update the contract status.</p>
          <textarea placeholder="Add approval note (optional)" className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none mb-4"
            style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} />
          <div className="flex gap-3">
            <button onClick={() => setShowApproveDialog(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
            <button onClick={() => { setApproved(true); setShowApproveDialog(false) }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.success }}>Confirm Approval</button>
          </div>
        </Modal>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <Modal title="Reject Contract" onClose={() => setShowRejectDialog(false)}>
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4" style={{ background: t.dangerBg }}>
            <X size={28} style={{ color: t.danger }} />
          </div>
          <p className="text-center text-sm mb-2" style={{ color: t.fg }}>Rejecting <strong>ServiceNow Master Agreement</strong></p>
          <p className="text-center text-xs mb-4" style={{ color: t.muted }}>Please provide a reason for rejection.</p>
          <textarea placeholder="Reason for rejection (required)" className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none mb-4"
            style={{ borderColor: t.border, color: t.fg, background: t.bg }} rows={3} />
          <div className="flex gap-3">
            <button onClick={() => setShowRejectDialog(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.muted }}>Cancel</button>
            <button onClick={() => { setRejected(true); setShowRejectDialog(false) }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: t.danger }}>Confirm Rejection</button>
          </div>
        </Modal>
      )}

      {/* Version History Drawer */}
      {showVersionHistory && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowVersionHistory(false)}>
          <div className="w-full max-w-sm h-full overflow-y-auto border-l" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: t.border }}>
              <h3 className="text-base font-semibold" style={{ color: t.fg }}>Version History</h3>
              <button onClick={() => setShowVersionHistory(false)} style={{ color: t.mutedLight }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {([] as any[]).map((v, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: v.current ? t.primary : t.border }} />
                    {i < 4 && <div className="w-px flex-1 mt-1" style={{ background: t.border }} />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: t.fg }}>{v.version}</span>
                      {v.current && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: t.primaryBg, color: t.primary }}>Current</span>}
                    </div>
                    <p className="text-xs mb-1" style={{ color: t.muted }}>{v.change}</p>
                    <p className="text-xs" style={{ color: t.mutedLight }}>{v.author} · {v.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 8

export function Contracts({ navigate, view, role }: ContractsProps) {
  const { theme: t } = useTheme()
  const [contracts, setContracts] = useState<any[]>([])
  const [gridMode, setGridMode] = useState(false)
  useEffect(() => {
    contractsApi.list().then((data: any) => {
      const normalized = (data || []).map((c: any) => ({
        ...c,
        status: c.status || 'draft',
        category: c.category || c.contract_type || '',
        dept: c.dept || c.department || '',
        owner: c.owner || '',
        value: c.value ? (typeof c.value === 'string' ? c.value : `$${c.value}`) : '$0',
        expiry: c.expiry || c.expiry_date || '',
        risk: c.risk || c.risk_level || 'low',
        obligations: c.obligations || 0,
        progress: c.progress || 0,
      }))
      setContracts(normalized)
    }).catch(() => setContracts([]))
  }, [view])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [sortBy, setSortBy] = useState('expiry')
  const [showExportModal, setShowExportModal] = useState(false)
  const [filterDept, setFilterDept] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterCategory, setFilterCategory] = useState('All')

  const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    active: { bg: t.successBg, text: t.success, label: 'Active', icon: <CheckCircle2 size={12} /> },
    expiring: { bg: t.warningBg, text: t.warning, label: 'Expiring Soon', icon: <Clock size={12} /> },
    'at-risk': { bg: t.dangerBg, text: t.danger, label: 'At Risk', icon: <AlertTriangle size={12} /> },
    pending: { bg: t.infoBg, text: t.info, label: 'Pending Review', icon: <Clock size={12} /> },
    draft: { bg: t.infoBg, text: t.info, label: 'Draft', icon: <Clock size={12} /> },
  }
  const fallbackStatus = statusConfig.draft

  if (view === 'upload') return <UploadView navigate={navigate} role={role} />
  if (view === 'details') return <DetailsView navigate={navigate} role={role} />

  const filtered = contracts.filter(c =>
    (statusFilter === 'all' || c.status === statusFilter) &&
    (filterDept === 'all' || c.dept === filterDept) &&
    (filterRisk === 'all' || c.risk === filterRisk) &&
    (filterCategory === 'All' || c.category === filterCategory) &&
    ((c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.dept || '').toLowerCase().includes(search.toLowerCase()))
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: t.fg }}>Contract Repository</h2>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>{filtered.length} contracts · $4.5M total value</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: t.border, color: t.fgSecondary, background: t.surface }}>
            <Download size={15} />Export
          </button>
          {canCreate(role) && (
            <button onClick={() => navigate('upload-contract')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: t.primary }}>
              <Plus size={15} />Upload Contract
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-xs" style={{ borderColor: t.border, background: t.surface }}>
          <Search size={15} style={{ color: t.mutedLight }} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: t.fg }}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: t.mutedLight }} /></button>}
        </div>

        <div className="flex gap-1.5">
          {['all', 'active', 'expiring', 'at-risk'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all border"
              style={{
                background: statusFilter === s ? t.primary : t.surface,
                color: statusFilter === s ? '#fff' : t.muted,
                borderColor: statusFilter === s ? t.primary : t.border,
              }}
            >
              {{ all: 'All', active: 'Active', expiring: 'Expiring', 'at-risk': 'At Risk' }[s]}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowFilterPanel(p => !p); setShowSortPanel(false) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: showFilterPanel ? t.primary : t.border, color: showFilterPanel ? t.primary : t.muted, background: t.surface }}>
            <Filter size={14} />Filters {(filterDept !== 'all' || filterRisk !== 'all') && <span className="w-4 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ background: t.primary }}>!</span>}
          </button>
          {showFilterPanel && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border shadow-xl z-20 p-4 space-y-4" style={{ background: t.surface, borderColor: t.border }}>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Department</label>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                  {['all', 'Technology', 'Legal', 'Finance', 'Sales', 'Human Resources', 'Marketing', 'Operations'].map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Risk Level</label>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: t.border, color: t.fg, background: t.bg }}>
                  {['all', 'low', 'medium', 'high', 'critical'].map(r => <option key={r} value={r}>{r === 'all' ? 'All Risk Levels' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setFilterDept('all'); setFilterRisk('all') }} className="flex-1 py-2 rounded-xl border text-xs font-medium" style={{ borderColor: t.border, color: t.muted }}>Clear</button>
                <button onClick={() => setShowFilterPanel(false)} className="flex-1 py-2 rounded-xl text-white text-xs font-medium" style={{ background: t.primary }}>Apply Filters</button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowSortPanel(p => !p); setShowFilterPanel(false) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: showSortPanel ? t.primary : t.border, color: showSortPanel ? t.primary : t.muted, background: t.surface }}>
            <ArrowUpDown size={14} />Sort
          </button>
          {showSortPanel && (
            <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl border shadow-xl z-20 py-2 overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
              {[
                { value: 'expiry', label: 'Expiry Date' },
                { value: 'value', label: 'Contract Value' },
                { value: 'title', label: 'Contract Name' },
                { value: 'risk', label: 'Risk Level' },
                { value: 'status', label: 'Status' },
              ].map(s => (
                <button key={s.value} onClick={() => { setSortBy(s.value); setShowSortPanel(false) }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all"
                  style={{ color: t.fg, background: sortBy === s.value ? t.primaryBg : 'transparent' }}
                  onMouseEnter={e => { if (sortBy !== s.value) (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover }}
                  onMouseLeave={e => { if (sortBy !== s.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                  {s.label}
                  {sortBy === s.value && <Check size={14} style={{ color: t.primary }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex gap-1 p-1 rounded-xl border" style={{ borderColor: t.border, background: t.surface }}>
          <button onClick={() => setGridMode(false)} className="p-1.5 rounded-lg transition-all" style={{ background: !gridMode ? t.borderLight : 'transparent', color: !gridMode ? t.fg : t.mutedLight }}>
            <List size={16} />
          </button>
          <button onClick={() => setGridMode(true)} className="p-1.5 rounded-lg transition-all" style={{ background: gridMode ? t.borderLight : 'transparent', color: gridMode ? t.fg : t.mutedLight }}>
            <Grid size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['All', 'Software', 'IT Services', 'Cloud', 'Legal', 'HR Tech', 'Communications'].map(cat => (
          <button
            key={cat}
            onClick={() => { setFilterCategory(cat); setPage(1) }}
            className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={{ borderColor: filterCategory === cat ? t.primary : t.border, color: filterCategory === cat ? t.primary : t.muted, background: filterCategory === cat ? t.primaryBg : t.surface }}>
            {cat}
          </button>
        ))}
      </div>

      {gridMode ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map(contract => {
            const status = statusConfig[contract.status] || fallbackStatus
            return (
              <div
                key={contract.id}
                className="rounded-2xl border p-5 cursor-pointer transition-all"
                style={{ borderColor: t.border, background: t.surface, boxShadow: t.cardShadow }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadowHover; (e.currentTarget as HTMLDivElement).style.borderColor = t.muted }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = t.cardShadow; (e.currentTarget as HTMLDivElement).style.borderColor = t.border }}
                onClick={() => navigate('contract-details')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.infoBg }}>
                    <FileText size={18} style={{ color: t.info }} />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                    {status.icon}{status.label}
                  </div>
                </div>
                <h4 className="text-sm font-semibold mb-1 leading-snug" style={{ color: t.fg }}>{contract.title}</h4>
                <p className="text-xs mb-3" style={{ color: t.muted }}>{contract.category} · {contract.dept}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: t.fg }}>{contract.value}</span>
                  <span style={{ color: t.mutedLight }}>Exp {contract.expiry}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full" style={{ background: t.borderLight }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${contract.progress}%`, background: contract.progress === 100 ? t.success : t.primary }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: t.mutedLight }}>Obligations</span>
                  <span className="text-xs font-medium" style={{ color: t.muted }}>{contract.progress}%</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.border, background: t.surface }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: t.tableHeader, borderBottom: `1px solid ${t.border}` }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: t.muted }}>CONTRACT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>DEPARTMENT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>VALUE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>STATUS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>EXPIRY</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: t.muted }}>OBLIGATIONS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((contract, i) => {
                const status = statusConfig[contract.status] || fallbackStatus
                return (
                  <tr
                    key={contract.id}
                    className="cursor-pointer transition-all"
                    style={{ borderBottom: i < paginated.length - 1 ? `1px solid ${t.borderLight}` : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = t.tableHeader }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                    onClick={() => { localStorage.setItem('selectedContractId', String(contract.id)); navigate('contract-details') }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.infoBg }}>
                          <FileText size={16} style={{ color: t.info }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: t.fg }}>{contract.title}</div>
                          <div className="text-xs" style={{ color: t.mutedLight }}>{contract.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm" style={{ color: t.fgSecondary }}>{contract.dept}</div>
                      <div className="text-xs" style={{ color: t.mutedLight }}>{contract.owner}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold" style={{ color: t.fg }}>{contract.value}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit text-xs font-medium" style={{ background: status.bg, color: status.text }}>
                        {status.icon}{status.label}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm" style={{ color: contract.status === 'expiring' || contract.status === 'at-risk' ? t.danger : t.fgSecondary }}>{contract.expiry}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full" style={{ background: t.borderLight }}>
                          <div className="h-full rounded-full" style={{ width: `${contract.progress}%`, background: contract.progress === 100 ? t.success : t.primary }} />
                        </div>
                        <span className="text-xs" style={{ color: t.mutedLight }}>{contract.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg transition-all" style={{ color: t.mutedLight }} onClick={e => { e.stopPropagation(); navigate('contract-details') }}>
                          <Eye size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg transition-all" style={{ color: t.mutedLight }} onClick={e => e.stopPropagation()}>
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: t.border }}>
          <span className="text-sm" style={{ color: t.muted }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} contracts
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                  style={{ background: p === page ? t.primary : 'transparent', color: p === page ? '#fff' : t.muted }}
                >
                  {p}
                </button>
              ))}
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
      )}

      {showExportModal && (
        <ExportModal title="Contract Repository Export" onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
