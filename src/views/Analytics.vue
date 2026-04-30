<template>
  <div class="analytics-page">
    <div class="page-header mb-6">
      <div>
        <h2 class="text-[26px] font-black tracking-tight mb-1">
          <span class="text-grad-primary">Analytics</span>
        </h2>
        <p class="text-sm text-nap-text-2">
          Calls, transcripts, and billing visibility from your AI receptionist.
        </p>
      </div>
      <button class="nap-btn nap-btn-primary refresh-btn" @click="loadAll()">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="glass-card loading-state">
      <div class="loading-spinner"></div>
      <span class="text-sm text-nap-text-3">Loading analytics...</span>
    </div>

    <template v-else>
      <div class="stats-row mb-6">
        <div class="stat-card">
          <div class="stat-title">Minutes Used</div>
          <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
          <template v-else>
            <div class="stat-num">{{ fmtNumber(overview.minutesUsed) }} / {{ fmtNumber(overview.minutesIncluded) }}</div>
            <div class="progress-wrap">
              <div class="progress-fill" :style="{ width: `${overview.billingPct || 0}%` }"></div>
            </div>
            <div class="stat-sub">{{ fmtNumber(overview.billingPct) }}% of plan</div>
          </template>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Calls This Month</div>
          <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
          <div v-else class="stat-num">{{ overview.totalCalls || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Overage Cost</div>
          <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
          <div v-else class="stat-num">{{ money(overview.overageUSD || 0) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Average Call Duration</div>
          <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
          <div v-else class="stat-num">{{ fmtDurationMin(overview.avgCallMin || 0) }}</div>
        </div>
      </div>

      <div class="glass-card section mb-6">
        <div class="section-head">
          <h3 class="section-title">Call Volume</h3>
          <select v-model.number="selectedRange" class="nap-input range-select">
            <option v-for="opt in rangeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div v-if="errors.analytics" class="section-error">{{ errors.analytics }}</div>
        <div v-else-if="analytics.length === 0" class="section-empty">No analytics data.</div>
        <div v-else class="chart-wrap">
          <div v-for="point in analytics" :key="point.label" class="chart-bar-col">
            <div class="chart-value">{{ point.calls || 0 }}</div>
            <div class="chart-bar-track">
              <div
                class="chart-bar-fill"
                :style="{ height: `${barHeight(point.calls)}%` }"
              ></div>
            </div>
            <div class="chart-label">{{ shortLabel(point.label) }}</div>
          </div>
        </div>
      </div>

      <div class="glass-card section mb-6">
        <h3 class="section-title mb-3">Recent Calls</h3>
        <div v-if="errors.calls" class="section-error">{{ errors.calls }}</div>
        <div v-else class="table-wrap">
          <table class="nap-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From Number</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Sentiment</th>
                <th>Has Recording</th>
                <th>Has Transcript</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="call in calls" :key="call.id" @click="openTranscript(call)" class="call-row">
                <td>{{ fmtDate(call.date) }}</td>
                <td class="font-mono">{{ fmtPhone(call.from) }}</td>
                <td>{{ fmtDurationMin(call.duration_min || 0) }}</td>
                <td>
                  <span :class="['badge', statusBadge(call.status)]">{{ displayStatus(call.status) }}</span>
                </td>
                <td>
                  <span :class="['badge', sentimentBadge(call.sentiment)]">{{ call.sentiment || 'Neutral' }}</span>
                </td>
                <td>{{ call.hasRecording ? 'Yes' : 'No' }}</td>
                <td>{{ call.hasTranscript ? 'Yes' : 'No' }}</td>
              </tr>
              <tr v-if="calls.length === 0">
                <td colspan="7" class="text-center py-4 text-nap-text-3">No calls found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="glass-card section">
        <div class="section-head">
          <h3 class="section-title">Invoices</h3>
          <select v-model="invoiceFilter" class="nap-input range-select">
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div v-if="errors.invoices" class="section-error">{{ errors.invoices }}</div>
        <div v-else class="table-wrap">
          <table class="nap-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Amount</th>
                <th>Minutes Used</th>
                <th>Status</th>
                <th>Date Generated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in filteredInvoices" :key="inv.id">
                <td>{{ inv.period }}</td>
                <td>{{ inv.amount }}</td>
                <td>{{ inv.minutes }}</td>
                <td>
                  <span :class="['badge', inv.paid ? 'badge-completed' : 'badge-pending']">
                    {{ inv.paid ? 'Paid' : 'Pending' }}
                  </span>
                </td>
                <td>{{ fmtDate(inv.date) }}</td>
              </tr>
              <tr v-if="filteredInvoices.length === 0">
                <td colspan="5" class="text-center py-4 text-nap-text-3">No invoices found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <Transition name="overlay">
      <div v-if="activeTranscript" class="drawer-overlay" @click="activeTranscript = null"></div>
    </Transition>
    <Transition name="drawer">
      <div v-if="activeTranscript" class="drawer-panel">
        <div class="drawer-header">
          <div>
            <div class="font-bold text-[15px]">{{ fmtDate(activeTranscript.date) }}</div>
            <div class="text-[12px] text-nap-text-3">{{ fmtDurationMin(activeTranscript.duration_min || 0) }}</div>
          </div>
          <button class="nap-btn" @click="activeTranscript = null">Close</button>
        </div>
        <div class="drawer-body">
          <div class="section-label">Summary</div>
          <div class="notes-box mb-3">{{ activeTranscript.summary || 'No summary available.' }}</div>
          <a v-if="activeTranscript.recording_url" :href="activeTranscript.recording_url" target="_blank" rel="noopener" class="recording-link">
            Open Recording
          </a>
          <div class="section-label mt-4">Conversation</div>
          <div class="chat-thread">
            <div
              v-for="(line, idx) in activeTranscript.transcript || []"
              :key="idx"
              :class="['chat-line', String(line.speaker).toLowerCase() === 'caller' ? 'chat-caller' : 'chat-ai']"
            >
              <div class="chat-speaker">{{ line.speaker }}</div>
              <div>{{ line.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const API_BASE = 'https://n8n.getnapsolutions.com/webhook'

const loading = ref(true)
const selectedRange = ref(1)
const invoiceFilter = ref('all')

const overview = ref({})
const analytics = ref([])
const calls = ref([])
const transcripts = ref([])
const invoices = ref([])

const activeTranscript = ref(null)

const errors = ref({
  overview: '',
  analytics: '',
  calls: '',
  transcripts: '',
  invoices: '',
})

const rangeOptions = [
  { label: 'Hourly', value: 0 },
  { label: 'Daily', value: 1 },
  { label: 'Weekly', value: 2 },
  { label: '2 Months', value: 3 },
  { label: '3 Months', value: 4 },
  { label: '6 Months', value: 5 },
  { label: 'Yearly', value: 6 },
  { label: 'All Time', value: 7 },
]

const transcriptByCallId = computed(() => {
  const map = new Map()
  for (const item of transcripts.value) {
    if (item?.call_id) map.set(item.call_id, item)
  }
  return map
})

const filteredInvoices = computed(() => {
  if (invoiceFilter.value === 'all') return invoices.value
  const paid = invoiceFilter.value === 'paid'
  return invoices.value.filter((inv) => Boolean(inv.paid) === paid)
})

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function loadAll() {
  loading.value = true
  errors.value = { overview: '', analytics: '', calls: '', transcripts: '', invoices: '' }

  const tasks = [
    fetchJson(`${API_BASE}/nap/overview`),
    fetchJson(`${API_BASE}/nap/analytics?range=${selectedRange.value}`),
    fetchJson(`${API_BASE}/nap/calls`),
    fetchJson(`${API_BASE}/nap/transcripts`),
    fetchJson(`${API_BASE}/nap/invoices`),
  ]

  const [ovRes, anRes, callsRes, txRes, invRes] = await Promise.allSettled(tasks)

  if (ovRes.status === 'fulfilled') overview.value = ovRes.value || {}
  else errors.value.overview = 'Failed to load overview.'

  if (anRes.status === 'fulfilled') analytics.value = Array.isArray(anRes.value) ? anRes.value : []
  else errors.value.analytics = 'Failed to load analytics.'

  if (callsRes.status === 'fulfilled') calls.value = Array.isArray(callsRes.value?.calls) ? callsRes.value.calls : []
  else errors.value.calls = 'Failed to load calls.'

  if (txRes.status === 'fulfilled') transcripts.value = Array.isArray(txRes.value?.transcripts) ? txRes.value.transcripts : []
  else errors.value.transcripts = 'Failed to load transcripts.'

  if (invRes.status === 'fulfilled') invoices.value = Array.isArray(invRes.value?.invoices) ? invRes.value.invoices : []
  else errors.value.invoices = 'Failed to load invoices.'

  loading.value = false
}

async function reloadAnalytics() {
  errors.value.analytics = ''
  try {
    const data = await fetchJson(`${API_BASE}/nap/analytics?range=${selectedRange.value}`)
    analytics.value = Array.isArray(data) ? data : []
  } catch (_error) {
    errors.value.analytics = 'Failed to load analytics.'
    analytics.value = []
  }
}

watch(selectedRange, () => {
  reloadAnalytics()
})

onMounted(() => {
  loadAll()
})

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })
}

function money(value) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmtDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDurationMin(durationMin) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMin || 0) * 60))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function fmtPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return String(value || '-')
}

function displayStatus(status) {
  return String(status || '').toLowerCase() === 'error' ? 'Failed' : String(status || 'unknown')
}

function statusBadge(status) {
  return String(status || '').toLowerCase() === 'error' ? 'badge-denied' : 'badge-completed'
}

function sentimentBadge(sentiment) {
  const s = String(sentiment || '').toLowerCase()
  if (s === 'positive') return 'badge-completed'
  if (s === 'negative') return 'badge-denied'
  return 'badge-edit'
}

function shortLabel(label) {
  if (!label) return '-'
  const d = new Date(`${label}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(label)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function barHeight(callsCount) {
  const max = Math.max(...analytics.value.map((p) => Number(p.calls || 0)), 1)
  return (Number(callsCount || 0) / max) * 100
}

function openTranscript(call) {
  const tx = transcriptByCallId.value.get(call.id)
  if (!tx) return
  activeTranscript.value = tx
}
</script>

<style scoped>
.analytics-page { position: relative; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.refresh-btn { padding: 9px 16px; font-size: 12px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { background: var(--grad-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 14px; }
.stat-title { font-size: 11px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; color: var(--c-text-3); margin-bottom: 8px; }
.stat-num { font-size: 24px; font-weight: 900; color: var(--c-text); }
.stat-sub { font-size: 11px; color: var(--c-text-3); margin-top: 5px; }
.stat-error { color: var(--c-danger); font-size: 12px; }
.progress-wrap { margin-top: 8px; height: 8px; border-radius: 999px; background: rgba(91,63,143,0.08); overflow: hidden; }
.progress-fill { height: 100%; background: var(--grad-accent); }
.section { padding: 16px; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.section-title { font-size: 16px; font-weight: 800; color: var(--c-text); }
.range-select { max-width: 180px; padding: 6px 10px; font-size: 12px; }
.section-error { color: var(--c-danger); font-size: 13px; }
.section-empty { color: var(--c-text-3); font-size: 13px; }
.chart-wrap { display: flex; align-items: flex-end; gap: 8px; min-height: 220px; padding: 8px; overflow-x: auto; }
.chart-bar-col { min-width: 58px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.chart-value { font-size: 11px; color: var(--c-text-3); }
.chart-bar-track { width: 36px; height: 150px; border-radius: 8px; background: rgba(91,63,143,0.08); display: flex; align-items: flex-end; overflow: hidden; }
.chart-bar-fill { width: 100%; background: var(--grad-primary); border-radius: 8px 8px 0 0; min-height: 4px; }
.chart-label { font-size: 10px; color: var(--c-text-3); text-align: center; }
.table-wrap { overflow-x: auto; }
.call-row { cursor: pointer; }
.call-row:hover { background: rgba(91,63,143,0.04); }
.loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 20px; }
.loading-spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--border-color); border-top-color: var(--c-teal);
  animation: spin 0.7s linear infinite;
}
.drawer-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(26,14,46,0.18);
  backdrop-filter: blur(2px);
}
.drawer-panel {
  position: fixed; top: 60px; right: 0; bottom: 0; width: 520px; z-index: 400;
  background: rgba(255,255,255,0.99); border-left: 1px solid var(--border-color);
  box-shadow: -8px 0 40px rgba(91,63,143,0.13); display: flex; flex-direction: column;
}
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border-color); }
.drawer-body { padding: 16px 18px; overflow-y: auto; }
.section-label { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--c-text-3); margin-bottom: 6px; }
.notes-box {
  font-size: 13px; color: var(--c-text-2); line-height: 1.6;
  background: rgba(91,63,143,0.03); border: 1px solid var(--border-color-light);
  border-radius: 10px; padding: 12px 14px;
}
.recording-link { color: var(--c-blue); font-size: 12px; text-decoration: underline; }
.chat-thread { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.chat-line { max-width: 86%; padding: 8px 10px; border-radius: 10px; font-size: 12px; line-height: 1.45; }
.chat-ai { align-self: flex-start; background: rgba(45,95,196,0.08); border: 1px solid rgba(45,95,196,0.2); }
.chat-caller { align-self: flex-end; background: rgba(0,168,138,0.08); border: 1px solid rgba(0,168,138,0.2); }
.chat-speaker { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 3px; color: var(--c-text-3); }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1080px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .stats-row { grid-template-columns: 1fr; }
  .drawer-panel { width: 100%; top: 0; }
}
</style>
