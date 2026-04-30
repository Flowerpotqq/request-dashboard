<template>
  <!-- Overlay -->
  <Transition name="overlay">
    <div
      v-if="request"
      class="drawer-overlay"
      @click="$emit('close')"
    ></div>
  </Transition>

  <!-- Drawer panel -->
  <Transition name="drawer">
    <div v-if="request" class="drawer-panel">

      <!-- Header -->
      <div class="drawer-header">
        <div class="flex items-center gap-3 min-w-0">
          <span :class="['badge', typeBadgeClass]">{{ typeLabel }}</span>
          <StatusBadge :status="request.status" />
        </div>
        <button class="close-btn" @click="$emit('close')" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="drawer-body">

        <!-- Patient info -->
        <div class="section-block">
          <div class="section-label">Patient Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Full Name</div>
              <div class="info-value font-semibold text-nap-text">{{ request.fullName }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone Number</div>
              <div class="info-value font-mono">{{ formatPhone(request.phone) }}</div>
            </div>
            <div v-if="patientDateOfBirth" class="info-item">
              <div class="info-label">Date of Birth</div>
              <div class="info-value">{{ patientDateOfBirth }}</div>
            </div>
            <div v-if="patientStatus" class="info-item">
              <div class="info-label">Patient Status</div>
              <div class="info-value">{{ patientStatus }}</div>
            </div>
          </div>
        </div>

        <!-- Request details -->
        <div class="section-block">
          <div class="section-label">Request Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">{{ request.type === 'reschedule' ? 'Requested New Date' : 'Requested Date' }}</div>
              <div class="info-value">{{ formatDate(request.requestedDate) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ request.type === 'reschedule' ? 'Requested New Time' : 'Requested Time' }}</div>
              <div class="info-value">{{ request.requestedTime || '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Reason</div>
              <div class="info-value">{{ request.reason || '—' }}</div>
            </div>
            <div class="info-item" v-if="request.existingDate">
              <div class="info-label">Original Appointment</div>
              <div class="info-value">{{ formatDateTime(request.existingDate) }}</div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="request.notes" class="section-block">
          <div class="section-label">Notes</div>
          <div class="notes-box">{{ request.notes }}</div>
        </div>

        <!-- Call summary -->
        <div v-if="showCallSummary" class="section-block">
          <div class="section-label">AI Call Summary</div>
          <div class="notes-box summary-box">{{ request.callSummary }}</div>
        </div>

        <!-- Metadata -->
        <div class="section-block">
          <div class="section-label">Submission Info</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Submitted At</div>
              <div class="info-value font-mono text-xs">{{ formatDateTime(request.submittedAt) }}</div>
            </div>
            <div class="info-item" v-if="request.sentiment">
              <div class="info-label">Caller Sentiment</div>
              <div class="info-value">
                <span :class="['sentiment-chip', sentimentClass]">{{ request.sentiment }}</span>
              </div>
            </div>
            <div class="info-item" v-if="request.callId">
              <div class="info-label">Call ID</div>
              <div class="info-value font-mono text-xs text-nap-text-3">{{ request.callId }}</div>
            </div>
          </div>
        </div>

        <!-- Receptionist-friendly booking context -->
        <div v-if="payloadEntries.length" class="section-block">
          <div class="section-label">Booking Context</div>
          <div class="info-grid">
            <div
              v-for="entry in payloadEntries"
              :key="entry.key"
              class="info-item"
            >
              <div class="info-label">{{ entry.label }}</div>
              <div class="info-value" :class="{ 'font-mono text-xs': entry.mono }">
                {{ entry.value }}
              </div>
            </div>
          </div>
        </div>

        <!-- Operational note -->
        <div class="ops-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            This is a request only. The receptionist must manually handle the calendar action in the booking system.
          </span>
        </div>

      </div>

      <!-- Footer actions -->
      <div class="drawer-footer">
        <div v-if="request.status === 'pending'" class="action-row">
          <button
            class="nap-btn nap-btn-confirm action-btn"
            :disabled="updating"
            @click="handleConfirm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Mark as Completed
          </button>
          <button
            class="nap-btn nap-btn-deny action-btn"
            :disabled="updating"
            @click="handleDeny"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Deny Request
          </button>
        </div>
        <div v-if="canRemoveGoogleCalendarHold" class="mt-2">
          <button
            class="nap-btn action-btn remove-hold-btn"
            :disabled="updating"
            @click="handleRemoveGoogleCalendarHold"
          >
            Remove Google Calendar Hold
          </button>
        </div>

        <div v-else class="status-resolved">
          <StatusBadge :status="request.status" />
          <span class="text-[12px] text-nap-text-3">
            {{ request.status === 'denied' ? 'Request was denied.' : 'Handled manually by receptionist.' }}
          </span>
          <button class="nap-btn reopen-btn" @click="handleReopen">
            Reopen
          </button>
        </div>
      </div>

      <Transition name="overlay">
        <div v-if="toastMessage" :class="['drawer-toast', toastType === 'error' ? 'drawer-toast-error' : 'drawer-toast-success']">
          {{ toastMessage }}
        </div>
      </Transition>

    </div>
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const props = defineProps({
  request: { type: Object, default: null }
})

const emit = defineEmits(['close'])
const store = useRequestsStore()
const updating = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null

const typeBadgeClass = computed(() => {
  switch (props.request?.type) {
    case 'book':        return 'badge-book'
    case 'reschedule':  return 'badge-reschedule'
    case 'edit':        return 'badge-edit'
    case 'cancel':      return 'badge-cancel'
    default:            return ''
  }
})

const typeLabel = computed(() => {
  switch (props.request?.type) {
    case 'book':        return '📅 Book Appointment'
    case 'reschedule':  return '🔄 Reschedule'
    case 'edit':        return '✏️ Edit Details'
    case 'cancel':      return '✕ Cancel Appointment'
    default:            return props.request?.type || 'Request'
  }
})

const sentimentClass = computed(() => {
  const s = (props.request?.sentiment || '').toLowerCase()
  if (s === 'positive') return 'sentiment-positive'
  if (s === 'negative') return 'sentiment-negative'
  return 'sentiment-neutral'
})

const showCallSummary = computed(() => {
  const summary = (props.request?.callSummary || '').trim()
  const notes = (props.request?.notes || '').trim()
  if (!summary) return false
  if (notes && summary === notes) return false
  return true
})

const canRemoveGoogleCalendarHold = computed(() => {
  const payload = props.request?.rawPayload
  return Boolean(
    payload?.delete_enabled === true
    && payload?.delete_payload?.calendar_event_id,
  )
})

const payloadEntries = computed(() => {
  const payload = props.request?.rawPayload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return []

  const labelMap = {
    practitioner: 'Practitioner',
    appointment_type: 'Appointment Type',
    duration_minutes: 'Duration',
    calendar_event_id: 'Calendar Event ID',
    confirmation_message: 'Confirmation Message',
  }

  const keyOrder = [
    'practitioner',
    'appointment_type',
    'duration_minutes',
    'calendar_event_id',
    'confirmation_message',
  ]

  const derivedValues = {
    appointment_type: payload.appointment_type ?? payload.reason ?? props.request?.reason ?? '',
  }

  function toTitleCase(text) {
    return String(text)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function toDisplayValue(key, rawValue) {
    if (rawValue == null || rawValue === '') return '-'

    if (typeof rawValue === 'boolean') return rawValue ? 'Yes' : 'No'

    if (key === 'is_new_patient') {
      const v = String(rawValue).trim().toLowerCase()
      if (v === 'yes' || v === 'true') return 'Yes'
      if (v === 'no' || v === 'false') return 'No'
    }

    if (key === 'date_of_birth') {
      const d = new Date(String(rawValue))
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
    }

    if (key === 'duration_minutes') {
      const n = Number(rawValue)
      if (Number.isFinite(n)) return `${n} min`
    }

    if (key === 'appointment_type') {
      const clean = String(rawValue).replace(/^=/, '').trim()
      return clean ? toTitleCase(clean) : '-'
    }

    if (typeof rawValue === 'object') return JSON.stringify(rawValue)
    return String(rawValue).replace(/^=/, '')
  }

  return keyOrder
    .filter((key) => Object.prototype.hasOwnProperty.call(payload, key) || derivedValues[key])
    .map((key) => {
      const rawValue = Object.prototype.hasOwnProperty.call(payload, key)
        ? payload[key]
        : derivedValues[key]
      const value = toDisplayValue(key, rawValue)
      return {
        key,
        label: labelMap[key] || key.replace(/_/g, ' '),
        value,
        mono: key === 'calendar_event_id' || key === 'calendar_id',
      }
    })
})

const patientDateOfBirth = computed(() => {
  const raw = props.request?.rawPayload?.date_of_birth
  if (!raw) return ''
  const clean = String(raw).replace(/^=/, '').trim()
  const d = new Date(clean)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return clean
})

const patientStatus = computed(() => {
  const raw = props.request?.rawPayload?.patient_status
  if (!raw) return ''
  return String(raw).replace(/^=/, '').trim()
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return ts
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

async function handleConfirm() {
  if (!props.request || updating.value) return
  updating.value = true
  try {
    await store.updateRequestStatus(props.request.id, 'completed')
  } finally {
    updating.value = false
  }
}

async function handleDeny() {
  if (!props.request || updating.value) return
  updating.value = true
  try {
    await store.updateRequestStatus(props.request.id, 'denied')
  } finally {
    updating.value = false
  }
}

async function handleReopen() {
  if (!props.request || updating.value) return
  updating.value = true
  try {
    await store.updateRequestStatus(props.request.id, 'pending')
  } finally {
    updating.value = false
  }
}

function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

async function handleRemoveGoogleCalendarHold() {
  const request = props.request
  const payload = request?.rawPayload?.delete_payload
  if (!request || !payload) return

  const confirmed = window.confirm('Remove the temporary Google Calendar hold?')
  if (!confirmed) return

  updating.value = true
  try {
    await store.removeGoogleCalendarHold(request.id, {
      calendar_event_id: payload.calendar_event_id,
      calendar_id: payload.calendar_id,
      practitioner: payload.practitioner,
    })
    showToast('Calendar hold removed', 'success')
  } catch (_error) {
    showToast('Failed to remove calendar hold', 'error')
  } finally {
    updating.value = false
  }
}

function formatPhone(value) {
  if (!value) return '-'
  const digits = String(value).replace(/\D/g, '')
  const normalized = digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits

  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`
  }

  return String(value).trim()
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(26,14,46,0.18);
  backdrop-filter: blur(2px);
}

.drawer-panel {
  position: fixed; top: 60px; right: 0; bottom: 0;
  width: 440px; z-index: 400;
  background: rgba(255,255,255,0.99);
  border-left: 1px solid var(--border-color);
  box-shadow: -8px 0 40px rgba(91,63,143,0.13);
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* Header */
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px 16px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(255,255,255,0.98);
  flex-shrink: 0;
}
.close-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--c-text-3);
  transition: background .14s, color .14s; flex-shrink: 0;
}
.close-btn:hover { background: rgba(91,63,143,0.07); color: var(--c-text); }

/* Body */
.drawer-body {
  flex: 1; overflow-y: auto; padding: 20px 22px;
  display: flex; flex-direction: column; gap: 20px;
}

.section-block { display: flex; flex-direction: column; gap: 10px; }
.section-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: 1.6px;
  text-transform: uppercase; color: var(--c-text-3);
  padding-bottom: 6px; border-bottom: 1px solid var(--border-color-light);
}
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { display: flex; flex-direction: column; gap: 3px; }
.info-label {
  font-size: 9.5px; font-weight: 700; color: var(--c-text-3);
  text-transform: uppercase; letter-spacing: 0.9px;
}
.info-value { font-size: 13px; color: var(--c-text-2); line-height: 1.4; }

.notes-box {
  font-size: 13px; color: var(--c-text-2); line-height: 1.6;
  background: rgba(91,63,143,0.03); border: 1px solid var(--border-color-light);
  border-radius: 10px; padding: 12px 14px;
}
.summary-box { background: rgba(0,168,138,0.03); border-color: rgba(0,168,138,0.12); }

.sentiment-chip {
  display: inline-block; padding: 2px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
}
.sentiment-positive { background: var(--ok-light); color: var(--c-teal); border: 1px solid var(--ok-border); }
.sentiment-negative { background: var(--danger-light); color: var(--c-danger); border: 1px solid var(--danger-border); }
.sentiment-neutral  { background: rgba(91,63,143,0.06); color: var(--c-text-3); border: 1px solid var(--border-color); }

.ops-note {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(45,95,196,0.04); border: 1px solid rgba(45,95,196,0.14);
  font-size: 11.5px; color: var(--c-blue); line-height: 1.5;
}

/* Footer */
.drawer-footer {
  padding: 16px 22px;
  border-top: 1px solid var(--border-color);
  background: rgba(255,255,255,0.98);
  flex-shrink: 0;
}
.action-row { display: flex; gap: 10px; }
.action-btn { flex: 1; justify-content: center; padding: 10px 14px; font-size: 12.5px; }
.status-resolved {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.reopen-btn {
  margin-left: auto; padding: 6px 12px; font-size: 11px;
}

.remove-hold-btn {
  width: 100%;
  justify-content: center;
}

.drawer-toast {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 600;
  padding: 8px 12px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.drawer-toast-success {
  background: var(--ok-light);
  color: var(--c-teal-dark);
  border-color: var(--ok-border);
}

.drawer-toast-error {
  background: var(--danger-light);
  color: #b02040;
  border-color: var(--danger-border);
}
</style>
