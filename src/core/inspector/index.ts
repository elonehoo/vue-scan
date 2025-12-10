/**
 * Inspector 模块 - 主入口
 */

export * from './overlay'
export * from './state'
export * from './types'
export * from './utils'

import { destroyInspectorOverlay, getInspectorOverlay, initInspectorOverlay } from './overlay'
import { inspectorStore } from './state'

/**
 * 启动 Inspector 模式
 */
export function startInspector(): void {
  // 先初始化 overlay（如果还没初始化）
  initInspectorOverlay()

  // 只设置状态，让 overlay 通过订阅来响应
  inspectorStore.state = {
    kind: 'inspecting',
    hoveredElement: null,
  }
}

/**
 * 停止 Inspector 模式
 */
export function stopInspector(): void {
  inspectorStore.state = { kind: 'inspect-off' }
  inspectorStore.selectedComponent = null
}

/**
 * 切换 Inspector 模式
 */
export function toggleInspector(): void {
  const overlay = getInspectorOverlay()
  if (!overlay) {
    startInspector()
    return
  }

  const state = inspectorStore.state
  if (state.kind === 'inspect-off') {
    startInspector()
  }
  else {
    stopInspector()
  }
}

/**
 * 销毁 Inspector
 */
export function destroyInspector(): void {
  destroyInspectorOverlay()
  inspectorStore.reset()
}

/**
 * 获取当前 Inspector 状态
 */
export function getInspectorState() {
  return inspectorStore.state
}

/**
 * 获取选中的组件信息
 */
export function getSelectedComponent() {
  return inspectorStore.selectedComponent
}

/**
 * 订阅 Inspector 状态变化
 */
export function subscribeInspectorState(listener: (state: ReturnType<typeof getInspectorState>) => void) {
  return inspectorStore.subscribeState(listener)
}

/**
 * 订阅选中组件变化
 */
export function subscribeSelectedComponent(listener: (info: ReturnType<typeof getSelectedComponent>) => void) {
  return inspectorStore.subscribeComponent(listener)
}
