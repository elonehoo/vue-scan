import type { VueAppInstance } from '@vue/devtools-kit'
import { getInstanceName } from '../shared/vue'
import { clearhighlight, createUpdateHighlight, highlight, unhighlight } from './highlight'

export interface BACE_VUE_INSTANCE extends VueAppInstance {
  __vue_scan_injected__?: boolean
  /** beforeUpdate */
  bu?: Array<() => void> | null
  /** beforeUnmount */
  bum?: Array<() => void> | null
  _uid?: number
  __flashCount?: number
  __flashTimeout?: ReturnType<typeof setTimeout> | null
  $options?: {
    beforeUpdate?: Array<() => void> | null
    beforeDestroy?: Array<() => void> | null
  }
  __renderStartTime?: number
}

export function createOnBeforeUpdateHook(instance?: BACE_VUE_INSTANCE, options?: {
  hideComponentName?: boolean
  interval?: number
}) {
  const {
    interval = 1000,
  } = options || {}

  if (!instance) {
    return
  }

  const el = instance?.subTree?.el || instance.$el

  if (!el) {
    return
  }

  const name = getInstanceName(instance)
  const uuid = `${name}__${instance.uid || instance._uid}`.replaceAll(' ', '_')

  return () => {
    if (!instance.__flashCount) {
      instance.__flashCount = 0
    }

    if (!instance.__updateHighlight) {
      instance.__updateHighlight = createUpdateHighlight()
    }

    // 记录渲染开始时间
    instance.__renderStartTime = performance.now()

    instance.__flashCount++

    // 在下一个微任务中计算渲染耗时
    Promise.resolve().then(() => {
      const renderTime = performance.now() - (instance.__renderStartTime || 0)
      highlight(instance, uuid, instance.__flashCount || 0, {
        ...options,
        renderTime, // 传递渲染时间到highlight函数
      })
    })

    if (instance.__flashTimeout) {
      clearTimeout(instance.__flashTimeout)
      instance.__flashTimeout = null
    }

    instance.__flashTimeout = setTimeout(() => {
      unhighlight(uuid)
      instance.__flashTimeout = null
      instance.__flashCount = 0
    }, interval)
  }
}

export function createOnBeforeUnmountHook(instance?: BACE_VUE_INSTANCE) {
  if (!instance) {
    return
  }

  const el = instance?.subTree?.el || instance.$el

  if (!el) {
    return
  }

  const name = getInstanceName(instance)
  const uuid = `${name}__${instance.uid || instance._uid}`.replaceAll(' ', '_')

  return () => {
    clearhighlight(uuid)
  }
}
