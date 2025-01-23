import { throttle } from 'lodash-es'
import { getComponentBoundingRect, getInstanceName } from '../shared/vue'

export interface ComponentBoundingRect {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

export function isInViewport(bounds: ComponentBoundingRect): boolean {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  return !(
    bounds.left >= viewportWidth
    || bounds.right <= 0
    || bounds.top >= viewportHeight
    || bounds.bottom <= 0
  )
}

function createHighlightElement(uuid: string): HTMLElement {
  const highlightEl = document.createElement('div')
  highlightEl.id = `vue-scan-highlight-${uuid}`
  highlightEl.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    border: 2px solid #42b883;
    transition: all 0.3s ease;
    opacity: 0;
  `
  // 使用 requestAnimationFrame 确保过渡动画生效
  requestAnimationFrame(() => {
    highlightEl.style.opacity = '1'
  })
  return highlightEl
}

function createLabelElement(uuid: string, name: string): HTMLElement {
  const labelEl = document.createElement('div')
  labelEl.id = `vue-scan-label-${uuid}`
  labelEl.style.cssText = `
    position: fixed;
    background: #42b883;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 10000;
    transition: all 0.3s ease;
    opacity: 0;
  `
  labelEl.textContent = name
  // 使用 requestAnimationFrame 确保过渡动画生效
  requestAnimationFrame(() => {
    labelEl.style.opacity = '1'
  })
  return labelEl
}

function updateHighlightPosition(highlightEl: HTMLElement, bounds: ComponentBoundingRect) {
  highlightEl.style.left = `${bounds.left}px`
  highlightEl.style.top = `${bounds.top}px`
  highlightEl.style.width = `${bounds.width}px`
  highlightEl.style.height = `${bounds.height}px`
}

function updateLabelPosition(labelEl: HTMLElement, bounds: ComponentBoundingRect) {
  labelEl.style.left = `${bounds.left}px`
  labelEl.style.top = `${bounds.top - labelEl.offsetHeight - 4}px`
}

type UpdateHighlightFunction = (
  bounds: ComponentBoundingRect,
  name: string,
  flashCount: number,
  hideComponentName?: boolean
) => void

export function createUpdateHighlight(): UpdateHighlightFunction {
  return throttle<UpdateHighlightFunction>(
    (bounds, name, flashCount, hideComponentName) => {
      if (!isInViewport(bounds))
        return
      highlight(bounds, name, flashCount, { hideComponentName })
    },
    500,
    {} as any,
  )
}

// 添加一个 Map 来跟踪每个组件的最后渲染时间和timeout
const componentTimers = new Map<string, {
  lastRenderTime: number
  timeout: NodeJS.Timeout | null
}>()

export function highlight(
  instance: any,
  uuid: string,
  flashCount: number,
  options?: {
    hideComponentName?: boolean
    renderTime?: number
    permanent?: boolean
  },
) {
  const bounds = getComponentBoundingRect(instance)
  if (!bounds.width && !bounds.height)
    return
  if (!isInViewport(bounds))
    return

  const renderTimeText = options?.renderTime
    ? ` (${options.renderTime.toFixed(2)}ms)`
    : ''
  const name = `${getInstanceName(instance)} x ${flashCount} ${renderTimeText}`

  let highlightEl = document.getElementById(`vue-scan-highlight-${uuid}`) as HTMLElement
  let labelEl = document.getElementById(`vue-scan-label-${uuid}`) as HTMLElement

  if (!highlightEl) {
    highlightEl = createHighlightElement(uuid)
    document.body.appendChild(highlightEl)
  }

  if (!labelEl && !options?.hideComponentName) {
    labelEl = createLabelElement(uuid, name)
    document.body.appendChild(labelEl)
  }

  updateHighlightPosition(highlightEl, bounds)
  if (labelEl) {
    labelEl.textContent = name
    updateLabelPosition(labelEl, bounds)
  }

  // 更新最后渲染时间
  const timer = componentTimers.get(uuid) || { lastRenderTime: 0, timeout: null }
  timer.lastRenderTime = Date.now()

  // 清除之前的timeout
  if (timer.timeout) {
    clearTimeout(timer.timeout)
  }

  if (!options?.permanent) {
    // 设置新的timeout - 在2秒没有新的渲染后才淡出
    timer.timeout = setTimeout(() => {
      const now = Date.now()
      // 只有在最后一次渲染后2秒内没有新的渲染才清除高亮
      if (now - timer.lastRenderTime >= 2000) {
        clearhighlight(uuid)
        componentTimers.delete(uuid)
      }
    }, 2000)
  }

  componentTimers.set(uuid, timer)
}

export function clearhighlight(uuid: string) {
  const highlightEl = document.getElementById(`vue-scan-highlight-${uuid}`)
  const labelEl = document.getElementById(`vue-scan-label-${uuid}`)

  if (highlightEl) {
    highlightEl.style.opacity = '0'
    setTimeout(() => highlightEl.remove(), 300) // 等待动画完成后移除元素
  }
  if (labelEl) {
    labelEl.style.opacity = '0'
    setTimeout(() => labelEl.remove(), 300) // 等待动画完成后移除元素
  }
}
