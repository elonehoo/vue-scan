/**
 * Vue Instrumentation Core
 * 类似 bippy 的 instrument 函数
 */

import type {
  Change,
  InstrumentationConfig,
  InstrumentationInstance,
  Render,
  RenderData,
  VueFiber,
} from './types'
import { RenderPhase } from './types'
import {
  getAllChanges,
  getDisplayName,
  getRenderData,
  setRenderData,
} from './utils'

// ============ 全局状态 ============

let fps = 0
let lastTime = performance.now()
let frameCount = 0
let fpsInitialized = false

/**
 * 更新 FPS
 */
function updateFPS(): void {
  frameCount++
  const now = performance.now()
  if (now - lastTime >= 1000) {
    fps = frameCount
    frameCount = 0
    lastTime = now
  }
  requestAnimationFrame(updateFPS)
}

/**
 * 获取当前 FPS
 */
export function getFPS(): number {
  if (!fpsInitialized) {
    fpsInitialized = true
    updateFPS()
    fps = 60
  }
  return fps
}

// ============ Instrumentation 实例管理 ============

const instrumentationInstances = new Map<string, InstrumentationInstance>()
let isInstrumented = false

// 长渲染回调
let onLongRenderCallback: ((name: string, time: number) => void) | null = null

/**
 * 设置长渲染回调
 */
export function setOnLongRenderCallback(callback: (name: string, time: number) => void): void {
  onLongRenderCallback = callback
}

/**
 * 获取所有实例
 */
function getAllInstances(): InstrumentationInstance[] {
  return Array.from(instrumentationInstances.values())
}

// ============ 核心 Instrumentation ============

/**
 * 创建 Instrumentation 实例
 */
export function createInstrumentation(
  instanceKey: string,
  config: InstrumentationConfig,
): InstrumentationInstance {
  const instance: InstrumentationInstance = {
    key: instanceKey,
    config,
    isPaused: false,
    fiberRoots: new WeakSet<VueFiber>(),
  }

  instrumentationInstances.set(instanceKey, instance)

  // 初次安装全局 hook
  if (!isInstrumented) {
    isInstrumented = true
    installGlobalHook()
  }

  return instance
}

/**
 * 安装全局 Vue DevTools Hook
 */
function installGlobalHook(): void {
  // 检查是否有 Vue DevTools Hook
  if (typeof window === 'undefined')
    return

  const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__
  if (!hook) {
    // 创建一个简单的 hook
    ;(window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ = {
      events: new Map(),
      on(event: string, fn: (...args: any[]) => void) {
        if (!this.events.has(event)) {
          this.events.set(event, [])
        }
        this.events.get(event).push(fn)
      },
      emit(event: string, ...args: any[]) {
        const fns = this.events.get(event) || []
        fns.forEach((fn: (...args: any[]) => void) => fn(...args))
      },
    }
  }
}

/**
 * 处理组件渲染
 */
export function handleComponentRender(
  fiber: VueFiber,
  phase: 'mount' | 'update' | 'unmount',
  renderTime: number,
): void {
  const allInstances = getAllInstances()

  // 通知所有实例
  for (const instance of allInstances) {
    if (instance.isPaused)
      continue

    const { config } = instance

    // 验证 fiber
    if (config.isValidFiber && !config.isValidFiber(fiber)) {
      continue
    }

    // 获取变更
    const changes: Change[] = config.trackChanges ? getAllChanges(fiber) : []

    // 创建渲染数据
    const render: Render = {
      phase: phase === 'mount' ? RenderPhase.Mount : phase === 'update' ? RenderPhase.Update : RenderPhase.Unmount,
      componentName: getDisplayName(fiber),
      time: renderTime,
      count: 1,
      changes,
      unnecessary: null, // Vue 暂不支持
      didCommit: true,
      fps: getFPS(),
    }

    // 触发回调
    config.onRender?.(fiber, [render])

    // 更新渲染数据存储
    if (phase !== 'unmount') {
      trackRender(fiber, renderTime)
    }

    // 记录长渲染 - 通过回调处理
    if (renderTime > 16 && onLongRenderCallback) {
      const componentName = getDisplayName(fiber)
      if (componentName) {
        onLongRenderCallback(componentName, renderTime)
      }
    }
  }

  // 保存当前状态用于下次比较
  if (phase !== 'unmount') {
    fiber.__previousProps__ = { ...fiber.props }
    if (fiber.setupState) {
      fiber.__previousState__ = { ...fiber.setupState }
    }
  }
}

/**
 * 跟踪渲染
 */
function trackRender(fiber: VueFiber, renderTime: number): void {
  const currentTimestamp = Date.now()
  const existingData = getRenderData(fiber)

  const renderData: RenderData = existingData || {
    selfTime: 0,
    totalTime: 0,
    renderCount: 0,
    lastRenderTimestamp: currentTimestamp,
  }

  renderData.renderCount = (renderData.renderCount || 0) + 1
  renderData.selfTime = renderTime || 0
  renderData.totalTime = renderTime || 0
  renderData.lastRenderTimestamp = currentTimestamp

  setRenderData(fiber, renderData)
}

/**
 * Commit 开始通知
 */
export function notifyCommitStart(): void {
  const allInstances = getAllInstances()
  for (const instance of allInstances) {
    if (!instance.isPaused) {
      instance.config.onCommitStart?.()
    }
  }
}

/**
 * Commit 结束通知
 */
export function notifyCommitFinish(): void {
  const allInstances = getAllInstances()
  for (const instance of allInstances) {
    if (!instance.isPaused) {
      instance.config.onCommitFinish?.()
    }
  }
}

/**
 * 暂停 instrumentation
 */
export function pauseInstrumentation(instanceKey: string): void {
  const instance = instrumentationInstances.get(instanceKey)
  if (instance) {
    instance.isPaused = true
  }
}

/**
 * 恢复 instrumentation
 */
export function resumeInstrumentation(instanceKey: string): void {
  const instance = instrumentationInstances.get(instanceKey)
  if (instance) {
    instance.isPaused = false
  }
}

/**
 * 检查 instrumentation 是否活跃
 */
export function isInstrumentationActive(): boolean {
  return isInstrumented && getAllInstances().some(i => !i.isPaused)
}

/**
 * 移除 instrumentation 实例
 */
export function removeInstrumentation(instanceKey: string): void {
  instrumentationInstances.delete(instanceKey)
}

/**
 * 清除所有 instrumentation
 */
export function clearAllInstrumentation(): void {
  instrumentationInstances.clear()
}
