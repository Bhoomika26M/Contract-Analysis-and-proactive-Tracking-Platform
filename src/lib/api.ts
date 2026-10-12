/**
 * Thin fetch wrapper around the FastAPI backend.
 *
 * Every screen reads and writes through this module, so there is exactly one
 * place that knows the API base URL.
 */

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
export const API_BASE = (RAW_BASE || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; query?: Record<string, unknown> }

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function toMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    const detail = data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0]
      if (typeof first?.msg === 'string') return first.msg
    }
  } catch {
    /* non-JSON error body */
  }
  return `Request failed with status ${response.status}`
}

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { body, query, headers, ...rest } = options

  const finalHeaders = new Headers(headers)
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the ContractIQ API. Is the backend running?')
  }

  if (response.status === 204) return undefined as T
  if (!response.ok) throw new ApiError(response.status, await toMessage(response))

  const contentType = response.headers.get('Content-Type') || ''
  if (!contentType.includes('application/json')) return (await response.text()) as unknown as T
  return (await response.json()) as T
}

export const api = {
  get: <T,>(path: string, query?: Record<string, unknown>) => apiFetch<T>(path, { method: 'GET', query }),
  post: <T,>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  put: <T,>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PUT', body }),
  patch: <T,>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
  delete: <T,>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

/** Absolute URL for endpoints that return a file download. */
export function fileUrl(path: string): string {
  return `${API_BASE}${path}`
}

/** Triggers a browser download for an endpoint that returns a file. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await fetch(buildUrl(path))
  if (!response.ok) throw new ApiError(response.status, await toMessage(response))
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
