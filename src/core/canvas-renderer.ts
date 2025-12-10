/**
 * Canvas 渲染器 - 使用 Canvas 实现丝滑的高亮效果
 * 模仿 react-scan 的 overlay 实现
 */

export interface HighlightRect {
  x: number
  y: number
  width: number
  height: number
  name: string
  renderCount: number
  renderTime?: number
}

interface ActiveHighlight {
  rect: HighlightRect
  alpha: number
  targetAlpha: number
  startTime: number
  color: string
}

class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private dpr: number = 1
  private rafId: number | null = null
  private activeHighlights: Map<string, ActiveHighlight> = new Map()
  private isRunning = false

  // 动画配置
  private readonly FADE_IN_SPEED = 0.15
  private readonly FADE_OUT_SPEED = 0.08
  private readonly HIGHLIGHT_DURATION = 1500 // ms
  private readonly COLORS = {
    normal: 'rgba(66, 184, 131, 0.8)', // Vue green
    warning: 'rgba(255, 217, 61, 0.8)', // Yellow
    critical: 'rgba(255, 107, 107, 0.8)', // Red
  }

  constructor() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
  }

  init(): void {
    if (this.canvas) 
return

    this.canvas = document.createElement('canvas')
    this.canvas.id = 'vue-scan-highlight-canvas'
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483646;
    `

    this.ctx = this.canvas.getContext('2d')!
    this.updateCanvasSize()

    document.body.appendChild(this.canvas)

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('scroll', this.handleScroll)

    this.start()
  }

  private updateCanvasSize(): void {
    if (!this.canvas) 
return

    const width = window.innerWidth
    const height = window.innerHeight

    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr)
    }
  }

  private handleResize = (): void => {
    this.updateCanvasSize()
  }

  private handleScroll = (): void => {
    // 滚动时需要更新高亮位置
    // 这里可以实现更精细的位置更新逻辑
  }

  start(): void {
    if (this.isRunning) 
return
    this.isRunning = true
    this.render()
  }

  stop(): void {
    this.isRunning = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  highlight(id: string, rect: HighlightRect): void {
    const renderCount = rect.renderCount
    let color = this.COLORS.normal

    // 根据渲染次数选择颜色
    if (renderCount > 10) {
      color = this.COLORS.critical
    }
 else if (renderCount > 5) {
      color = this.COLORS.warning
    }

    const existing = this.activeHighlights.get(id)

    if (existing) {
      // 更新现有高亮
      existing.rect = rect
      existing.targetAlpha = 1
      existing.startTime = performance.now()
      existing.color = color
    }
 else {
      // 创建新高亮
      this.activeHighlights.set(id, {
        rect,
        alpha: 0,
        targetAlpha: 1,
        startTime: performance.now(),
        color,
      })
    }
  }

  clearHighlight(id: string): void {
    const highlight = this.activeHighlights.get(id)
    if (highlight) {
      highlight.targetAlpha = 0
    }
  }

  clearAll(): void {
    this.activeHighlights.forEach((highlight) => {
      highlight.targetAlpha = 0
    })
  }

  private render = (): void => {
    if (!this.isRunning) 
return

    this.draw()
    this.rafId = requestAnimationFrame(this.render)
  }

  private draw(): void {
    const ctx = this.ctx
    const canvas = this.canvas
    if (!ctx || !canvas) 
return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width / this.dpr, canvas.height / this.dpr)

    const now = performance.now()
    const toRemove: string[] = []

    this.activeHighlights.forEach((highlight, id) => {
      // 计算 alpha 过渡
      if (highlight.alpha < highlight.targetAlpha) {
        highlight.alpha = Math.min(
          highlight.alpha + this.FADE_IN_SPEED,
          highlight.targetAlpha,
        )
      }
 else if (highlight.alpha > highlight.targetAlpha) {
        highlight.alpha = Math.max(
          highlight.alpha - this.FADE_OUT_SPEED,
          highlight.targetAlpha,
        )
      }

      // 检查是否应该开始淡出
      if (
        highlight.targetAlpha === 1
        && now - highlight.startTime > this.HIGHLIGHT_DURATION
      ) {
        highlight.targetAlpha = 0
      }

      // 如果完全透明，标记删除
      if (highlight.alpha <= 0.01 && highlight.targetAlpha === 0) {
        toRemove.push(id)
        return
      }

      // 绘制高亮
      this.drawHighlight(ctx, highlight)
    })

    // 移除已完成的高亮
    toRemove.forEach(id => this.activeHighlights.delete(id))
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, highlight: ActiveHighlight): void {
    const { rect, alpha, color } = highlight
    const { x, y, width, height, name, renderCount, renderTime } = rect

    // 绘制边框
    ctx.save()
    ctx.globalAlpha = alpha

    // 外边框 - 发光效果
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.strokeRect(x, y, width, height)

    // 内部填充 - 半透明
    ctx.shadowBlur = 0
    const fillColor = color.replace('0.8', `${0.1 * alpha}`)
    ctx.fillStyle = fillColor
    ctx.fillRect(x, y, width, height)

    // 绘制标签
    if (name && alpha > 0.5) {
      this.drawLabel(ctx, x, y, name, renderCount, renderTime, color, alpha)
    }

    ctx.restore()
  }

  private drawLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    name: string,
    count: number,
    time: number | undefined,
    color: string,
    alpha: number,
  ): void {
    const timeText = time ? ` ${time.toFixed(1)}ms` : ''
    const text = `${name} ×${count}${timeText}`

    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
    const metrics = ctx.measureText(text)
    const padding = 4
    const labelWidth = metrics.width + padding * 2
    const labelHeight = 18

    // 标签背景
    const labelX = x
    const labelY = y - labelHeight - 4

    ctx.fillStyle = color.replace('0.8', `${0.95 * alpha}`)
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 3)
    ctx.fill()

    // 标签文字
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fillText(text, labelX + padding, labelY + labelHeight - 5)
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('scroll', this.handleScroll)

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    this.canvas = null
    this.ctx = null
    this.activeHighlights.clear()
  }
}

// 单例
let canvasRenderer: CanvasRenderer | null = null

export function initCanvasRenderer(): CanvasRenderer {
  if (!canvasRenderer) {
    canvasRenderer = new CanvasRenderer()
    canvasRenderer.init()
  }
  return canvasRenderer
}

export function getCanvasRenderer(): CanvasRenderer | null {
  return canvasRenderer
}

export function destroyCanvasRenderer(): void {
  if (canvasRenderer) {
    canvasRenderer.destroy()
    canvasRenderer = null
  }
}

export { CanvasRenderer }
