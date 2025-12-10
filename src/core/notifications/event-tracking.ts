/**
 * 性能事件追踪
 * 监控交互、掉帧和长渲染事件
 */

import type {
  DroppedFramesEvent,
  GroupedComponentRender,
  InteractionEvent,
  InteractionKind,
  LongRenderEvent,
} from './index'
import {
  addSlowdownEvent,
  generateEventId,
  HIGH_SEVERITY_FPS_DROP_TIME,
} from './index'

// ============ 交互追踪状态 ============

interface CurrentInteraction {
  kind: InteractionKind
  id: string
  startTime: number
  startOrigin: number
  componentPath: string[]
  renders: Map<string, {
    name: string
    count: number
    selfTime: number
    totalTime: number
    changes: {
      props: Array<{ name: string, count: number }>
      state: Array<{ index: number, count: number }>
    }
  }>
}

let currentInteraction: CurrentInteraction | null = null
let isListening = false

// FPS 追踪
let framesDrawnInTheLastSecond: number[] = []
let lastFPS = 60

// ============ 交互监听 ============

/**
 * 开始监听交互事件
 */
export function startInteractionTracking(): () => void {
  if (isListening)
    return () => {}

  isListening = true

  const handlePointerDown = (e: PointerEvent) => {
    startInteraction('click', getComponentPath(e.target as Element))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!currentInteraction || currentInteraction.kind !== 'keyboard') {
      startInteraction('keyboard', getComponentPath(e.target as Element))
    }
  }

  document.addEventListener('pointerdown', handlePointerDown, { passive: true })
  document.addEventListener('keydown', handleKeyDown, { passive: true })

  return () => {
    isListening = false
    document.removeEventListener('pointerdown', handlePointerDown)
    document.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * 开始一个交互
 */
function startInteraction(kind: InteractionKind, componentPath: string[]): void {
  // 如果已有交互在进行，先结束它
  if (currentInteraction) {
    endInteraction()
  }

  currentInteraction = {
    kind,
    id: generateEventId(),
    startTime: performance.now(),
    startOrigin: performance.timeOrigin,
    componentPath,
    renders: new Map(),
  }

  // 在下一帧结束交互
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      endInteraction()
    })
  })
}

/**
 * 结束当前交互
 */
function endInteraction(): void {
  if (!currentInteraction)
    return

  const endTime = performance.now()
  const duration = endTime - currentInteraction.startTime

  // 只记录超过阈值的交互
  if (duration > 16) { // 超过一帧时间
    const groupedRenders: GroupedComponentRender[] = []

    currentInteraction.renders.forEach((render, id) => {
      groupedRenders.push({
        id,
        name: render.name,
        count: render.count,
        totalTime: render.totalTime,
        selfTime: render.selfTime,
        changes: render.changes,
        parents: new Set(),
      })
    })

    const renderTime = groupedRenders.reduce((sum, r) => sum + r.totalTime, 0)
    const otherJSTime = Math.max(0, duration - renderTime)

    const event: InteractionEvent = {
      kind: 'interaction',
      id: currentInteraction.id,
      type: currentInteraction.kind,
      componentPath: currentInteraction.componentPath,
      groupedRenders,
      timing: {
        kind: 'interaction',
        renderTime,
        otherJSTime,
        framePreparation: 0,
        frameConstruction: 0,
        frameDraw: null,
      },
      memory: getMemoryUsage(),
      timestamp: currentInteraction.startTime + currentInteraction.startOrigin,
    }

    addSlowdownEvent(event)
  }

  currentInteraction = null
}

/**
 * 记录组件渲染
 */
export function recordComponentRender(
  componentName: string,
  renderTime: number,
  changes?: { props?: string[], state?: number[] },
): void {
  if (!currentInteraction)
    return

  const id = `${componentName}-${currentInteraction.id}`
  const existing = currentInteraction.renders.get(id)

  if (existing) {
    existing.count++
    existing.totalTime += renderTime
    existing.selfTime = Math.max(existing.selfTime, renderTime)

    if (changes?.props) {
      changes.props.forEach((prop) => {
        const propChange = existing.changes.props.find(p => p.name === prop)
        if (propChange) {
          propChange.count++
        }
        else {
          existing.changes.props.push({ name: prop, count: 1 })
        }
      })
    }
  }
  else {
    currentInteraction.renders.set(id, {
      name: componentName,
      count: 1,
      selfTime: renderTime,
      totalTime: renderTime,
      changes: {
        props: changes?.props?.map(name => ({ name, count: 1 })) || [],
        state: changes?.state?.map(index => ({ index, count: 1 })) || [],
      },
    })
  }
}

// ============ 掉帧追踪 ============

let rafHandle: number | null = null
let timeoutHandle: number | null = null
let isTrackingFrames = false

/**
 * 开始追踪掉帧
 */
export function startFrameDropTracking(): () => void {
  if (isTrackingFrames)
    return () => {}

  isTrackingFrames = true
  measureFrame()

  return () => {
    isTrackingFrames = false
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }
  }
}

/**
 * 测量帧
 */
function measureFrame(): void {
  if (!isTrackingFrames)
    return

  const startTime = performance.now()
  const startOrigin = performance.timeOrigin

  rafHandle = requestAnimationFrame(() => {
    timeoutHandle = window.setTimeout(() => {
      const endNow = performance.now()
      const duration = endNow - startTime
      const endOrigin = performance.timeOrigin

      // 更新 FPS
      framesDrawnInTheLastSecond.push(endNow + endOrigin)
      framesDrawnInTheLastSecond = framesDrawnInTheLastSecond.filter(
        frameAt => endNow + endOrigin - frameAt <= 1000,
      )
      lastFPS = framesDrawnInTheLastSecond.length

      // 检测掉帧
      if (
        duration > HIGH_SEVERITY_FPS_DROP_TIME
        && document.visibilityState === 'visible'
      ) {
        const event: DroppedFramesEvent = {
          kind: 'dropped-frames',
          id: generateEventId(),
          groupedRenders: [],
          timing: {
            kind: 'dropped-frames',
            renderTime: 0,
            otherTime: duration,
          },
          memory: getMemoryUsage(),
          timestamp: startTime + startOrigin,
          fps: lastFPS,
        }

        addSlowdownEvent(event)
      }

      measureFrame()
    }, 0)
  })
}

/**
 * 获取当前 FPS
 */
export function getCurrentFPS(): number {
  return lastFPS
}

// ============ 长渲染追踪 ============

const LONG_RENDER_THRESHOLD = 16 // 一帧时间

/**
 * 记录长渲染事件
 */
export function recordLongRender(componentName: string, renderTime: number): void {
  if (renderTime < LONG_RENDER_THRESHOLD)
    return

  const event: LongRenderEvent = {
    kind: 'long-render',
    id: generateEventId(),
    componentName,
    renderTime,
    timestamp: performance.now() + performance.timeOrigin,
  }

  addSlowdownEvent(event)
}

// ============ 辅助函数 ============

/**
 * 获取组件路径
 */
function getComponentPath(element: Element | null): string[] {
  const path: string[] = []
  let el = element

  while (el) {
    // 尝试获取 Vue 组件名
    const vueEl = el as any
    if (vueEl.__vueParentComponent) {
      const componentName = getVueComponentName(vueEl.__vueParentComponent)
      if (componentName && !path.includes(componentName)) {
        path.push(componentName)
      }
    }
    el = el.parentElement
  }

  return path.reverse()
}

/**
 * 获取 Vue 组件名
 */
function getVueComponentName(instance: any): string | null {
  if (!instance)
    return null

  const type = instance.type
  if (!type)
    return null

  return (
    type.name
    || type.__name
    || (type.__file ? type.__file.split('/').pop()?.replace(/\.vue$/, '') : null)
    || 'Anonymous'
  )
}

/**
 * 获取内存使用
 */
function getMemoryUsage(): number | null {
  // @ts-expect-error - memory API 只在 Chrome 中可用
  const memory = performance.memory
  if (!memory)
    return null

  return memory.usedJSHeapSize / (1024 * 1024)
}

/**
 * 开始所有追踪
 */
export function startTimingTracking(): () => void {
  const unsubInteraction = startInteractionTracking()
  const unsubFrameDrop = startFrameDropTracking()

  return () => {
    unsubInteraction()
    unsubFrameDrop()
  }
}
