<script setup lang="ts">
import type { SlowdownEvent } from '../../core/notifications'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  addEventListenerForSlowdown,
  clearSlowdownEvents,
  getEventSeverity,
  getReadableSeverity,
  getSlowdownEvents,
  getTotalTime,
} from '../../core/notifications'
import { getAlertColor } from '../../core/notifications/thresholds'

const events = ref<SlowdownEvent[]>([])
const selectedEventId = ref<string | null>(null)

// 加载事件
function loadEvents() {
  events.value = getSlowdownEvents()
}

// 监听新事件
let unsubscribe: (() => void) | null = null
onMounted(() => {
  loadEvents()
  unsubscribe = addEventListenerForSlowdown(() => {
    loadEvents()
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

// 按严重性分组的事件
const groupedEvents = computed(() => {
  const groups: Record<string, SlowdownEvent[]> = {
    'high': [] as SlowdownEvent[],
    'needs-improvement': [] as SlowdownEvent[],
    'low': [] as SlowdownEvent[],
  }

  events.value.forEach((event) => {
    const severity = getEventSeverity(event)
    groups[severity].push(event)
  })

  return groups
})

// 高严重性事件计数
const highSeverityCount = computed(() => groupedEvents.value.high.length)
const needsImprovementCount = computed(() => groupedEvents.value['needs-improvement'].length)

// 获取事件图标
function getEventIcon(event: SlowdownEvent): string {
  switch (event.kind) {
    case 'interaction':
      return event.type === 'click' ? '👆' : event.type === 'keyboard' ? '⌨️' : '📜'
    case 'dropped-frames':
      return '📉'
    case 'long-render':
      return '🐢'
  }
}

// 获取事件标题
function getEventTitle(event: SlowdownEvent): string {
  switch (event.kind) {
    case 'interaction':
      return event.componentPath.at(-1) || 'Interaction'
    case 'dropped-frames':
      return `FPS Drop (${event.fps} FPS)`
    case 'long-render':
      return event.componentName
  }
}

// 获取事件时间
function getEventTime(event: SlowdownEvent): string {
  switch (event.kind) {
    case 'interaction':
      return `${getTotalTime(event.timing).toFixed(0)}ms`
    case 'dropped-frames':
      return `${getTotalTime(event.timing).toFixed(0)}ms`
    case 'long-render':
      return `${event.renderTime.toFixed(1)}ms`
  }
}

// 获取相对时间
function getRelativeTime(timestamp: number): string {
  const now = performance.now() + performance.timeOrigin
  const diff = now - timestamp
  if (diff < 1000)
    return 'just now'
  if (diff < 60000)
    return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000)
    return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

// 清除事件
function handleClear() {
  clearSlowdownEvents()
  loadEvents()
}

// 选择事件
function selectEvent(event: SlowdownEvent) {
  selectedEventId.value = selectedEventId.value === event.id ? null : event.id
}

const selectedEvent = computed(() => {
  if (!selectedEventId.value)
    return null
  return events.value.find(e => e.id === selectedEventId.value) || null
})

// 自动刷新相对时间
const refreshKey = ref(0)
let refreshInterval: number | null = null
onMounted(() => {
  refreshInterval = window.setInterval(() => {
    refreshKey.value++
  }, 1000)
})
onUnmounted(() => {
  if (refreshInterval)
    clearInterval(refreshInterval)
})

// 强制更新相对时间
watch(refreshKey, () => {
  // 触发重新计算
})
</script>

<template>
  <div class="notification-section">
    <!-- 头部 -->
    <div class="notification-header">
      <div class="notification-title">
        <span style="margin-right: 4px;">🔔</span>
        Slowdowns
        <span v-if="highSeverityCount > 0" class="badge badge-high">
          {{ highSeverityCount }}
        </span>
        <span v-if="needsImprovementCount > 0" class="badge badge-warning">
          {{ needsImprovementCount }}
        </span>
      </div>
      <button v-if="events.length > 0" class="clear-btn" @click="handleClear">
        Clear
      </button>
    </div>

    <!-- 事件列表 -->
    <div v-if="events.length > 0" class="event-list">
      <div
        v-for="event in events.slice(0, 20)"
        :key="`${event.id}-${refreshKey}`"
        class="event-item"
        :class="{ selected: selectedEventId === event.id }"
        @click="selectEvent(event)"
      >
        <div class="event-icon">
          {{ getEventIcon(event) }}
        </div>
        <div class="event-info">
          <div class="event-name">
            {{ getEventTitle(event) }}
          </div>
          <div class="event-meta">
            {{ getRelativeTime(event.timestamp) }}
          </div>
        </div>
        <div
          class="event-badge"
          :style="{ backgroundColor: getAlertColor(getEventSeverity(event)) }"
        >
          {{ getEventTime(event) }}
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        👀
      </div>
      <div class="empty-text">
        Scanning for slowdowns...
      </div>
      <div class="empty-hint">
        Interact with your app to detect performance issues
      </div>
    </div>

    <!-- 选中事件详情 -->
    <div v-if="selectedEvent" class="event-detail">
      <div class="detail-header">
        <span class="detail-kind">{{ selectedEvent.kind }}</span>
        <span
          class="detail-severity"
          :style="{ color: getAlertColor(getEventSeverity(selectedEvent)) }"
        >
          {{ getReadableSeverity(getEventSeverity(selectedEvent)) }}
        </span>
      </div>

      <div v-if="selectedEvent.kind === 'interaction'" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">{{ selectedEvent.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Render Time</span>
          <span class="detail-value">{{ selectedEvent.timing.renderTime.toFixed(1) }}ms</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Other JS</span>
          <span class="detail-value">{{ selectedEvent.timing.otherJSTime.toFixed(1) }}ms</span>
        </div>
        <div v-if="selectedEvent.groupedRenders.length > 0" class="detail-renders">
          <div class="detail-subtitle">
            Components ({{ selectedEvent.groupedRenders.length }})
          </div>
          <div
            v-for="render in selectedEvent.groupedRenders.slice(0, 5)"
            :key="render.id"
            class="render-item"
          >
            <span class="render-name">{{ render.name }}</span>
            <span class="render-count">×{{ render.count }}</span>
            <span class="render-time">{{ render.totalTime.toFixed(1) }}ms</span>
          </div>
        </div>
      </div>

      <div v-else-if="selectedEvent.kind === 'dropped-frames'" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">FPS</span>
          <span class="detail-value">{{ selectedEvent.fps }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Frame Time</span>
          <span class="detail-value">{{ getTotalTime(selectedEvent.timing).toFixed(1) }}ms</span>
        </div>
      </div>

      <div v-else-if="selectedEvent.kind === 'long-render'" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">Component</span>
          <span class="detail-value">{{ selectedEvent.componentName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Render Time</span>
          <span class="detail-value">{{ selectedEvent.renderTime.toFixed(1) }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>
