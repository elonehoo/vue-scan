<script setup lang="ts">
import type { ComponentRenderData } from '../shared/store'
import type { FPSData } from '../core/fps'
import type { PerformanceMetrics } from '../core/performance'
import type { WidgetOptions } from './index'
import { computed, onMounted, onUnmounted, provide, reactive, ref } from 'vue'
import { destroyFPSMonitor, initFPSMonitor } from '../core/fps'
import { destroyPerformanceMonitor, initPerformanceMonitor } from '../core/performance'
import { addUpdateListener, getAllComponentData, getRecentComponents } from '../shared/store'
import ComponentsSection from './components/ComponentsSection.vue'
import FPSSection from './components/FPSSection.vue'
import MetricsSection from './components/MetricsSection.vue'
import TabsSection from './components/TabsSection.vue'
import ToolbarSection from './components/ToolbarSection.vue'

const props = defineProps<{
  options: WidgetOptions
}>()

// Widget 状态
const isCollapsed = ref(false)
const isDragging = ref(false)
const currentTab = ref<'stats' | 'components'>('stats')
const isEnabled = ref(true)

// 位置和尺寸
const position = reactive({
  x: 16,
  y: 16,
})

// 拖拽状态
const dragOffset = reactive({ x: 0, y: 0 })

// FPS 和性能数据
const fpsData = ref<FPSData | null>(null)
const performanceData = ref<PerformanceMetrics | null>(null)
const fpsHistory = ref<number[]>([])

// 组件数据（从全局 store 获取）
const componentDataMap = ref<Map<string, ComponentRenderData>>(new Map())
const recentComponentIds = ref<string[]>([])

// 组件数据更新计数器（用于触发响应式更新）
const updateCounter = ref(0)

// 提供给子组件的状态
provide('widgetState', {
  isEnabled,
  fpsData,
  performanceData,
  fpsHistory,
  componentDataMap,
  recentComponentIds,
  currentTab,
  updateCounter,
})

// 初始位置计算
const initialCorner = computed(() => props.options.initialPosition || 'bottom-right')

// Store 更新取消器
let removeStoreListener: (() => void) | null = null

onMounted(() => {
  // 设置初始位置
  const padding = 16
  switch (initialCorner.value) {
    case 'top-left':
      position.x = padding
      position.y = padding
      break
    case 'top-right':
      position.x = window.innerWidth - 316
      position.y = padding
      break
    case 'bottom-left':
      position.x = padding
      position.y = window.innerHeight - 400
      break
    case 'bottom-right':
    default:
      position.x = window.innerWidth - 316
      position.y = window.innerHeight - 400
      break
  }

  // 订阅组件渲染数据更新
  removeStoreListener = addUpdateListener(() => {
    componentDataMap.value = getAllComponentData()
    recentComponentIds.value = getRecentComponents()
    updateCounter.value++
  })

  // 启动 FPS 监控
  if (props.options.enableFPS !== false) {
    const fpsMonitor = initFPSMonitor({
      warningThreshold: props.options.fpsWarningThreshold || 30,
      onUpdate: (data) => {
        fpsData.value = data
        fpsHistory.value.push(data.current)
        if (fpsHistory.value.length > 60) {
          fpsHistory.value.shift()
        }
      },
    })
    fpsMonitor.start()
  }

  // 启动性能监控
  if (props.options.enablePerformance !== false) {
    const perfMonitor = initPerformanceMonitor({
      onUpdate: (metrics) => {
        performanceData.value = metrics
      },
    })
    perfMonitor.start()
  }

  // 监听全局事件
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  destroyFPSMonitor()
  destroyPerformanceMonitor()
  removeStoreListener?.()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('resize', handleWindowResize)
})

// 拖拽处理
function handleDragStart(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.header-btn'))
    return
  isDragging.value = true
  dragOffset.x = e.clientX - position.x
  dragOffset.y = e.clientY - position.y
  e.preventDefault()
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    position.x = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x))
    position.y = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
  }
}

function handleMouseUp() {
  isDragging.value = false
}

function handleWindowResize() {
  // 确保 widget 保持在可见区域内
  position.x = Math.max(0, Math.min(window.innerWidth - 300, position.x))
  position.y = Math.max(0, Math.min(window.innerHeight - 100, position.y))
}

// 折叠/展开
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

// 切换启用状态
function toggleEnabled() {
  isEnabled.value = !isEnabled.value
}

// 计算样式
const widgetStyle = computed(() => ({
  left: `${position.x}px`,
  top: `${position.y}px`,
}))

// FPS 状态类名
const fpsStatusClass = computed(() => {
  const fps = fpsData.value?.current ?? 0
  if (fps >= 50)
    return 'good'
  if (fps >= 30)
    return 'warning'
  return 'bad'
})
</script>

<template>
  <div class="vue-scan-widget" :style="widgetStyle">
    <!-- 折叠状态 -->
    <div v-if="isCollapsed" class="collapsed-bar" @click="toggleCollapse">
      <span class="logo-dot" />
      <span class="collapsed-fps" :class="fpsStatusClass">
        {{ fpsData?.current ?? '—' }} FPS
      </span>
    </div>

    <!-- 展开状态 -->
    <div v-else class="widget-container">
      <!-- 拖拽头部 -->
      <div class="drag-handle" @mousedown="handleDragStart">
        <div class="logo-section">
          <span class="logo-dot" />
          <span class="logo-text">Vue Scan</span>
        </div>
        <div class="header-controls">
          <button class="header-btn" title="Minimize" @click="toggleCollapse">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 工具栏 -->
      <ToolbarSection
        :is-enabled="isEnabled"
        @toggle-enabled="toggleEnabled"
      />

      <!-- 标签页 -->
      <TabsSection v-model="currentTab" />

      <!-- 内容区域 -->
      <div class="content-area">
        <div class="content-scroll">
          <!-- Stats 面板 -->
          <template v-if="currentTab === 'stats'">
            <FPSSection
              :fps-data="fpsData"
              :fps-history="fpsHistory"
            />
            <MetricsSection :performance-data="performanceData" />
          </template>

          <!-- Components 面板 -->
          <template v-else-if="currentTab === 'components'">
            <ComponentsSection />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
