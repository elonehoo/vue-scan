/**
 * Canvas 渲染器 - 使用 Canvas 实现丝滑的高亮效果
 * 完全模仿 react-scan 的 new-outlines 实现
 */

// ===== 类型定义 =====
export interface OutlineData {
  id: string
  name: string
  count: number
  x: number
  y: number
  width: number
  height: number
  renderTime?: number
  didCommit: boolean
}

export interface ActiveOutline {
  id: string
  name: string
  count: number
  x: number
  y: number
  width: number
  height: number
  targetX: number
  targetY: number
  targetWidth: number
  targetHeight: number
  frame: number
  renderTime?: number
  didCommit: boolean
}

export interface HighlightRect {
  x: number
  y: number
  width: number
  height: number
  name: string
  renderCount: number
  renderTime?: number
}

// ===== 常量配置 =====
const MONO_FONT = 'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace'
const INTERPOLATION_SPEED = 0.15
const MAX_PARTS_LENGTH = 4
const MAX_LABEL_LENGTH = 40
const TOTAL_FRAMES = 45

// 主题色 (react-scan 紫色 #8e61e3)
const PRIMARY_COLOR = '142,97,227'

// ===== 工具函数 =====
function lerp(start: number, end: number): number {
  return Math.floor(start + (end - start) * INTERPOLATION_SPEED)
}

function sortEntry(prev: [number, string[]], next: [number, string[]]): number {
  return next[0] - prev[0]
}

function getSortedEntries(countByNames: Map<number, string[]>): [number, string[]][] {
  const entries = [...countByNames.entries()]
  return entries.sort(sortEntry)
}

function getLabelTextPart([count, names]: [number, string[]]): string {
  let part = `${names.slice(0, MAX_PARTS_LENGTH).join(', ')} ×${count}`
  if (part.length > MAX_LABEL_LENGTH) {
    part = `${part.slice(0, MAX_LABEL_LENGTH)}…`
  }
  return part
}

/**
 * 生成标签文本 - 将同位置的多个组件合并显示
 */
export function getLabelText(outlines: ActiveOutline[]): string {
  const nameByCount = new Map<string, number>()
  for (const { name, count } of outlines) {
    nameByCount.set(name, (nameByCount.get(name) || 0) + count)
  }

  const countByNames = new Map<number, string[]>()
  for (const [name, count] of nameByCount) {
    const names = countByNames.get(count)
    if (names) {
      names.push(name)
    }
    else {
      countByNames.set(count, [name])
    }
  }

  const partsEntries = getSortedEntries(countByNames)
  if (partsEntries.length === 0)
    return ''

  let labelText = getLabelTextPart(partsEntries[0])
  for (let i = 1, len = partsEntries.length; i < len; i++) {
    labelText += `, ${getLabelTextPart(partsEntries[i])}`
  }

  if (labelText.length > MAX_LABEL_LENGTH) {
    return `${labelText.slice(0, MAX_LABEL_LENGTH)}…`
  }

  return labelText
}

/**
 * 更新 outlines 数据
 */
export function updateOutlines(
  activeOutlines: Map<string, ActiveOutline>,
  outlines: OutlineData[],
): void {
  for (const { id, name, count, x, y, width, height, renderTime, didCommit } of outlines) {
    const outline: ActiveOutline = {
      id,
      name,
      count,
      x,
      y,
      width,
      height,
      frame: 0,
      targetX: x,
      targetY: y,
      targetWidth: width,
      targetHeight: height,
      renderTime,
      didCommit,
    }

    const existingOutline = activeOutlines.get(id)
    if (existingOutline) {
      existingOutline.count++
      existingOutline.frame = 0
      existingOutline.targetX = x
      existingOutline.targetY = y
      existingOutline.targetWidth = width
      existingOutline.targetHeight = height
      existingOutline.renderTime = renderTime
      existingOutline.didCommit = didCommit
    }
    else {
      activeOutlines.set(id, outline)
    }
  }
}

/**
 * 更新滚动位置
 */
export function updateScroll(
  activeOutlines: Map<string, ActiveOutline>,
  deltaX: number,
  deltaY: number,
): void {
  for (const outline of activeOutlines.values()) {
    const newX = outline.x - deltaX
    const newY = outline.y - deltaY
    outline.x = newX
    outline.y = newY
    outline.targetX = newX
    outline.targetY = newY
  }
}

/**
 * 绘制 Canvas
 */
export function drawCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dpr: number,
  activeOutlines: Map<string, ActiveOutline>,
): boolean {
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

  // 按位置分组
  const groupedOutlinesMap = new Map<string, ActiveOutline[]>()
  const rectMap = new Map<string, {
    x: number
    y: number
    width: number
    height: number
    alpha: number
  }>()

  const toRemove: string[] = []

  for (const outline of activeOutlines.values()) {
    const {
      x,
      y,
      width,
      height,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
      frame,
    } = outline

    // 位置插值
    if (targetX !== x) {
      outline.x = lerp(x, targetX)
    }
    if (targetY !== y) {
      outline.y = lerp(y, targetY)
    }
    if (targetWidth !== width) {
      outline.width = lerp(width, targetWidth)
    }
    if (targetHeight !== height) {
      outline.height = lerp(height, targetHeight)
    }

    // 计算 alpha 和帧数
    const alpha = 1 - frame / TOTAL_FRAMES
    outline.frame++

    // 如果动画结束，标记删除
    if (frame >= TOTAL_FRAMES) {
      toRemove.push(outline.id)
      continue
    }

    // 分组 key
    const labelKey = `${outline.x},${outline.y}`
    const rectKey = `${labelKey},${outline.width},${outline.height}`

    const outlines = groupedOutlinesMap.get(labelKey)
    if (outlines) {
      outlines.push(outline)
    }
    else {
      groupedOutlinesMap.set(labelKey, [outline])
    }

    const rect = rectMap.get(rectKey) || {
      x: outline.x,
      y: outline.y,
      width: outline.width,
      height: outline.height,
      alpha,
    }
    if (alpha > rect.alpha) {
      rect.alpha = alpha
    }
    rectMap.set(rectKey, rect)
  }

  // 删除过期的 outlines
  for (const id of toRemove) {
    activeOutlines.delete(id)
  }

  // 绘制矩形
  for (const { x, y, width, height, alpha } of rectMap.values()) {
    ctx.strokeStyle = `rgba(${PRIMARY_COLOR},${alpha})`
    ctx.lineWidth = 1.5

    // 发光效果
    ctx.shadowColor = `rgba(${PRIMARY_COLOR},${alpha * 0.5})`
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.stroke()

    // 内部填充
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgba(${PRIMARY_COLOR},${alpha * 0.1})`
    ctx.fill()
  }

  // 绘制标签
  ctx.font = `11px ${MONO_FONT}`

  const labelMap = new Map<string, {
    text: string
    width: number
    height: number
    alpha: number
    x: number
    y: number
    outlines: ActiveOutline[]
  }>()

  for (const outlines of groupedOutlinesMap.values()) {
    const first = outlines[0]
    const { x, y, frame } = first
    const alpha = 1 - frame / TOTAL_FRAMES
    const text = getLabelText(outlines)
    const { width: textWidth } = ctx.measureText(text)
    const height = 14

    const labelKey = `${x},${y}`
    const existing = labelMap.get(labelKey)

    if (!existing || alpha > existing.alpha) {
      labelMap.set(labelKey, {
        text,
        width: textWidth + 8,
        height,
        alpha,
        x,
        y,
        outlines,
      })
    }
  }

  // 绘制标签背景和文字
  for (const { text, width, height, alpha, x, y } of labelMap.values()) {
    if (alpha < 0.3)
      continue

    const labelX = x
    const labelY = y - height - 4

    // 确保标签在视口内
    const adjustedX = Math.max(0, Math.min(labelX, canvas.width / dpr - width))
    const adjustedY = Math.max(height + 4, labelY)

    // 背景
    ctx.fillStyle = `rgba(${PRIMARY_COLOR},${alpha * 0.95})`
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(adjustedX, adjustedY, width, height, 3)
    }
    else {
      ctx.rect(adjustedX, adjustedY, width, height)
    }
    ctx.fill()

    // 文字
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillText(text, adjustedX + 4, adjustedY + height - 3)
  }

  return activeOutlines.size > 0
}

// ===== Canvas 渲染器类 =====
class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private dpr: number = 1
  private rafId: number | null = null
  private activeOutlines: Map<string, ActiveOutline> = new Map()
  private isRunning = false
  private prevScrollX = 0
  private prevScrollY = 0
  private isScrollScheduled = false

  constructor() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
  }

  init(): void {
    if (this.canvas)
      return

    // 创建 Shadow DOM 隔离样式
    const host = document.createElement('div')
    host.setAttribute('data-vue-scan-canvas', 'true')
    const shadowRoot = host.attachShadow({ mode: 'open' })

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

    const ctx = this.canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      console.error('[vue-scan] Failed to get canvas context')
      return
    }
    this.ctx = ctx
    this.updateCanvasSize()

    shadowRoot.appendChild(this.canvas)
    document.documentElement.appendChild(host)

    // 记录初始滚动位置
    this.prevScrollX = window.scrollX
    this.prevScrollY = window.scrollY

    // 监听事件
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('scroll', this.handleScroll, { passive: true })

    this.start()
  }

  private updateCanvasSize(): void {
    if (!this.canvas || !this.ctx)
      return

    const width = window.innerWidth
    const height = window.innerHeight

    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    this.ctx.resetTransform()
    this.ctx.scale(this.dpr, this.dpr)
  }

  private handleResize = (): void => {
    this.updateCanvasSize()
  }

  private handleScroll = (): void => {
    if (this.isScrollScheduled)
      return

    this.isScrollScheduled = true

    // 延迟处理滚动以合并多次滚动事件
    setTimeout(() => {
      const { scrollX, scrollY } = window
      const deltaX = scrollX - this.prevScrollX
      const deltaY = scrollY - this.prevScrollY
      this.prevScrollX = scrollX
      this.prevScrollY = scrollY

      updateScroll(this.activeOutlines, deltaX, deltaY)
      this.isScrollScheduled = false
    }, 32) // ~2 帧
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

  /**
   * 高亮一个组件
   */
  highlight(id: string, rect: HighlightRect): void {
    const outlineData: OutlineData = {
      id,
      name: rect.name,
      count: rect.renderCount,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      renderTime: rect.renderTime,
      didCommit: true,
    }

    updateOutlines(this.activeOutlines, [outlineData])
  }

  /**
   * 清除指定高亮
   */
  clearHighlight(id: string): void {
    const outline = this.activeOutlines.get(id)
    if (outline) {
      // 加速淡出
      outline.frame = Math.max(outline.frame, TOTAL_FRAMES - 10)
    }
  }

  /**
   * 清除所有高亮
   */
  clearAll(): void {
    for (const outline of this.activeOutlines.values()) {
      outline.frame = TOTAL_FRAMES - 10
    }
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

    drawCanvas(ctx, canvas, this.dpr, this.activeOutlines)
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('scroll', this.handleScroll)

    const host = document.querySelector('[data-vue-scan-canvas]')
    if (host) {
      host.remove()
    }

    this.canvas = null
    this.ctx = null
    this.activeOutlines.clear()
  }

  /**
   * 获取活动的 outlines 数量
   */
  getActiveCount(): number {
    return this.activeOutlines.size
  }
}

// ===== 单例管理 =====
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
