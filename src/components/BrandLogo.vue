<template>
  <img class="brand-logo" :src="napLogo" :alt="alt" />
</template>

<script setup>
import napLogo from '@/assets/nap-solutions-logo.svg'

defineProps({
  alt: {
    type: String,
    default: 'NAP Solutions'
  }
})
</script>

<style scoped>
.brand-logo {
  display: block;
  width: auto;
  height: 100%;
  object-fit: contain;
}
</style>
