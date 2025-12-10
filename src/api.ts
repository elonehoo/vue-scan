/**
 * Vue Scan 公开 API
 * 提供程序化控制 Vue Scan 的能力
 */

import type { RenderStats, VueScanAPI } from './types'
import { destroyCanvasRenderer, getCanvasRenderer, initCanvasRenderer } from './core/canvas-renderer'
import { getConfig, setConfigValue, updateConfig, useConfig } from './core/config'
import { getFPS } from './core/instrumentation'
import { getSlowdownEvents } from './core/notifications'
import { clearAllComponentData, getAllComponentData } from './shared/store'
import { createWidget, destroyWidget } from './widget'

// ============ 内部状态 ============

let isInitialized = false
let isPaused = false

// ============ API 实现 ============

/**
 * 启用/禁用扫描
 */
export function setEnabled(enabled: boolean): void {
  setConfigValue('enabled', enabled)
  if (enabled && !isInitialized) {
    initCanvasRenderer()
  }
}

/**
 * 获取当前启用状态
 */
export function isEnabled(): boolean {
  return getConfig().enabled
}

/**
 * 显示/隐藏面板
 */
export function showPanel(show: boolean): void {
  setConfigValue('showPanel', show)
  if (show) {
    createWidget({
      initialPosition: getConfig().panelPosition,
      enableFPS: getConfig().enableFPS,
      enablePerformance: getConfig().enablePerformance,
      fpsWarningThreshold: getConfig().fpsWarningThreshold,
    })
  }
  else {
    destroyWidget()
  }
}

/**
 * 切换面板显示
 */
export function togglePanel(): boolean {
  const current = getConfig().showPanel
  showPanel(!current)
  return !current
}

/**
 * 暂停扫描
 */
export function pause(): void {
  isPaused = true
  const renderer = getCanvasRenderer()
  if (renderer) {
    renderer.stop()
  }
}

/**
 * 恢复扫描
 */
export function resume(): void {
  isPaused = false
  const renderer = getCanvasRenderer()
  if (renderer) {
    renderer.start()
  }
}

/**
 * 获取是否暂停
 */
export function isPausedState(): boolean {
  return isPaused
}

/**
 * 获取渲染统计
 */
export function getStats(): RenderStats {
  const componentData = getAllComponentData()
  const slowdownEvents = getSlowdownEvents()

  let totalRenders = 0
  let totalTime = 0
  let maxTime = 0
  let slowRenderCount = 0

  componentData.forEach((data) => {
    totalRenders += data.renderCount
    totalTime += data.totalRenderTime
    maxTime = Math.max(maxTime, data.renderTime)
    if (data.renderTime > 16) {
      slowRenderCount++
    }
  })

  // 从 slowdown events 也计算慢渲染
  slowdownEvents.forEach((event) => {
    if (event.kind === 'long-render') {
      slowRenderCount++
    }
  })

  return {
    totalRenders,
    totalTime,
    averageTime: totalRenders > 0 ? totalTime / totalRenders : 0,
    maxTime,
    componentCount: componentData.size,
    currentFPS: getFPS(),
    slowRenderCount,
  }
}

/**
 * 清除渲染数据
 */
export function clear(): void {
  const renderer = getCanvasRenderer()
  if (renderer) {
    renderer.clearAll()
  }
  // 同时清除 store 中的数据
  clearAllComponentData()
}

/**
 * 销毁 Vue Scan
 */
export function destroy(): void {
  destroyWidget()
  destroyCanvasRenderer()
  isInitialized = false
}

/**
 * 获取配置（响应式）
 */
export { useConfig }

/**
 * 更新配置
 */
export { updateConfig }

/**
 * 获取 API 对象
 */
export function getAPI(): VueScanAPI {
  return {
    setEnabled,
    isEnabled,
    showPanel,
    togglePanel,
    pause,
    resume,
    getStats,
    clear,
    destroy,
  }
}

// ============ 全局暴露 ============

/**
 * 在 window 上暴露 API（类似 react-scan）
 */
export function exposeGlobalAPI(): void {
  if (typeof window !== 'undefined') {
    (window as any).__VUE_SCAN__ = getAPI()
  }
}

/**
 * 初始化 API
 */
export function initAPI(): void {
  if (isInitialized)
    return
  isInitialized = true
  exposeGlobalAPI()
}
