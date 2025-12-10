/**
 * Vue Instrumentation Types
 * 类似 bippy 的 Fiber 类型定义
 */

import type { VueAppInstance } from '@vue/devtools-kit'

// ============ Vue "Fiber" 类型 ============

/**
 * Vue 组件实例扩展类型（类似 React Fiber）
 */
export interface VueFiber extends VueAppInstance {
  /** 组件唯一ID */
  uid: number
  /** 组件类型 */
  type: VueComponentType
  /** Props */
  props: Record<string, unknown>
  /** 响应式状态 */
  setupState?: Record<string, unknown>
  /** 子树 VNode */
  subTree: VueVNode
  /** 父组件 */
  parent: VueFiber | null
  /** 根组件 */
  root: VueFiber
  /** 应用上下文 */
  appContext: VueAppContext
  /** 是否已挂载 */
  isMounted: boolean
  /** 是否已卸载 */
  isUnmounted: boolean
  /** 组件 proxy */
  proxy: Record<string, unknown> | null
  /** 渲染函数 */
  render: (() => VueVNode) | null
  /** 生命周期 hooks */
  bu?: Array<() => void> | null // beforeUpdate
  u?: Array<() => void> | null // updated
  bum?: Array<() => void> | null // beforeUnmount
  um?: Array<() => void> | null // unmounted
  /** Vue Scan 扩展属性 */
  __vue_scan_id__?: string
  __vue_scan_injected__?: boolean
  __renderStartTime__?: number
  __renderCount__?: number
  __lastRenderTime__?: number
  __previousProps__?: Record<string, unknown>
  __previousState__?: Record<string, unknown>
  /** Vue 2 兼容 */
  _uid?: number
  $el?: Element
  $options?: Record<string, unknown>
  $vnode?: VueVNode
}

/**
 * Vue 组件类型
 */
export interface VueComponentType {
  name?: string
  __name?: string
  __file?: string
  __VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__?: string
  setup?: (...args: unknown[]) => unknown
  render?: (...args: unknown[]) => unknown
  props?: Record<string, unknown> | string[]
  emits?: string[] | Record<string, unknown>
  components?: Record<string, VueComponentType>
}

/**
 * Vue VNode
 */
export interface VueVNode {
  type: unknown
  props: Record<string, unknown> | null
  children: VueVNode[] | string | null
  el: Element | null
  component: VueFiber | null
  key: string | number | null
  ref: unknown
  shapeFlag: number
}

/**
 * Vue App Context
 */
export interface VueAppContext {
  app: VueApp
  config: Record<string, unknown>
  components: Record<string, VueComponentType>
  directives: Record<string, unknown>
  provides: Record<string, unknown>
}

/**
 * Vue App
 */
export interface VueApp {
  version: string
  config: Record<string, unknown>
  use: (plugin: unknown) => VueApp
  mount: (rootContainer: Element | string) => VueFiber
  unmount: () => void
  provide: (key: string | symbol, value: unknown) => VueApp
  component: (name: string, component?: VueComponentType) => VueComponentType | VueApp
  directive: (name: string, directive?: unknown) => unknown | VueApp
  __VUE_DEVTOOLS_NEXT_APP_RECORD__?: unknown
}

// ============ 渲染数据类型 ============

/**
 * 渲染阶段
 */
export enum RenderPhase {
  Mount = 0b001,
  Update = 0b010,
  Unmount = 0b100,
}

/**
 * 变更原因
 */
export enum ChangeReason {
  Props = 0b001,
  State = 0b010,
  Context = 0b100,
}

/**
 * 不稳定变更标记
 */
export const UNSTABLE_CHANGE = Symbol('unstable_change')

/**
 * 单个变更
 */
export interface Change {
  type: ChangeReason
  name: string
  prevValue: unknown
  nextValue: unknown
  unstable: boolean
}

/**
 * 聚合变更
 */
export interface AggregatedChange {
  type: number // ChangeReason 的并集
  unstable: boolean
}

/**
 * 单次渲染数据
 */
export interface Render {
  phase: RenderPhase
  componentName: string | null
  time: number | null
  count: number
  changes: Change[]
  unnecessary: boolean | null
  didCommit: boolean
  fps: number
}

/**
 * 组件渲染数据统计
 */
export interface RenderData {
  selfTime: number
  totalTime: number
  renderCount: number
  lastRenderTimestamp: number
}

/**
 * 时序数据
 */
export interface Timings {
  selfTime: number
  totalTime: number
}

// ============ Instrumentation 配置 ============

/**
 * 渲染回调
 */
export type OnRenderHandler = (fiber: VueFiber, renders: Render[]) => void

/**
 * Commit 开始回调
 */
export type OnCommitStartHandler = () => void

/**
 * Commit 结束回调
 */
export type OnCommitFinishHandler = () => void

/**
 * 错误回调
 */
export type OnErrorHandler = (error: unknown) => void

/**
 * Fiber 验证回调
 */
export type IsValidFiberHandler = (fiber: VueFiber) => boolean

/**
 * 激活回调
 */
export type OnActiveHandler = () => void

/**
 * Instrumentation 配置
 */
export interface InstrumentationConfig {
  onCommitStart?: OnCommitStartHandler
  isValidFiber?: IsValidFiberHandler
  onRender?: OnRenderHandler
  onCommitFinish?: OnCommitFinishHandler
  onError?: OnErrorHandler
  onActive?: OnActiveHandler
  trackChanges?: boolean
  forceAlwaysTrackRenders?: boolean
}

/**
 * Instrumentation 实例
 */
export interface InstrumentationInstance {
  key: string
  config: InstrumentationConfig
  isPaused: boolean
  fiberRoots: WeakSet<VueFiber>
}
