/**
 * 内存和性能监控模块
 * 用于收集页面性能指标
 */

export interface MemoryInfo {
  /** 已使用的 JS 堆内存大小 (MB) */
  usedJSHeapSize: number
  /** JS 堆内存总大小 (MB) */
  totalJSHeapSize: number
  /** JS 堆内存限制 (MB) */
  jsHeapSizeLimit: number
  /** 使用率百分比 */
  usagePercentage: number
}

export interface PerformanceMetrics {
  /** 内存信息 */
  memory: MemoryInfo | null
  /** DOM 节点数量 */
  domNodes: number
  /** 事件监听器数量（估算） */
  eventListeners: number
  /** 页面加载时间 (ms) */
  loadTime: number
  /** 首次内容绘制时间 (ms) */
  fcp: number | null
  /** 最大内容绘制时间 (ms) */
  lcp: number | null
  /** 首次输入延迟 (ms) */
  fid: number | null
  /** 累积布局偏移 */
  cls: number | null
  /** 时间戳 */
  timestamp: number
}

export interface PerformanceMonitorOptions {
  /** 更新间隔 (ms) */
  updateInterval?: number
  /** 更新回调 */
  onUpdate?: (metrics: PerformanceMetrics) => void
}

class PerformanceMonitor {
  private intervalId: number | null = null
  private updateInterval: number
  private onUpdate?: (metrics: PerformanceMetrics) => void
  private isRunning = false

  // Web Vitals 数据
  private fcpValue: number | null = null
  private lcpValue: number | null = null
  private fidValue: number | null = null
  private clsValue: number | null = null

  // 历史数据
  private memoryHistory: number[] = []
  private maxHistoryLength = 60

  constructor(options: PerformanceMonitorOptions = {}) {
    this.updateInterval = options.updateInterval ?? 1000
    this.onUpdate = options.onUpdate
    this.initWebVitals()
  }

  private initWebVitals(): void {
    // 监听 FCP
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.fcpValue = entry.startTime
          }
        }
      })
      observer.observe({ type: 'paint', buffered: true })
    }
    catch {
      // PerformanceObserver 不支持
    }

    // 监听 LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          this.lcpValue = lastEntry.startTime
        }
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    }
    catch {
      // LCP 不支持
    }

    // 监听 FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming
          if (fidEntry.processingStart) {
            this.fidValue = fidEntry.processingStart - entry.startTime
          }
        }
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
    }
    catch {
      // FID 不支持
    }

    // 监听 CLS
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as unknown as { hadRecentInput: boolean, value: number }
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value
            this.clsValue = clsValue
          }
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    }
    catch {
      // CLS 不支持
    }
  }

  start(): void {
    if (this.isRunning)
      return
    this.isRunning = true
    this.update()
    this.intervalId = window.setInterval(() => this.update(), this.updateInterval)
  }

  stop(): void {
    this.isRunning = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private update(): void {
    const metrics = this.getMetrics()

    // 记录内存历史
    if (metrics.memory) {
      this.memoryHistory.push(metrics.memory.usedJSHeapSize)
      if (this.memoryHistory.length > this.maxHistoryLength) {
        this.memoryHistory.shift()
      }
    }

    if (this.onUpdate) {
      this.onUpdate(metrics)
    }
  }

  getMetrics(): PerformanceMetrics {
    return {
      memory: this.getMemoryInfo(),
      domNodes: this.getDOMNodeCount(),
      eventListeners: this.estimateEventListeners(),
      loadTime: this.getLoadTime(),
      fcp: this.fcpValue,
      lcp: this.lcpValue,
      fid: this.fidValue,
      cls: this.clsValue,
      timestamp: Date.now(),
    }
  }

  private getMemoryInfo(): MemoryInfo | null {
    // @ts-expect-error - memory API 只在 Chrome 中可用
    const memory = performance.memory
    if (!memory)
      return null

    const usedJSHeapSize = memory.usedJSHeapSize / (1024 * 1024)
    const totalJSHeapSize = memory.totalJSHeapSize / (1024 * 1024)
    const jsHeapSizeLimit = memory.jsHeapSizeLimit / (1024 * 1024)

    return {
      usedJSHeapSize: Math.round(usedJSHeapSize * 100) / 100,
      totalJSHeapSize: Math.round(totalJSHeapSize * 100) / 100,
      jsHeapSizeLimit: Math.round(jsHeapSizeLimit * 100) / 100,
      usagePercentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100),
    }
  }

  private getDOMNodeCount(): number {
    return document.getElementsByTagName('*').length
  }

  private estimateEventListeners(): number {
    // 这是一个粗略的估算
    // 真正的事件监听器数量需要通过 Chrome DevTools 获取
    let count = 0
    const allElements = document.getElementsByTagName('*')
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i]
      // 检查常见的内联事件处理器
      const inlineEvents = [
        'onclick',
        'onmousedown',
        'onmouseup',
        'onmouseover',
        'onmouseout',
        'onmousemove',
        'onkeydown',
        'onkeyup',
        'onkeypress',
        'onfocus',
        'onblur',
        'onchange',
        'oninput',
        'onsubmit',
        'onscroll',
        'onload',
        'onerror',
      ]
      for (const event of inlineEvents) {
        if ((element as any)[event]) {
          count++
        }
      }
    }
    return count
  }

  private getLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      return Math.round(navigation.loadEventEnd - navigation.startTime)
    }
    return 0
  }

  getMemoryHistory(): number[] {
    return [...this.memoryHistory]
  }

  reset(): void {
    this.memoryHistory = []
    this.fcpValue = null
    this.lcpValue = null
    this.fidValue = null
    this.clsValue = null
  }

  destroy(): void {
    this.stop()
    this.reset()
    this.onUpdate = undefined
  }
}

// 单例模式
let performanceMonitor: PerformanceMonitor | null = null

export function initPerformanceMonitor(options?: PerformanceMonitorOptions): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(options)
  }
  return performanceMonitor
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor
}

export function destroyPerformanceMonitor(): void {
  if (performanceMonitor) {
    performanceMonitor.destroy()
    performanceMonitor = null
  }
}

export { PerformanceMonitor }
