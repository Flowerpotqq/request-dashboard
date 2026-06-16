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
            <span class="a-sidebar__footer-pct">{{ loading ? '—' : `${fmtNumber(combinedPct)}%` }}</span>
          </div>
          <div class="a-sidebar__plan-bar">
            <div class="a-sidebar__plan-fill--in" :style="{ width: loading ? '0%' : `${inboundSharePct}%` }"></div>
            <div v-if="hasOutbound" class="a-sidebar__plan-fill--ob" :style="{ width: loading ? '0%' : `${outboundSharePct}%` }"></div>
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

        <!-- Invalid / expired link -->
        <template v-else-if="tenantValid === false">
          <div class="invalid-link-card glass-card">
            <div class="invalid-link-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 class="invalid-link-title">Dashboard link is invalid or expired</h3>
            <p class="invalid-link-sub">This link doesn't match any active account. Please contact NAP Solutions to get a valid dashboard link.</p>
            <a href="mailto:support@getnapsolutions.com" class="nap-btn nap-btn-primary" style="margin-top:20px;padding:10px 20px;font-size:13px">
              Contact Support
            </a>
          </div>
        </template>

        <template v-else>

          <!-- ── OVERVIEW ── -->
          <div v-if="activeSection === 'overview'" class="a-view">

            <!-- Combined usage meter -->
            <div class="glass-card a-card mb-4">
              <div class="combined-meter-head">
                <div>
                  <div class="stat-title">Total AI Minutes Used</div>
                  <div class="combined-period">{{ overview.billingPeriod || 'Current Period' }}{{ hasOutbound ? ' · Inbound + Outbound' : '' }}</div>
                </div>
                <div class="combined-total">
                  <span class="text-grad-primary" style="font-size:26px;font-weight:900">{{ fmtNumber(combinedMinutes) }}</span>
                  <span class="combined-cap-label"> / {{ fmtNumber(combinedCap) }} min</span>
                </div>
              </div>
              <div class="combined-bar">
                <div class="combined-bar__fill combined-bar__fill--in" :style="{ width: `${inboundSharePct}%` }"></div>
                <div v-if="hasOutbound" class="combined-bar__fill combined-bar__fill--ob" :style="{ width: `${outboundSharePct}%` }"></div>
              </div>
              <div class="combined-legend">
                <div class="legend-item">
                  <div class="legend-dot legend-dot--in"></div>
                  <span>Inbound — {{ fmtNumber(minutesUsedDisplay) }} / {{ fmtNumber(minutesCapDisplay) }} min</span>
                </div>
                <div v-if="hasOutbound" class="legend-item">
                  <div class="legend-dot legend-dot--ob"></div>
                  <span>Outbound — {{ fmtNumber(obMinutesUsed) }} / {{ fmtNumber(obMinutesCap) }} min</span>
                </div>
              </div>
            </div>

            <!-- Inbound stat cards -->
            <div class="stats-row">
              <div
                v-for="(card, i) in statCards"
                :key="card.title"
                class="stat-card glass-card"
                :style="{ animationDelay: `${i * 70}ms` }"
              >
                <div class="stat-icon-chip"><span v-html="card.icon"></span></div>
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

            <!-- Outbound stat cards (only if hasOutbound) -->
            <div v-if="hasOutbound" class="stats-row mt-4">
              <div
                v-for="(card, i) in obStatCards"
                :key="card.title"
                class="stat-card glass-card"
                :style="{ animationDelay: `${i * 70}ms` }"
              >
                <div class="stat-icon-chip"><span v-html="card.icon"></span></div>
                <div class="stat-title">{{ card.title }}</div>
                <div v-if="obErrors.overview" class="stat-error">{{ obErrors.overview }}</div>
                <template v-else>
                  <div :class="['stat-num', `text-grad-${card.gradient}`]">{{ card.value }}</div>
                  <template v-if="card.progress !== undefined">
                    <div class="progress-wrap mt-2">
                      <div class="progress-fill progress-fill--ob" :style="{ width: `${card.progress}%` }"></div>
                    </div>
                    <div class="stat-sub">{{ card.sub }}</div>
                  </template>
                  <div v-else-if="card.sub" class="stat-sub">{{ card.sub }}</div>
                </template>
              </div>
            </div>

            <!-- Billing summary -->
            <div class="glass-card a-card mt-4" v-if="!errors.overview">
              <h3 class="a-card-title mb-3">Billing Summary</h3>
              <div class="quick-stats">
                <div class="quick-stat">
                  <div class="quick-stat__label">Billing Period</div>
                  <div class="quick-stat__val">{{ overview.billingPeriod || '—' }}</div>
                </div>
                <div class="quick-stat">
                  <div class="quick-stat__label">Inbound Recordings</div>
                  <div class="quick-stat__val">{{ overview.totalRecordings ?? '—' }}</div>
                </div>
                <div class="quick-stat">
                  <div class="quick-stat__label">Inbound Transcripts</div>
                  <div class="quick-stat__val">{{ overview.totalTranscripts ?? '—' }}</div>
                </div>
                <div v-if="hasOutbound" class="quick-stat">
                  <div class="quick-stat__label">Outbound Calls Today</div>
                  <div class="quick-stat__val">{{ outboundOverview.callsToday ?? '—' }}</div>
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
                      <th>Date &amp; Time</th><th>From</th><th>Duration</th>
                      <th>Status</th><th>Sentiment</th><th>Rec.</th><th>Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="call in filteredCalls" :key="call.id" @click="openTranscript(call)" class="call-row">
                      <td>{{ fmtDateTime(call.timestamp || call.date) }}</td>
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
                      <div class="tx-card__date">{{ fmtDateTime(tx.timestamp || tx.date) }}</div>
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

          <!-- ── MY PLAN ── -->
          <div v-else-if="activeSection === 'my-plan'" class="a-view">
            <div class="glass-card a-card" v-if="errors.overview">
              <div class="section-error">{{ errors.overview }}</div>
            </div>
            <template v-else>
              <div class="plan-hero glass-card">
                <div class="plan-hero__badge">{{ overview.clientName || 'MY PLAN' }}</div>
                <div class="plan-hero__period">{{ overview.billingPeriod || 'Current Period' }}{{ hasOutbound ? ' · Inbound + Outbound' : '' }}</div>
                <div class="plan-hero__usage">
                  <span class="text-grad-primary" style="font-size:32px;font-weight:900">{{ fmtNumber(combinedMinutes) }}</span>
                  <span class="plan-hero__cap"> / {{ fmtNumber(combinedCap) }} min</span>
                </div>
                <div class="combined-bar mt-2" style="height:8px">
                  <div class="combined-bar__fill combined-bar__fill--in" :style="{ width: `${inboundSharePct}%` }"></div>
                  <div v-if="hasOutbound" class="combined-bar__fill combined-bar__fill--ob" :style="{ width: `${outboundSharePct}%` }"></div>
                </div>
                <div class="plan-hero__pct">{{ fmtNumber(combinedPct) }}% of plan used</div>
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

          <!-- ── OUTBOUND ANALYTICS ── -->
          <div v-else-if="activeSection === 'ob-analytics'" class="a-view">
            <div class="ob-section-badge">OUTBOUND</div>
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Outbound Call Volume</h3>
                  <p class="a-card-sub">Outbound calls over time — select a range</p>
                </div>
                <select v-model.number="outboundRange" class="nap-input range-select">
                  <option v-for="opt in rangeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div v-if="obErrors.analytics" class="section-error">{{ obErrors.analytics }}</div>
              <div v-else-if="outboundAnalytics.length === 0" class="section-empty">No data for this range.</div>
              <div v-else class="chart-wrap">
                <div v-for="point in outboundAnalytics" :key="point.label" class="chart-bar-col">
                  <div class="chart-value">{{ point.calls || 0 }}</div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill chart-bar-fill--ob" :style="{ height: `${obBarHeight(point.calls)}%` }"></div>
                  </div>
                  <div class="chart-label">{{ shortLabel(point.label) }}</div>
                </div>
              </div>
            </div>
            <div class="stats-row mt-4" v-if="outboundAnalytics.length">
              <div class="stat-card glass-card" style="animation-delay:0ms">
                <div class="stat-title">Total Calls (Range)</div>
                <div class="stat-num text-grad-primary">{{ outboundAnalytics.reduce((s, p) => s + (p.calls || 0), 0) }}</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:70ms">
                <div class="stat-title">Total Minutes (Range)</div>
                <div class="stat-num text-grad-accent">{{ fmtNumber(outboundAnalytics.reduce((s, p) => s + (p.minutes || 0), 0)) }}m</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:140ms">
                <div class="stat-title">Completed Calls</div>
                <div class="stat-num text-grad-primary">{{ outboundAnalytics.reduce((s, p) => s + (p.completed || 0), 0) }}</div>
              </div>
            </div>
          </div>

          <!-- ── OUTBOUND CALL LOGS ── -->
          <div v-else-if="activeSection === 'ob-calls'" class="a-view">
            <div class="ob-section-badge">OUTBOUND</div>
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Outbound Call Logs</h3>
                  <p class="a-card-sub">Click a row to view the full transcript</p>
                </div>
                <div class="calls-meta" v-if="!obErrors.calls">
                  <span class="meta-pill">{{ filteredObCalls.length }}{{ obCallSearch ? ` / ${obCalls.length}` : '' }} calls</span>
                </div>
              </div>
              <div v-if="!obErrors.calls" class="search-filter-bar">
                <input v-model="obCallSearch" type="text" placeholder="Search by date, phone, or name…" class="nap-input search-input" />
              </div>
              <div v-if="obErrors.calls" class="section-error">{{ obErrors.calls }}</div>
              <div v-else class="table-wrap">
                <table class="nap-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th><th>To</th><th>Name</th><th>Duration</th>
                      <th>Status</th><th>Sentiment</th><th>Rec.</th><th>Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="call in filteredObCalls" :key="call.id" @click="openObTranscript(call)" class="call-row">
                      <td>{{ fmtDateTime(call.timestamp || call.date) }}</td>
                      <td class="font-mono">{{ fmtPhone(call.to || call.from) }}</td>
                      <td style="font-weight:600">{{ obCallName(call) || '—' }}</td>
                      <td>{{ fmtDurationMin(call.duration_min || 0) }}</td>
                      <td><span :class="['badge', statusBadge(call.status)]">{{ displayStatus(call.status) }}</span></td>
                      <td><span :class="['badge', sentimentBadge(call.sentiment)]">{{ call.sentiment || 'Neutral' }}</span></td>
                      <td><span :class="call.hasRecording ? 'check-yes' : 'check-no'">{{ call.hasRecording ? '✓' : '–' }}</span></td>
                      <td><span :class="call.hasTranscript ? 'check-yes' : 'check-no'">{{ call.hasTranscript ? '✓' : '–' }}</span></td>
                    </tr>
                    <tr v-if="filteredObCalls.length === 0">
                      <td colspan="8" class="empty-cell">{{ obCallSearch ? 'No calls match your search.' : 'No outbound calls found.' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── OUTBOUND TRANSCRIPTS ── -->
          <div v-else-if="activeSection === 'ob-transcripts'" class="a-view">
            <div class="ob-section-badge">OUTBOUND</div>
            <div v-if="obErrors.transcripts" class="glass-card a-card section-error">{{ obErrors.transcripts }}</div>
            <template v-else>
              <div class="glass-card a-card mb-4">
                <div class="search-filter-bar">
                  <input v-model="obTxSearch" type="text" placeholder="Search by date or summary…" class="nap-input search-input" />
                  <span class="meta-pill">{{ filteredObTranscripts.length }}{{ obTxSearch ? ` / ${obTranscripts.length}` : '' }}</span>
                </div>
              </div>
              <div v-if="filteredObTranscripts.length === 0" class="glass-card a-card section-empty">
                {{ obTxSearch ? 'No transcripts match your search.' : 'No outbound transcripts available.' }}
              </div>
              <div v-else class="transcript-list">
                <div
                  v-for="tx in filteredObTranscripts"
                  :key="tx.call_id"
                  class="transcript-card glass-card"
                  @click="activeTranscript = tx"
                >
                  <div class="tx-card__head">
                    <div>
                      <div class="tx-card__date">{{ fmtDateTime(tx.timestamp || tx.date) }}</div>
                      <div class="tx-card__meta">
                        {{ fmtDurationMin(tx.duration_min || 0) }}
                        <span v-if="obCallName(tx)" style="margin-left:8px;font-weight:700;color:var(--c-text-2)">· {{ obCallName(tx) }}</span>
                      </div>
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

          <!-- ── OUTBOUND INVOICES ── -->
          <div v-else-if="activeSection === 'ob-invoices'" class="a-view">
            <div class="ob-section-badge">OUTBOUND</div>
            <div class="glass-card a-card">
              <div class="a-card-head">
                <div>
                  <h3 class="a-card-title">Outbound Invoices</h3>
                  <p class="a-card-sub">Outbound billing history and payment status</p>
                </div>
                <select v-model="obInvoiceFilter" class="nap-input range-select">
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div v-if="obErrors.invoices" class="section-error">{{ obErrors.invoices }}</div>
              <div v-else class="table-wrap">
                <table class="nap-table">
                  <thead>
                    <tr><th>Period</th><th>Amount</th><th>Minutes</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="inv in filteredObInvoices" :key="inv.id">
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
                    <tr v-if="filteredObInvoices.length === 0">
                      <td colspan="5" class="empty-cell">No outbound invoices found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── MAKE A CALL ── -->
          <div v-else-if="activeSection === 'make-call'" class="a-view">
            <div class="ob-section-badge">OUTBOUND</div>

            <!-- Stats row -->
            <div class="stats-row mb-4" style="grid-template-columns:repeat(3,1fr)">
              <div class="stat-card glass-card">
                <div class="stat-icon-chip"><span v-html="ICONS.phoneOut"></span></div>
                <div class="stat-title">Contacts Ready</div>
                <div class="stat-num text-grad-accent">{{ mcValidContacts.length }}</div>
                <div class="stat-sub">Valid rows from CSV</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:40ms">
                <div class="stat-icon-chip"><span v-html="ICONS.file"></span></div>
                <div class="stat-title">Rows With Issues</div>
                <div class="stat-num text-grad-primary">{{ mcRowErrors.length }}</div>
                <div class="stat-sub">Need cleanup before submission</div>
              </div>
              <div class="stat-card glass-card" style="animation-delay:80ms">
                <div class="stat-icon-chip"><span v-html="ICONS.activity"></span></div>
                <div class="stat-title">Retell Status</div>
                <div class="stat-num" style="font-size:20px;line-height:1.2;margin-top:4px">{{ mcRetellStatus }}</div>
                <div :class="['mc-status-chip', mcSubmitState]">{{ mcRetellStatusDetail }}</div>
              </div>
            </div>

            <!-- Upload + Preview grid -->
            <div class="mc-grid">

              <!-- Upload & Validation Panel -->
              <div class="glass-card a-card">
                <div class="stat-title mb-3">CSV Upload</div>

                <label
                  :class="['mc-upload-zone', mcIsDragging && 'mc-upload-zone--drag']"
                  @dragover.prevent="mcIsDragging = true"
                  @dragleave.prevent="mcIsDragging = false"
                  @drop.prevent="mcHandleDrop"
                >
                  <input ref="mcFileInputRef" type="file" accept=".csv,text/csv" style="display:none" @change="mcHandleFileSelect" />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span class="mc-upload-title">Drop CSV here or browse</span>
                  <span class="mc-upload-hint">Required headers: phone number, patient_first_name, patient_last_name, phone_number</span>
                </label>

                <div v-if="mcFileName" class="mc-file-row mt-2">
                  <div>
                    <div style="font-size:12px;font-weight:700;color:var(--c-text)">{{ mcFileName }}</div>
                    <div style="font-size:10.5px;color:var(--c-text-3)">{{ mcTotalRows }} parsed rows</div>
                  </div>
                  <button class="mc-clear-btn" @click="mcClearFile">Clear</button>
                </div>

                <div class="mt-4">
                  <div class="stat-title mb-2">Validation</div>
                  <div v-if="mcMessages.length === 0" class="mc-empty">Upload a CSV to validate contacts.</div>
                  <div v-else class="mc-msg-list">
                    <div v-for="msg in mcMessages" :key="msg.text" :class="['mc-msg', msg.type]">{{ msg.text }}</div>
                  </div>
                </div>

                <button :class="['mc-submit-btn mt-4', !mcCanSubmit && 'mc-submit-btn--disabled']" :disabled="!mcCanSubmit" @click="mcSubmitContacts">
                  {{ mcSubmitButtonLabel }}
                </button>
              </div>

              <!-- Contact Preview Table -->
              <div class="glass-card" style="overflow:hidden">
                <div class="a-card-head" style="padding:18px 20px 14px">
                  <div>
                    <h3 class="a-card-title">Contact Preview</h3>
                    <p class="a-card-sub">Valid contacts from the uploaded CSV</p>
                  </div>
                  <span class="meta-pill">{{ mcValidContacts.length }} contacts</span>
                </div>
                <div class="table-wrap">
                  <table class="nap-table">
                    <thead>
                      <tr><th>phone number</th><th>patient_first_name</th><th>patient_last_name</th><th>phone_number</th><th>Row</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="c in mcPreviewContacts" :key="c.rowNumber">
                        <td class="font-mono" style="font-size:12px">{{ c.phoneDisplay }}</td>
                        <td style="font-weight:600">{{ c.firstName || '—' }}</td>
                        <td style="font-weight:600">{{ c.lastName || '—' }}</td>
                        <td class="font-mono" style="font-size:12px">{{ c.phoneNumber }}</td>
                        <td style="font-size:12px;color:var(--c-text-3)">{{ c.rowNumber }}</td>
                      </tr>
                      <tr v-if="mcPreviewContacts.length === 0">
                        <td colspan="5" class="empty-cell">No valid contacts to preview yet.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="mcValidContacts.length > MC_PREVIEW_LIMIT" class="mc-preview-footer">
                  Showing first {{ MC_PREVIEW_LIMIT }} contacts · {{ mcValidContacts.length - MC_PREVIEW_LIMIT }} more ready
                </div>
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
            <div class="font-bold text-[15px]">{{ fmtDateTime(activeTranscript.timestamp || activeTranscript.date) }}</div>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const API_BASE = '/api/nap'

// ── Polling config ───────────────────────────────────────────────────────────
const INBOUND_REFRESH_MS = 60_000   // inbound data silently refreshes every 60 s
const BATCH_PAUSE_MS     = 2 * 60_000  // pause inbound polling for 2 min after a batch submit
let _inboundTimer = null
let _batchResumeTimer = null

// Extract tenant token from /t/:token or /clinic/:token — null on the bare base URL
const _pathMatch = window.location.pathname.match(/^\/(?:t|clinic)\/([^/]+)/)
const tenantId = _pathMatch?.[1] ? decodeURIComponent(_pathMatch[1]).trim() : null
const hasOutbound = ref(false)

const loading = ref(true)
const tenantValid = ref(null)
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

// Outbound refs (Recoup Health only)
const outboundOverview = ref({})
const outboundAnalytics = ref([])
const obCalls = ref([])
const obTranscripts = ref([])
const obInvoices = ref([])
const outboundRange = ref(1)
const obInvoiceFilter = ref('all')
const obErrors = ref({ overview: '', analytics: '', calls: '', transcripts: '', invoices: '' })
const obCallSearch = ref('')
const obTxSearch = ref('')

// ── Make a Call state ────────────────────────────────────────────────────────
const MC_PREVIEW_LIMIT = 25
const MC_REQUIRED_COLUMNS = {
  phoneDisplay: ['phone number'],
  firstName:    ['patient_first_name'],
  lastName:     ['patient_last_name'],
  phoneNumber:  ['phone_number'],
}
const mcFileInputRef  = ref(null)
const mcFileName      = ref('')
const mcTotalRows     = ref(0)
const mcContacts      = ref([])
const mcRowErrors     = ref([])
const mcFileErrors    = ref([])
const mcIsDragging    = ref(false)
const mcSubmitState   = ref('idle')
const mcSubmitMessage = ref('')

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
  phoneOut: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.5 19.79 19.79 0 0 1 1.63 2.84 2 2 0 0 1 3.6.66h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.37a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/><polyline points="16 2 22 2 22 8"/><line x1="22" y1="2" x2="15" y2="9"/></svg>`,
  clock:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  dollar:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  wave:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
}

const navSections = computed(() => [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'overview', label: 'Overview', icon: ICONS.grid },
    ],
  },
  {
    label: 'INBOUND',
    items: [
      { id: 'call-volume',  label: 'Analytics',        icon: ICONS.activity },
      { id: 'call-logs',    label: 'Call Logs',         icon: ICONS.phone },
      { id: 'transcripts',  label: 'Transcribed Calls', icon: ICONS.message },
      { id: 'invoices',     label: 'Invoices',          icon: ICONS.file },
    ],
  },
  ...(hasOutbound.value ? [{
    label: 'OUTBOUND',
    items: [
      { id: 'ob-analytics',   label: 'Analytics',   icon: ICONS.activity },
      { id: 'ob-calls',       label: 'Call Logs',   icon: ICONS.phone },
      { id: 'ob-transcripts', label: 'Transcripts', icon: ICONS.message },
      { id: 'ob-invoices',    label: 'Invoices',    icon: ICONS.file },
      { id: 'make-call',      label: 'Make a Call', icon: ICONS.phoneOut },
    ],
  }] : []),
  {
    label: 'ACCOUNT',
    items: [
      { id: 'my-plan', label: 'My Plan',           icon: ICONS.star },
      { id: 'contact', label: 'Contact & Upgrade', icon: ICONS.mail },
    ],
  },
])

const sectionMeta = {
  'overview':       { title: 'Overview',             sub: 'Combined inbound & outbound usage at a glance.' },
  'call-volume':    { title: 'Inbound Analytics',    sub: 'Inbound call volume and trends over time.' },
  'call-logs':      { title: 'Inbound Call Logs',    sub: 'All recent calls from your AI receptionist.' },
  'transcripts':    { title: 'Transcribed Calls',    sub: 'Full conversation recordings and summaries.' },
  'invoices':       { title: 'Inbound Invoices',     sub: 'Billing history and payment status.' },
  'my-plan':        { title: 'My Plan',              sub: 'Your current plan details and usage.' },
  'contact':        { title: 'Contact & Upgrade',    sub: 'Get help or upgrade your NAP Solutions plan.' },
  'ob-analytics':   { title: 'Outbound Analytics',  sub: 'Outbound call volume and trends over time.' },
  'ob-calls':       { title: 'Outbound Call Logs',   sub: 'All outbound calls from your campaign.' },
  'ob-transcripts': { title: 'Outbound Transcripts', sub: 'Full outbound conversation recordings and summaries.' },
  'ob-invoices':    { title: 'Outbound Invoices',    sub: 'Outbound billing history and payment status.' },
  'make-call':      { title: 'Make a Call',          sub: 'Upload a contact list and launch an outbound campaign via Retell AI.' },
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
const minutesCapDisplay  = computed(() => Number(overview.value?.minutesIncluded || 1000))
const billingPctDisplay  = computed(() => {
  const cap = minutesCapDisplay.value
  if (!cap) return 0
  return Math.min(100, (minutesUsedDisplay.value / cap) * 100)
})

// Combined inbound + outbound meter
const obMinutesCap       = computed(() => Number(outboundOverview.value?.minutesIncluded || 1000))
const combinedMinutes    = computed(() => minutesUsedDisplay.value + (hasOutbound.value ? obMinutesUsed.value : 0))
const combinedCap        = computed(() => minutesCapDisplay.value + (hasOutbound.value ? obMinutesCap.value : 0))
const combinedPct        = computed(() => combinedCap.value ? Math.min(100, (combinedMinutes.value / combinedCap.value) * 100) : 0)
const inboundSharePct    = computed(() => combinedCap.value ? Math.min(100, (minutesUsedDisplay.value / combinedCap.value) * 100) : 0)
const outboundSharePct   = computed(() => combinedCap.value ? Math.min(100, (obMinutesUsed.value / combinedCap.value) * 100) : 0)

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
  { label: 'Billing Period',       value: overview.value.billingPeriod || '—' },
  { label: 'Inbound Minutes',      value: `${fmtNumber(minutesUsedDisplay.value)} / ${fmtNumber(minutesCapDisplay.value)}` },
  ...(hasOutbound.value ? [
    { label: 'Outbound Minutes',   value: `${fmtNumber(obMinutesUsed.value)} / ${fmtNumber(obMinutesCap.value)}` },
  ] : []),
  { label: 'Total Minutes Used',   value: fmtNumber(combinedMinutes.value) },
])

// Outbound computed properties
const obMinutesUsed = computed(() => Number(outboundOverview.value?.minutesUsed || 0))
const obBillingPct  = computed(() => obMinutesCap.value ? Math.min(100, (obMinutesUsed.value / obMinutesCap.value) * 100) : 0)

const obStatCards = computed(() => [
  {
    title: 'Minutes Used',
    value: `${fmtNumber(obMinutesUsed.value)} / ${fmtNumber(obMinutesCap.value)}`,
    sub: `${fmtNumber(obBillingPct.value)}% of plan`,
    progress: obBillingPct.value,
    gradient: 'primary',
    icon: ICONS.clock,
  },
  {
    title: 'Total Calls',
    value: String(outboundOverview.value.totalCalls || 0),
    sub: outboundOverview.value.billingPeriod || '',
    gradient: 'accent',
    icon: ICONS.phone,
  },
  {
    title: 'Overage Cost',
    value: money(outboundOverview.value.overageUSD || 0),
    gradient: 'primary',
    icon: ICONS.dollar,
  },
  {
    title: 'Avg Call Duration',
    value: fmtDurationMin(outboundOverview.value.avgCallMin || 0),
    gradient: 'accent',
    icon: ICONS.wave,
  },
])

const obTranscriptByCallId = computed(() => {
  const map = new Map()
  for (const item of obTranscripts.value) {
    if (item?.call_id) map.set(item.call_id, item)
  }
  return map
})

const filteredObInvoices = computed(() => {
  if (obInvoiceFilter.value === 'all') return obInvoices.value
  const paid = obInvoiceFilter.value === 'paid'
  return obInvoices.value.filter((inv) => Boolean(inv.paid) === paid)
})

const obOverageInvoices = computed(() =>
  obInvoices.value.filter((inv) => inv.isOverage || (inv.overageMin ?? 0) > 0)
)

const filteredObCalls = computed(() => {
  const q = obCallSearch.value.trim().toLowerCase()
  return q
    ? obCalls.value.filter(call => {
        const date  = fmtDateTime(call.timestamp || call.date).toLowerCase()
        const phone = fmtPhone(call.to || call.from).toLowerCase()
        const name  = obCallName(call).toLowerCase()
        return date.includes(q) || phone.includes(q) || name.includes(q)
      })
    : obCalls.value
})

const filteredObTranscripts = computed(() => {
  const q = obTxSearch.value.trim().toLowerCase()
  return q
    ? obTranscripts.value.filter(tx => {
        const date    = fmtDateTime(tx.timestamp || tx.date).toLowerCase()
        const summary = String(tx.summary || '').toLowerCase()
        const name    = obCallName(tx).toLowerCase()
        return date.includes(q) || summary.includes(q) || name.includes(q)
      })
    : obTranscripts.value
})

// ── Make a Call computed ─────────────────────────────────────────────────────
const mcValidContacts   = computed(() => mcContacts.value.filter(c => c.isValid))
const mcPreviewContacts = computed(() => mcValidContacts.value.slice(0, MC_PREVIEW_LIMIT))
const mcCanSubmit       = computed(() => mcValidContacts.value.length > 0 && mcFileErrors.value.length === 0 && mcSubmitState.value !== 'submitting')
const mcRetellStatus    = computed(() => {
  if (mcSubmitState.value === 'success')    return 'Connected'
  if (mcSubmitState.value === 'error')      return 'Needs Attention'
  if (mcSubmitState.value === 'submitting') return 'Submitting'
  return 'Ready'
})
const mcRetellStatusDetail = computed(() => {
  if (mcSubmitState.value === 'success')    return 'Batch sent'
  if (mcSubmitState.value === 'error')      return 'Submission failed'
  if (mcSubmitState.value === 'submitting') return 'Sending contacts'
  return 'n8n → Retell AI'
})
const mcSubmitButtonLabel = computed(() => {
  if (mcSubmitState.value === 'submitting') return 'Sending to Retell AI...'
  if (mcValidContacts.value.length === 0)   return 'Upload contacts first'
  return `Submit ${mcValidContacts.value.length} contacts to Retell`
})
const mcMessages = computed(() => {
  const list = mcFileErrors.value.map(text => ({ type: 'error', text }))
  if (mcFileName.value && mcFileErrors.value.length === 0)
    list.push({ type: 'success', text: `${mcValidContacts.value.length} contacts ready to preview.` })
  mcRowErrors.value.slice(0, 5).forEach(e => list.push({ type: 'warning', text: `Row ${e.rowNumber}: ${e.message}` }))
  if (mcRowErrors.value.length > 5)
    list.push({ type: 'warning', text: `${mcRowErrors.value.length - 5} more rows have issues.` })
  if (mcSubmitMessage.value)
    list.push({ type: mcSubmitState.value === 'success' ? 'success' : 'error', text: mcSubmitMessage.value })
  return list
})

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
      const date = fmtDateTime(call.timestamp || call.date).toLowerCase()
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
      const date = fmtDateTime(tx.timestamp || tx.date).toLowerCase()
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

function normalizeInvoices(list) {
  return (Array.isArray(list) ? list : []).map((inv, index) => {
    const period = String(inv?.period || '').trim() || overview.value?.billingPeriod || currentBillingPeriodFallback()
    const amountRaw = String(inv?.amount || '').trim()
    const amount = amountRaw || '$0.00'
    const used = Number(inv?.minutesUsed ?? 0)
    const cap  = Number(inv?.includedMinutes ?? minutesCapDisplay.value)
    const minutes = `${fmtNumber(used)} / ${fmtNumber(cap)}`
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

function startInboundPolling() {
  if (_inboundTimer) return
  _inboundTimer = setInterval(refreshInboundSilent, INBOUND_REFRESH_MS)
}

function stopInboundPolling() {
  if (_inboundTimer) { clearInterval(_inboundTimer); _inboundTimer = null }
}

// Quietly refreshes inbound-only data (no loading spinner, no outbound touch)
async function refreshInboundSilent() {
  if (!tenantId) return
  const tid = encodeURIComponent(tenantId)
  const [ovRes, callsRes, txRes, invRes] = await Promise.allSettled([
    fetchJson(`${API_BASE}/overview?tenantId=${tid}`),
    fetchJson(`${API_BASE}/calls?tenantId=${tid}`),
    fetchJson(`${API_BASE}/transcripts?tenantId=${tid}`),
    fetchJson(`${API_BASE}/invoices?tenantId=${tid}`),
  ])
  if (ovRes.status    === 'fulfilled') overview.value    = ovRes.value    || {}
  if (callsRes.status === 'fulfilled') calls.value       = Array.isArray(callsRes.value?.calls)        ? callsRes.value.calls        : []
  if (txRes.status    === 'fulfilled') transcripts.value = Array.isArray(txRes.value?.transcripts)     ? txRes.value.transcripts     : []
  if (invRes.status   === 'fulfilled') invoices.value    = normalizeInvoices(invRes.value?.invoices)
}

async function loadAll() {
  if (!tenantId) {
    loading.value = false
    return
  }
  // Reset any existing timers so the 60s clock restarts from now
  stopInboundPolling()
  if (_batchResumeTimer) { clearTimeout(_batchResumeTimer); _batchResumeTimer = null }

  loading.value = true
  errors.value = { overview: '', analytics: '', calls: '', transcripts: '', invoices: '' }
  obErrors.value = { overview: '', analytics: '', calls: '', transcripts: '', invoices: '' }

  const tid = encodeURIComponent(tenantId)

  // Resolve tenant capabilities — 401 means invalid token, stop immediately
  try {
    const caps = await fetchJson(`${API_BASE}/tenant?tenantId=${tid}`)
    hasOutbound.value = !!caps.hasOutbound
    tenantValid.value = true
  } catch {
    tenantValid.value = false
    loading.value = false
    return
  }

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
  if (hasOutbound.value) loadOutbound()
  startInboundPolling()   // begin 60s silent inbound refresh
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
watch(outboundRange, () => { reloadObAnalytics() })
onMounted(() => { loadAll() })
onUnmounted(() => {
  stopInboundPolling()
  if (_batchResumeTimer) clearTimeout(_batchResumeTimer)
})

function fmtNumber(value)     { return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 }) }
function money(value)         { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
function fmtDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(dateStr) {
  if (!dateStr) return '-'
  const hasTime = /[T ](\d{1,2}:)/.test(String(dateStr))
  const d = hasTime ? new Date(dateStr) : new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (!hasTime) return datePart
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart}, ${timePart}`
}
function fmtDurationMin(durationMin) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMin || 0) * 60))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
function fmtPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length > 6) return `+${digits}`
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
function obBarHeight(callsCount) {
  const max = Math.max(...outboundAnalytics.value.map((p) => Number(p.calls || 0)), 1)
  return (Number(callsCount || 0) / max) * 100
}
function openObTranscript(call) {
  const tx = obTranscriptByCallId.value.get(call.id)
  if (!tx) return
  activeTranscript.value = tx
}

function obCallName(item) {
  const full = item?.contactName || item?.contact_name || item?.callerName ||
    item?.name || item?.caller_name ||
    [item?.contact_first_name || item?.first_name, item?.contact_last_name || item?.last_name].filter(Boolean).join(' ')
  const trimmed = String(full || '').trim()
  return trimmed.toLowerCase() === 'unknown' ? '' : trimmed
}

function filterObHourly(data) {
  if (outboundRange.value !== 0) return data
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return data.filter((point) => {
    const m = String(point.label || '').match(/^(\d{2}):(\d{2})$/)
    if (!m) return true
    return Number(m[1]) * 60 + Number(m[2]) <= nowMinutes
  })
}

async function loadOutbound() {
  if (!hasOutbound.value || !tenantId) return
  const tid = encodeURIComponent(tenantId)
  const OB = '/api/nap/outbound'
  const tasks = [
    fetchJson(`${OB}/overview?tenantId=${tid}`),
    fetchJson(`${OB}/analytics?tenantId=${tid}&range=${outboundRange.value}`),
    fetchJson(`${OB}/calls?tenantId=${tid}`),
    fetchJson(`${OB}/transcripts?tenantId=${tid}`),
    fetchJson(`${OB}/invoices?tenantId=${tid}`),
  ]
  const [ovRes, anRes, callsRes, txRes, invRes] = await Promise.allSettled(tasks)
  if (ovRes.status === 'fulfilled')    outboundOverview.value  = ovRes.value || {}
  else obErrors.value.overview         = 'Failed to load outbound overview.'
  if (anRes.status === 'fulfilled')    outboundAnalytics.value = filterObHourly(Array.isArray(anRes.value) ? anRes.value : [])
  else obErrors.value.analytics        = 'Failed to load outbound analytics.'
  if (callsRes.status === 'fulfilled') obCalls.value           = Array.isArray(callsRes.value?.calls) ? callsRes.value.calls : []
  else obErrors.value.calls            = 'Failed to load outbound calls.'
  if (txRes.status === 'fulfilled')    obTranscripts.value     = Array.isArray(txRes.value?.transcripts) ? txRes.value.transcripts : []
  else obErrors.value.transcripts      = 'Failed to load outbound transcripts.'
  if (invRes.status === 'fulfilled')   obInvoices.value        = normalizeInvoices(invRes.value?.invoices)
  else obErrors.value.invoices         = 'Failed to load outbound invoices.'
}

async function reloadObAnalytics() {
  if (!hasOutbound.value || !tenantId) return
  obErrors.value.analytics = ''
  try {
    const tid = encodeURIComponent(tenantId)
    const data = await fetchJson(`/api/nap/outbound/analytics?tenantId=${tid}&range=${outboundRange.value}`)
    outboundAnalytics.value = filterObHourly(Array.isArray(data) ? data : [])
  } catch {
    obErrors.value.analytics = 'Failed to load outbound analytics.'
    outboundAnalytics.value = []
  }
}

// ── Make a Call helpers ──────────────────────────────────────────────────────
function mcNormalizeHeader(v) {
  return String(v || '').trim().toLowerCase().replace(/[\s-]+/g, ' ').replace(/_/g, ' ')
}
function mcNormalizePhone(raw) {
  const s = String(raw || '').trim()
  if (/^\+[1-9]\d{6,14}$/.test(s)) return s              // already E.164
  const digits = s.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`           // North American 10-digit
  if (digits.length === 11 && digits[0] === '1') return `+${digits}` // NA with country code
  if (digits.length >= 7)  return `+${digits}`             // best-effort international
  return s                                                 // give up, let validation fail
}
function mcSplitCsvLine(line) {
  const values = []; let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i], nx = line[i + 1]
    if (ch === '"' && inQuotes && nx === '"') { current += '"'; i++ }
    else if (ch === '"') inQuotes = !inQuotes
    else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = '' }
    else current += ch
  }
  values.push(current.trim())
  return values
}
function mcParseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) throw new Error('CSV file is empty.')
  const headers = mcSplitCsvLine(lines[0]).map(mcNormalizeHeader)
  const colIdx = {}, missing = []
  for (const [field, aliases] of Object.entries(MC_REQUIRED_COLUMNS)) {
    const i = headers.findIndex(h => aliases.map(mcNormalizeHeader).includes(h))
    if (i === -1) missing.push(aliases[0]); else colIdx[field] = i
  }
  if (missing.length > 0) throw new Error(`Missing required headers: ${missing.join(', ')}.`)
  const parsed = [], errs = []
  lines.slice(1).forEach((line, idx) => {
    const rn = idx + 2
    const vals = mcSplitCsvLine(line)
    const phoneDisplay = String(vals[colIdx.phoneDisplay] || '').trim()
    const rawPhone = String(vals[colIdx.phoneNumber] || '').trim().replace(/[\s().-]/g, '')
    const firstName = vals[colIdx.firstName]?.trim() || ''
    const lastName  = vals[colIdx.lastName]?.trim()  || ''
    if (!rawPhone && !firstName && !lastName) return
    const phone = rawPhone ? mcNormalizePhone(rawPhone) : ''
    const isValid = Boolean(phone) && /^\+[1-9]\d{6,14}$/.test(phone)
    if (!phone) errs.push({ rowNumber: rn, message: 'phone_number is required.' })
    else if (!isValid) errs.push({ rowNumber: rn, message: 'phone_number must be E.164 format, e.g. +14165551234.' })
    parsed.push({ rowNumber: rn, phoneDisplay, phoneNumber: phone, firstName, lastName, isValid })
  })
  if (parsed.length === 0) throw new Error('CSV has no contact rows.')
  return { rows: lines.length - 1, contacts: parsed, errors: errs }
}
function mcClearFile() {
  mcFileName.value = ''; mcTotalRows.value = 0; mcContacts.value = []
  mcRowErrors.value = []; mcFileErrors.value = []; mcSubmitState.value = 'idle'; mcSubmitMessage.value = ''
  if (mcFileInputRef.value) mcFileInputRef.value.value = ''
}
function mcReadFile(file) {
  mcClearFile(); mcFileName.value = file.name
  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    mcFileErrors.value = ['Please upload a CSV file.']; return
  }
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const r = mcParseCsv(String(reader.result || ''))
      mcTotalRows.value = r.rows; mcContacts.value = r.contacts; mcRowErrors.value = r.errors
    } catch (e) { mcFileErrors.value = [e.message || 'Unable to parse CSV.'] }
  }
  reader.onerror = () => { mcFileErrors.value = ['Unable to read file.'] }
  reader.readAsText(file)
}
function mcHandleFileSelect(e) { const f = e.target.files?.[0]; if (f) mcReadFile(f) }
function mcHandleDrop(e) { mcIsDragging.value = false; const f = e.dataTransfer.files?.[0]; if (f) mcReadFile(f) }
async function mcSubmitContacts() {
  if (!mcCanSubmit.value) return
  mcSubmitState.value = 'submitting'; mcSubmitMessage.value = ''

  // Pause the 60s inbound refresh while the batch is running
  stopInboundPolling()
  if (_batchResumeTimer) { clearTimeout(_batchResumeTimer); _batchResumeTimer = null }

  try {
    const tid = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
    const payload = mcValidContacts.value.map(c => ({ patient_phone: c.phoneNumber, patient_first_name: c.firstName, patient_last_name: c.lastName }))
    const resp = await fetch(`/api/nap/outbound/retell-batch${tid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ contacts: payload }),
    })
    const data = await resp.json()
    if (!resp.ok || !data?.success) throw new Error(data?.error || `HTTP ${resp.status}`)
    mcSubmitState.value = 'success'
    mcSubmitMessage.value = data?.retell?.batch_call_id
      ? `Retell batch created: ${data.retell.batch_call_id}`
      : 'Contacts sent to Retell AI.'

    // After 2 min: refresh outbound call data once, then resume inbound polling
    _batchResumeTimer = setTimeout(async () => {
      _batchResumeTimer = null
      if (hasOutbound.value) await loadOutbound()
      startInboundPolling()
    }, BATCH_PAUSE_MS)

  } catch (e) {
    mcSubmitState.value = 'error'
    mcSubmitMessage.value = e?.message || 'Unable to submit contacts.'
    // Batch didn't go through — resume polling immediately
    startInboundPolling()
  }
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

/* ── Combined meter ─────────────────────────────────────── */
.combined-meter-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px;
}
.combined-period { font-size: 12px; color: var(--c-text-3); margin-top: 3px; }
.combined-total { text-align: right; }
.combined-cap-label { font-size: 14px; font-weight: 600; color: var(--c-text-3); }
.combined-bar {
  display: flex; height: 10px; border-radius: 999px;
  background: rgba(91,63,143,0.08); overflow: hidden; margin-bottom: 12px;
}
.combined-bar__fill {
  height: 100%; transition: width 900ms cubic-bezier(.22,1,.36,1); min-width: 0;
}
.combined-bar__fill--in  { background: var(--grad-primary); }
.combined-bar__fill--ob  { background: var(--grad-accent); }
.combined-legend { display: flex; gap: 20px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--c-text-2); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-dot--in { background: var(--grad-primary); }
.legend-dot--ob { background: var(--grad-accent); }
.progress-fill--ob { background: var(--grad-accent); }

/* ── Sidebar plan bar (split) ───────────────────────────── */
.a-sidebar__plan-bar { display: flex; }
.a-sidebar__plan-fill--in {
  height: 100%; background: var(--grad-primary); border-radius: 999px 0 0 999px;
  transition: width 900ms cubic-bezier(.22,1,.36,1);
}
.a-sidebar__plan-fill--ob {
  height: 100%; background: var(--grad-accent); border-radius: 0 999px 999px 0;
  transition: width 900ms cubic-bezier(.22,1,.36,1);
}

/* ── Outbound section ───────────────────────────────────── */
.ob-section-badge {
  display: inline-flex; align-items: center;
  background: var(--grad-accent); color: #fff;
  font-size: 9px; font-weight: 900; letter-spacing: 2px;
  padding: 3px 12px; border-radius: 99px; margin-bottom: 16px;
}
.chart-bar-fill--ob { background: var(--grad-accent); }

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 1100px) { .stats-row, .shimmer-stat-row, .quick-stats { grid-template-columns: repeat(2, 1fr); } .plan-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px)  { .a-sidebar { display: none; } }
@media (max-width: 600px)  {
  .stats-row, .shimmer-stat-row, .quick-stats { grid-template-columns: 1fr; }
  .drawer-panel { width: 100%; top: 0; }
  .a-main__inner { padding: 16px 14px 60px; }
  .plan-grid { grid-template-columns: 1fr; }
}

/* ── Make a Call section ─────────────────────────────────── */
.mc-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(380px, 1.4fr);
  gap: 16px;
}
.mc-upload-zone {
  min-height: 176px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 20px; border-radius: 12px; border: 1.5px dashed rgba(91,63,143,0.22);
  background: rgba(255,255,255,0.55); color: var(--c-purple-mid); cursor: pointer; text-align: center;
  transition: border-color .15s, background .15s, transform .15s;
}
.mc-upload-zone:hover, .mc-upload-zone--drag {
  border-color: var(--c-teal); background: rgba(0,168,138,0.05); transform: translateY(-1px);
}
.mc-upload-title { font-size: 13px; font-weight: 800; color: var(--c-text); }
.mc-upload-hint  { font-size: 11px; color: var(--c-text-3); max-width: 230px; line-height: 1.5; }
.mc-file-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; border-radius: 9px; border: 1px solid var(--border-color);
  background: rgba(255,255,255,0.7);
}
.mc-clear-btn {
  flex-shrink: 0; padding: 5px 9px; border-radius: 7px; border: 1px solid rgba(224,92,92,0.3);
  background: rgba(224,92,92,0.06); color: #e05c5c; font-size: 11px; font-weight: 800; cursor: pointer;
}
.mc-empty { padding: 10px; border-radius: 9px; background: rgba(91,63,143,0.04); color: var(--c-text-3); font-size: 12px; font-weight: 600; }
.mc-msg-list { display: flex; flex-direction: column; gap: 6px; }
.mc-msg { padding: 8px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; border: 1px solid transparent; }
.mc-msg.success { background: var(--ok-light); border-color: var(--ok-border); color: var(--c-teal); }
.mc-msg.warning { background: var(--warn-light); border-color: var(--warn-border); color: #c27800; }
.mc-msg.error   { background: var(--danger-light); border-color: var(--danger-border); color: #e03050; }
.mc-status-chip {
  display: inline-flex; align-items: center; padding: 4px 9px; border-radius: 7px;
  font-size: 11px; font-weight: 800; margin-top: 6px;
}
.mc-status-chip.idle, .mc-status-chip.submitting { background: var(--warn-light); border: 1px solid var(--warn-border); color: #c27800; }
.mc-status-chip.success { background: var(--ok-light); border: 1px solid var(--ok-border); color: var(--c-teal); }
.mc-status-chip.error   { background: var(--danger-light); border: 1px solid var(--danger-border); color: #e03050; }
.mc-submit-btn {
  width: 100%; padding: 10px; border-radius: 9px; border: none;
  background: var(--grad-accent); color: #fff; font-size: 12px; font-weight: 800; cursor: pointer;
  box-shadow: var(--shadow-glow); transition: opacity .15s, transform .15s;
}
.mc-submit-btn:hover:not(.mc-submit-btn--disabled) { transform: translateY(-1px); }
.mc-submit-btn--disabled { background: rgba(91,63,143,0.1); color: var(--c-text-3); cursor: not-allowed; box-shadow: none; }
.mc-preview-footer { padding: 11px 18px; border-top: 1px solid var(--border-color); color: var(--c-text-3); font-size: 12px; font-weight: 600; text-align: center; }
@media (max-width: 900px) { .mc-grid { grid-template-columns: 1fr; } }

/* ── Invalid link state ──────────────────────────────────── */
.invalid-link-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 64px 32px; max-width: 480px; margin: 0 auto;
  animation: view-in 260ms cubic-bezier(.22,1,.36,1) both;
}
.invalid-link-icon {
  width: 64px; height: 64px; border-radius: 18px;
  background: var(--danger-light); border: 1px solid var(--danger-border);
  color: #e03050; display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.invalid-link-title { font-size: 18px; font-weight: 900; color: var(--c-text); margin-bottom: 10px; }
.invalid-link-sub   { font-size: 13px; color: var(--c-text-3); line-height: 1.6; max-width: 340px; }
</style>
