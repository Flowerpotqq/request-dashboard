/**
 * Webhook / API configuration for the NAP Receptionist Dashboard
 *
 * When VITE_ENABLE_WEBHOOKS=true, the dashboard makes live HTTP requests.
 * When false (default), built-in mock data is used.
 *
 * ── Future n8n integration ─────────────────────────────────────────────────
 *
 * The n8n "Anand Trial Receptionist" workflow routes function calls from the
 * Retell AI agent via a Switch node. For the receptionist dashboard to receive
 * live data, add a new n8n workflow that:
 *
 *   1. Listens on a POST webhook (triggered whenever book_appointment_cal,
 *      reschedule_appointment_cal, cancel_appointment_cal, or edit_appointment_cal
 *      fires from the Retell agent).
 *
 *   2. Normalizes the payload to the Request schema:
 *      { id, type, firstName, lastName, phone, reason, requestedDate,
 *        requestedTime, submittedAt, status, callSummary, sentiment, callId }
 *
 *   3. Appends the normalized row to your requests datastore (Google Sheets,
 *      Supabase, Airtable, etc.) and exposes a GET endpoint for this dashboard.
 *
 * The dashboard will:
 *   - GET  {REQUESTS_ENDPOINT}        → fetch all requests (JSON array)
 *   - PATCH {REQUESTS_ENDPOINT}/:id   → update status { status: 'completed'|'denied'|'pending' }
 *
 * Note: check_availability_cal and lookup_appointment_cal do NOT create
 * request submissions and should be excluded from the webhook routing.
 */

const ENABLE_WEBHOOKS = String(import.meta.env.VITE_ENABLE_WEBHOOKS ?? 'false').toLowerCase() === 'true'
const API_BASE_URL    = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const CLIENT_ID       = String(import.meta.env.VITE_CLIENT_ID ?? '').trim()
const CLINIC_ID       = String(import.meta.env.VITE_CLINIC_ID ?? '').trim()
const WEBHOOK_BASE    = String(import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ?? '').replace(/\/$/, '')

function endpoint(path) {
  if (!ENABLE_WEBHOOKS) return ''
  const cleanedPath = String(path).replace(/^\/+/, '')
  if (API_BASE_URL) {
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
  /** GET  → returns { requests: Request[] }  */
  requests: endpoint('requests'),

  /** PATCH → body: { status: 'completed'|'denied'|'pending' }
   *  Future: used to sync status changes back to n8n / Google Sheets */
  updateStatus: (id) => ENABLE_WEBHOOKS ? endpoint(`requests/${id}`) : '',
}

export const WEBHOOKS_ENABLED = ENABLE_WEBHOOKS
