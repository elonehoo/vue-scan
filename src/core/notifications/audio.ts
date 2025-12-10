/**
 * 音频告警通知
 * 类似 react-scan 的 ding 声音提醒
 */

import type { SlowdownEvent } from './index'
import { getEventSeverity } from './index'

let audioContext: AudioContext | null = null
let isAudioEnabled = false

/**
 * 初始化音频上下文
 */
function initAudioContext(): AudioContext | null {
  if (audioContext)
    return audioContext

  try {
    audioContext = new AudioContext()
    return audioContext
  }
  catch {
    console.warn('[vue-scan] AudioContext not supported')
    return null
  }
}

/**
 * 播放通知声音
 */
export function playNotificationSound(): void {
  const ctx = initAudioContext()
  if (!ctx || ctx.state === 'closed')
    return

  // 确保音频上下文是激活的
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  // 设置声音参数 - 清脆的 ding 声
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5 音符
  oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1) // 滑降到 A4

  // 音量包络
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.3)
}

/**
 * 启用音频通知
 */
export function enableAudioNotifications(): void {
  isAudioEnabled = true
  initAudioContext()
}

/**
 * 禁用音频通知
 */
export function disableAudioNotifications(): void {
  isAudioEnabled = false
}

/**
 * 检查音频通知是否启用
 */
export function isAudioNotificationsEnabled(): boolean {
  return isAudioEnabled
}

/**
 * 切换音频通知
 */
export function toggleAudioNotifications(): boolean {
  if (isAudioEnabled) {
    disableAudioNotifications()
  }
  else {
    enableAudioNotifications()
  }
  return isAudioEnabled
}

/**
 * 处理事件并播放声音（如果严重性高）
 */
export function handleEventAudio(event: SlowdownEvent): void {
  if (!isAudioEnabled)
    return

  const severity = getEventSeverity(event)
  if (severity === 'high') {
    playNotificationSound()
  }
}

/**
 * 销毁音频上下文
 */
export function destroyAudioContext(): void {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close()
  }
  audioContext = null
  isAudioEnabled = false
}
