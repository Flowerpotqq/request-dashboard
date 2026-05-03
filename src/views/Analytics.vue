<template>
  <div class="analytics-shell">

    <!-- ─── Sidebar ─── -->
    <aside :class="['a-sidebar', sidebarCollapsed && 'a-sidebar--collapsed']">
      <div class="a-sidebar__inner">

        <!-- Brand header -->
        <div class="a-sidebar__brand">
          <div class="a-sidebar__brand-icon">NAP</div>
          <span class="a-sidebar__brand-text">NAP <strong>Solutions</strong></span>
          <button class="a-sidebar__toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? 'Expand' : 'Collapse'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Nav -->
        <nav class="a-nav">
          <template v-for="section in navSections" :key="section.label">
            <div class="a-nav__section-label">{{ section.label }}</div>
            <button
              v-for="item in section.items"
              :key="item.id"
              :class="['a-nav__item', activeSection === item.id && 'a-nav__item--active']"
              @click="setSection(item.id)"
              :title="item.label"
            >
              <span class="a-nav__icon" v-html="item.icon"></span>
              <span class="a-nav__label">{{ item.label }}</span>
            </button>
          </template>
        </nav>

        <!-- Billing cycle footer widget -->
        <div class="a-sidebar__footer">
          <div class="a-sidebar__footer-head">
            <span class="a-sidebar__footer-badge">BILLING CYCLE</span>
          </div>
          <div class="a-sidebar__footer-row">
            <span class="a-sidebar__footer-period">{{ loading ? '—' : (overview.billingPeriod || 'Current Period') }}</span>
            <span class="a-sidebar__footer-pct">{{ loading ? '—' : `${fmtNumber(billingPctDisplay)}%` }}</span>
          </div>
          <div class="a-sidebar__plan-bar">
            <div class="a-sidebar__plan-fill" :style="{ width: loading ? '0%' : `${billingPctDisplay}%` }"></div>
          </div>
          <div class="a-sidebar__footer-powered">Powered by <strong>NAP Solutions</strong></div>
        </div>

      </div>
    </aside>

    <!-- ─── Main content ─── -->
    <div class="a-main" ref="mainRef">
      <div class="a-main__inner">

        <!-- Page header -->
        <div class="a-page-header">
          <div>
            <h2 class="a-page-title"><span class="text-grad-primary">{{ currentSectionTitle }}</span></h2>
            <p class="a-page-sub">{{ currentSectionSub }}</p>
          </div>
          <button class="nap-btn nap-btn-primary" @click="loadAll()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        <!-- Loading shimmer -->
        <template v-if="loading">
          <div class="shimmer-stat-row">
            <div v-for="i in 4" :key="i" class="shimmer-stat glass-card">
              <div class="sh sh--xs mb-2"></div>
              <div class="sh sh--xl mb-2"></div>
              <div class="sh sh--sm" style="width:55%"></div>
            </div>
          </div>
          <div class="glass-card shimmer-block mb-4"></div>
        </template>

        <template v-else>

          <!-- ── OVERVIEW ── -->
          <div v-if="activeSection === 'overview'" class="a-view">
            <div class="stats-row">
              <div
                v-for="(card, i) in statCards"
                :key="card.title"
                class="stat-card glass-card"
                :style="{ animationDelay: `${i * 70}ms` }"
              >
                <div class="stat-icon-chip">
                  <span v-html="card.icon"></span>
                </div>
                <div class="stat-title">{{ card.title }}</div>
                <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
                <template v-else>
                  <div :class="['stat-num', `text-grad-${card.gradient}`]">{{ card.value }}</div>
                  <template v-if="card.progress !== undefined">
                    <div class="progress-wrap mt-2">
                      <div class="progress-fill" :style="{ width: `${card.progress}%` }"></div>
                    </div>
                    <div class="stat-sub">{{ card.sub }}</div>
                  </template>
                  <div v-else-if="card.sub" class="stat-sub">{{ card.sub }}</div>
                </template>
              </div>
            </div>

            <!-- Quick stats row -->
            <div class="glass-card a-card mt-4" v-if="!errors.overview">
              <h3 class="a-card-title mb-3">Billing Summary</h3>
              <div class="quick-stats">
                <div class="quick-stat">
                  <div class="quick-stat__label">Billing Period</div>
                  <div class="quick-stat__val">{{ overview.billingPeriod || '—' }}</div>
                </div>
                <div class="quick-stat">
                  <div class="quick-stat__label">Minutes Included</div>
                  <div class="quick-stat__val">{{ fmtNumber(MINUTES_CAP) }}</div>
                </div>
                <div class="quick-stat">
                  <div class="quick-stat__label">Total Recordings</div>
                  <div class="quick-stat__val">{{ overview.totalRecordings ?? '—' }}</div>
                </div>
                <div class="quick-stat">
                  <div class="quick-stat__label">Total Transcripts</div>
                  <div class="quick-stat__val">{{ overview.totalTranscripts ?? '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── CALL VOLUME ── -->
          <div v-else-if="activeSection === 'call-volume'" class="a-view">
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Call Volume</h3>
                  <p class="a-card-sub">Calls over time — select a range</p>
                </div>
                <select v-model.number="selectedRange" class="nap-input range-select">
                  <option v-for="opt in rangeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div v-if="errors.analytics" class="section-error">{{ errors.analytics }}</div>
              <div v-else-if="analytics.length === 0" class="section-empty">No data for this range.</div>
              <div v-else class="chart-wrap">
                <div v-for="point in analytics" :key="point.label" class="chart-bar-col">
                  <div class="chart-value">{{ point.calls || 0 }}</div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" :style="{ height: `${barHeight(point.calls)}%` }"></div>
                  </div>
                  <div class="chart-label">{{ shortLabel(point.label) }}</div>
                </div>
              </div>
            </div>

            <!-- Mini stats below chart -->
            <div class="stats-row mt-4" v-if="analytics.length">
              <div class="stat-card glass-card" style="animation-delay:0ms">
                <div class="stat-title">Total Calls (Range)</div>
                <div class="stat-num text-grad-primary">{{ analytics.reduce((s, p) => s + (p.calls || 0), 0) }}</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:70ms">
                <div class="stat-title">Total Minutes (Range)</div>
                <div class="stat-num text-grad-accent">{{ fmtNumber(analytics.reduce((s, p) => s + (p.minutes || 0), 0)) }}m</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:140ms">
                <div class="stat-title">Completed Calls</div>
                <div class="stat-num text-grad-primary">{{ analytics.reduce((s, p) => s + (p.completed || 0), 0) }}</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:210ms">
                <div class="stat-title">Missed Calls</div>
                <div class="stat-num text-grad-accent">{{ analytics.reduce((s, p) => s + (p.missed || 0), 0) }}</div>
              </div>
            </div>
          </div>

          <!-- ── CALL LOGS ── -->
          <div v-else-if="activeSection === 'call-logs'" class="a-view">
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Call Logs</h3>
                  <p class="a-card-sub">Click any row to view the full transcript</p>
                </div>
                <div class="calls-meta" v-if="!errors.calls">
                  <span class="meta-pill">{{ filteredCalls.length }}{{ callSearch ? ` / ${calls.length}` : '' }} calls</span>
                </div>
              </div>
              <div v-if="!errors.calls" class="search-filter-bar">
                <input v-model="callSearch" type="text" placeholder="Search by date, phone, or name…" class="nap-input search-input" />
                <select v-model="callSentimentSort" class="nap-input range-select">
                  <option value="">Sentiment: Default</option>
                  <option value="pos">Positive First</option>
                  <option value="neg">Negative First</option>
                </select>
              </div>
              <div v-if="errors.calls" class="section-error">{{ errors.calls }}</div>
              <div v-else class="table-wrap">
                <table class="nap-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>From</th><th>Duration</th>
                      <th>Status</th><th>Sentiment</th><th>Rec.</th><th>Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="call in filteredCalls" :key="call.id" @click="openTranscript(call)" class="call-row">
                      <td>{{ fmtDate(call.date) }}</td>
                      <td class="font-mono">{{ fmtPhone(call.from) }}</td>
                      <td>{{ fmtDurationMin(call.duration_min || 0) }}</td>
                      <td><span :class="['badge', statusBadge(call.status)]">{{ displayStatus(call.status) }}</span></td>
                      <td><span :class="['badge', sentimentBadge(call.sentiment)]">{{ call.sentiment || 'Neutral' }}</span></td>
                      <td><span :class="call.hasRecording ? 'check-yes' : 'check-no'">{{ call.hasRecording ? '✓' : '–' }}</span></td>
                      <td><span :class="call.hasTranscript ? 'check-yes' : 'check-no'">{{ call.hasTranscript ? '✓' : '–' }}</span></td>
                    </tr>
                    <tr v-if="filteredCalls.length === 0">
                      <td colspan="7" class="empty-cell">{{ callSearch ? 'No calls match your search.' : 'No calls found.' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── TRANSCRIPTS ── -->
          <div v-else-if="activeSection === 'transcripts'" class="a-view">
            <div v-if="errors.transcripts" class="glass-card a-card section-error">{{ errors.transcripts }}</div>
            <template v-else>
              <div class="glass-card a-card mb-4">
                <div class="search-filter-bar">
                  <input v-model="txSearch" type="text" placeholder="Search by date, name, or summary…" class="nap-input search-input" />
                  <select v-model="txSentimentSort" class="nap-input range-select">
                    <option value="">Sentiment: Default</option>
                    <option value="pos">Positive First</option>
                    <option value="neg">Negative First</option>
                  </select>
                  <span class="meta-pill">{{ filteredTranscripts.length }}{{ txSearch ? ` / ${transcripts.length}` : '' }}</span>
                </div>
              </div>
              <div v-if="filteredTranscripts.length === 0" class="glass-card a-card section-empty">
                {{ txSearch ? 'No transcripts match your search.' : 'No transcripts available.' }}
              </div>
              <div v-else class="transcript-list">
                <div
                  v-for="tx in filteredTranscripts"
                  :key="tx.call_id"
                  class="transcript-card glass-card"
                  @click="activeTranscript = tx"
                >
                  <div class="tx-card__head">
                    <div>
                      <div class="tx-card__date">{{ fmtDate(tx.date) }}</div>
                      <div class="tx-card__meta">{{ fmtDurationMin(tx.duration_min || 0) }}</div>
                    </div>
                    <div class="tx-card__right">
                      <span :class="['badge', sentimentBadge(tx.sentiment)]">{{ tx.sentiment || 'Neutral' }}</span>
                      <span class="tx-card__status">{{ tx.status || '' }}</span>
                    </div>
                  </div>
                  <div class="tx-card__summary">{{ tx.summary || 'No summary available.' }}</div>
                  <div class="tx-card__preview" v-if="tx.transcript && tx.transcript.length">
                    <span class="tx-preview-line" v-for="(line, i) in tx.transcript.slice(0, 2)" :key="i">
                      <strong>{{ line.speaker }}:</strong> {{ line.text }}
                    </span>
                  </div>
                  <div class="tx-card__cta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    View full transcript
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- ── INVOICES ── -->
          <div v-else-if="activeSection === 'invoices'" class="a-view">
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Invoices</h3>
                  <p class="a-card-sub">Billing history and payment status</p>
                </div>
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
                      <th>Period</th><th>Amount</th><th>Minutes</th><th>Status</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="inv in filteredInvoices" :key="inv.id">
                      <td>{{ inv.period }}</td>
                      <td class="font-bold">{{ inv.amount }}</td>
                      <td>{{ inv.minutes }}</td>
                      <td>
                        <span :class="['badge', inv.paid ? 'badge-completed' : 'badge-pending']">
                          <span class="badge-dot"></span>{{ inv.paid ? 'Paid' : 'Pending' }}
                        </span>
                      </td>
                      <td>{{ fmtDate(inv.date) }}</td>
                    </tr>
                    <tr v-if="filteredInvoices.length === 0">
                      <td colspan="5" class="empty-cell">No invoices found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── OVERAGE ── -->
          <div v-else-if="activeSection === 'overage'" class="a-view">
            <div class="stats-row mb-4">
              <div class="stat-card glass-card" style="animation-delay:0ms">
                <div class="stat-icon-chip"><span v-html="ICONS.dollar"></span></div>
                <div class="stat-title">Overage Cost</div>
                <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
                <div v-else :class="['stat-num', overview.overageUSD > 0 ? 'text-grad-danger' : 'text-grad-accent']">
                  {{ money(overview.overageUSD || 0) }}
                </div>
                <div class="stat-sub">{{ overview.overageUSD > 0 ? 'Overage charges apply' : 'No overage this period' }}</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:70ms">
                <div class="stat-icon-chip"><span v-html="ICONS.clock"></span></div>
                <div class="stat-title">Minutes Used</div>
                <div v-if="errors.overview" class="stat-error">{{ errors.overview }}</div>
                <div v-else class="stat-num text-grad-primary">{{ fmtNumber(minutesUsedDisplay) }}</div>
                <div class="stat-sub">of {{ fmtNumber(MINUTES_CAP) }} included</div>
              </div>
            </div>
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Overage Invoices</h3>
                  <p class="a-card-sub">Invoices with usage charges beyond your plan</p>
                </div>
              </div>
              <div v-if="errors.invoices" class="section-error">{{ errors.invoices }}</div>
              <div v-else class="table-wrap">
                <table class="nap-table">
                  <thead>
                    <tr><th>Period</th><th>Amount</th><th>Overage Min</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="inv in overageInvoices" :key="inv.id">
                      <td>{{ inv.period }}</td>
                      <td class="font-bold">{{ inv.amount }}</td>
                      <td>{{ inv.overageMin ?? 0 }} min</td>
                      <td>
                        <span :class="['badge', inv.paid ? 'badge-completed' : 'badge-pending']">
                          <span class="badge-dot"></span>{{ inv.paid ? 'Paid' : 'Pending' }}
                        </span>
                      </td>
                      <td>{{ fmtDate(inv.date) }}</td>
                    </tr>
                    <tr v-if="overageInvoices.length === 0">
                      <td colspan="5" class="empty-cell">No overage invoices found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── MY PLAN ── -->
          <div v-else-if="activeSection === 'my-plan'" class="a-view">
            <div class="glass-card a-card" v-if="errors.overview">
              <div class="section-error">{{ errors.overview }}</div>
            </div>
            <template v-else>
              <div class="plan-hero glass-card">
                <div class="plan-hero__badge">SCALE PLAN</div>
                <div class="plan-hero__period">{{ overview.billingPeriod || 'Current Period' }}</div>
                <div class="plan-hero__usage">
                  <span class="text-grad-primary" style="font-size:32px;font-weight:900">{{ fmtNumber(minutesUsedDisplay) }}</span>
                  <span class="plan-hero__cap"> / {{ fmtNumber(MINUTES_CAP) }} min</span>
                </div>
                <div class="progress-wrap mt-2" style="height:8px">
                  <div class="progress-fill" :style="{ width: `${billingPctDisplay}%` }"></div>
                </div>
                <div class="plan-hero__pct">{{ fmtNumber(billingPctDisplay) }}% of plan used</div>
              </div>

              <div class="plan-grid mt-4">
                <div class="plan-stat glass-card" v-for="(item, i) in planStats" :key="item.label" :style="{ animationDelay: `${i * 60}ms` }">
                  <div class="plan-stat__label">{{ item.label }}</div>
                  <div class="plan-stat__val">{{ item.value }}</div>
                </div>
              </div>
            </template>
          </div>

          <!-- ── CONTACT ── -->
          <div v-else-if="activeSection === 'contact'" class="a-view">
            <div class="glass-card a-card contact-card">
              <div class="contact-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5 19.79 19.79 0 0 1 1.63 2.84 2 2 0 0 1 3.6.66h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.37a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h3 class="contact-title">Contact &amp; Upgrade</h3>
              <p class="contact-sub">Need help or want to upgrade your plan? Reach out to the NAP Solutions team.</p>
              <div class="contact-links">
                <a href="mailto:support@getnapsolutions.com" class="nap-btn nap-btn-primary contact-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email Support
                </a>
                <a href="https://getnapsolutions.com" target="_blank" rel="noopener" class="nap-btn contact-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Visit Website
                </a>
              </div>
            </div>
          </div>

        </template>
      </div>
    </div>

    <!-- ─── Transcript drawer ─── -->
    <Transition name="overlay">
      <div v-if="activeTranscript" class="drawer-overlay" @click="activeTranscript = null"></div>
    </Transition>
    <Transition name="drawer">
      <div v-if="activeTranscript" class="drawer-panel">
        <div class="drawer-header">
          <div>
            <div class="font-bold text-[15px]">{{ fmtDate(activeTranscript.date) }}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[12px] text-nap-text-3">{{ fmtDurationMin(activeTranscript.duration_min || 0) }}</span>
              <span v-if="activeTranscript.sentiment" :class="['badge', sentimentBadge(activeTranscript.sentiment)]">{{ activeTranscript.sentiment }}</span>
            </div>
          </div>
          <button class="nap-btn" @click="activeTranscript = null">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Close
          </button>
        </div>
        <div class="drawer-body">
          <div class="section-label">Summary</div>
          <div class="notes-box mb-3">{{ activeTranscript.summary || 'No summary available.' }}</div>
          <a v-if="activeTranscript.recording_url" :href="activeTranscript.recording_url" target="_blank" rel="noopener" class="recording-link">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
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

const API_BASE = '/api/nap'
const MINUTES_CAP = 1000

// Extract tenant token from /t/:token or /clinic/:token — null on the bare base URL
const _pathMatch = window.location.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
const tenantId = _pathMatch?.[1] ? decodeURIComponent(_pathMatch[1]).trim() : null

const loading = ref(true)
const selectedRange = ref(1)
const invoiceFilter = ref('all')
const sidebarCollapsed = ref(false)
const activeSection = ref('overview')
const mainRef = ref(null)

const overview = ref({})
const analytics = ref([])
const calls = ref([])
const transcripts = ref([])
const invoices = ref([])
const activeTranscript = ref(null)

const errors = ref({ overview: '', analytics: '', calls: '', transcripts: '', invoices: '' })

const callSearch = ref('')
const callSentimentSort = ref('')
const txSearch = ref('')
const txSentimentSort = ref('')

const rangeOptions = [
  { label: 'Hourly',   value: 0 },
  { label: 'Daily',    value: 1 },
  { label: 'Weekly',   value: 2 },
  { label: '2 Months', value: 3 },
  { label: '3 Months', value: 4 },
  { label: '6 Months', value: 5 },
  { label: 'Yearly',   value: 6 },
  { label: 'All Time', value: 7 },
]

const ICONS = {
  grid:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  activity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  phone:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5 19.79 19.79 0 0 1 1.63 2.84 2 2 0 0 1 3.6.66h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.37a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  message:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  file:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  trending: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  star:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  mail:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  clock:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  dollar:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  wave:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
}

const navSections = [
  {
    label: 'DASHBOARD',
    items: [
      { id: 'overview',     label: 'Overview',     icon: ICONS.grid },
      { id: 'call-volume',  label: 'Analytics',    icon: ICONS.activity },
    ],
  },
  {
    label: 'CALLS',
    items: [
      { id: 'call-logs',    label: 'Call Logs',        icon: ICONS.phone },
      { id: 'transcripts',  label: 'Transcribed Calls', icon: ICONS.message },
    ],
  },
  {
    label: 'BILLING',
    items: [
      { id: 'invoices',     label: 'Invoices',          icon: ICONS.file },
      { id: 'overage',      label: 'Overage Invoices',  icon: ICONS.trending },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { id: 'my-plan',      label: 'My Plan',           icon: ICONS.star },
      { id: 'contact',      label: 'Contact & Upgrade', icon: ICONS.mail },
    ],
  },
]

const sectionMeta = {
  'overview':    { title: 'Overview',          sub: 'Your AI receptionist at a glance.' },
  'call-volume': { title: 'Analytics',         sub: 'Call volume and trends over time.' },
  'call-logs':   { title: 'Call Logs',         sub: 'All recent calls from your AI receptionist.' },
  'transcripts': { title: 'Transcribed Calls', sub: 'Full conversation recordings and summaries.' },
  'invoices':    { title: 'Invoices',          sub: 'Billing history and payment status.' },
  'overage':     { title: 'Overage Invoices',  sub: 'Usage and charges beyond your plan.' },
  'my-plan':     { title: 'My Plan',           sub: 'Your current plan details and usage.' },
  'contact':     { title: 'Contact & Upgrade', sub: 'Get help or upgrade your NAP Solutions plan.' },
}

const currentSectionTitle = computed(() => sectionMeta[activeSection.value]?.title ?? 'Analytics')
const currentSectionSub   = computed(() => sectionMeta[activeSection.value]?.sub   ?? '')

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

const overageInvoices = computed(() =>
  invoices.value.filter((inv) => inv.isOverage || (inv.overageMin ?? 0) > 0)
)

const minutesUsedDisplay = computed(() => Number(overview.value?.minutesUsed || 0))
const minutesCapDisplay  = computed(() => MINUTES_CAP)
const billingPctDisplay  = computed(() => {
  const used = minutesUsedDisplay.value
  if (!MINUTES_CAP) return 0
  return Math.min(100, (used / MINUTES_CAP) * 100)
})

const statCards = computed(() => [
  {
    title: 'Minutes Used',
    value: `${fmtNumber(minutesUsedDisplay.value)} / ${fmtNumber(minutesCapDisplay.value)}`,
    sub: `${fmtNumber(billingPctDisplay.value)}% of plan`,
    progress: billingPctDisplay.value,
    gradient: 'primary',
    icon: ICONS.clock,
  },
  {
    title: 'Total Calls',
    value: String(overview.value.totalCalls || 0),
    sub: overview.value.billingPeriod || '',
    gradient: 'accent',
    icon: ICONS.phone,
  },
  {
    title: 'Overage Cost',
    value: money(overview.value.overageUSD || 0),
    gradient: 'primary',
    icon: ICONS.dollar,
  },
  {
    title: 'Avg Call Duration',
    value: fmtDurationMin(overview.value.avgCallMin || 0),
    gradient: 'accent',
    icon: ICONS.wave,
  },
])

const planStats = computed(() => [
  { label: 'Billing Period',    value: overview.value.billingPeriod || '—' },
  { label: 'Minutes Included',  value: fmtNumber(MINUTES_CAP) },
  { label: 'Minutes Used',      value: fmtNumber(minutesUsedDisplay.value) },
  { label: 'Total Calls',       value: overview.value.totalCalls ?? '—' },
  { label: 'Total Recordings',  value: overview.value.totalRecordings ?? '—' },
  { label: 'Total Transcripts', value: overview.value.totalTranscripts ?? '—' },
])

function applySentimentSort(list, dir) {
  if (!dir) return list
  const rank = { positive: 0, neutral: 1, negative: 2 }
  return [...list].sort((a, b) => {
    const ra = rank[(a.sentiment || 'neutral').toLowerCase()] ?? 1
    const rb = rank[(b.sentiment || 'neutral').toLowerCase()] ?? 1
    return dir === 'pos' ? ra - rb : rb - ra
  })
}

const filteredCalls = computed(() => {
  const q = callSearch.value.trim().toLowerCase()
  let list = calls.value
  if (q) {
    list = list.filter(call => {
      const date = fmtDate(call.date).toLowerCase()
      const phone = fmtPhone(call.from).toLowerCase()
      const name = String(call.name || call.caller_name || '').toLowerCase()
      return date.includes(q) || phone.includes(q) || name.includes(q)
    })
  }
  return applySentimentSort(list, callSentimentSort.value)
})

const filteredTranscripts = computed(() => {
  const q = txSearch.value.trim().toLowerCase()
  let list = transcripts.value
  if (q) {
    list = list.filter(tx => {
      const date = fmtDate(tx.date).toLowerCase()
      const name = String(tx.name || tx.caller_name || '').toLowerCase()
      const summary = String(tx.summary || '').toLowerCase()
      return date.includes(q) || name.includes(q) || summary.includes(q)
    })
  }
  return applySentimentSort(list, txSentimentSort.value)
})

function setSection(id) {
  activeSection.value = id
  if (mainRef.value) mainRef.value.scrollTop = 0
}

function currentBillingPeriodFallback() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function normalizeInvoiceMinutes(rawMinutes) {
  const raw = String(rawMinutes ?? '').trim()
  const usedPart = raw.split('/')[0]?.trim() || '0'
  const usedNum = Number(usedPart.replace(/[^\d.]/g, ''))
  const used = Number.isFinite(usedNum) ? usedNum : 0
  return `${fmtNumber(used)} / ${fmtNumber(MINUTES_CAP)}`
}

function normalizeInvoices(list) {
  return (Array.isArray(list) ? list : []).map((inv, index) => {
    const period = String(inv?.period || '').trim() || overview.value?.billingPeriod || currentBillingPeriodFallback()
    const amountRaw = String(inv?.amount || '').trim()
    const amount = amountRaw || '$0.00'
    const minutes = normalizeInvoiceMinutes(inv?.minutes)
    const date = String(inv?.date || '').trim()
    return {
      id: inv?.id || `invoice-${index}`,
      period,
      amount,
      minutes,
      status: inv?.status,
      date,
      paid: Boolean(inv?.paid),
      isOverage: Boolean(inv?.isOverage),
      overageMin: inv?.overageMin ?? 0,
    }
  })
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function loadAll() {
  if (!tenantId) {
    loading.value = false
    return
  }
  loading.value = true
  errors.value = { overview: '', analytics: '', calls: '', transcripts: '', invoices: '' }

  const tid = encodeURIComponent(tenantId)
  const tasks = [
    fetchJson(`${API_BASE}/overview?tenantId=${tid}`),
    fetchJson(`${API_BASE}/analytics?tenantId=${tid}&range=${selectedRange.value}`),
    fetchJson(`${API_BASE}/calls?tenantId=${tid}`),
    fetchJson(`${API_BASE}/transcripts?tenantId=${tid}`),
    fetchJson(`${API_BASE}/invoices?tenantId=${tid}`),
  ]

  const [ovRes, anRes, callsRes, txRes, invRes] = await Promise.allSettled(tasks)

  if (ovRes.status === 'fulfilled')    overview.value    = ovRes.value || {}
  else errors.value.overview    = 'Failed to load overview.'

  if (anRes.status === 'fulfilled')    analytics.value   = filterHourly(Array.isArray(anRes.value) ? anRes.value : [])
  else errors.value.analytics   = 'Failed to load analytics.'

  if (callsRes.status === 'fulfilled') calls.value       = Array.isArray(callsRes.value?.calls) ? callsRes.value.calls : []
  else errors.value.calls       = 'Failed to load calls.'

  if (txRes.status === 'fulfilled')    transcripts.value = Array.isArray(txRes.value?.transcripts) ? txRes.value.transcripts : []
  else errors.value.transcripts = 'Failed to load transcripts.'

  if (invRes.status === 'fulfilled')   invoices.value    = normalizeInvoices(invRes.value?.invoices)
  else errors.value.invoices    = 'Failed to load invoices.'

  loading.value = false
}

function filterHourly(data) {
  if (selectedRange.value !== 0) return data
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return data.filter((point) => {
    const m = String(point.label || '').match(/^(\d{2}):(\d{2})$/)
    if (!m) return true
    return Number(m[1]) * 60 + Number(m[2]) <= nowMinutes
  })
}

async function reloadAnalytics() {
  if (!tenantId) return
  errors.value.analytics = ''
  try {
    const tid = encodeURIComponent(tenantId)
    const data = await fetchJson(`${API_BASE}/analytics?tenantId=${tid}&range=${selectedRange.value}`)
    analytics.value = filterHourly(Array.isArray(data) ? data : [])
  } catch {
    errors.value.analytics = 'Failed to load analytics.'
    analytics.value = []
  }
}

watch(selectedRange, () => { reloadAnalytics() })
onMounted(() => { loadAll() })

function fmtNumber(value)     { return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 }) }
function money(value)         { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
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
/* ── Shell ─────────────────────────────────────────────── */
.analytics-shell {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* ── Sidebar ────────────────────────────────────────────── */
.a-sidebar {
  width: 230px;
  min-width: 230px;
  height: 100%;
  background: rgba(255,255,255,0.97);
  border-right: 1px solid var(--border-color);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 280ms cubic-bezier(.4,0,.2,1), min-width 280ms cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
  z-index: 10;
}
.a-sidebar--collapsed { width: 60px; min-width: 60px; }
.a-sidebar__inner { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

/* Brand header */
.a-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color-light);
  min-height: 60px;
}
.a-sidebar__brand-icon {
  width: 34px; height: 34px; border-radius: 10px;
  background: var(--grad-primary);
  color: #fff; font-weight: 900; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; letter-spacing: .5px;
}
.a-sidebar__brand-text {
  font-size: 13px; font-weight: 600; color: var(--c-text-2);
  white-space: nowrap; overflow: hidden;
  transition: opacity 200ms;
}
.a-sidebar__brand-text strong { color: var(--c-teal); font-weight: 900; }
.a-sidebar--collapsed .a-sidebar__brand-text { opacity: 0; width: 0; }
.a-sidebar__toggle-btn {
  margin-left: auto; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--c-text-3); cursor: pointer;
  transition: background .15s, color .15s, transform .15s;
}
.a-sidebar__toggle-btn:hover {
  background: rgba(91,63,143,0.07); color: var(--c-purple); transform: scale(1.08);
}

/* Nav items */
.a-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 6px 0; }
.a-nav__section-label {
  font-size: 9px; font-weight: 800; letter-spacing: 2px; color: var(--c-text-4);
  padding: 14px 16px 5px; white-space: nowrap; overflow: hidden;
  max-height: 38px; opacity: 1;
  transition: opacity 200ms, max-height 220ms, padding 220ms;
}
.a-sidebar--collapsed .a-nav__section-label { opacity: 0; max-height: 0; padding: 0; }
.a-nav__item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 16px;
  border: none; background: transparent;
  color: var(--c-text-3); cursor: pointer;
  font-size: 13px; font-weight: 600; font-family: inherit;
  text-align: left; white-space: nowrap;
  transition: background .14s, color .14s;
  position: relative;
}
.a-nav__item:hover { background: rgba(91,63,143,0.04); color: var(--c-text-2); }
.a-nav__item--active { background: rgba(0,168,138,0.06); color: var(--c-teal); font-weight: 700; }
.a-nav__item--active::before {
  content: ''; position: absolute; left: 0; top: 5px; bottom: 5px;
  width: 3px; border-radius: 0 3px 3px 0; background: var(--grad-accent);
}
.a-nav__icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; }
.a-nav__icon svg { display: block; }
.a-nav__label { overflow: hidden; white-space: nowrap; transition: opacity 200ms, max-width 250ms; max-width: 160px; }
.a-sidebar--collapsed .a-nav__label { opacity: 0; max-width: 0; }
.a-sidebar--collapsed .a-nav__item { justify-content: center; padding-left: 0; padding-right: 0; }

/* Footer billing widget */
.a-sidebar__footer {
  border-top: 1px solid var(--border-color-light);
  padding: 14px;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(0,168,138,0.04), rgba(45,95,196,0.04));
}
.a-sidebar__footer-head { margin-bottom: 6px; }
.a-sidebar__footer-badge {
  font-size: 8.5px; font-weight: 800; letter-spacing: 1.5px;
  color: var(--c-teal); background: rgba(0,168,138,0.1);
  border: 1px solid rgba(0,168,138,0.2);
  padding: 2px 8px; border-radius: 99px;
  white-space: nowrap;
}
.a-sidebar__footer-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 7px; overflow: hidden;
  transition: opacity 200ms;
}
.a-sidebar--collapsed .a-sidebar__footer-row,
.a-sidebar--collapsed .a-sidebar__footer-head,
.a-sidebar--collapsed .a-sidebar__footer-powered { opacity: 0; max-height: 0; overflow: hidden; margin: 0; }
.a-sidebar__footer-period {
  font-size: 11.5px; font-weight: 700; color: var(--c-text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.a-sidebar__footer-pct { font-size: 11.5px; font-weight: 800; color: var(--c-teal); flex-shrink: 0; }
.a-sidebar__plan-bar {
  height: 5px; border-radius: 999px; background: rgba(0,168,138,0.12); overflow: hidden; margin-bottom: 8px;
}
.a-sidebar__plan-fill {
  height: 100%; background: var(--grad-accent); border-radius: 999px;
  transition: width 900ms cubic-bezier(.22,1,.36,1);
}
.a-sidebar__footer-powered {
  font-size: 10px; color: var(--c-text-4); text-align: center; white-space: nowrap;
  transition: opacity 200ms;
}
.a-sidebar__footer-powered strong { color: var(--c-teal-dark); }

/* ── Main ───────────────────────────────────────────────── */
.a-main { flex: 1; height: 100%; overflow-y: auto; overflow-x: hidden; }
.a-main__inner { padding: 28px 28px 60px; }

/* ── Page header ────────────────────────────────────────── */
.a-page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.a-page-title { font-size: 24px; font-weight: 900; letter-spacing: -.5px; margin-bottom: 4px; }
.a-page-sub { font-size: 13px; color: var(--c-text-3); }

/* ── View transition ────────────────────────────────────── */
.a-view { animation: view-in 260ms cubic-bezier(.22,1,.36,1) both; }
@keyframes view-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── Shimmer ────────────────────────────────────────────── */
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.shimmer-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.shimmer-stat { padding: 20px; }
.sh {
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(91,63,143,0.05) 25%, rgba(91,63,143,0.13) 50%, rgba(91,63,143,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
.sh--xs { height: 10px; width: 65%; }
.sh--sm { height: 12px; }
.sh--xl { height: 30px; width: 80%; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }
.shimmer-block { height: 220px; }

/* ── Stat cards ─────────────────────────────────────────── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@keyframes card-enter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.stat-card {
  padding: 20px;
  animation: card-enter 400ms cubic-bezier(.22,1,.36,1) both;
  cursor: default;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
}
.stat-card:hover { transform: translateY(-3px) translateZ(0); box-shadow: var(--shadow-card); }
.stat-icon-chip {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 10px;
  background: rgba(91,63,143,0.08); color: var(--c-purple-mid); margin-bottom: 12px;
}
.stat-title { font-size: 9.5px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: var(--c-text-3); margin-bottom: 6px; }
.stat-num { font-size: 28px; font-weight: 900; line-height: 1.1; margin-bottom: 4px; }
.stat-sub { font-size: 11px; color: var(--c-text-3); margin-top: 5px; }
.stat-error { color: var(--c-danger); font-size: 12px; }
.progress-wrap { height: 6px; border-radius: 999px; background: rgba(91,63,143,0.08); overflow: hidden; }
.progress-fill { height: 100%; background: var(--grad-accent); border-radius: 999px; transition: width 900ms cubic-bezier(.22,1,.36,1); }

/* Quick stats */
.quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.quick-stat { padding: 12px 0; border-right: 1px solid var(--border-color-light); }
.quick-stat:last-child { border-right: none; }
.quick-stat__label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--c-text-3); margin-bottom: 6px; }
.quick-stat__val { font-size: 18px; font-weight: 800; color: var(--c-text); }

/* ── Cards ──────────────────────────────────────────────── */
.a-card { padding: 20px; }
.a-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.a-card-title { font-size: 15px; font-weight: 800; color: var(--c-text); }
.a-card-sub { font-size: 12px; color: var(--c-text-3); margin-top: 2px; }
.mb-3 { margin-bottom: 12px; }
.range-select { max-width: 160px; padding: 6px 10px; font-size: 12px; }
.section-error { color: var(--c-danger); font-size: 13px; }
.section-empty { color: var(--c-text-3); font-size: 13px; }
.calls-meta { display: flex; align-items: center; gap: 8px; }
.meta-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: rgba(91,63,143,0.07); color: var(--c-text-3); border: 1px solid var(--border-color); }
.search-filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 180px; }

/* ── Chart ──────────────────────────────────────────────── */
.chart-wrap { display: flex; align-items: flex-end; gap: 8px; min-height: 200px; padding: 8px 0; overflow-x: auto; }
.chart-bar-col { min-width: 52px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.chart-value { font-size: 11px; font-weight: 700; color: var(--c-text-3); }
.chart-bar-track { width: 34px; height: 140px; border-radius: 8px; background: rgba(91,63,143,0.07); display: flex; align-items: flex-end; overflow: hidden; }
.chart-bar-fill { width: 100%; background: var(--grad-primary); border-radius: 8px 8px 0 0; min-height: 4px; transition: height 750ms cubic-bezier(.22,1,.36,1); }
.chart-label { font-size: 10px; color: var(--c-text-4); text-align: center; }
.text-grad-danger {
  background: var(--grad-danger);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── Tables ─────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
.call-row { cursor: pointer; }
.call-row:hover { background: rgba(91,63,143,0.04); }
.check-yes { color: var(--c-teal); font-weight: 700; font-size: 13px; }
.check-no  { color: var(--c-text-4); font-size: 13px; }
.empty-cell { text-align: center; padding: 24px 14px; color: var(--c-text-3); font-size: 13px; }

/* ── Transcript cards ───────────────────────────────────── */
.transcript-list { display: flex; flex-direction: column; gap: 12px; }
.transcript-card {
  padding: 18px 20px; cursor: pointer;
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease;
}
.transcript-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.tx-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.tx-card__date { font-size: 13px; font-weight: 700; color: var(--c-text); }
.tx-card__meta { font-size: 11px; color: var(--c-text-3); margin-top: 2px; }
.tx-card__right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.tx-card__status { font-size: 10px; color: var(--c-text-4); text-transform: capitalize; }
.tx-card__summary { font-size: 13px; color: var(--c-text-2); line-height: 1.5; margin-bottom: 10px; }
.tx-card__preview { display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; }
.tx-preview-line { font-size: 11.5px; color: var(--c-text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-preview-line strong { color: var(--c-text-2); }
.tx-card__cta { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: var(--c-blue); }

/* ── Plan section ───────────────────────────────────────── */
.plan-hero {
  padding: 28px 24px;
}
.plan-hero__badge {
  display: inline-flex; align-items: center;
  background: var(--grad-primary); color: #fff;
  font-size: 9px; font-weight: 900; letter-spacing: 2px;
  padding: 4px 12px; border-radius: 99px; margin-bottom: 12px;
}
.plan-hero__period { font-size: 13px; color: var(--c-text-3); margin-bottom: 6px; }
.plan-hero__usage { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
.plan-hero__cap { font-size: 16px; font-weight: 700; color: var(--c-text-3); }
.plan-hero__pct { font-size: 12px; color: var(--c-text-3); margin-top: 6px; }
.plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.plan-stat {
  padding: 16px 18px;
  animation: card-enter 380ms cubic-bezier(.22,1,.36,1) both;
}
.plan-stat__label { font-size: 9.5px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--c-text-3); margin-bottom: 6px; }
.plan-stat__val { font-size: 20px; font-weight: 900; color: var(--c-text); }

/* ── Contact section ────────────────────────────────────── */
.contact-card { text-align: center; padding: 48px 32px; }
.contact-icon {
  width: 64px; height: 64px; border-radius: 18px;
  background: var(--grad-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; box-shadow: var(--shadow-purple);
}
.contact-title { font-size: 22px; font-weight: 900; color: var(--c-text); margin-bottom: 10px; }
.contact-sub { font-size: 14px; color: var(--c-text-3); line-height: 1.6; max-width: 360px; margin: 0 auto 28px; }
.contact-links { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
.contact-btn { padding: 10px 20px; font-size: 13px; }

/* ── Drawer ─────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed; left: 0; right: 0; bottom: 0; top: 60px; z-index: 300;
  background: rgba(26,14,46,0.18); backdrop-filter: blur(2px);
}
.drawer-panel {
  position: fixed; top: 60px; right: 0; bottom: 0; width: 520px; z-index: 400;
  background: rgba(255,255,255,0.99); border-left: 1px solid var(--border-color);
  box-shadow: -8px 0 40px rgba(91,63,143,0.13); display: flex; flex-direction: column;
}
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.drawer-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
.section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--c-text-3); margin-bottom: 6px; }
.notes-box { font-size: 13px; color: var(--c-text-2); line-height: 1.6; background: rgba(91,63,143,0.03); border: 1px solid var(--border-color-light); border-radius: 10px; padding: 12px 14px; }
.mt-4 { margin-top: 16px; }
.recording-link { display: inline-flex; align-items: center; gap: 5px; color: var(--c-blue); font-size: 12px; text-decoration: underline; }
.chat-thread { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.chat-line { max-width: 86%; padding: 8px 10px; border-radius: 10px; font-size: 12px; line-height: 1.45; }
.chat-ai     { align-self: flex-start; background: rgba(45,95,196,0.08); border: 1px solid rgba(45,95,196,0.2); }
.chat-caller { align-self: flex-end;   background: rgba(0,168,138,0.08); border: 1px solid rgba(0,168,138,0.2); }
.chat-speaker { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 3px; color: var(--c-text-3); }

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 1100px) { .stats-row, .shimmer-stat-row, .quick-stats { grid-template-columns: repeat(2, 1fr); } .plan-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px)  { .a-sidebar { display: none; } }
@media (max-width: 600px)  {
  .stats-row, .shimmer-stat-row, .quick-stats { grid-template-columns: 1fr; }
  .drawer-panel { width: 100%; top: 0; }
  .a-main__inner { padding: 16px 14px 60px; }
  .plan-grid { grid-template-columns: 1fr; }
}
</style>
