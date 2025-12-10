export interface VueScanBaseOptions {
  enable?: boolean
  hideComponentName?: boolean
  interval?: number
  enablePanel?: boolean // 添加面板开关选项
  /** 启用 FPS 监控 */
  enableFPS?: boolean
  /** 启用性能监控 */
  enablePerformance?: boolean
  /** FPS 低于此值时显示警告 */
  fpsWarningThreshold?: number
  /** 性能数据更新间隔 (ms) */
  performanceUpdateInterval?: number
}

export type VueScanOptions = [
  VueScanBaseOptions | undefined,
]
