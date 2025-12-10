/**
 * Vue Instrumentation Store
 * 类似 bippy 的渲染数据存储
 */

import type { RenderData, VueFiber } from './types'
import { getDisplayName, getFiberId, getType } from './utils'

// ============ 全局存储 ============

/**
 * 组件渲染数据存储
 * 使用 WeakMap 来避免内存泄漏
 */
const componentRenderStore = new WeakMap<object, Map<string, RenderData>>()

/**
 * 组件名称到实例的映射
 */
const componentNameMap = new Map<string, Set<VueFiber>>()

/**
 * 渲染历史记录
 */
const renderHistory: Array<{
  componentName: string
  fiberId: string
  timestamp: number
  time: number
}> = []

const MAX_HISTORY_SIZE = 1000

// ============ 存储操作 ============

/**
 * 获取组件的渲染数据
 */
export function getComponentRenderData(fiber: VueFiber): RenderData | undefined {
  const type = getType(fiber)
  if (!type)
    return undefined

  const id = getFiberId(fiber)
  const keyMap = componentRenderStore.get(type as object)

  if (keyMap) {
    return keyMap.get(id)
  }

  return undefined
}

/**
 * 设置组件的渲染数据
 */
export function setComponentRenderData(fiber: VueFiber, data: RenderData): void {
  const type = getType(fiber)
  if (!type)
    return

  const id = getFiberId(fiber)
  let keyMap = componentRenderStore.get(type as object)

  if (!keyMap) {
    keyMap = new Map()
    componentRenderStore.set(type as object, keyMap)
  }

  keyMap.set(id, data)

  // 更新名称映射
  const name = getDisplayName(fiber)
  if (name) {
    let instances = componentNameMap.get(name)
    if (!instances) {
      instances = new Set()
      componentNameMap.set(name, instances)
    }
    instances.add(fiber)
  }
}

/**
 * 更新组件渲染数据
 */
export function updateComponentRenderData(
  fiber: VueFiber,
  renderTime: number,
): RenderData {
  const currentTimestamp = Date.now()
  const existingData = getComponentRenderData(fiber)

  const newData: RenderData = {
    selfTime: renderTime,
    totalTime: existingData
      ? existingData.totalTime + renderTime
      : renderTime,
    renderCount: existingData
      ? existingData.renderCount + 1
      : 1,
    lastRenderTimestamp: currentTimestamp,
  }

  setComponentRenderData(fiber, newData)

  // 添加到历史记录
  addToHistory(fiber, renderTime)

  return newData
}

/**
 * 添加到渲染历史
 */
function addToHistory(fiber: VueFiber, time: number): void {
  const componentName = getDisplayName(fiber) || 'Unknown'
  const fiberId = getFiberId(fiber)

  renderHistory.push({
    componentName,
    fiberId,
    timestamp: Date.now(),
    time,
  })

  // 限制历史大小
  if (renderHistory.length > MAX_HISTORY_SIZE) {
    renderHistory.shift()
  }
}

/**
 * 移除组件渲染数据
 */
export function removeComponentRenderData(fiber: VueFiber): void {
  const type = getType(fiber)
  if (!type)
    return

  const id = getFiberId(fiber)
  const keyMap = componentRenderStore.get(type as object)

  if (keyMap) {
    keyMap.delete(id)
    if (keyMap.size === 0) {
      componentRenderStore.delete(type as object)
    }
  }

  // 从名称映射中移除
  const name = getDisplayName(fiber)
  if (name) {
    const instances = componentNameMap.get(name)
    if (instances) {
      instances.delete(fiber)
      if (instances.size === 0) {
        componentNameMap.delete(name)
      }
    }
  }
}

// ============ 查询操作 ============

/**
 * 按名称获取所有组件实例
 */
export function getComponentsByName(name: string): Set<VueFiber> | undefined {
  return componentNameMap.get(name)
}

/**
 * 获取所有已跟踪的组件名称
 */
export function getAllTrackedComponentNames(): string[] {
  return Array.from(componentNameMap.keys())
}

/**
 * 获取渲染历史
 */
export function getRenderHistory(): typeof renderHistory {
  return renderHistory.slice()
}

/**
 * 获取最近的渲染记录
 */
export function getRecentRenders(count: number = 100): typeof renderHistory {
  return renderHistory.slice(-count)
}

/**
 * 获取特定组件的渲染历史
 */
export function getComponentRenderHistory(
  componentName: string,
): Array<typeof renderHistory[number]> {
  return renderHistory.filter(r => r.componentName === componentName)
}

/**
 * 获取渲染统计
 */
export function getRenderStats(): {
  totalRenders: number
  totalTime: number
  averageTime: number
  maxTime: number
  componentCount: number
} {
  let totalRenders = 0
  let totalTime = 0
  let maxTime = 0

  for (const record of renderHistory) {
    totalRenders++
    totalTime += record.time
    maxTime = Math.max(maxTime, record.time)
  }

  return {
    totalRenders,
    totalTime,
    averageTime: totalRenders > 0 ? totalTime / totalRenders : 0,
    maxTime,
    componentCount: componentNameMap.size,
  }
}

/**
 * 获取慢渲染组件
 */
export function getSlowComponents(threshold: number = 16): Array<{
  name: string
  count: number
  averageTime: number
  totalTime: number
}> {
  const componentTimes = new Map<string, { total: number, count: number }>()

  for (const record of renderHistory) {
    if (record.time > threshold) {
      const existing = componentTimes.get(record.componentName) || { total: 0, count: 0 }
      existing.total += record.time
      existing.count++
      componentTimes.set(record.componentName, existing)
    }
  }

  return Array.from(componentTimes.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      averageTime: data.total / data.count,
      totalTime: data.total,
    }))
    .sort((a, b) => b.totalTime - a.totalTime)
}

/**
 * 清除所有渲染历史
 */
export function clearRenderHistory(): void {
  renderHistory.length = 0
}

/**
 * 清除所有存储
 */
export function clearAllStores(): void {
  componentNameMap.clear()
  renderHistory.length = 0
  // WeakMap 会自动清理
}
