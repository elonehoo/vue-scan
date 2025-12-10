/**
 * Vue Instrumentation Utilities
 * 类似 bippy 的工具函数
 */

import type {
  Change,
  ChangeReason,
  RenderData,
  Timings,
  VueComponentType,
  VueFiber,
} from './types'

// ============ 渲染数据存储 ============

const renderDataMap = new WeakMap<object, Map<string, RenderData>>()

/**
 * 获取 Fiber ID
 */
export function getFiberId(fiber: VueFiber): string {
  return String(fiber.uid ?? fiber._uid ?? 0)
}

/**
 * 获取组件类型
 */
export function getType(fiber: VueFiber): VueComponentType | null {
  return fiber.type ?? null
}

/**
 * 获取显示名称
 */
export function getDisplayName(fiber: VueFiber | VueComponentType | null): string | null {
  if (!fiber)
    return null

  // 如果是 fiber
  if ('type' in fiber && fiber.type) {
    const type = fiber.type as VueComponentType
    return (
      type.name
      || type.__name
      || type.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__
      || getFileBaseName(type.__file)
      || null
    )
  }

  // 如果是 type
  const type = fiber as VueComponentType
  return (
    type.name
    || type.__name
    || type.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__
    || getFileBaseName(type.__file)
    || null
  )
}

/**
 * 从文件路径获取基础名称
 */
function getFileBaseName(file: string | undefined): string | null {
  if (!file)
    return null
  const parts = file.split('/')
  const fileName = parts[parts.length - 1]
  return fileName?.replace(/\.vue$/, '') ?? null
}

/**
 * 获取渲染数据
 */
export function getRenderData(fiber: VueFiber): RenderData | undefined {
  const type = getType(fiber)
  if (!type)
    return undefined

  const id = getFiberId(fiber)
  const keyMap = renderDataMap.get(type as object)

  if (keyMap) {
    return keyMap.get(id)
  }

  return undefined
}

/**
 * 设置渲染数据
 */
export function setRenderData(fiber: VueFiber, value: RenderData): void {
  const type = getType(fiber)
  if (!type)
    return

  const id = getFiberId(fiber)
  let keyMap = renderDataMap.get(type as object)

  if (!keyMap) {
    keyMap = new Map()
    renderDataMap.set(type as object, keyMap)
  }

  keyMap.set(id, value)
}

/**
 * 获取时序数据
 */
export function getTimings(fiber: VueFiber): Timings {
  const renderTime = fiber.__lastRenderTime__ ?? 0
  return {
    selfTime: renderTime,
    totalTime: renderTime,
  }
}

// ============ 变更检测 ============

/**
 * 检测 Props 变更
 */
export function getPropsChanges(fiber: VueFiber): Change[] {
  const changes: Change[] = []

  const currentProps = fiber.props || {}
  const previousProps = fiber.__previousProps__ || {}

  // 检查新增或变更的 props
  for (const key in currentProps) {
    if (key === 'children' || key.startsWith('on'))
      continue

    const currentValue = currentProps[key]
    const prevValue = previousProps[key]

    if (!isEqual(currentValue, prevValue)) {
      changes.push({
        type: 0b001 as ChangeReason, // Props
        name: key,
        nextValue: currentValue,
        prevValue,
        unstable: isValueUnstable(prevValue, currentValue),
      })
    }
  }

  // 检查移除的 props
  for (const key in previousProps) {
    if (!(key in currentProps)) {
      changes.push({
        type: 0b001 as ChangeReason, // Props
        name: key,
        nextValue: undefined,
        prevValue: previousProps[key],
        unstable: true,
      })
    }
  }

  return changes
}

/**
 * 检测 State 变更
 */
export function getStateChanges(fiber: VueFiber): Change[] {
  const changes: Change[] = []

  const currentState = fiber.setupState || {}
  const previousState = fiber.__previousState__ || {}

  for (const key in currentState) {
    // 跳过函数和 ref
    if (typeof currentState[key] === 'function')
      continue

    const currentValue = currentState[key]
    const prevValue = previousState[key]

    if (!isEqual(currentValue, prevValue)) {
      changes.push({
        type: 0b010 as ChangeReason, // State
        name: key,
        nextValue: currentValue,
        prevValue,
        unstable: isValueUnstable(prevValue, currentValue),
      })
    }
  }

  return changes
}

/**
 * 获取所有变更
 */
export function getAllChanges(fiber: VueFiber): Change[] {
  return [
    ...getPropsChanges(fiber),
    ...getStateChanges(fiber),
  ]
}

// ============ 比较工具 ============

/**
 * 深度比较
 */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b)
    return true

  if (a === null || b === null)
    return a === b

  if (typeof a !== typeof b)
    return false

  if (typeof a === 'object') {
    // 数组比较
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length)
        return false
      return a.every((item, index) => isEqual(item, b[index]))
    }

    // 对象比较
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>

    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length)
      return false

    return aKeys.every(key => isEqual(aObj[key], bObj[key]))
  }

  return false
}

/**
 * 检查值是否不稳定（函数或对象引用变更但内容相同）
 */
export function isValueUnstable(prevValue: unknown, nextValue: unknown): boolean {
  if (prevValue === nextValue)
    return false

  const prevString = fastSerialize(prevValue)
  const nextString = fastSerialize(nextValue)

  const unstableTypes = ['function', 'object']

  return (
    prevString === nextString
    && unstableTypes.includes(typeof prevValue)
    && unstableTypes.includes(typeof nextValue)
  )
}

/**
 * 快速序列化
 */
const serializeCache = new WeakMap<object, string>()

export function fastSerialize(value: unknown, depth = 0): string {
  if (depth > 3)
    return '...'

  if (value === null)
    return 'null'
  if (value === undefined)
    return 'undefined'

  const type = typeof value

  if (type === 'string')
    return `"${value}"`
  if (type === 'number' || type === 'boolean')
    return String(value)
  if (type === 'function')
    return `fn:${(value as () => void).name || 'anonymous'}`

  if (type === 'object') {
    const obj = value as object

    // 检查缓存
    const cached = serializeCache.get(obj)
    if (cached)
      return cached

    let result: string

    if (Array.isArray(obj)) {
      result = `[${obj.slice(0, 5).map(item => fastSerialize(item, depth + 1)).join(',')}${obj.length > 5 ? '...' : ''}]`
    }
    else {
      const keys = Object.keys(obj).slice(0, 5)
      const pairs = keys.map(key => `${key}:${fastSerialize((obj as Record<string, unknown>)[key], depth + 1)}`)
      result = `{${pairs.join(',')}${Object.keys(obj).length > 5 ? '...' : ''}}`
    }

    serializeCache.set(obj, result)
    return result
  }

  return String(value)
}

// ============ DOM 工具 ============

/**
 * 获取 Fiber 对应的 DOM 元素
 */
export function getFiberElement(fiber: VueFiber): Element | null {
  return fiber.subTree?.el || fiber.$el || null
}

/**
 * 从 DOM 元素获取 Fiber
 */
export function getFiberFromElement(element: Element): VueFiber | null {
  // 检查 __vueParentComponent
  const vueEl = element as Element & {
    __vueParentComponent?: VueFiber
    __vue__?: VueFiber
  }

  if (vueEl.__vueParentComponent) {
    return vueEl.__vueParentComponent
  }

  // Vue 2 兼容
  if (vueEl.__vue__) {
    return vueEl.__vue__ as unknown as VueFiber
  }

  return null
}

/**
 * 检查元素是否在视口内
 */
export function isElementInViewport(
  el: Element,
  rect = el.getBoundingClientRect(),
): boolean {
  return (
    rect.bottom > 0
    && rect.right > 0
    && rect.top < window.innerHeight
    && rect.left < window.innerWidth
    && rect.width > 0
    && rect.height > 0
  )
}

// ============ Fiber 遍历 ============

/**
 * 遍历子 Fiber
 */
export function traverseChildren(
  fiber: VueFiber,
  callback: (child: VueFiber) => void,
): void {
  const subTree = fiber.subTree
  if (!subTree?.children)
    return

  const children = subTree.children
  if (!Array.isArray(children))
    return

  for (const child of children) {
    if (child?.component) {
      callback(child.component as VueFiber)
      traverseChildren(child.component as VueFiber, callback)
    }
  }
}

/**
 * 获取组件路径
 */
export function getComponentPath(fiber: VueFiber): string[] {
  const path: string[] = []
  let current: VueFiber | null = fiber

  while (current) {
    const name = getDisplayName(current)
    if (name) {
      path.unshift(name)
    }
    current = current.parent
  }

  return path
}

/**
 * 检查是否是复合组件
 */
export function isCompositeFiber(fiber: VueFiber): boolean {
  const type = fiber.type
  if (!type)
    return false

  return typeof type === 'object' || typeof type === 'function'
}
