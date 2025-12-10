/**
 * Inspector 类型定义
 */

import type { VueAppInstance } from '@vue/devtools-kit'

export type InspectorState
  = | { kind: 'inspect-off' }
    | { kind: 'inspecting', hoveredElement: Element | null }
    | { kind: 'focused', focusedElement: Element, componentInstance: VueAppInstance }

export interface ComponentInfo {
  name: string
  uid: number | string
  props: Record<string, unknown>
  data: Record<string, unknown>
  computed: Record<string, unknown>
  setupState: Record<string, unknown>
  renderCount: number
  lastRenderTime?: number
}

export interface InspectorRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ComponentTreeNode {
  id: string
  name: string
  element?: HTMLElement
  instance?: VueAppInstance
  children: ComponentTreeNode[]
  depth: number
  isExpanded: boolean
  renderCount?: number
  lastRenderTime?: number
}

export interface InspectorOverlayOptions {
  showLabel?: boolean
  showLockIcon?: boolean
  labelPosition?: 'top' | 'bottom'
}
