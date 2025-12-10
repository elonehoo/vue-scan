/**
 * Vue Scan 启动选项
 */
export interface VueScanBaseOptions {
  /** 是否启用 Vue Scan */
  enable?: boolean
  /** 是否隐藏组件名称 */
  hideComponentName?: boolean
  /** 高亮动画间隔 (ms) */
  interval?: number
  /** 是否启用 Widget 面板 */
  enablePanel?: boolean
  /** 启用 FPS 监控 */
  enableFPS?: boolean
  /** 启用性能监控 */
  enablePerformance?: boolean
  /** FPS 低于此值时显示警告 */
  fpsWarningThreshold?: number
  /** 性能数据更新间隔 (ms) */
  performanceUpdateInterval?: number
  /** 启用音频告警 */
  audioNotifications?: boolean
  /** 面板初始位置 */
  panelPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** 高亮颜色 */
  highlightColor?: string
  /** 高亮透明度 */
  highlightOpacity?: number
  /** 渲染时间警告阈值 (ms) */
  renderTimeWarningThreshold?: number
  /** 是否显示渲染次数 */
  showRenderCount?: boolean
  /** 是否显示渲染时间 */
  showRenderTime?: boolean
  /** 渲染回调 */
  onRender?: (componentName: string, renderTime: number) => void
  /** 慢渲染回调 */
  onSlowRender?: (componentName: string, renderTime: number) => void
  /** 是否在生产环境强制启用 */
  dangerouslyForceRunInProduction?: boolean
}

export type VueScanOptions = [
  VueScanBaseOptions | undefined,
]

/**
 * Vue Scan API 接口
 */
export interface VueScanAPI {
  /** 启用/禁用扫描 */
  setEnabled: (enabled: boolean) => void
  /** 获取当前启用状态 */
  isEnabled: () => boolean
  /** 显示/隐藏面板 */
  showPanel: (show: boolean) => void
  /** 切换面板显示 */
  togglePanel: () => boolean
  /** 暂停扫描 */
  pause: () => void
  /** 恢复扫描 */
  resume: () => void
  /** 获取渲染统计 */
  getStats: () => RenderStats
  /** 清除渲染数据 */
  clear: () => void
  /** 销毁 Vue Scan */
  destroy: () => void
}

/**
 * 渲染统计数据
 */
export interface RenderStats {
  /** 总渲染次数 */
  totalRenders: number
  /** 总渲染时间 (ms) */
  totalTime: number
  /** 平均渲染时间 (ms) */
  averageTime: number
  /** 最大渲染时间 (ms) */
  maxTime: number
  /** 组件数量 */
  componentCount: number
  /** 当前 FPS */
  currentFPS: number
  /** 慢渲染次数 */
  slowRenderCount: number
}
