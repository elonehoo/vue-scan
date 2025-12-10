/**
 * 持久化配置系统
 * 类似 react-scan 的 LocalStorage 配置管理
 */

import { ref, watch } from 'vue'

// ============ 类型定义 ============

/**
 * Vue Scan 配置
 */
export interface VueScanConfig {
  /** 是否启用扫描 */
  enabled: boolean
  /** 是否显示面板 */
  showPanel: boolean
  /** 是否启用 FPS 监控 */
  enableFPS: boolean
  /** 是否启用性能监控 */
  enablePerformance: boolean
  /** 是否启用音频告警 */
  audioNotifications: boolean
  /** FPS 警告阈值 */
  fpsWarningThreshold: number
  /** 渲染时间警告阈值 (ms) */
  renderTimeWarningThreshold: number
  /** 面板位置 */
  panelPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** 面板是否折叠 */
  panelCollapsed: boolean
  /** 当前选中的 Tab */
  activeTab: 'stats' | 'components' | 'inspector' | 'notifications'
  /** 高亮颜色 */
  highlightColor: string
  /** 高亮透明度 */
  highlightOpacity: number
  /** 是否显示组件名称 */
  showComponentName: boolean
  /** 是否显示渲染次数 */
  showRenderCount: boolean
  /** 是否显示渲染时间 */
  showRenderTime: boolean
}

// ============ 默认配置 ============

export const DEFAULT_CONFIG: VueScanConfig = {
  enabled: true,
  showPanel: true,
  enableFPS: true,
  enablePerformance: true,
  audioNotifications: false,
  fpsWarningThreshold: 30,
  renderTimeWarningThreshold: 16,
  panelPosition: 'bottom-right',
  panelCollapsed: false,
  activeTab: 'stats',
  highlightColor: '#8E61E3',
  highlightOpacity: 0.6,
  showComponentName: true,
  showRenderCount: true,
  showRenderTime: true,
}

// ============ 存储 Key ============

const STORAGE_KEY = 'vue-scan-config'
const STORAGE_VERSION = 1

// ============ 配置存储 ============

/**
 * 从 LocalStorage 读取配置
 */
export function loadConfig(): VueScanConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_CONFIG }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { ...DEFAULT_CONFIG }
    }

    const parsed = JSON.parse(stored)

    // 版本检查
    if (parsed._version !== STORAGE_VERSION) {
      // 迁移或重置配置
      return { ...DEFAULT_CONFIG }
    }

    // 合并默认配置以处理新增字段
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    }
  }
  catch (e) {
    console.warn('[vue-scan] Failed to load config:', e)
    return { ...DEFAULT_CONFIG }
  }
}

/**
 * 保存配置到 LocalStorage
 */
function saveConfig(config: VueScanConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    const toStore = {
      ...config,
      _version: STORAGE_VERSION,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  }
  catch (e) {
    console.warn('[vue-scan] Failed to save config:', e)
  }
}

// ============ 响应式配置 ============

const config = ref<VueScanConfig>(loadConfig())

// 自动保存配置变更
let saveTimeout: ReturnType<typeof setTimeout> | null = null
watch(config, (newConfig) => {
  // 防抖保存
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    saveConfig(newConfig)
  }, 300)
}, { deep: true })

// ============ 导出 API ============

/**
 * 获取当前配置
 */
export function getConfig(): VueScanConfig {
  return config.value
}

/**
 * 获取响应式配置
 */
export function useConfig() {
  return config
}

/**
 * 更新配置
 */
export function updateConfig(updates: Partial<VueScanConfig>): void {
  config.value = {
    ...config.value,
    ...updates,
  }
}

/**
 * 重置配置为默认值
 */
export function resetConfig(): void {
  config.value = { ...DEFAULT_CONFIG }
  saveConfig(config.value)
}

/**
 * 获取单个配置项
 */
export function getConfigValue<K extends keyof VueScanConfig>(key: K): VueScanConfig[K] {
  return config.value[key]
}

/**
 * 设置单个配置项
 */
export function setConfigValue<K extends keyof VueScanConfig>(key: K, value: VueScanConfig[K]): void {
  config.value = {
    ...config.value,
    [key]: value,
  }
}

/**
 * 切换布尔配置项
 */
export function toggleConfigValue(key: keyof VueScanConfig): boolean {
  const current = config.value[key]
  if (typeof current !== 'boolean') {
    console.warn(`[vue-scan] Cannot toggle non-boolean config: ${key}`)
    return false
  }
  config.value = {
    ...config.value,
    [key]: !current,
  }
  return config.value[key] as boolean
}

// ============ 特定配置快捷方法 ============

/**
 * 切换启用状态
 */
export function toggleEnabled(): boolean {
  return toggleConfigValue('enabled')
}

/**
 * 切换音频通知
 */
export function toggleAudioNotificationsConfig(): boolean {
  return toggleConfigValue('audioNotifications')
}

/**
 * 切换面板显示
 */
export function toggleShowPanel(): boolean {
  return toggleConfigValue('showPanel')
}

/**
 * 设置面板位置
 */
export function setPanelPosition(position: VueScanConfig['panelPosition']): void {
  setConfigValue('panelPosition', position)
}

/**
 * 设置活动 Tab
 */
export function setActiveTab(tab: VueScanConfig['activeTab']): void {
  setConfigValue('activeTab', tab)
}

/**
 * 设置高亮颜色
 */
export function setHighlightColor(color: string): void {
  setConfigValue('highlightColor', color)
}

/**
 * 设置 FPS 警告阈值
 */
export function setFPSWarningThreshold(threshold: number): void {
  setConfigValue('fpsWarningThreshold', threshold)
}

/**
 * 导出配置为 JSON
 */
export function exportConfig(): string {
  return JSON.stringify(config.value, null, 2)
}

/**
 * 导入配置
 */
export function importConfig(jsonString: string): boolean {
  try {
    const imported = JSON.parse(jsonString)
    config.value = {
      ...DEFAULT_CONFIG,
      ...imported,
    }
    return true
  }
  catch (e) {
    console.warn('[vue-scan] Failed to import config:', e)
    return false
  }
}
