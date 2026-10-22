const TOKEN_KEY = 'contractiq_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { ...options, headers })
  if (!res.ok) {
    let msg = res.statusText
    try {
      const data = await res.json()
      if (Array.isArray(data.detail)) {
        msg = data.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join('; ')
      } else {
        msg = data.detail || data.message || msg
      }
    } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: any) =>
    api<{ access_token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => api<any>('/api/auth/me'),
}

export const contractsApi = {
  list: () => api<any[]>('/api/contracts'),
  get: (id: number) => api<any>(`/api/contracts/${id}`),
  create: (payload: any) => api<any>('/api/contracts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: any) => api<any>(`/api/contracts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => api<void>(`/api/contracts/${id}`, { method: 'DELETE' }),
  upload: (file: File, meta?: any) => {
    const fd = new FormData()
    fd.append('file', file)
    if (meta) {
      Object.keys(meta).forEach(k => {
        if (meta[k] !== undefined && meta[k] !== null && meta[k] !== '') fd.append(k, String(meta[k]))
      })
    }
    const token = getToken()
    return fetch('/api/contracts/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText)
      return r.json()
    })
  },
}

export const obligationsApi = {
  list: () => api<any[]>('/api/obligations'),
  create: (p: any) => api<any>('/api/obligations', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: any) => api<any>(`/api/obligations/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  remove: (id: number) => api<void>(`/api/obligations/${id}`, { method: 'DELETE' }),
}

export const renewalsApi = {
  list: () => api<any[]>('/api/renewals'),
  create: (p: any) => api<any>('/api/renewals', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: any) => api<any>(`/api/renewals/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  remove: (id: number) => api<void>(`/api/renewals/${id}`, { method: 'DELETE' }),
}

export const complianceApi = {
  list: () => api<any[]>('/api/compliance'),
  create: (p: any) => api<any>('/api/compliance', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: any) => api<any>(`/api/compliance/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  remove: (id: number) => api<void>(`/api/compliance/${id}`, { method: 'DELETE' }),
}

export const notificationsApi = {
  list: () => api<any[]>('/api/notifications'),
  create: (p: any) => api<any>('/api/notifications', { method: 'POST', body: JSON.stringify(p) }),
  markRead: (id: number) => api<any>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  remove: (id: number) => api<void>(`/api/notifications/${id}`, { method: 'DELETE' }),
}

export const usersApi = {
  list: () => api<any[]>('/api/users'),
  create: (p: any) => api<any>('/api/users', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: any) => api<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  remove: (id: number) => api<void>(`/api/users/${id}`, { method: 'DELETE' }),
}

export const auditApi = { list: () => api<any[]>('/api/audit-logs') }
export const settingsApi = {
  list: () => api<any[]>('/api/settings'),
  set: (key: string, value: string) => api<any>(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
}
export const dashboardApi = { stats: () => api<any>('/api/dashboard/stats') }
export const reportsApi = { summary: () => api<any>('/api/reports/summary') }
export const aiApi = { summarize: (id: number) => api<any>(`/api/ai/summarize/${id}`, { method: 'POST' }) }
