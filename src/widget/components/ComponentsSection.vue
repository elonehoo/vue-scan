<script setup lang="ts">
import type { Ref } from 'vue'
import type { ComponentRenderData } from '../../shared/store'
import { computed, inject, ref } from 'vue'

// 从 widget 状态获取组件数据
const widgetState = inject<{
  componentDataMap: Ref<Map<string, ComponentRenderData>>
  recentComponentIds: Ref<string[]>
  updateCounter: Ref<number>
}>('widgetState')

const searchQuery = ref('')
const selectedUuid = ref<string | null>(null)
const expandedItems = ref<Set<string>>(new Set())

const components = computed(() => {
  // 触发响应式更新
  const counter = widgetState?.updateCounter.value
  void counter

  const data = widgetState?.componentDataMap.value ?? new Map()
  const entries = Array.from(data.entries())

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    return entries.filter(([_, info]) =>
      info.componentName.toLowerCase().includes(query),
    )
  }

  // 按渲染次数排序
  return entries.sort((a, b) => b[1].renderCount - a[1].renderCount)
})

function toggleExpand(uuid: string) {
  if (expandedItems.value.has(uuid)) {
    expandedItems.value.delete(uuid)
  }
  else {
    expandedItems.value.add(uuid)
  }
}

function selectComponent(uuid: string) {
  if (selectedUuid.value === uuid) {
    selectedUuid.value = null
  }
  else {
    selectedUuid.value = uuid
    // 尝试高亮对应的 DOM 元素
    const element = document.querySelector(`[data-vue-scan-id="${uuid}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

function formatTime(ms: number): string {
  if (ms < 1)
    return '< 1ms'
  if (ms < 1000)
    return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
</script>

<template>
  <div class="components-section">
    <!-- 搜索框 -->
    <div style="padding: 8px;">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search components..."
      >
    </div>

    <!-- 组件列表 -->
    <div v-if="components.length > 0" style="padding: 0 8px 8px;">
      <div
        v-for="[uuid, info] in components"
        :key="uuid"
        class="component-item"
        :class="{ selected: selectedUuid === uuid }"
        @click="selectComponent(uuid)"
      >
        <div class="component-header">
          <span class="component-name">{{ info.componentName }}</span>
          <span class="component-count">{{ info.renderCount }}</span>
        </div>

        <div
          v-if="expandedItems.has(uuid) || selectedUuid === uuid"
          class="component-details"
        >
          <div class="component-detail-row">
            <span>Last render:</span>
            <span>{{ formatTime(info.lastRenderTime) }}</span>
          </div>
          <div class="component-detail-row">
            <span>Average:</span>
            <span>{{ formatTime(info.averageRenderTime) }}</span>
          </div>
          <div class="component-detail-row">
            <span>Total:</span>
            <span>{{ formatTime(info.totalRenderTime) }}</span>
          </div>
        </div>

        <button
          v-if="!expandedItems.has(uuid) && selectedUuid !== uuid"
          style="
            display: block;
            width: 100%;
            margin-top: 4px;
            padding: 4px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.3);
            font-size: 10px;
            cursor: pointer;
          "
          @click.stop="toggleExpand(uuid)"
        >
          Show details
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-state-icon">
        📦
      </div>
      <div class="empty-state-text">
        {{ searchQuery ? 'No components match your search' : 'No component renders detected yet' }}
      </div>
      <div v-if="!searchQuery" style="margin-top: 8px; font-size: 11px;">
        Interact with your app to see renders
      </div>
    </div>
  </div>
</template>
