<template>
  <header class="topbar">
    <!-- Left: logo + navigation -->
    <div class="flex items-center gap-3">
      <BrandLogo class="topbar-logo" alt="NAP Solutions" />

      <div class="product-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        Receptionist Dashboard
      </div>

      <nav class="topbar-nav" aria-label="Primary">
        <button
          v-for="item in navItems"
          :key="item.key"
          :class="['topbar-nav-item', store.activeTab === item.key ? 'topbar-nav-item-active' : '']"
          @click="store.loadTab(item.key)"
        >
          {{ item.label }}
          <span
            v-if="item.key === 'requests' && pendingCount > 0"
            :class="['topbar-nav-count', store.activeTab === item.key ? 'topbar-nav-count-active' : '']"
          >
            {{ pendingCount }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Right: status + pending count + user -->
    <div class="flex items-center gap-3">
      <!-- Pending requests badge -->
      <div v-if="pendingCount > 0" class="badge-pending-count">
        <span class="dot-pulse"></span>
        {{ pendingCount }} pending
      </div>

      <div class="text-right">
        <div class="text-sm font-bold text-nap-text">{{ store.receptionistName }}</div>
        <div class="text-[11px] text-nap-text-3">{{ store.clinicName }}</div>
      </div>
      <div class="avatar">{{ initials }}</div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import BrandLogo from '@/components/BrandLogo.vue'

const store = useRequestsStore()

const pendingCount = computed(() =>
  store.requests.filter(r => r.status === 'pending').length
)

const navItems = [
  { key: 'requests', label: 'Request Queue' },
]

const initials = computed(() => {
  return store.receptionistName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>

<style scoped>
.topbar {
  height: 60px; min-height: 60px; z-index: 200;
  background: rgba(255,255,255,0.98);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; backdrop-filter: blur(24px);
  box-shadow: 0 1px 0 var(--border-color), 0 4px 20px rgba(91,63,143,0.06);
  flex-shrink: 0;
}
.topbar-logo {
  height: 34px;
  min-width: 100px;
  flex-shrink: 0;
}
.product-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  background: rgba(91,63,143,0.06); border: 1px solid var(--border-color);
  font-size: 11px; font-weight: 700; color: var(--c-text-2);
}
.topbar-nav {
  display: flex; align-items: center; gap: 6px;
  padding-left: 6px;
}
.topbar-nav-item {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--c-text-3);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background .14s ease, border-color .14s ease, color .14s ease;
}
.topbar-nav-item:hover {
  background: rgba(91,63,143,0.05);
  color: var(--c-text-2);
}
.topbar-nav-item-active {
  background: rgba(91,63,143,0.08);
  border-color: var(--border-color);
  color: var(--c-text);
  box-shadow: var(--shadow-nap);
}
.topbar-nav-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--warn-light);
  border: 1px solid var(--warn-border);
  color: var(--c-amber);
  font-size: 10px;
  font-weight: 800;
}
.topbar-nav-count-active {
  background: rgba(255, 197, 61, 0.18);
}
.badge-pending-count {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 20px;
  background: var(--warn-light); border: 1px solid var(--warn-border);
  font-size: 11px; font-weight: 700; color: var(--c-amber);
}
.dot-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--c-amber); flex-shrink: 0;
  animation: pulse-glow 1.4s ease-in-out infinite;
}
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--grad-accent);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 900; font-size: 13px;
  box-shadow: var(--shadow-glow); flex-shrink: 0;
}

@media (max-width: 980px) {
  .topbar {
    height: auto; min-height: 60px;
    padding: 12px 18px;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }
  .topbar-nav {
    width: 100%;
    padding-left: 0;
    flex-wrap: wrap;
  }
}

@media (max-width: 720px) {
  .product-chip,
  .text-right {
    display: none;
  }
}
</style>
