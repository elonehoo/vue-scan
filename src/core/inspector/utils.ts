/**
 * Inspector 工具函数
 */

import type { VueAppInstance } from '@vue/devtools-kit'
import type { ComponentInfo, ComponentTreeNode, InspectorRect } from './types'
import { getInstanceName } from '../../shared/vue'

/**
 * 从 DOM 元素获取 Vue 组件实例
 */
export function getComponentFromElement(element: Element): VueAppInstance | null {
  // Vue 3 的组件实例存储在 __vueParentComponent 属性中
  const el = element as Element & {
    __vueParentComponent?: VueAppInstance
    __vue__?: VueAppInstance // Vue 2
  }

  if (el.__vueParentComponent) {
    return el.__vueParentComponent
  }

  // Vue 2 兼容
  if (el.__vue__) {
    return el.__vue__ as unknown as VueAppInstance
  }

  // 向上查找父元素
  let parent = element.parentElement
  while (parent) {
    const parentEl = parent as Element & {
      __vueParentComponent?: VueAppInstance
      __vue__?: VueAppInstance
    }

    if (parentEl.__vueParentComponent) {
      return parentEl.__vueParentComponent
    }
    if (parentEl.__vue__) {
      return parentEl.__vue__ as unknown as VueAppInstance
    }
    parent = parent.parentElement
  }

  return null
}

/**
 * 从元素获取最近的组件 DOM 节点
 */
export function findComponentElement(element: Element): Element | null {
  let current: Element | null = element

  while (current) {
    if (current.hasAttribute('data-vue-scan-id') || current.hasAttribute('data-v-app')) {
      return current
    }

    const el = current as Element & { __vueParentComponent?: VueAppInstance }
    if (el.__vueParentComponent) {
      return current
    }

    current = current.parentElement
  }

  return null
}

/**
 * 获取组件信息
 */
export function getComponentInfo(instance: VueAppInstance): ComponentInfo {
  const name = getInstanceName(instance)
  const uid = (instance as { uid?: number, _uid?: number }).uid
    || (instance as { uid?: number, _uid?: number })._uid
    || 0

  // 获取 props
  const props: Record<string, unknown> = {}
  if (instance.props) {
    for (const key of Object.keys(instance.props)) {
      props[key] = instance.props[key]
    }
  }

  // 获取 data (Vue 2) 或 setupState (Vue 3)
  const data: Record<string, unknown> = {}
  const setupState: Record<string, unknown> = {}

  if (instance.data && typeof instance.data === 'object') {
    for (const key of Object.keys(instance.data)) {
      data[key] = (instance.data as Record<string, unknown>)[key]
    }
  }

  if (instance.setupState && typeof instance.setupState === 'object') {
    for (const key of Object.keys(instance.setupState)) {
      // 跳过以 _ 开头的内部属性
      if (!key.startsWith('_') && !key.startsWith('$')) {
        setupState[key] = (instance.setupState as Record<string, unknown>)[key]
      }
    }
  }

  // 获取 computed
  const computed: Record<string, unknown> = {}
  // Vue 3 的 computed 存储在 setupState 中，需要通过 effect 判断

  // 获取渲染统计
  const renderCount = (instance as { __flashCount?: number }).__flashCount || 0
  const lastRenderTime = (instance as { __lastRenderTime?: number }).__lastRenderTime

  return {
    name,
    uid,
    props,
    data,
    computed,
    setupState,
    renderCount,
    lastRenderTime,
  }
}

/**
 * 获取组件的边界矩形
 */
export function getElementRect(element: Element): InspectorRect {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

/**
 * 构建组件树
 */
export function buildComponentTree(rootElement: Element): ComponentTreeNode[] {
  const nodes: ComponentTreeNode[] = []
  const visited = new WeakSet<Element>()

  function walk(element: Element, depth: number): ComponentTreeNode | null {
    if (visited.has(element))
      return null
    visited.add(element)

    const instance = getComponentFromElement(element)
    if (!instance)
      return null

    const name = getInstanceName(instance)
    const uid = (instance as { uid?: number, _uid?: number }).uid
      || (instance as { uid?: number, _uid?: number })._uid
      || 0
    const id = `${name}__${uid}`

    const children: ComponentTreeNode[] = []

    // 遍历子元素
    const childElements = Array.from(element.children)
    for (const child of childElements) {
      const childNode = walk(child, depth + 1)
      if (childNode) {
        children.push(childNode)
      }
    }

    return {
      id,
      name,
      element: element as HTMLElement,
      instance,
      children,
      depth,
      isExpanded: depth < 2,
      renderCount: (instance as { __flashCount?: number }).__flashCount,
      lastRenderTime: (instance as { __lastRenderTime?: number }).__lastRenderTime,
    }
  }

  // 从根元素开始遍历
  const rootNode = walk(rootElement, 0)
  if (rootNode) {
    nodes.push(rootNode)
  }

  // 如果没有找到组件，尝试遍历子元素
  if (nodes.length === 0) {
    const childElements = Array.from(rootElement.children)
    for (const child of childElements) {
      const node = walk(child, 0)
      if (node) {
        nodes.push(node)
      }
    }
  }

  return nodes
}

/**
 * 不可视的 HTML 标签
 */
export const NON_VISUAL_TAGS = new Set([
  'HTML',
  'HEAD',
  'META',
  'TITLE',
  'BASE',
  'SCRIPT',
  'STYLE',
  'LINK',
  'NOSCRIPT',
  'SOURCE',
  'TRACK',
  'EMBED',
  'OBJECT',
  'PARAM',
  'TEMPLATE',
  'SLOT',
  'AREA',
])

/**
 * 检查元素是否为可视元素
 */
export function isVisualElement(element: Element): boolean {
  return !NON_VISUAL_TAGS.has(element.tagName)
}

/**
 * 从点击坐标获取元素
 */
export function getElementFromPoint(x: number, y: number): Element | null {
  const elements = document.elementsFromPoint(x, y)

  for (const element of elements) {
    // 跳过 vue-scan 自身的元素
    if (
      element.closest('[data-vue-scan-canvas]')
      || element.closest('[data-vue-scan-widget]')
      || element.closest('[data-vue-scan-inspector]')
    ) {
      continue
    }

    // 跳过不可视元素
    if (!isVisualElement(element)) {
      continue
    }

    // 查找关联的 Vue 组件
    const componentElement = findComponentElement(element)
    if (componentElement) {
      return componentElement
    }

    return element
  }

  return null
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
    else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn(...args)
      }, delay - (now - lastCall))
    }
  }
}
