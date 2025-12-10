<script setup lang="ts">
defineProps<{
  isEnabled: boolean
}>()

const emit = defineEmits<{
  toggleEnabled: []
}>()
</script>

<template>
  <div class="toolbar">
    <button
      class="toolbar-btn"
      :class="{ active: isEnabled }"
      title="Toggle Vue Scan"
      @click="emit('toggleEnabled')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>

    <div class="toolbar-divider" />

    <div
      class="toggle-switch"
      :class="{ active: isEnabled }"
      title="Enable/Disable highlighting"
      @click="emit('toggleEnabled')"
    />

    <div style="flex: 1" />

    <span style="font-size: 10px; color: rgba(255, 255, 255, 0.4);">
      {{ isEnabled ? 'Scanning' : 'Paused' }}
    </span>
  </div>
</template>
