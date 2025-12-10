/**
 * Vue Component Change Detection
 * 类似 bippy 的变更检测
 */

import type { Change, VueFiber } from './types'
import { ChangeReason, UNSTABLE_CHANGE } from './types'
import { fastSerialize, isEqual } from './utils'

/**
 * 检测 Props 变更
 */
export function getPropsChanges(fiber: VueFiber): Change[] {
  const changes: Change[] = []
  const currentProps = fiber.props || {}
  const prevProps = fiber.__previousProps__ || {}

  // 检查新增和变更的 props
  for (const key of Object.keys(currentProps)) {
    if (key === 'key' || key === 'ref')
      continue

    const current = currentProps[key]
    const prev = prevProps[key]

    if (!(key in prevProps)) {
      // 新增的 prop
      changes.push({
        type: ChangeReason.Props,
        name: key,
        prevValue: UNSTABLE_CHANGE,
        nextValue: current,
        unstable: true,
      })
    }
    else if (!isEqual(current, prev)) {
      // 变更的 prop
      changes.push({
        type: ChangeReason.Props,
        name: key,
        prevValue: prev,
        nextValue: current,
        unstable: false,
      })
    }
  }

  // 检查删除的 props
  for (const key of Object.keys(prevProps)) {
    if (key === 'key' || key === 'ref')
      continue

    if (!(key in currentProps)) {
      changes.push({
        type: ChangeReason.Props,
        name: key,
        prevValue: prevProps[key],
        nextValue: UNSTABLE_CHANGE,
        unstable: true,
      })
    }
  }

  return changes
}

/**
 * 检测 State 变更 (Vue Refs / Reactive)
 */
export function getStateChanges(fiber: VueFiber): Change[] {
  const changes: Change[] = []
  const currentState = fiber.setupState || {}
  const prevState = fiber.__previousState__ || {}

  for (const key of Object.keys(currentState)) {
    // 跳过私有属性和方法
    if (key.startsWith('_') || key.startsWith('$'))
      continue
    if (typeof currentState[key] === 'function')
      continue

    const current = currentState[key] as any
    const prev = prevState[key] as any

    // 获取实际值（可能是 ref）
    const currentValue = current?.value !== undefined ? current.value : current
    const prevValue = prev?.value !== undefined ? prev.value : prev

    if (!(key in prevState)) {
      changes.push({
        type: ChangeReason.State,
        name: key,
        prevValue: UNSTABLE_CHANGE,
        nextValue: currentValue,
        unstable: true,
      })
    }
    else if (!isEqual(currentValue, prevValue)) {
      changes.push({
        type: ChangeReason.State,
        name: key,
        prevValue,
        nextValue: currentValue,
        unstable: false,
      })
    }
  }

  return changes
}

/**
 * 检测 Context 变更 (Vue Provide/Inject)
 */
export function getContextChanges(fiber: VueFiber): Change[] {
  const changes: Change[] = []
  const currentProvides = fiber.provides || {}
  const prevProvides = fiber.__previousProvides__ || {}

  for (const key of Object.keys(currentProvides)) {
    const current = currentProvides[key]
    const prev = prevProvides[key]

    if (!(key in prevProvides)) {
      changes.push({
        type: ChangeReason.Context,
        name: String(key),
        prevValue: UNSTABLE_CHANGE,
        nextValue: current,
        unstable: true,
      })
    }
    else if (!isEqual(current, prev)) {
      changes.push({
        type: ChangeReason.Context,
        name: String(key),
        prevValue: prev,
        nextValue: current,
        unstable: false,
      })
    }
  }

  return changes
}

/**
 * 获取变更原因的文字描述
 */
export function getChangeReasonText(reason: ChangeReason): string {
  switch (reason) {
    case ChangeReason.Props:
      return 'props'
    case ChangeReason.State:
      return 'state'
    case ChangeReason.Context:
      return 'context'
    default:
      return 'unknown'
  }
}

/**
 * 将变更序列化为可读字符串
 */
export function serializeChange(change: Change): string {
  const reasonText = getChangeReasonText(change.type)
  const prevStr = change.unstable ? '(new)' : fastSerialize(change.prevValue)
  const nextStr = fastSerialize(change.nextValue)
  return `${reasonText}.${change.name}: ${prevStr} → ${nextStr}`
}

/**
 * 获取变更摘要
 */
export function getChangesSummary(changes: Change[]): {
  props: number
  state: number
  context: number
  total: number
  unstable: number
} {
  const summary = {
    props: 0,
    state: 0,
    context: 0,
    total: changes.length,
    unstable: 0,
  }

  for (const change of changes) {
    if (change.unstable) {
      summary.unstable++
    }
    switch (change.type) {
      case ChangeReason.Props:
        summary.props++
        break
      case ChangeReason.State:
        summary.state++
        break
      case ChangeReason.Context:
        summary.context++
        break
    }
  }

  return summary
}
