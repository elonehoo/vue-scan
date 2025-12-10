/**
 * 阈值告警配置
 */

import type { EventSeverity, SlowdownEvent } from './index'
import { ref } from 'vue'
import { getEventSeverity } from './index'

// ============ 阈值配置 ============

export interface ThresholdConfig {
  /** FPS 警告阈值 */
  fpsWarning: number
  /** FPS 严重阈值 */
  fpsCritical: number
  /** 渲染时间警告阈值 (ms) */
  renderTimeWarning: number
  /** 渲染时间严重阈值 (ms) */
  renderTimeCritical: number
  /** 交互时间良好阈值 (ms) */
  interactionGood: number
  /** 交互时间差阈值 (ms) */
  interactionPoor: number
  /** 内存使用警告阈值 (%) */
  memoryWarning: number
  /** 内存使用严重阈值 (%) */
  memoryCritical: number
}

const defaultThresholds: ThresholdConfig = {
  fpsWarning: 30,
  fpsCritical: 20,
  renderTimeWarning: 16,
  renderTimeCritical: 50,
  interactionGood: 100,
  interactionPoor: 300,
  memoryWarning: 70,
  memoryCritical: 90,
}

const thresholds = ref<ThresholdConfig>({ ...defaultThresholds })

/**
 * 获取阈值配置
 */
export function getThresholds(): ThresholdConfig {
  return thresholds.value
}

/**
 * 设置阈值配置
 */
export function setThresholds(config: Partial<ThresholdConfig>): void {
  thresholds.value = { ...thresholds.value, ...config }
}

/**
 * 重置阈值配置
 */
export function resetThresholds(): void {
  thresholds.value = { ...defaultThresholds }
}

// ============ 告警状态 ============

export interface AlertState {
  /** FPS 状态 */
  fps: EventSeverity
  /** 内存状态 */
  memory: EventSeverity
  /** 渲染状态 */
  render: EventSeverity
  /** 交互状态 */
  interaction: EventSeverity
  /** 总体状态 */
  overall: EventSeverity
}

const alertState = ref<AlertState>({
  fps: 'low',
  memory: 'low',
  render: 'low',
  interaction: 'low',
  overall: 'low',
})

/**
 * 获取告警状态
 */
export function getAlertState(): AlertState {
  return alertState.value
}

/**
 * 更新 FPS 告警状态
 */
export function updateFPSAlert(fps: number): void {
  const config = thresholds.value

  if (fps < config.fpsCritical) {
    alertState.value.fps = 'high'
  }
  else if (fps < config.fpsWarning) {
    alertState.value.fps = 'needs-improvement'
  }
  else {
    alertState.value.fps = 'low'
  }

  updateOverallAlert()
}

/**
 * 更新内存告警状态
 */
export function updateMemoryAlert(usagePercentage: number): void {
  const config = thresholds.value

  if (usagePercentage > config.memoryCritical) {
    alertState.value.memory = 'high'
  }
  else if (usagePercentage > config.memoryWarning) {
    alertState.value.memory = 'needs-improvement'
  }
  else {
    alertState.value.memory = 'low'
  }

  updateOverallAlert()
}

/**
 * 更新渲染告警状态
 */
export function updateRenderAlert(renderTime: number): void {
  const config = thresholds.value

  if (renderTime > config.renderTimeCritical) {
    alertState.value.render = 'high'
  }
  else if (renderTime > config.renderTimeWarning) {
    alertState.value.render = 'needs-improvement'
  }
  else {
    alertState.value.render = 'low'
  }

  updateOverallAlert()
}

/**
 * 更新交互告警状态
 */
export function updateInteractionAlert(interactionTime: number): void {
  const config = thresholds.value

  if (interactionTime > config.interactionPoor) {
    alertState.value.interaction = 'high'
  }
  else if (interactionTime > config.interactionGood) {
    alertState.value.interaction = 'needs-improvement'
  }
  else {
    alertState.value.interaction = 'low'
  }

  updateOverallAlert()
}

/**
 * 从事件更新告警状态
 */
export function updateAlertFromEvent(event: SlowdownEvent): void {
  const severity = getEventSeverity(event)

  switch (event.kind) {
    case 'interaction':
      alertState.value.interaction = severity
      break
    case 'dropped-frames':
      alertState.value.fps = severity
      break
    case 'long-render':
      alertState.value.render = severity
      break
  }

  updateOverallAlert()
}

/**
 * 更新总体告警状态
 */
function updateOverallAlert(): void {
  const states = [
    alertState.value.fps,
    alertState.value.memory,
    alertState.value.render,
    alertState.value.interaction,
  ]

  if (states.includes('high')) {
    alertState.value.overall = 'high'
  }
  else if (states.includes('needs-improvement')) {
    alertState.value.overall = 'needs-improvement'
  }
  else {
    alertState.value.overall = 'low'
  }
}

/**
 * 获取告警颜色
 */
export function getAlertColor(severity: EventSeverity): string {
  switch (severity) {
    case 'high':
      return '#ef4444' // red
    case 'needs-improvement':
      return '#f59e0b' // amber
    case 'low':
      return '#22c55e' // green
  }
}

/**
 * 获取告警文本
 */
export function getAlertText(severity: EventSeverity): string {
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
 * 重置告警状态
 */
export function resetAlertState(): void {
  alertState.value = {
    fps: 'low',
    memory: 'low',
    render: 'low',
    interaction: 'low',
    overall: 'low',
  }
}
