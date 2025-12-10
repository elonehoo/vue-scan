/**
 * Notification 与告警系统
 * 类似 react-scan 的 slowdown 检测和通知机制
 */

import { ref } from 'vue'

// ============ 类型定义 ============

export type EventSeverity = 'low' | 'needs-improvement' | 'high'
export type EventType = 'interaction' | 'dropped-frames' | 'long-render'
export type InteractionKind = 'click' | 'keyboard' | 'scroll'

/**
 * 分组的组件渲染数据
 */
export interface GroupedComponentRender {
  id: string
  name: string
  count: number
  totalTime: number
  selfTime: number
  changes: {
    props: Array<{ name: string, count: number }>
    state: Array<{ index: number, count: number }>
  }
  parents: Set<string>
}

/**
 * 交互时序数据
 */
export interface InteractionTiming {
  kind: 'interaction'
  renderTime: number
  otherJSTime: number
  framePreparation: number
  frameConstruction: number
  frameDraw: number | null
}

/**
 * 掉帧时序数据
 */
export interface DroppedFramesTiming {
  kind: 'dropped-frames'
  renderTime: number
  otherTime: number
}

/**
 * 交互事件
 */
export interface InteractionEvent {
  kind: 'interaction'
  id: string
  type: InteractionKind
  componentPath: string[]
  groupedRenders: GroupedComponentRender[]
  timing: InteractionTiming
  memory: number | null
  timestamp: number
}

/**
 * 掉帧事件
 */
export interface DroppedFramesEvent {
  kind: 'dropped-frames'
  id: string
  groupedRenders: GroupedComponentRender[]
  timing: DroppedFramesTiming
  memory: number | null
  timestamp: number
  fps: number
}

/**
 * 长渲染事件
 */
export interface LongRenderEvent {
  kind: 'long-render'
  id: string
  componentName: string
  renderTime: number
  timestamp: number
}

export type SlowdownEvent = InteractionEvent | DroppedFramesEvent | LongRenderEvent

// ============ 阈值常量 ============

export const HIGH_SEVERITY_FPS_DROP_TIME = 150
export const INTERACTION_THRESHOLD_GOOD = 100
export const INTERACTION_THRESHOLD_POOR = 300
export const FPS_THRESHOLD_WARNING = 30
export const FPS_THRESHOLD_CRITICAL = 20
export const RENDER_TIME_THRESHOLD_WARNING = 16 // 一帧的时间
export const RENDER_TIME_THRESHOLD_CRITICAL = 50

// ============ 事件严重性判断 ============

/**
 * 获取事件严重性
 */
export function getEventSeverity(event: SlowdownEvent): EventSeverity {
  switch (event.kind) {
    case 'interaction': {
      const totalTime = getTotalTime(event.timing)
      if (totalTime < INTERACTION_THRESHOLD_GOOD)
        return 'low'
      if (totalTime < INTERACTION_THRESHOLD_POOR)
        return 'needs-improvement'
      return 'high'
    }
    case 'dropped-frames': {
      const totalTime = getTotalTime(event.timing)
      if (totalTime < 50)
        return 'low'
      if (totalTime < HIGH_SEVERITY_FPS_DROP_TIME)
        return 'needs-improvement'
      return 'high'
    }
    case 'long-render': {
      if (event.renderTime < RENDER_TIME_THRESHOLD_WARNING)
        return 'low'
      if (event.renderTime < RENDER_TIME_THRESHOLD_CRITICAL)
        return 'needs-improvement'
      return 'high'
    }
  }
}

/**
 * 获取可读的严重性文本
 */
export function getReadableSeverity(severity: EventSeverity): string {
  switch (severity) {
    case 'high':
      return 'Poor'
    case 'needs-improvement':
      return 'Laggy'
    case 'low':
      return 'Good'
  }
}

/**
 * 计算总时间
 */
export function getTotalTime(timing: InteractionTiming | DroppedFramesTiming): number {
  switch (timing.kind) {
    case 'interaction': {
      const { renderTime, otherJSTime, framePreparation, frameConstruction, frameDraw } = timing
      return renderTime + otherJSTime + framePreparation + frameConstruction + (frameDraw ?? 0)
    }
    case 'dropped-frames': {
      return timing.otherTime + timing.renderTime
    }
  }
}

// ============ 事件存储 ============

const MAX_EVENTS = 100
const events = ref<SlowdownEvent[]>([])
const selectedEvent = ref<SlowdownEvent | null>(null)
const slowdownCount = ref(0)

/**
 * 事件监听器
 */
type EventListener = (event: SlowdownEvent) => void
const eventListeners = new Set<EventListener>()

/**
 * 添加事件
 */
export function addSlowdownEvent(event: SlowdownEvent): void {
  events.value.unshift(event)

  // 限制事件数量
  if (events.value.length > MAX_EVENTS) {
    events.value.pop()
  }

  // 更新慢速事件计数
  if (getEventSeverity(event) !== 'low') {
    slowdownCount.value++
  }

  // 通知监听器
  eventListeners.forEach((listener) => {
    try {
      listener(event)
    }
    catch (e) {
      console.error('[vue-scan] Event listener error:', e)
    }
  })
}

/**
 * 获取所有事件
 */
export function getSlowdownEvents(): SlowdownEvent[] {
  return events.value
}

/**
 * 获取选中的事件
 */
export function getSelectedEvent(): SlowdownEvent | null {
  return selectedEvent.value
}

/**
 * 设置选中的事件
 */
export function setSelectedEvent(event: SlowdownEvent | null): void {
  selectedEvent.value = event
}

/**
 * 获取慢速事件计数
 */
export function getSlowdownCount(): number {
  return slowdownCount.value
}

/**
 * 清除所有事件
 */
export function clearSlowdownEvents(): void {
  events.value = []
  slowdownCount.value = 0
  selectedEvent.value = null
}

/**
 * 添加事件监听器
 */
export function addEventListenerForSlowdown(listener: EventListener): () => void {
  eventListeners.add(listener)
  return () => {
    eventListeners.delete(listener)
  }
}

// ============ 唯一ID生成 ============

let idCounter = 0
export function generateEventId(): string {
  return `event-${Date.now()}-${idCounter++}`
}

// ============ 重新导出 ============
export {
  getCurrentFPS,
  recordComponentRender,
  recordLongRender,
  startFrameDropTracking,
  startInteractionTracking,
  startTimingTracking,
} from './event-tracking'
