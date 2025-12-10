<script setup lang="ts">
import type { PerformanceMetrics } from '../../core/performance'
import { computed } from 'vue'

const props = defineProps<{
  performanceData: PerformanceMetrics | null
}>()

const memory = computed(() => props.performanceData?.memory)

const memoryStatus = computed(() => {
  const usage = memory.value?.usagePercentage ?? 0
  if (usage > 80)
    return 'bad'
  if (usage > 60)
    return 'warning'
  return 'good'
})

const memoryBarColor = computed(() => {
  switch (memoryStatus.value) {
    case 'bad': return '#ef4444'
    case 'warning': return '#f59e0b'
    default: return '#8e61e3'
  }
})

function getVitalColor(type: string, value: number | null): string {
  if (value === null)
    return '#666'

  switch (type) {
    case 'fcp':
      return value < 1800 ? '#22c55e' : value < 3000 ? '#f59e0b' : '#ef4444'
    case 'lcp':
      return value < 2500 ? '#22c55e' : value < 4000 ? '#f59e0b' : '#ef4444'
    case 'fid':
      return value < 100 ? '#22c55e' : value < 300 ? '#f59e0b' : '#ef4444'
    case 'cls':
      return value < 0.1 ? '#22c55e' : value < 0.25 ? '#f59e0b' : '#ef4444'
    default:
      return '#888'
  }
}

function formatValue(value: number | null, unit: string, decimals = 0): string {
  if (value === null)
    return '—'
  return `${value.toFixed(decimals)}${unit}`
}

const domNodeColor = computed(() => {
  const nodes = props.performanceData?.domNodes ?? 0
  if (nodes > 1500)
    return '#ef4444'
  if (nodes > 800)
    return '#f59e0b'
  return '#22c55e'
})
</script>

<template>
  <div class="metrics-section">
    <!-- 内存使用 -->
    <div v-if="memory" class="memory-bar">
      <div class="memory-bar-label">
        <span>Memory</span>
        <span :style="{ color: memoryBarColor }">
          {{ memory.usedJSHeapSize.toFixed(1) }} MB
        </span>
      </div>
      <div class="memory-bar-track">
        <div
          class="memory-bar-fill"
          :style="{
            width: `${memory.usagePercentage}%`,
            background: memoryBarColor,
          }"
        />
      </div>
      <div style="font-size: 9px; color: rgba(255, 255, 255, 0.3); margin-top: 2px;">
        {{ memory.usagePercentage }}% of {{ memory.jsHeapSizeLimit.toFixed(0) }} MB limit
      </div>
    </div>

    <!-- Web Vitals -->
    <div v-if="performanceData" style="margin-top: 12px;">
      <div style="font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
        Web Vitals
      </div>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">FCP</span>
          <span class="metric-value" :style="{ color: getVitalColor('fcp', performanceData.fcp) }">
            {{ formatValue(performanceData.fcp, 'ms') }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">LCP</span>
          <span class="metric-value" :style="{ color: getVitalColor('lcp', performanceData.lcp) }">
            {{ formatValue(performanceData.lcp, 'ms') }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">FID</span>
          <span class="metric-value" :style="{ color: getVitalColor('fid', performanceData.fid) }">
            {{ formatValue(performanceData.fid, 'ms') }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">CLS</span>
          <span class="metric-value" :style="{ color: getVitalColor('cls', performanceData.cls) }">
            {{ formatValue(performanceData.cls, '', 3) }}
          </span>
        </div>
      </div>
    </div>

    <!-- DOM 节点数量 -->
    <div v-if="performanceData" style="margin-top: 8px;">
      <div class="metric-item">
        <span class="metric-label">DOM Nodes</span>
        <span class="metric-value" :style="{ color: domNodeColor }">
          {{ performanceData.domNodes.toLocaleString() }}
        </span>
      </div>
    </div>
  </div>
</template>
