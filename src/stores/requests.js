import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const VALID_TABS = new Set(['requests', 'analytics'])
const AUTO_REFRESH_MS = 8000

const API_BASE_URL = 'https://dashboard.getnapsolutions.com'

function getTokenFromUrl() {
  if (typeof window === 'undefined') return ''
  const match = window.location.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
  return match?.[1] ? decodeURIComponent(match[1]).trim() : ''
}

function buildRequestsUrl(token) {
  if (!token) return ''
  return `${API_BASE_URL}/api/link/${encodeURIComponent(token)}/queue/requests`
}

function buildStatusUrl(token, id) {
  if (!token) return ''
  return `${API_BASE_URL}/api/link/${encodeURIComponent(token)}/queue/requests/${id}`
}

function buildDeleteGcalHoldUrl(token, id) {
  if (!token) return ''
  return `${API_BASE_URL}/api/link/${encodeURIComponent(token)}/queue/requests/${id}/delete-gcal-hold`
}

export const useRequestsStore = defineStore('requests', () => {
  const activeTab = ref('requests')
  const receptionistName = ref('Front Desk')
  const clinicName = ref('')
  const clientId = ref('')
  const clinicId = ref('')

  const requests = ref([])
  const loading = ref(false)
  const loadError = ref(null)

  const selectedId = ref(null)
  const search = ref('')
  const sortKey = ref('submittedAt')
  const sortDir = ref('desc')
  const filterStatus = ref('all')
  const refreshTimer = ref(null)
  const visibilityListenerBound = ref(false)

  const selectedRequest = computed(() =>
    requests.value.find((request) => request.id === selectedId.value) || null,
  )

  const filtered = computed(() => {
    let list = requests.value

    if (filterStatus.value !== 'all') {
      list = list.filter((request) => request.status === filterStatus.value)
    }

    const query = search.value.trim().toLowerCase()
    if (query) {
      list = list.filter((request) =>
        request.fullName.toLowerCase().includes(query)
        || request.phone.toLowerCase().includes(query)
        || request.reason.toLowerCase().includes(query),
      )
    }

    list = [...list].sort((left, right) => {
      const leftValue = left[sortKey.value] || ''
      const rightValue = right[sortKey.value] || ''
      const comparison = String(leftValue).localeCompare(String(rightValue))
      return sortDir.value === 'asc' ? comparison : -comparison
    })

    return list
  })

  const pendingCount = computed(() => requests.value.filter((request) => request.status === 'pending').length)
  const completedCount = computed(() => requests.value.filter((request) => request.status === 'completed').length)
  const deniedCount = computed(() => requests.value.filter((request) => request.status === 'denied').length)

  const todayCompleted = computed(() => {
    const today = new Date().toDateString()
    return requests.value.filter((request) =>
      request.status === 'completed'
      && new Date(request.submittedAt).toDateString() === today,
    ).length
  })

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
      return
    }
    sortKey.value = key
    sortDir.value = 'desc'
  }

  function setFilter(status) {
    filterStatus.value = status
    selectedId.value = null
  }

  async function loadRequests(options = {}) {
    const silent = Boolean(options.silent)
    if (loading.value && !silent) return

    if (!silent) {
      loading.value = true
      loadError.value = null
    }

    try {
      const token = (function() {
        if (typeof window === 'undefined') return ''
        const match = window.location.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
        return match?.[1] ? decodeURIComponent(match[1]).trim() : ''
      })()

      if (!token) {
        if (!silent) requests.value = []
        return
      }

      const url = `https://dashboard.getnapsolutions.com/api/link/${encodeURIComponent(token)}/queue/requests`

      const response = await fetch(`${url}?_ts=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const body = await response.json()
      requests.value = Array.isArray(body) ? body : (body.requests ?? [])

      if (body?.tenant) {
        receptionistName.value = body.tenant.receptionistName || receptionistName.value
        clinicName.value = body.tenant.clinicName || clinicName.value
        clientId.value = body.tenant.clientId || clientId.value
        clinicId.value = body.tenant.clinicId || clinicId.value
      }

    } catch (error) {
      console.error('[NAP][REQUESTS] Load error:', error)
      if (!silent) {
        loadError.value = error.message
        requests.value = []
      }
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  function startAutoRefresh() {
    if (typeof window === 'undefined' || refreshTimer.value) return

    refreshTimer.value = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      loadRequests({ silent: true })
    }, AUTO_REFRESH_MS)
  }

  function bindVisibilityRefresh() {
    if (typeof window === 'undefined' || visibilityListenerBound.value) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadRequests({ silent: true })
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    visibilityListenerBound.value = true
  }

  async function updateRequestStatus(id, status) {
    const request = requests.value.find((entry) => entry.id === id)
    if (!request) return

    const previousStatus = request.status
    request.status = status

    const token = (function() {
      if (typeof window === 'undefined') return ''
      const match = window.location.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
      return match?.[1] ? decodeURIComponent(match[1]).trim() : ''
    })()

    if (!token) return

    const url = `https://dashboard.getnapsolutions.com/api/link/${encodeURIComponent(token)}/queue/requests/${id}`

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          updatedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const body = await response.json()
      if (body?.request?.status) {
        request.status = body.request.status
      }
    } catch (error) {
      request.status = previousStatus
      console.warn('[NAP][REQUESTS] Status sync error (non-fatal):', error)
    }
  }

  async function removeGoogleCalendarHold(id, payload) {
    const request = requests.value.find((entry) => entry.id === id)
    if (!request) {
      throw new Error('Request not found.')
    }

    const token = (function() {
      if (typeof window === 'undefined') return ''
      const match = window.location.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
      return match?.[1] ? decodeURIComponent(match[1]).trim() : ''
    })()

    if (!token) {
      throw new Error('Missing access token.')
    }

    const url = buildDeleteGcalHoldUrl(token, id)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const body = await response.json().catch(() => null)
    if (!response.ok || !body?.success) {
      throw new Error(body?.error || `HTTP ${response.status}`)
    }

    request.gcalDeleted = true
    request.calendarEventId = null
    request.status = 'booked_in_jane'

    if (request.rawPayload && typeof request.rawPayload === 'object') {
      request.rawPayload.delete_enabled = false
      if (request.rawPayload.delete_payload && typeof request.rawPayload.delete_payload === 'object') {
        request.rawPayload.delete_payload.calendar_event_id = null
      }
    }

    if (body?.request) {
      Object.assign(request, body.request)
    }

    return body
  }

  function init() {
    loadRequests()
    startAutoRefresh()
    bindVisibilityRefresh()
  }

  return {
    activeTab,
    receptionistName,
    clinicName,
    clientId,
    clinicId,
    requests,
    loading,
    loadError,
    selectedId,
    search,
    sortKey,
    sortDir,
    filterStatus,
    selectedRequest,
    filtered,
    pendingCount,
    completedCount,
    deniedCount,
    todayCompleted,
    loadTab,
    selectRequest,
    closeDrawer,
    setSort,
    setFilter,
    loadRequests,
    updateRequestStatus,
    removeGoogleCalendarHold,
    startAutoRefresh,
    stopAutoRefresh,
    init,
  }
})
