<script setup lang="ts">
/**
 * Slowdown History - 类似 react-scan 的历史记录列表
 */
import type { SlowdownEvent } from '../../core/notifications'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  addEventListenerForSlowdown,
  clearSlowdownEvents,
  getEventSeverity,
  getSlowdownEvents,
  getTotalTime,
} from '../../core/notifications'

defineProps<{
  selectedEventId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', event: SlowdownEvent): void
}>()

const events = ref<SlowdownEvent[]>([])
const flashingIds = ref<Set<string>>(new Set())

// 加载事件
function loadEvents() {
  events.value = getSlowdownEvents()
}

// 监听新事件
let unsubscribe: (() => void) | null = null
onMounted(() => {
  loadEvents()
  unsubscribe = addEventListenerForSlowdown((event) => {
    loadEvents()
    // 添加闪烁效果
    flashingIds.value.add(event.id)
    setTimeout(() => {
      flashingIds.value.delete(event.id)
    }, 1000)
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

// 获取事件图标
function getEventIcon(event: SlowdownEvent) {
  switch (event.kind) {
    case 'interaction':
      return event.type === 'click' ? 'pointer' : 'keyboard'
    case 'dropped-frames':
      return 'trending-down'
    case 'long-render':
      return 'slow'
  }
}

// 获取事件标题
function getEventTitle(event: SlowdownEvent): string {
  switch (event.kind) {
    case 'interaction':
      return event.componentPath.at(-1) || 'Interaction'
    case 'dropped-frames':
      return 'FPS Drop'
    case 'long-render':
      return event.componentName
  }
}

// 获取事件时间/FPS显示
function getEventBadge(event: SlowdownEvent): { text: string, isFps: boolean } {
  switch (event.kind) {
    case 'interaction':
      return { text: `${getTotalTime(event.timing).toFixed(0)}ms`, isFps: false }
    case 'dropped-frames':
      return { text: `${event.fps} FPS`, isFps: true }
    case 'long-render':
      return { text: `${event.renderTime.toFixed(0)}ms`, isFps: false }
  }
}

// 获取严重性颜色类
function getSeverityClass(event: SlowdownEvent): string {
  const severity = getEventSeverity(event)
  switch (severity) {
    case 'high':
      return 'severity-high'
    case 'needs-improvement':
      return 'severity-warning'
    case 'low':
      return 'severity-low'
  }
}

// 清除所有事件
function handleClear() {
  clearSlowdownEvents()
  loadEvents()
}

const hasEvents = computed(() => events.value.length > 0)
</script>

<template>
  <div class="slowdown-history">
    <div class="history-header">
      <span class="history-title">History</span>
      <button
        v-if="hasEvents"
        class="clear-button"
        title="Clear all events"
        @click="handleClear"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>

    <div class="history-content">
      <div v-if="!hasEvents" class="empty-state">
        No Events
      </div>

      <template v-else>
        <button
          v-for="event in events.slice(0, 50)"
          :key="event.id"
          class="history-item"
          :class="{
            selected: selectedEventId === event.id,
            flashing: flashingIds.has(event.id),
            [getSeverityClass(event)]: true,
          }"
          @click="emit('select', event)"
        >
          <div class="item-left">
            <span class="item-icon">
              <!-- Pointer Icon -->
              <svg v-if="getEventIcon(event) === 'pointer'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.6-.94 2.97-2.3 3.6a4 4 0 0 1-3.4 0C8.94 8.97 8 7.6 8 6a4 4 0 0 1 4-4z" />
                <path d="M12 14l-3-3h6z" />
              </svg>
              <!-- Keyboard Icon -->
              <svg v-else-if="getEventIcon(event) === 'keyboard'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="6" y1="8" x2="6" y2="8" />
                <line x1="10" y1="8" x2="10" y2="8" />
                <line x1="14" y1="8" x2="14" y2="8" />
                <line x1="18" y1="8" x2="18" y2="8" />
                <line x1="6" y1="16" x2="18" y2="16" />
              </svg>
              <!-- Trending Down Icon -->
              <svg v-else-if="getEventIcon(event) === 'trending-down'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
              <!-- Slow Icon -->
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span class="item-name">{{ getEventTitle(event) }}</span>
          </div>
          <div class="item-right">
            <span class="item-badge" :class="getSeverityClass(event)">
              {{ getEventBadge(event).text }}
            </span>
          </div>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.slowdown-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border-right: 1px solid #27272A;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 8px 12px;
  font-size: 12px;
  color: #65656D;
}

.history-title {
  font-weight: 500;
}

.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #65656D;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background-color: #18181B;
  color: #fff;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px 4px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #65656D;
  font-size: 12px;
  padding: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.history-item:hover {
  background-color: #18181B;
}

.history-item.selected {
  background-color: #18181B;
}

.history-item.flashing::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(139, 92, 246, 0.3);
  animation: fadeOut 1s ease-out forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  display: flex;
  align-items: center;
  color: #A1A1AA;
  flex-shrink: 0;
}

.item-name {
  font-size: 12px;
  color: #E4E4E7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-right {
  flex-shrink: 0;
  margin-left: 8px;
}

.item-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.item-badge.severity-high {
  background-color: rgba(185, 64, 64, 0.8);
  color: #fff;
}

.item-badge.severity-warning {
  background-color: rgba(183, 113, 22, 0.8);
  color: #fff;
}

.item-badge.severity-low {
  background-color: rgba(34, 197, 94, 0.5);
  color: #fff;
}
</style>
