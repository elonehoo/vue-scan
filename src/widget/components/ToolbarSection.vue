<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import {
  getInspectorState,
  startInspector,
  stopInspector,
  subscribeInspectorState,
} from '../../core/inspector'

const props = defineProps<{
  isEnabled: boolean
}>()

const emit = defineEmits<{
  toggleEnabled: []
}>()

const isInspecting = ref(false)

// 监听 Inspector 状态
const unsubscribe = subscribeInspectorState((state) => {
  isInspecting.value = state.kind === 'inspecting' || state.kind === 'focused'
})

// 初始化状态
const initialState = getInspectorState()
isInspecting.value = initialState.kind === 'inspecting' || initialState.kind === 'focused'

// 组件卸载时取消订阅
onUnmounted(() => {
  unsubscribe()
})

// 状态文本
const statusText = computed(() => {
  if (isInspecting.value)
    return 'Inspecting'
  return props.isEnabled ? 'Scanning' : 'Paused'
})

function toggleInspector() {
  if (isInspecting.value) {
    stopInspector()
  }
  else {
    startInspector()
  }
}
</script>

<template>
  <div class="toolbar">
    <!-- Inspect Button -->
    <button
      class="toolbar-btn"
      :class="{ active: isInspecting }"
      :style="{ color: isInspecting ? '#8e61e3' : '#999' }"
      title="Inspect element"
      @click="toggleInspector"
    >
      <svg v-if="!isInspecting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        <path d="M13 13l6 6" />
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="6" />
      </svg>
    </button>

    <!-- Divider -->
    <div class="toolbar-divider" />

    <!-- Toggle Switch -->
    <div
      class="toggle-switch"
      :class="{ active: isEnabled }"
      title="Outline Re-renders"
      @click="emit('toggleEnabled')"
    />

    <div style="flex: 1" />

    <!-- Status Text -->
    <span class="toolbar-status">
      {{ statusText }}
    </span>
  </div>
</template>

<style scoped>
.toolbar-status {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
