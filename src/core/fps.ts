/**
 * FPS 监控模块
 * 用于实时监测页面帧率并提供性能分析
 */

export interface FPSData {
  current: number
  average: number
  min: number
  max: number
  samples: number[]
  timestamp: number
}

export interface FPSMonitorOptions {
  /** 采样大小，用于计算平均值 */
  sampleSize?: number
  /** 低 FPS 警告阈值 */
  warningThreshold?: number
  /** FPS 更新回调 */
  onUpdate?: (data: FPSData) => void
}

class FPSMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 0
  private samples: number[] = []
  private sampleSize: number
  private warningThreshold: number
  private rafId: number | null = null
  private isRunning = false
  private onUpdate?: (data: FPSData) => void

  // 历史数据用于绘制图表
  private history: number[] = []
  private maxHistoryLength = 60 // 保存60个数据点

  constructor(options: FPSMonitorOptions = {}) {
    this.sampleSize = options.sampleSize ?? 60
    this.warningThreshold = options.warningThreshold ?? 30
    this.onUpdate = options.onUpdate
  }

  start(): void {
    if (this.isRunning)
      return
    this.isRunning = true
    this.lastTime = performance.now()
    this.frameCount = 0
    this.loop()
  }

  stop(): void {
    this.isRunning = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private loop = (): void => {
    if (!this.isRunning)
      return

    this.frameCount++
    const currentTime = performance.now()
    const elapsed = currentTime - this.lastTime

    // 每秒更新一次 FPS
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed)
      this.samples.push(this.fps)

      // 限制采样数组大小
      if (this.samples.length > this.sampleSize) {
        this.samples.shift()
      }

      // 更新历史数据
      this.history.push(this.fps)
      if (this.history.length > this.maxHistoryLength) {
        this.history.shift()
      }

      // 触发更新回调
      if (this.onUpdate) {
        this.onUpdate(this.getData())
      }

      this.frameCount = 0
      this.lastTime = currentTime
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  getData(): FPSData {
    const validSamples = this.samples.filter(s => s > 0)
    return {
      current: this.fps,
      average: validSamples.length
        ? Math.round(validSamples.reduce((a, b) => a + b, 0) / validSamples.length)
        : 0,
      min: validSamples.length ? Math.min(...validSamples) : 0,
      max: validSamples.length ? Math.max(...validSamples) : 0,
      samples: [...this.samples],
      timestamp: Date.now(),
    }
  }

  getHistory(): number[] {
    return [...this.history]
  }

  isWarning(): boolean {
    return this.fps < this.warningThreshold && this.fps > 0
  }

  getWarningThreshold(): number {
    return this.warningThreshold
  }

  setWarningThreshold(threshold: number): void {
    this.warningThreshold = threshold
  }

  reset(): void {
    this.samples = []
    this.history = []
    this.fps = 0
    this.frameCount = 0
    this.lastTime = performance.now()
  }

  destroy(): void {
    this.stop()
    this.reset()
    this.onUpdate = undefined
  }
}

// 单例模式
let fpsMonitor: FPSMonitor | null = null

export function initFPSMonitor(options?: FPSMonitorOptions): FPSMonitor {
  if (!fpsMonitor) {
    fpsMonitor = new FPSMonitor(options)
  }
  return fpsMonitor
}

export function getFPSMonitor(): FPSMonitor | null {
  return fpsMonitor
}

export function destroyFPSMonitor(): void {
  if (fpsMonitor) {
    fpsMonitor.destroy()
    fpsMonitor = null
  }
}

export { FPSMonitor }
