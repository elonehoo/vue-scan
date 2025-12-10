<script setup lang="ts">
import type { ComponentInfo } from '../../core/inspector/types'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSelectedComponent, subscribeSelectedComponent } from '../../core/inspector'

const selectedComponent = ref<ComponentInfo | null>(null)
let unsubscribe: (() => void) | null = null

onMounted(() => {
  selectedComponent.value = getSelectedComponent()
  unsubscribe = subscribeSelectedComponent((info) => {
    selectedComponent.value = info
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const hasProps = computed(() => {
  if (!selectedComponent.value)
    return false
  return Object.keys(selectedComponent.value.props).length > 0
})

const hasData = computed(() => {
  if (!selectedComponent.value)
    return false
  return Object.keys(selectedComponent.value.data).length > 0
})

const hasSetupState = computed(() => {
  if (!selectedComponent.value)
    return false
  return Object.keys(selectedComponent.value.setupState).length > 0
})

function formatValue(value: unknown): string {
  if (value === null)
    return 'null'
  if (value === undefined)
    return 'undefined'
  if (typeof value === 'string')
    return `"${value}"`
  if (typeof value === 'function')
    return 'ƒ()'
  if (Array.isArray(value))
    return `Array(${value.length})`
  if (typeof value === 'object')
    return `{${Object.keys(value).length}}`
  return String(value)
}

function getValueClass(value: unknown): string {
  if (value === null || value === undefined)
    return 'value-null'
  if (typeof value === 'string')
    return 'value-string'
  if (typeof value === 'number')
    return 'value-number'
  if (typeof value === 'boolean')
    return 'value-boolean'
  if (typeof value === 'function')
    return 'value-function'
  return 'value-object'
}
</script>

<template>
  <div class="inspector-panel">
    <div v-if="selectedComponent" class="component-info">
      <div class="component-header">
        <span class="component-name">{{ selectedComponent.name }}</span>
        <span class="component-stats">
          ×{{ selectedComponent.renderCount }}
          <template v-if="selectedComponent.lastRenderTime">
            • {{ selectedComponent.lastRenderTime.toFixed(1) }}ms
          </template>
        </span>
      </div>

      <!-- Props Section -->
      <div v-if="hasProps" class="section">
        <div class="section-header">
          props
          <span class="section-count">{{ Object.keys(selectedComponent.props).length }}</span>
        </div>
        <div class="section-content">
          <div
            v-for="(value, key) in selectedComponent.props"
            :key="key"
            class="property"
          >
            <span class="property-name">{{ key }}</span>
            <span class="property-colon">:</span>
            <span class="property-value" :class="getValueClass(value)">
              {{ formatValue(value) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Setup State Section -->
      <div v-if="hasSetupState" class="section">
        <div class="section-header">
          state
          <span class="section-count">{{ Object.keys(selectedComponent.setupState).length }}</span>
        </div>
        <div class="section-content">
          <div
            v-for="(value, key) in selectedComponent.setupState"
            :key="key"
            class="property"
          >
            <span class="property-name">{{ key }}</span>
            <span class="property-colon">:</span>
            <span class="property-value" :class="getValueClass(value)">
              {{ formatValue(value) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Data Section (Vue 2) -->
      <div v-if="hasData" class="section">
        <div class="section-header">
          data
          <span class="section-count">{{ Object.keys(selectedComponent.data).length }}</span>
        </div>
        <div class="section-content">
          <div
            v-for="(value, key) in selectedComponent.data"
            :key="key"
            class="property"
          >
            <span class="property-name">{{ key }}</span>
            <span class="property-colon">:</span>
            <span class="property-value" :class="getValueClass(value)">
              {{ formatValue(value) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Click "Inspect" and select a component</p>
    </div>
  </div>
</template>

<style scoped>
.inspector-panel {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.component-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #222;
}

.component-name {
  color: #a855f7;
  font-weight: 600;
  font-size: 13px;
}

.component-stats {
  color: #666;
  font-size: 11px;
}

.section {
  margin-bottom: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #888;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.section-count {
  background: rgba(142, 97, 227, 0.1);
  color: #8e61e3;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 9px;
}

.section-content {
  padding-left: 8px;
  border-left: 1px solid #333;
}

.property {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: 'Menlo', 'Consolas', monospace;
  line-height: 1.6;
}

.property-name {
  color: #a855f7;
}

.property-colon {
  color: #666;
}

.property-value {
  color: #888;
}

.value-string {
  color: #22c55e;
}

.value-number {
  color: #60a5fa;
}

.value-boolean {
  color: #f59e0b;
}

.value-null {
  color: #666;
  font-style: italic;
}

.value-function {
  color: #c4b5fd;
}

.value-object {
  color: #93c5fd;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: #666;
  font-size: 12px;
}
</style>
