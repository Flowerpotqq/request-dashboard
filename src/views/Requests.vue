<template>
  <div class="requests-page">

    <!-- Page header -->
    <div class="page-header mb-6">
      <div>
        <h2 class="text-[26px] font-black tracking-tight mb-1">
          <span class="text-grad-primary">Request Queue</span>
        </h2>
        <p class="text-sm text-nap-text-2">
          AI-collected appointment requests - review and handle each one manually.
        </p>
      </div>
      <button class="nap-btn nap-btn-primary refresh-btn" @click="store.loadRequests({ force: true })">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Stats row -->
    <div class="stats-row mb-6 animate-tab-enter">
      <div class="stat-card" @click="store.setFilter('all')">
        <div class="stat-num" style="color:var(--c-purple)">{{ store.requests.length }}</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card stat-clickable" @click="store.setFilter('pending')">
        <div class="stat-num" style="color:var(--c-amber)">{{ store.pendingCount }}</div>
        <div class="stat-label">Pending Review</div>
        <div v-if="store.pendingCount > 0" class="stat-pulse"></div>
      </div>
      <div class="stat-card stat-clickable" @click="store.setFilter('completed')">
        <div class="stat-num" style="color:var(--c-teal)">{{ store.completedCount }}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card stat-clickable" @click="store.setFilter('denied')">
        <div class="stat-num" style="color:var(--c-danger)">{{ store.deniedCount }}</div>
        <div class="stat-label">Denied</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar mb-4 animate-tab-enter" style="animation-delay:60ms">

      <!-- Search -->
      <div class="search-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="store.search"
          class="nap-input search-input"
          placeholder="Search by name or phone number..."
        />
        <button v-if="store.search" class="search-clear" @click="store.search = ''">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Sort control -->
      <div class="sort-group">
        <span class="sort-label">Sort by</span>
        <button
          :class="['sort-btn', store.sortKey === 'submittedAt' ? 'sort-active' : '']"
          @click="store.setSort('submittedAt')"
        >
          Submitted
          <svg v-if="store.sortKey === 'submittedAt'" class="sort-arrow" :style="{ transform: store.sortDir === 'asc' ? 'rotate(180deg)' : 'rotate(0)' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button
          :class="['sort-btn', store.sortKey === 'requestedDate' ? 'sort-active' : '']"
          @click="store.setSort('requestedDate')"
        >
          Req. Date
          <svg v-if="store.sortKey === 'requestedDate'" class="sort-arrow" :style="{ transform: store.sortDir === 'asc' ? 'rotate(180deg)' : 'rotate(0)' }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <!-- Status filter tabs -->
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs" :key="tab.key"
          :class="['filter-tab', store.filterStatus === tab.key ? 'filter-tab-active' : '']"
          @click="store.setFilter(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.count != null" :class="['filter-count', store.filterStatus === tab.key ? 'filter-count-active' : '']">{{ tab.count }}</span>
        </button>
      </div>

    </div>

    <!-- Loading state -->
    <div v-if="store.loading" class="glass-card loading-state animate-tab-enter">
      <div class="loading-spinner"></div>
      <span class="text-sm text-nap-text-3">Loading request queue...</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="store.filtered.length === 0" class="glass-card empty-state animate-tab-enter">
      <div class="empty-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
      </div>
      <div class="text-[15px] font-bold text-nap-text mb-1">
        {{ store.search || store.filterStatus !== 'all' ? 'No matching requests' : 'No requests yet' }}
      </div>
      <div class="text-sm text-nap-text-3">
        {{ store.search ? `No requests matching "${store.search}"` : store.filterStatus !== 'all' ? `No ${store.filterStatus} requests found.` : 'Requests will appear here when the AI receptionist collects them.' }}
      </div>
      <button v-if="store.search || store.filterStatus !== 'all'" class="nap-btn mt-4" @click="clearFilters">
        Clear filters
      </button>
    </div>

    <!-- Request table -->
    <template v-else>
      <div
        class="glass-card overflow-hidden animate-tab-enter"
        style="animation-delay:100ms"
        :class="{ 'table-drawer-open': store.selectedId }"
      >
        <table class="nap-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Patient</th>
              <th>Phone</th>
              <th
                class="sortable"
                @click="store.setSort('requestedDate')"
              >
                <span class="flex items-center gap-1.5">
                  Req. Date &amp; Time
                  <svg v-if="store.sortKey === 'requestedDate'" :style="{ transform: store.sortDir === 'asc' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .18s' }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </th>
              <th
                class="sortable"
                @click="store.setSort('submittedAt')"
              >
                <span class="flex items-center gap-1.5">
                  Submitted
                  <svg v-if="store.sortKey === 'submittedAt'" :style="{ transform: store.sortDir === 'asc' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .18s' }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(req, i) in paginated"
              :key="req.id"
              :class="[
                'request-row',
                req.status === 'pending' ? 'row-pending' : '',
                store.selectedId === req.id ? 'row-selected' : ''
              ]"
              :style="{ animationDelay: `${i * 30}ms` }"
              @click="store.selectRequest(req.id)"
            >
              <!-- Type -->
              <td>
                <span :class="['badge', typeBadgeClass(req.type)]">{{ typeLabel(req.type) }}</span>
              </td>

              <!-- Patient name -->
              <td>
                <div class="font-semibold text-nap-text text-[13px]">{{ req.fullName }}</div>
                <div class="text-[11px] text-nap-text-3 mt-0.5">{{ formatAppointmentType(req.reason) }}</div>
              </td>

              <!-- Phone -->
              <td class="font-mono text-[12px] text-nap-text-2 whitespace-nowrap">
                {{ formatPhone(req.phone) }}
              </td>

              <!-- Requested date -->
              <td class="whitespace-nowrap">
                <div class="text-[13px] text-nap-text-2 font-medium">{{ formatShortDate(req.requestedDate) }}</div>
                <div class="text-[11px] text-nap-text-3 mt-0.5">{{ req.requestedTime }}</div>
              </td>

              <!-- Submitted -->
              <td class="whitespace-nowrap">
                <div class="text-[12px] text-nap-text-3">{{ formatRelative(req.submittedAt) }}</div>
                <div class="text-[10px] text-nap-text-4 mt-0.5 font-mono">{{ formatTime(req.submittedAt) }}</div>
              </td>

              <!-- Status -->
              <td>
                <StatusBadge :status="req.status" />
              </td>

              <!-- Chevron -->
              <td class="chevron-cell">
                <svg
                  :style="{ transform: store.selectedId === req.id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s ease' }"
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e82a0" stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4 text-[12px] text-nap-text-3">
        <span>Showing {{ paginated.length }} of {{ store.filtered.length }} requests</span>
        <div v-if="totalPages > 1" class="flex gap-1.5">
          <button
            v-for="p in totalPages" :key="p"
            :class="['page-btn', page === p ? 'page-active' : '']"
            @click="page = p"
          >{{ p }}</button>
        </div>
      </div>
    </template>

  </div>

  <!-- Request detail drawer -->
  <RequestDrawer
    :request="store.selectedRequest"
    @close="store.closeDrawer()"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import RequestDrawer from '@/components/RequestDrawer.vue'

const store = useRequestsStore()

const page = ref(1)
const PER_PAGE = 15

const filterTabs = computed(() => [
  { key: 'all', label: 'All', count: store.requests.length },
  { key: 'pending', label: 'Pending', count: store.pendingCount },
  { key: 'completed', label: 'Completed', count: store.completedCount },
  { key: 'denied', label: 'Denied', count: store.deniedCount },
])

// Reset page on filter/search change
watch([() => store.search, () => store.filterStatus, () => store.sortKey, () => store.sortDir], () => {
  page.value = 1
})

const totalPages = computed(() => Math.max(1, Math.ceil(store.filtered.length / PER_PAGE)))
const paginated = computed(() => {
  const start = (page.value - 1) * PER_PAGE
  return store.filtered.slice(start, start + PER_PAGE)
})

function clearFilters() {
  store.search = ''
  store.setFilter('all')
}

function typeBadgeClass(type) {
  const map = { book: 'badge-book', reschedule: 'badge-reschedule', edit: 'badge-edit', cancel: 'badge-cancel' }
  return map[type] || ''
}

function typeLabel(type) {
  const map = { book: 'Book', reschedule: 'Reschedule', edit: 'Edit', cancel: 'Cancel' }
  return map[type] || type
}

function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatRelative(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAppointmentType(value) {
  if (!value) return '-'
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
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
.requests-page {
  position: relative;
}

/* Page header */
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
}
.refresh-btn { padding: 9px 16px; font-size: 12px; flex-shrink: 0; }

/* Stats */
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.stat-card {
  background: var(--grad-card); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 16px 18px;
  backdrop-filter: blur(20px); box-shadow: var(--shadow-nap);
  position: relative; overflow: hidden; cursor: default;
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease;
}
.stat-card.stat-clickable { cursor: pointer; }
.stat-card.stat-clickable:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat-card::before {
  content: ''; position: absolute; inset: 0; border-radius: 14px;
  background: linear-gradient(145deg, rgba(255,255,255,0.7) 0%, transparent 60%);
  pointer-events: none;
}
.stat-num {
  font-size: 32px; font-weight: 900; line-height: 1; margin-bottom: 6px;
  position: relative; z-index: 1;
}
.stat-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: 1.4px;
  text-transform: uppercase; color: var(--c-text-3);
  position: relative; z-index: 1;
}
.stat-pulse {
  position: absolute; top: 12px; right: 12px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--c-amber); box-shadow: 0 0 6px var(--c-amber);
  animation: pulse-glow 1.4s ease-in-out infinite;
}

/* Toolbar */
.toolbar {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
}
.search-wrap {
  position: relative; flex: 1; min-width: 240px;
}
.search-icon {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: #8e82a0; pointer-events: none;
}
.search-input { padding-left: 34px; padding-right: 32px; }
.search-clear {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; border-radius: 50%; border: none;
  background: rgba(142,130,160,0.15); color: #8e82a0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s; padding: 0;
}
.search-clear:hover { background: rgba(224,92,92,0.18); color: #e05c5c; }

.sort-group {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.sort-label { font-size: 11px; font-weight: 700; color: var(--c-text-3); white-space: nowrap; }
.sort-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 11px; border-radius: 8px;
  border: 1px solid var(--border-color); background: rgba(255,255,255,0.8);
  font-size: 11.5px; font-weight: 600; color: var(--c-text-2);
  cursor: pointer; font-family: inherit;
  transition: background .14s, color .14s, border-color .14s;
}
.sort-btn:hover { background: rgba(91,63,143,0.07); }
.sort-btn.sort-active {
  background: var(--ok-light); border-color: var(--ok-border); color: var(--c-teal);
}
.sort-arrow { transition: transform .18s ease; flex-shrink: 0; }

.filter-tabs {
  display: flex; gap: 3px; flex-shrink: 0;
  background: rgba(91,63,143,0.04); border: 1px solid var(--border-color);
  border-radius: 10px; padding: 3px;
}
.filter-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 7px; border: none; background: transparent;
  font-size: 11.5px; font-weight: 600; color: var(--c-text-3);
  cursor: pointer; font-family: inherit;
  transition: background .14s, color .14s;
}
.filter-tab:hover { color: var(--c-text-2); background: rgba(255,255,255,0.7); }
.filter-tab.filter-tab-active {
  background: #fff; color: var(--c-text); font-weight: 700;
  box-shadow: var(--shadow-nap);
}
.filter-count {
  font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 10px;
  background: rgba(91,63,143,0.08); color: #8e82a0;
  border: 1px solid var(--border-color);
}
.filter-count-active {
  background: var(--ok-light); color: var(--c-teal); border-color: var(--ok-border);
}

/* Loading */
.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 60px 20px;
}
.loading-spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--border-color); border-top-color: var(--c-teal);
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; gap: 8px;
}
.empty-icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: rgba(91,63,143,0.06); border: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  color: var(--c-text-4); margin-bottom: 8px;
}

/* Table */
.request-row { transition: background .1s ease; }

.chevron-cell { text-align: right; padding-right: 16px !important; }
</style>
