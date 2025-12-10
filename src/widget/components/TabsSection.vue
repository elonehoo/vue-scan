<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { addEventListenerForSlowdown, getEventSeverity, getSlowdownEvents } from '../../core/notifications'

const model = defineModel<'stats' | 'components' | 'inspector' | 'notifications' | 'settings'>()

// 慢速事件计数
const slowdownCount = ref(0)

// 加载事件计数
function loadCount() {
  const events = getSlowdownEvents()
  slowdownCount.value = events.filter(e => getEventSeverity(e) !== 'low').length
}

let unsubscribe: (() => void) | null = null
onMounted(() => {
  loadCount()
  unsubscribe = addEventListenerForSlowdown(() => {
    loadCount()
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

const hasBadge = computed(() => slowdownCount.value > 0)
</script>

<template>
  <div class="tabs">
    <button
      class="tab"
      :class="{ active: model === 'stats' }"
      @click="model = 'stats'"
    >
      Stats
    </button>
    <button
      class="tab"
      :class="{ active: model === 'components' }"
      @click="model = 'components'"
    >
      Components
    </button>
    <button
      class="tab"
      :class="{ active: model === 'inspector' }"
      @click="model = 'inspector'"
    >
      Inspector
    </button>
    <button
      class="tab notification-tab"
      :class="{ active: model === 'notifications' }"
      @click="model = 'notifications'"
    >
      <span class="notification-icon">🔔</span>
      <span v-if="hasBadge" class="notification-badge">{{ slowdownCount > 99 ? '99+' : slowdownCount }}</span>
    </button>
    <button
      class="tab settings-tab"
      :class="{ active: model === 'settings' }"
      title="Settings"
      @click="model = 'settings'"
    >
      ⚙️
    </button>
  </div>
</template>
