import { TENANT_CONTEXT } from '@/config/tenant'

const ENABLE_WEBHOOKS = String(import.meta.env.VITE_ENABLE_WEBHOOKS ?? 'false').toLowerCase() === 'true'
const ENV_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const API_BASE_URL = ENV_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '')
const CLIENT_ID = String(import.meta.env.VITE_CLIENT_ID ?? '').trim()
const CLINIC_ID = String(import.meta.env.VITE_CLINIC_ID ?? '').trim()
const WEBHOOK_BASE = String(import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ?? '').replace(/\/$/, '')

function endpoint(path) {
  if (!ENABLE_WEBHOOKS) return ''

  const cleanedPath = String(path).replace(/^\/+/, '')

  if (API_BASE_URL) {
    if (TENANT_CONTEXT.accessToken) {
      return `${API_BASE_URL}/api/link/${encodeURIComponent(TENANT_CONTEXT.accessToken)}/queue/${cleanedPath}`
    }

    if (CLIENT_ID && CLINIC_ID) {
      return `${API_BASE_URL}/api/${CLIENT_ID}/${CLINIC_ID}/${cleanedPath}`
    }

    return `${API_BASE_URL}/api/${cleanedPath}`
  }

  if (WEBHOOK_BASE) {
    return `${WEBHOOK_BASE}/nap/${cleanedPath}`
  }

  return ''
}

export const WEBHOOKS = {
  requests: endpoint('requests'),
  updateStatus: (id) => ENABLE_WEBHOOKS ? endpoint(`requests/${id}`) : '',
}

export const WEBHOOKS_ENABLED = ENABLE_WEBHOOKS
