/**
 * requests.js — Pinia store for the Receptionist Dashboard
 *
 * Manages:
 *   - Request list (loaded from mock data or live API)
 *   - Selected request (drives the detail drawer)
 *   - Search / sort / filter state
 *   - Status update actions (confirm / deny / reopen)
 *   - Active tab state
 *
 * Future API integration:
 *   Replace the mock load in `loadRequests()` with a real fetch() to your
 *   n8n webhook endpoint. Replace `updateRequestStatus()` with a PATCH call.
 *   Both integration points are clearly marked below.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateMockRequests } from '@/composables/useRequestsMockData'
import { WEBHOOKS, WEBHOOKS_ENABLED } from '@/config/webhooks'

const VALID_TABS = new Set(['requests', 'contact'])

export const useRequestsStore = defineStore('requests', () => {

  // ── App shell state ──────────────────────────────────────────
  const activeTab    = ref('requests')
  const receptionistName = ref('Front Desk')
  const clinicName       = ref('Marketplace Dental Centre')

  // ── Request data ─────────────────────────────────────────────
  const requests   = ref([])
  const loading    = ref(false)
  const loadError  = ref(null)

  // ── UI state ─────────────────────────────────────────────────
  const selectedId = ref(null)
  const search     = ref('')
  const sortKey    = ref('submittedAt')   // 'submittedAt' | 'requestedDate'
  const sortDir    = ref('desc')          // 'asc' | 'desc'
  const filterStatus = ref('all')         // 'all' | 'pending' | 'completed' | 'denied'

  // ── Derived ──────────────────────────────────────────────────
  const selectedRequest = computed(() =>
    requests.value.find(r => r.id === selectedId.value) || null
  )

  const filtered = computed(() => {
    let list = requests.value

    // Status filter
    if (filterStatus.value !== 'all') {
      list = list.filter(r => r.status === filterStatus.value)
    }

    // Search (name or phone)
    const q = search.value.trim().toLowerCase()
    if (q) {
      list = list.filter(r =>
        r.fullName.toLowerCase().includes(q)
        || r.phone.toLowerCase().includes(q)
        || r.reason.toLowerCase().includes(q)
      )
    }

    // Sort
    list = [...list].sort((a, b) => {
      const aVal = a[sortKey.value] || ''
      const bVal = b[sortKey.value] || ''
      const cmp  = String(aVal).localeCompare(String(bVal))
      return sortDir.value === 'asc' ? cmp : -cmp
    })

    return list
  })

  const pendingCount    = computed(() => requests.value.filter(r => r.status === 'pending').length)
  const completedCount  = computed(() => requests.value.filter(r => r.status === 'completed').length)
  const deniedCount     = computed(() => requests.value.filter(r => r.status === 'denied').length)

  const todayCompleted = computed(() => {
    const today = new Date().toDateString()
    return requests.value.filter(r =>
      r.status === 'completed' && new Date(r.submittedAt).toDateString() === today
    ).length
  })

  // ── Actions ───────────────────────────────────────────────────

  function normalizeTab(tab) {
    return VALID_TABS.has(tab) ? tab : 'requests'
  }

  function loadTab(tab) {
    activeTab.value = normalizeTab(tab)
    selectedId.value = null
  }

  function selectRequest(id) {
    selectedId.value = selectedId.value === id ? null : id
  }

  function closeDrawer() {
    selectedId.value = null
  }

  function setSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'desc'
    }
  }

  function setFilter(status) {
    filterStatus.value = status
    selectedId.value = null
  }

  /**
   * Load requests.
   *
   * ── Integration point ────────────────────────────────────────
   * When VITE_ENABLE_WEBHOOKS=true:
   *   Replace `generateMockRequests()` with:
   *     const res  = await fetch(WEBHOOKS.requests, { cache: 'no-store' })
   *     const body = await res.json()
   *     requests.value = body.requests ?? body
   *
   * The n8n endpoint should respond with:
   *   { requests: [ { id, type, firstName, lastName, phone, reason,
   *                   requestedDate, requestedTime, submittedAt, status,
   *                   callSummary, sentiment, callId, notes, existingDate } ] }
   */
  async function loadRequests({ force = false } = {}) {
    if (loading.value) return

    loading.value = true
    loadError.value = null

    try {
      if (WEBHOOKS_ENABLED && WEBHOOKS.requests) {
        // ── Live API ─────────────────────────────────────────────
        const res  = await fetch(`${WEBHOOKS.requests}?_ts=${Date.now()}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        requests.value = Array.isArray(body) ? body : (body.requests ?? [])
        console.log('[NAP][REQUESTS] Loaded from API:', requests.value.length)
      } else {
        // ── Mock data ─────────────────────────────────────────────
        await new Promise(resolve => setTimeout(resolve, 320)) // simulate network
        requests.value = generateMockRequests()
        console.log('[NAP][REQUESTS] Loaded mock data:', requests.value.length)
      }
    } catch (err) {
      console.error('[NAP][REQUESTS] Load error:', err)
      loadError.value = err.message
      requests.value = generateMockRequests()
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a request's status (confirm / deny / reopen).
   *
   * ── Integration point ────────────────────────────────────────
   * When VITE_ENABLE_WEBHOOKS=true:
   *   After updating local state, PATCH to n8n for audit logging:
   *     await fetch(WEBHOOKS.updateStatus(id), {
   *       method: 'PATCH',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify({ status, updatedAt: new Date().toISOString() })
   *     })
   *
   * n8n can then update the Google Sheet row and send a confirmation.
   */
  async function updateRequestStatus(id, status) {
    const req = requests.value.find(r => r.id === id)
    if (!req) return
    const previousStatus = req.status

    // Optimistic local update
    req.status = status
    console.log(`[NAP][REQUESTS] Status updated: ${id} → ${status}`)

    if (WEBHOOKS_ENABLED && WEBHOOKS.updateStatus(id)) {
      try {
        const res = await fetch(WEBHOOKS.updateStatus(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        if (body?.request?.status) {
          req.status = body.request.status
        }
      } catch (err) {
        req.status = previousStatus
        console.warn('[NAP][REQUESTS] Status sync error (non-fatal):', err)
      }
    }
  }

  function init() {
    loadRequests()
  }

  return {
    // state
    activeTab,
    receptionistName,
    clinicName,
    requests,
    loading,
    loadError,
    selectedId,
    search,
    sortKey,
    sortDir,
    filterStatus,
    // computed
    selectedRequest,
    filtered,
    pendingCount,
    completedCount,
    deniedCount,
    todayCompleted,
    // actions
    loadTab,
    selectRequest,
    closeDrawer,
    setSort,
    setFilter,
    loadRequests,
    updateRequestStatus,
    init,
  }
})
