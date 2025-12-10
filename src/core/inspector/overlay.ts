/**
 * Inspector Overlay - 悬停和选中时的覆盖层
 */

import type { InspectorRect, InspectorState } from './types'
import { inspectorStore } from './state'
import { findComponentElement, getComponentFromElement, getComponentInfo, getElementFromPoint, getElementRect, isVisualElement, throttle } from './utils'

// 常量配置 - react-scan 风格
const ANIMATION_SPEED = 0.15
const MONO_FONT = 'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace'
const INSPECTOR_COLOR = '142,97,227' // react-scan 紫色 #8e61e3
const FOCUS_COLOR = '142,97,227' // 选中时也使用紫色

interface AnimatedRect extends InspectorRect {
  targetX: number
  targetY: number
  targetWidth: number
  targetHeight: number
  alpha: number
}

function lerp(start: number, end: number): number {
  return start + (end - start) * ANIMATION_SPEED
}

class InspectorOverlay {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private eventCatcher: HTMLDivElement | null = null
  private dpr: number = 1
  private rafId: number | null = null
  private isRunning = false
  private isInitialized = false
  private isInspectActive = false
  private unsubscribeState: (() => void) | null = null

  private currentRect: AnimatedRect | null = null
  private focusedRect: AnimatedRect | null = null
  private hoveredElement: Element | null = null
  private componentName: string = ''
  private isFadingOut = false

  constructor() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
  }

  init(): void {
    if (this.isInitialized)
      return
    this.isInitialized = true

    // 创建 Shadow DOM 容器
    const host = document.createElement('div')
    host.setAttribute('data-vue-scan-inspector', 'true')
    const shadowRoot = host.attachShadow({ mode: 'open' })

    // 创建 Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 0.15s ease;
    `

    // 创建事件捕获层
    this.eventCatcher = document.createElement('div')
    this.eventCatcher.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      cursor: crosshair;
      pointer-events: none;
    `

    const ctx = this.canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      console.error('[vue-scan] Failed to get inspector canvas context')
      return
    }
    this.ctx = ctx
    this.updateCanvasSize()

    shadowRoot.appendChild(this.canvas)
    shadowRoot.appendChild(this.eventCatcher)
    document.documentElement.appendChild(host)

    // 绑定事件
    this.bindEvents()

    // 监听状态变化（只订阅一次）
    this.unsubscribeState = inspectorStore.subscribeState(this.handleStateChange)
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

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize)

    if (this.eventCatcher) {
      this.eventCatcher.addEventListener('pointermove', this.handlePointerMove)
      this.eventCatcher.addEventListener('click', this.handleClick)
      this.eventCatcher.addEventListener('keydown', this.handleKeyDown)
    }

    // 全局按键监听
    window.addEventListener('keydown', this.handleGlobalKeyDown)
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.handleResize)

    if (this.eventCatcher) {
      this.eventCatcher.removeEventListener('pointermove', this.handlePointerMove)
      this.eventCatcher.removeEventListener('click', this.handleClick)
      this.eventCatcher.removeEventListener('keydown', this.handleKeyDown)
    }

    window.removeEventListener('keydown', this.handleGlobalKeyDown)
  }

  private handleResize = (): void => {
    this.updateCanvasSize()
  }

  private handlePointerMove = throttle((e: PointerEvent) => {
    const state = inspectorStore.state
    if (state.kind !== 'inspecting')
      return

    const element = getElementFromPoint(e.clientX, e.clientY)
    if (!element || element === this.hoveredElement)
      return

    this.hoveredElement = element
    const componentElement = findComponentElement(element)

    if (componentElement && isVisualElement(componentElement)) {
      const instance = getComponentFromElement(componentElement)
      if (instance) {
        const info = getComponentInfo(instance)
        this.componentName = info.name

        const rect = getElementRect(componentElement)
        this.updateRect(rect)

        // 不需要每次都更新状态，只在内部跟踪悬停的元素
      }
    }
    else {
      this.startFadeOut()
    }
  }, 16)

  private handleClick = (e: MouseEvent): void => {
    const state = inspectorStore.state
    if (state.kind !== 'inspecting')
      return

    e.preventDefault()
    e.stopPropagation()

    const element = getElementFromPoint(e.clientX, e.clientY)
    if (!element)
      return

    const componentElement = findComponentElement(element)
    if (!componentElement)
      return

    const instance = getComponentFromElement(componentElement)
    if (!instance)
      return

    // 设置选中状态
    inspectorStore.state = {
      kind: 'focused',
      focusedElement: componentElement,
      componentInstance: instance,
    }

    // 设置选中的组件信息
    const info = getComponentInfo(instance)
    inspectorStore.selectedComponent = info
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      // 直接设置状态，不调用 stopInspecting 避免循环
      if (inspectorStore.state.kind !== 'inspect-off') {
        inspectorStore.state = { kind: 'inspect-off' }
      }
    }
  }

  private handleGlobalKeyDown = (_e: KeyboardEvent): void => {
    // 可以添加快捷键支持，如 Option+Click 启动 Inspector
  }

  private handleStateChange = (state: InspectorState): void => {
    switch (state.kind) {
      case 'inspect-off':
        this.handleInspectOff()
        break
      case 'inspecting':
        // 只有当前没在检查时才启动
        if (!this.isInspectActive) {
          this.isInspectActive = true
          this.startInspecting()
        }
        break
      case 'focused':
        this.isInspectActive = false
        this.focusElement(state.focusedElement)
        break
    }
  }

  private updateRect(rect: InspectorRect): void {
    if (!this.currentRect) {
      this.currentRect = {
        ...rect,
        targetX: rect.x,
        targetY: rect.y,
        targetWidth: rect.width,
        targetHeight: rect.height,
        alpha: 0,
      }
    }
    else {
      this.currentRect.targetX = rect.x
      this.currentRect.targetY = rect.y
      this.currentRect.targetWidth = rect.width
      this.currentRect.targetHeight = rect.height
    }

    this.isFadingOut = false
    this.startAnimation()
  }

  /**
   * 内部处理 inspect-off 状态（不触发状态变更）
   */
  private handleInspectOff(): void {
    this.isInspectActive = false
    if (this.eventCatcher) {
      this.eventCatcher.style.pointerEvents = 'none'
    }
    this.startFadeOut()
  }

  startInspecting(): void {
    if (this.canvas) {
      this.canvas.style.opacity = '1'
    }
    if (this.eventCatcher) {
      this.eventCatcher.style.pointerEvents = 'auto'
    }
    this.startAnimation()
  }

  /**
   * 停止检查（会触发状态变更）
   */
  stopInspecting(): void {
    // 只有当前不是 inspect-off 状态时才更新
    if (inspectorStore.state.kind !== 'inspect-off') {
      inspectorStore.state = { kind: 'inspect-off' }
    }
  }

  private focusElement(element: Element): void {
    const rect = getElementRect(element)
    const instance = getComponentFromElement(element)

    if (instance) {
      const info = getComponentInfo(instance)
      this.componentName = info.name
    }

    this.focusedRect = {
      ...rect,
      targetX: rect.x,
      targetY: rect.y,
      targetWidth: rect.width,
      targetHeight: rect.height,
      alpha: 1,
    }

    // 停止悬停捕获
    if (this.eventCatcher) {
      this.eventCatcher.style.pointerEvents = 'none'
    }

    this.startAnimation()
  }

  private startFadeOut(): void {
    this.isFadingOut = true
    this.startAnimation()
  }

  private startAnimation(): void {
    if (this.isRunning)
      return
    this.isRunning = true
    this.render()
  }

  private stopAnimation(): void {
    this.isRunning = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
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

    ctx.clearRect(0, 0, canvas.width / this.dpr, canvas.height / this.dpr)

    let hasActiveAnimation = false

    // 绘制悬停矩形
    if (this.currentRect) {
      const rect = this.currentRect

      // 位置插值
      if (Math.abs(rect.x - rect.targetX) > 0.5) {
        rect.x = lerp(rect.x, rect.targetX)
        hasActiveAnimation = true
      }
      else {
        rect.x = rect.targetX
      }

      if (Math.abs(rect.y - rect.targetY) > 0.5) {
        rect.y = lerp(rect.y, rect.targetY)
        hasActiveAnimation = true
      }
      else {
        rect.y = rect.targetY
      }

      if (Math.abs(rect.width - rect.targetWidth) > 0.5) {
        rect.width = lerp(rect.width, rect.targetWidth)
        hasActiveAnimation = true
      }
      else {
        rect.width = rect.targetWidth
      }

      if (Math.abs(rect.height - rect.targetHeight) > 0.5) {
        rect.height = lerp(rect.height, rect.targetHeight)
        hasActiveAnimation = true
      }
      else {
        rect.height = rect.targetHeight
      }

      // 透明度动画
      if (this.isFadingOut) {
        if (rect.alpha > 0.01) {
          rect.alpha = lerp(rect.alpha, 0)
          hasActiveAnimation = true
        }
        else {
          rect.alpha = 0
          this.currentRect = null
          if (this.canvas) {
            this.canvas.style.opacity = '0'
          }
        }
      }
      else {
        if (rect.alpha < 0.99) {
          rect.alpha = lerp(rect.alpha, 1)
          hasActiveAnimation = true
        }
        else {
          rect.alpha = 1
        }
      }

      if (rect.alpha > 0) {
        this.drawRect(ctx, rect, INSPECTOR_COLOR, this.componentName)
      }
    }

    // 绘制选中矩形
    if (this.focusedRect) {
      const rect = this.focusedRect
      const state = inspectorStore.state

      if (state.kind === 'focused') {
        // 更新位置（组件可能移动）
        const element = state.focusedElement
        if (element && element.isConnected) {
          const newRect = getElementRect(element)
          rect.targetX = newRect.x
          rect.targetY = newRect.y
          rect.targetWidth = newRect.width
          rect.targetHeight = newRect.height
        }

        // 位置插值
        if (Math.abs(rect.x - rect.targetX) > 0.5) {
          rect.x = lerp(rect.x, rect.targetX)
          hasActiveAnimation = true
        }
        else {
          rect.x = rect.targetX
        }

        if (Math.abs(rect.y - rect.targetY) > 0.5) {
          rect.y = lerp(rect.y, rect.targetY)
          hasActiveAnimation = true
        }
        else {
          rect.y = rect.targetY
        }

        if (Math.abs(rect.width - rect.targetWidth) > 0.5) {
          rect.width = lerp(rect.width, rect.targetWidth)
          hasActiveAnimation = true
        }
        else {
          rect.width = rect.targetWidth
        }

        if (Math.abs(rect.height - rect.targetHeight) > 0.5) {
          rect.height = lerp(rect.height, rect.targetHeight)
          hasActiveAnimation = true
        }
        else {
          rect.height = rect.targetHeight
        }

        this.drawRect(ctx, rect, FOCUS_COLOR, this.componentName, true)
      }
      else {
        this.focusedRect = null
      }
    }

    if (!hasActiveAnimation && !this.isFadingOut) {
      // 保持运行以响应变化，但降低帧率
    }
  }

  private drawRect(
    ctx: CanvasRenderingContext2D,
    rect: AnimatedRect,
    color: string,
    name: string,
    isFocused = false,
  ): void {
    const { x, y, width, height, alpha } = rect

    // 边框
    ctx.strokeStyle = `rgba(${color},${alpha})`
    ctx.lineWidth = isFocused ? 2 : 1.5
    ctx.shadowColor = `rgba(${color},${alpha * 0.5})`
    ctx.shadowBlur = isFocused ? 12 : 8

    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.stroke()

    // 填充
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgba(${color},${alpha * 0.1})`
    ctx.fill()

    // 标签
    if (name && alpha > 0.3) {
      this.drawLabel(ctx, x, y, name, color, alpha, isFocused)
    }
  }

  private drawLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    name: string,
    color: string,
    alpha: number,
    isFocused: boolean,
  ): void {
    ctx.font = `11px ${MONO_FONT}`
    const text = isFocused ? `${name} (selected)` : name
    const metrics = ctx.measureText(text)
    const padding = 4
    const labelWidth = metrics.width + padding * 2
    const labelHeight = 16

    const labelX = x
    const labelY = y - labelHeight - 4

    // 确保标签在视口内
    const adjustedX = Math.max(0, Math.min(labelX, window.innerWidth - labelWidth))
    const adjustedY = Math.max(labelHeight + 4, labelY)

    // 背景
    ctx.fillStyle = `rgba(${color},${alpha * 0.95})`
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(adjustedX, adjustedY, labelWidth, labelHeight, 3)
    }
    else {
      ctx.rect(adjustedX, adjustedY, labelWidth, labelHeight)
    }
    ctx.fill()

    // 文字
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillText(text, adjustedX + padding, adjustedY + labelHeight - 4)
  }

  destroy(): void {
    this.stopAnimation()
    this.unbindEvents()

    // 取消状态订阅
    if (this.unsubscribeState) {
      this.unsubscribeState()
      this.unsubscribeState = null
    }

    const host = document.querySelector('[data-vue-scan-inspector]')
    if (host) {
      host.remove()
    }

    this.canvas = null
    this.ctx = null
    this.eventCatcher = null
    this.isInitialized = false
  }
}

// 单例
let inspectorOverlay: InspectorOverlay | null = null

export function initInspectorOverlay(): InspectorOverlay {
  if (!inspectorOverlay) {
    inspectorOverlay = new InspectorOverlay()
    inspectorOverlay.init()
  }
  return inspectorOverlay
}

export function getInspectorOverlay(): InspectorOverlay | null {
  return inspectorOverlay
}

export function destroyInspectorOverlay(): void {
  if (inspectorOverlay) {
    inspectorOverlay.destroy()
    inspectorOverlay = null
  }
}

export { InspectorOverlay }
