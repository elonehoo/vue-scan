/**
 * 组件渲染数据存储
 * 用于在 hook 和 widget 之间共享组件渲染信息
 */

import { reactive, ref } from 'vue'

export interface ComponentRenderData {
  componentName: string
  renderCount: number
  renderTime: number
  lastRenderTime: number
  averageRenderTime: number
  totalRenderTime: number
  lastUpdated: number
}

// 全局响应式状态
const componentDataMap = reactive(new Map<string, ComponentRenderData>())
const updateListeners = new Set<(uuid: string, data: ComponentRenderData) => void>()

// 最近渲染的组件列表（用于组件列表显示）
const recentComponents = ref<string[]>([])
const MAX_RECENT_COMPONENTS = 50

/**
 * 更新组件渲染数据
 */
export function updateComponentRenderData(uuid: string, data: Partial<ComponentRenderData>) {
  let existing = componentDataMap.get(uuid)

  if (!existing) {
    existing = {
      componentName: data.componentName || 'Unknown',
      renderCount: 0,
      renderTime: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      lastUpdated: Date.now(),
    }
    componentDataMap.set(uuid, existing)
  }

  // 更新数据
  existing.renderCount++
  existing.renderTime = data.renderTime || 0
  existing.lastRenderTime = data.renderTime || 0
  existing.totalRenderTime += data.renderTime || 0
  existing.averageRenderTime = existing.totalRenderTime / existing.renderCount
  existing.lastUpdated = Date.now()

  if (data.componentName) {
    existing.componentName = data.componentName
  }

  // 更新最近组件列表
  const idx = recentComponents.value.indexOf(uuid)
  if (idx > -1) {
    recentComponents.value.splice(idx, 1)
  }
  recentComponents.value.unshift(uuid)
  if (recentComponents.value.length > MAX_RECENT_COMPONENTS) {
    recentComponents.value.pop()
  }

  // 通知监听器
  updateListeners.forEach((listener) => {
    listener(uuid, existing!)
  })
}

/**
 * 获取所有组件数据
 */
export function getAllComponentData(): Map<string, ComponentRenderData> {
  return componentDataMap
}

/**
 * 获取特定组件数据
 */
export function getComponentData(uuid: string): ComponentRenderData | undefined {
  return componentDataMap.get(uuid)
}

/**
 * 获取最近渲染的组件列表
 */
export function getRecentComponents(): string[] {
  return recentComponents.value
}

/**
 * 添加更新监听器
 */
export function addUpdateListener(listener: (uuid: string, data: ComponentRenderData) => void) {
  updateListeners.add(listener)
  return () => {
    updateListeners.delete(listener)
  }
}

/**
 * 清除所有数据
 */
export function clearAllComponentData() {
  componentDataMap.clear()
  recentComponents.value = []
}

/**
 * 移除特定组件数据
 */
export function removeComponentData(uuid: string) {
  componentDataMap.delete(uuid)
  const idx = recentComponents.value.indexOf(uuid)
  if (idx > -1) {
    recentComponents.value.splice(idx, 1)
  }
}
