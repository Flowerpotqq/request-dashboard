<template>
  <span :class="['badge', badgeClass]">
    <span class="badge-dot"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const badgeClass = computed(() => {
  switch (props.status) {
    case 'completed': return 'badge-completed'
    case 'denied':    return 'badge-denied'
    default:          return 'badge-pending'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'completed': return 'Completed'
    case 'denied':    return 'Denied'
    default:          return 'Pending'
  }
})
</script>
