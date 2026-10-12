// ContractIQ API client — typed wrappers around the Express REST backend
const BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error("API Error"), { status: res.status, detail: data.detail });
  return data as T;
}

// ─── Contract types ───────────────────────────────────────────────────────────
export interface Contract {
  id: string;
  name: string;
  category: string;
  owner: string;
  start: string;
  expiry: string;
  value: string;
  status: string;
  risk: string;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContractListResponse {
  data: Contract[];
  total: number;
}

export interface ContractFilters {
  status?: string;
  category?: string;
  risk?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// ─── Renewal types ────────────────────────────────────────────────────────────
export interface Renewal {
  id: string;
  contractId: string | null;
  name: string;
  owner: string;
  expiry: string;
  value: string;
  daysLeft: number;
  status: string;
  notes: string;
  renewedOn: string | null;
  extendedTo: string | null;
  terminatedOn: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface RenewalListResponse {
  data: Renewal[];
  stats: { critical: number; upcoming: number; scheduled: number; total: number };
  total: number;
}

// ─── Notification & audit log types ───────────────────────────────────────────
export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
}

export interface AuditLogItem {
  id: number;
  user: string;
  action: string;
  date: string;
  ip: string;
  module: string;
  status: string;
}

export interface AuditLogListResponse {
  data: AuditLogItem[];
  total: number;
}

// ─── Contracts API ────────────────────────────────────────────────────────────
export const contractsApi = {
  list: (filters?: ContractFilters) => {
    const params = new URLSearchParams();
    if (filters?.status)    params.set("status",    filters.status);
    if (filters?.category)  params.set("category",  filters.category);
    if (filters?.risk)      params.set("risk",       filters.risk);
    if (filters?.search)    params.set("search",     filters.search);
    if (filters?.date_from) params.set("date_from",  filters.date_from);
    if (filters?.date_to)   params.set("date_to",    filters.date_to);
    const qs = params.toString();
    return request<ContractListResponse>(`/contracts${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<Contract>(`/contracts/${id}`),

  create: (body: Omit<Contract, "id" | "createdAt" | "updatedAt">) =>
    request<Contract>("/contracts", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Contract>) =>
    request<Contract>(`/contracts/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<{ message: string; id: string }>(`/contracts/${id}`, { method: "DELETE" }),
};

// ─── Renewals API ─────────────────────────────────────────────────────────────
export const renewalsApi = {
  list: (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.search) params.set("search", filters.search);
    const qs = params.toString();
    return request<RenewalListResponse>(`/renewals${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => request<Renewal>(`/renewals/${id}`),

  create: (body: Omit<Renewal, "id" | "createdAt" | "updatedAt" | "renewedOn" | "extendedTo" | "terminatedOn">) =>
    request<Renewal>("/renewals", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Renewal>) =>
    request<Renewal>(`/renewals/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  renew: (id: string, term_months: number, notes?: string) =>
    request<{ message: string; renewal: Renewal }>(`/renewals/${id}/renew`, {
      method: "POST",
      body: JSON.stringify({ term_months, notes }),
    }),

  extend: (id: string, extend_months: number, notes?: string) =>
    request<{ message: string; renewal: Renewal }>(`/renewals/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ extend_months, notes }),
    }),

  terminate: (id: string, reason: string) =>
    request<{ message: string; renewal: Renewal }>(`/renewals/${id}/terminate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  delete: (id: string) =>
    request<{ message: string; id: string }>(`/renewals/${id}`, { method: "DELETE" }),
};

// ─── Stats API ────────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request<NotificationListResponse>("/notifications"),
  get: (id: number) => request<NotificationItem>(`/notifications/${id}`),
  create: (body: Omit<NotificationItem, "id">) =>
    request<NotificationItem>("/notifications", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<NotificationItem>) =>
    request<NotificationItem>(`/notifications/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) =>
    request<{ message: string; id: number }>(`/notifications/${id}`, { method: "DELETE" }),
};

export const auditLogsApi = {
  list: () => request<AuditLogListResponse>("/audit-logs"),
  get: (id: number) => request<AuditLogItem>(`/audit-logs/${id}`),
  create: (body: Omit<AuditLogItem, "id">) =>
    request<AuditLogItem>("/audit-logs", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<AuditLogItem>) =>
    request<AuditLogItem>(`/audit-logs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: number) =>
    request<{ message: string; id: number }>(`/audit-logs/${id}`, { method: "DELETE" }),
};

// ─── Stats API ────────────────────────────────────────────────────────────────
export const statsApi = {
  get: () =>
    request<{
      contracts: { total: number; active: number; expiring: number; pending: number; archived: number };
      renewals:  { total: number; critical: number; upcoming: number; scheduled: number };
      notifications: { total: number; unread: number };
      audit_logs: { total: number; failed: number };
    }>('/stats'),
};
