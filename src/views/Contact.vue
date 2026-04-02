<template>
  <div>
    <div class="mb-6">
      <h2 class="text-[24px] font-black tracking-tight mb-1">
        <span class="text-grad-primary">Contact &amp; Support</span>
      </h2>
      <p class="text-sm text-nap-text-2">Get help with the receptionist dashboard or upgrade your plan.</p>
    </div>

    <div class="grid grid-cols-2 gap-5 animate-tab-enter">

      <!-- Support card -->
      <div class="glass-card p-6">
        <div class="card-icon card-icon-teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 class="text-[15px] font-black text-nap-text mt-4 mb-2">Technical Support</h3>
        <p class="text-sm text-nap-text-2 mb-4 leading-relaxed">
          Need help connecting n8n, setting up webhooks, or troubleshooting the dashboard?
        </p>
        <a href="mailto:support@getnapsolutions.com" class="nap-btn nap-btn-primary inline-flex">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Email Support
        </a>
      </div>

      <!-- Upgrade card -->
      <div class="glass-card p-6">
        <div class="card-icon card-icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h3 class="text-[15px] font-black text-nap-text mt-4 mb-2">Upgrade to Full Product</h3>
        <p class="text-sm text-nap-text-2 mb-4 leading-relaxed">
          Connect your CRM for automatic appointment booking, real-time calendar sync, and advanced analytics.
        </p>
        <a href="mailto:hello@getnapsolutions.com" class="nap-btn nap-btn-primary inline-flex">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Get Full Access
        </a>
      </div>

    </div>

    <!-- Trial info banner -->
    <div class="trial-banner mt-5 animate-tab-enter" style="animation-delay:80ms">
      <div class="flex items-start gap-3">
        <div class="trial-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div class="text-[13px] font-bold text-nap-text mb-1">You're on the Free Trial plan</div>
          <div class="text-sm text-nap-text-2 leading-relaxed">
            This dashboard collects AI-generated requests and lets you manage them manually.
            Upgrading to the full NAP product adds direct CRM integration, live calendar sync,
            automated confirmations, and a full analytics suite.
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.card-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.card-icon-teal   { background: var(--ok-light);   border: 1px solid var(--ok-border);    color: var(--c-teal); }
.card-icon-purple { background: var(--purple-light); border: 1px solid var(--purple-border); color: var(--c-purple); }

.trial-banner {
  background: rgba(45,95,196,0.04); border: 1px solid rgba(45,95,196,0.14);
  border-radius: 12px; padding: 16px 20px;
}
.trial-icon {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  background: rgba(45,95,196,0.08); border: 1px solid rgba(45,95,196,0.18);
  display: flex; align-items: center; justify-content: center; color: var(--c-blue);
}
</style>
