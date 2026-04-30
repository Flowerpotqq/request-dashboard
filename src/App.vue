<template>
  <div class="app-shell">
    <!-- Ambient orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>

    <!-- Top bar -->
    <Topbar />

    <!-- Main content -->
    <main ref="mainAreaRef" class="main-area">
      <div class="content-wrap">
        <Transition name="tab" mode="out-in">
          <component :is="activeView" :key="store.activeTab" />
        </Transition>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRequestsStore } from '@/stores/requests'
import Topbar   from '@/components/Topbar.vue'
import Requests from '@/views/Requests.vue'
import Analytics from '@/views/Analytics.vue'

const store = useRequestsStore()
const mainAreaRef = ref(null)

const viewsByTab = {
  requests: Requests,
  analytics: Analytics,
}

const activeView = computed(() => viewsByTab[store.activeTab] || Requests)

// Scroll back to top on tab change
watch(() => store.activeTab, () => {
  if (mainAreaRef.value) mainAreaRef.value.scrollTop = 0
})

onMounted(() => store.init())
</script>

<style scoped>
.app-shell {
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  background: var(--bg-page);
  overflow: hidden; position: relative;
}

.orb {
  position: fixed; border-radius: 50%; pointer-events: none;
  filter: blur(80px); z-index: 0;
}
.orb-1 {
  width: 520px; height: 520px; top: -160px; right: -120px;
  background: radial-gradient(circle, rgba(91,63,143,0.12) 0%, transparent 70%);
  animation: orb1 18s ease-in-out infinite;
}
.orb-2 {
  width: 420px; height: 420px; bottom: -120px; left: 5%;
  background: radial-gradient(circle, rgba(0,168,138,0.08) 0%, transparent 70%);
  animation: orb2 22s ease-in-out infinite;
}

.main-area {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  position: relative; z-index: 1;
  scroll-behavior: smooth;
}
.content-wrap {
  max-width: 1320px; margin: 0 auto;
  padding: 28px 28px;
  position: relative;
}
</style>
