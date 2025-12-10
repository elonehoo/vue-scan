<script setup lang="ts">
/**
 * Event Details View - 事件详情视图
 * 类似 react-scan 的渲染柱状图和时序分解
 */
import type { SlowdownEvent } from '../../core/notifications'
import { computed, ref } from 'vue'
import {
  getEventSeverity,
  getReadableSeverity,
  getTotalTime,
} from '../../core/notifications'
import { playNotificationSound, toggleAudioNotifications } from '../../core/notifications/audio'

const props = defineProps<{
  event: SlowdownEvent | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeTab = ref<'breakdown' | 'prompts'>('breakdown')
const isAudioEnabled = ref(false)

// 获取时序数据
const timeData = computed(() => {
  if (!props.event)
    return []

  const data: Array<{
    name: string
    time: number
    color: string
    kind: string
  }> = []

  if (props.event.kind === 'interaction') {
    const timing = props.event.timing
    data.push(
      { name: 'Render Time', time: timing.renderTime, color: '#8B5CF6', kind: 'render' },
      { name: 'Other JS', time: timing.otherJSTime, color: '#6366F1', kind: 'other-js' },
      { name: 'Frame Prep', time: timing.framePreparation, color: '#3B82F6', kind: 'frame-prep' },
      { name: 'Frame Build', time: timing.frameConstruction, color: '#06B6D4', kind: 'frame-build' },
    )
    if (timing.frameDraw) {
      data.push({ name: 'Frame Draw', time: timing.frameDraw, color: '#10B981', kind: 'frame-draw' })
    }
  }
  else if (props.event.kind === 'dropped-frames') {
    const timing = props.event.timing
    data.push(
      { name: 'Render Time', time: timing.renderTime, color: '#8B5CF6', kind: 'render' },
      { name: 'Other Time', time: timing.otherTime, color: '#6366F1', kind: 'other' },
    )
  }
  else if (props.event.kind === 'long-render') {
    data.push(
      { name: 'Render Time', time: props.event.renderTime, color: '#8B5CF6', kind: 'render' },
    )
  }

  return data.filter(d => d.time > 0)
})

// 总时间
const totalTime = computed(() => {
  if (!props.event)
    return 0
  if (props.event.kind === 'long-render')
    return props.event.renderTime
  return getTotalTime(props.event.timing)
})

// 严重性
const severity = computed(() => {
  if (!props.event)
    return 'low'
  return getEventSeverity(props.event)
})

// 切换音频
function handleToggleAudio() {
  isAudioEnabled.value = toggleAudioNotifications()
  if (isAudioEnabled.value) {
    playNotificationSound()
  }
}

// 获取组件渲染数据
const componentRenders = computed(() => {
  if (!props.event)
    return []
  if (props.event.kind === 'interaction' || props.event.kind === 'dropped-frames') {
    return props.event.groupedRenders || []
  }
  if (props.event.kind === 'long-render') {
    return [{
      id: props.event.id,
      name: props.event.componentName,
      count: 1,
      totalTime: props.event.renderTime,
      selfTime: props.event.renderTime,
      changes: { props: [], state: [] },
      parents: new Set<string>(),
    }]
  }
  return []
})

// 获取标题
const headerTitle = computed(() => {
  if (!props.event)
    return ''
  switch (props.event.kind) {
    case 'interaction':
      return props.event.componentPath.at(-1) || 'Interaction'
    case 'dropped-frames':
      return 'FPS Drop'
    case 'long-render':
      return props.event.componentName
    default:
      return ''
  }
})

// 获取类型标签
const typeLabel = computed(() => {
  if (!props.event)
    return ''
  switch (props.event.kind) {
    case 'interaction':
      return props.event.type === 'click' ? 'Click' : 'Keyboard'
    case 'dropped-frames':
      return `${props.event.fps} FPS`
    case 'long-render':
      return 'Long Render'
    default:
      return ''
  }
})
</script>

<template>
  <div v-if="event" class="event-details">
    <!-- 头部 -->
    <div class="details-header">
      <div class="header-left">
        <span class="header-title">{{ headerTitle }}</span>
        <span class="header-badge" :class="`severity-${severity}`">
          {{ typeLabel }}
        </span>
      </div>
      <div class="header-right">
        <button class="close-button" @click="emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-row">
      <div class="tabs-group">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'breakdown' }"
          @click="activeTab = 'breakdown'"
        >
          Breakdown
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'prompts' }"
          @click="activeTab = 'prompts'"
        >
          Prompts
        </button>
      </div>
      <button
        class="audio-toggle"
        :class="{ enabled: isAudioEnabled }"
        title="Toggle audio alerts"
        @click="handleToggleAudio"
      >
        <span>Alerts</span>
        <svg v-if="isAudioEnabled" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      </button>
    </div>

    <!-- Breakdown Content -->
    <div v-if="activeTab === 'breakdown'" class="breakdown-content">
      <!-- Time Bars -->
      <div class="time-breakdown">
        <div class="breakdown-title">
          Time Breakdown
          <span class="total-time">{{ totalTime.toFixed(0) }}ms total</span>
        </div>
        <div class="time-bars">
          <div
            v-for="item in timeData"
            :key="item.kind"
            class="time-bar-item"
          >
            <div class="bar-header">
              <span class="bar-name">{{ item.name }}</span>
              <span class="bar-value">{{ item.time.toFixed(0) }}ms</span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: `${(item.time / totalTime) * 100}%`,
                  backgroundColor: item.color,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Component Renders -->
      <div v-if="componentRenders.length > 0" class="component-renders">
        <div class="renders-title">
          Component Renders ({{ componentRenders.length }})
        </div>
        <div class="renders-list">
          <div
            v-for="render in componentRenders.slice(0, 10)"
            :key="render.id"
            class="render-item"
          >
            <div class="render-info">
              <span class="render-name">{{ render.name }}</span>
              <span class="render-count">×{{ render.count }}</span>
            </div>
            <div class="render-time">
              {{ render.totalTime.toFixed(1) }}ms
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prompts Content -->
    <div v-else-if="activeTab === 'prompts'" class="prompts-content">
      <div class="prompts-intro">
        <p>Copy these prompts to use with an AI assistant for optimization suggestions:</p>
      </div>

      <div class="prompt-card">
        <div class="prompt-title">
          Explain Issue
        </div>
        <div class="prompt-preview">
          Explain why this {{ event?.kind }} event took {{ totalTime.toFixed(0) }}ms...
        </div>
        <button class="copy-button">
          Copy Prompt
        </button>
      </div>

      <div class="prompt-card">
        <div class="prompt-title">
          Suggest Fixes
        </div>
        <div class="prompt-preview">
          Suggest performance optimizations for this {{ severity }} severity issue...
        </div>
        <button class="copy-button">
          Copy Prompt
        </button>
      </div>
    </div>

    <!-- More Info -->
    <div class="more-info">
      <div class="info-row">
        <span class="info-label">Severity</span>
        <span class="info-value" :class="`severity-${severity}`">
          {{ getReadableSeverity(severity) }}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Occurred</span>
        <span class="info-value">just now</span>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div v-else class="empty-details">
    <div class="empty-icon">
      👀
    </div>
    <div class="empty-title">
      Scanning for slowdowns...
    </div>
    <div class="empty-hint">
      Click on an item in the History list to get started
    </div>
    <div class="empty-tip">
      You don't need to keep this panel open for Vue Scan to record slowdowns
    </div>
    <button class="audio-enable-button" @click="handleToggleAudio">
      {{ isAudioEnabled ? 'Disable' : 'Enable' }} audio alerts
    </button>
  </div>
</template>

<style scoped>
.event-details {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #27272A;
  min-height: 40px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 13px;
  font-weight: 500;
  color: #E4E4E7;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.header-badge.severity-high {
  background-color: rgba(185, 64, 64, 0.8);
  color: #fff;
}

.header-badge.severity-needs-improvement {
  background-color: rgba(183, 113, 22, 0.8);
  color: #fff;
}

.header-badge.severity-low {
  background-color: rgba(34, 197, 94, 0.5);
  color: #fff;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: none;
  color: #6F6F78;
  cursor: pointer;
  border-radius: 4px;
}

.close-button:hover {
  background-color: #27272A;
  color: #fff;
}

.tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #27272A;
}

.tabs-group {
  display: flex;
  gap: 4px;
  background-color: #18181B;
  padding: 4px;
  border-radius: 4px;
}

.tab-button {
  padding: 4px 12px;
  font-size: 11px;
  border: none;
  background: transparent;
  color: #6E6E77;
  border-radius: 4px;
  cursor: pointer;
}

.tab-button.active {
  background-color: #7521c8;
  color: #fff;
}

.audio-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  background: transparent;
  border: none;
  color: #6E6E77;
  cursor: pointer;
  border-radius: 4px;
}

.audio-toggle:hover {
  background-color: #27272A;
}

.audio-toggle.enabled {
  color: #8B5CF6;
}

.breakdown-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.time-breakdown {
  margin-bottom: 16px;
}

.breakdown-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  color: #A1A1AA;
  margin-bottom: 8px;
}

.total-time {
  font-size: 11px;
  color: #6E6E77;
}

.time-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.bar-name {
  color: #E4E4E7;
}

.bar-value {
  color: #A1A1AA;
}

.bar-track {
  height: 4px;
  background-color: #27272A;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.component-renders {
  margin-top: 16px;
}

.renders-title {
  font-size: 12px;
  font-weight: 500;
  color: #A1A1AA;
  margin-bottom: 8px;
}

.renders-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.render-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background-color: #18181B;
  border-radius: 4px;
}

.render-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.render-name {
  font-size: 11px;
  color: #E4E4E7;
}

.render-count {
  font-size: 10px;
  color: #6E6E77;
}

.render-time {
  font-size: 11px;
  color: #A1A1AA;
}

.prompts-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.prompts-intro {
  font-size: 12px;
  color: #6E6E77;
  margin-bottom: 16px;
}

.prompt-card {
  background-color: #18181B;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.prompt-title {
  font-size: 12px;
  font-weight: 500;
  color: #E4E4E7;
  margin-bottom: 8px;
}

.prompt-preview {
  font-size: 11px;
  color: #6E6E77;
  margin-bottom: 12px;
}

.copy-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  font-size: 12px;
  background-color: #27272A;
  color: #6E6E77;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-button:hover {
  background-color: #3F3F46;
  color: #fff;
}

.more-info {
  padding: 12px;
  border-top: 1px solid #27272A;
  display: flex;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 11px;
  color: #6F6F78;
}

.info-value {
  font-size: 11px;
  color: #E4E4E7;
  background-color: #27272A;
  padding: 2px 6px;
  border-radius: 4px;
}

.info-value.severity-high {
  color: #EF4444;
}

.info-value.severity-needs-improvement {
  color: #F59E0B;
}

.info-value.severity-low {
  color: #22C55E;
}

.empty-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #A1A1AA;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: #6E6E77;
  margin-bottom: 4px;
}

.empty-tip {
  font-size: 11px;
  color: #52525B;
  margin-bottom: 16px;
}

.audio-enable-button {
  padding: 8px 16px;
  font-size: 12px;
  background-color: #27272A;
  color: #E4E4E7;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.audio-enable-button:hover {
  background-color: #3F3F46;
}
</style>
