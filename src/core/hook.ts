import type { VueAppInstance } from '@vue/devtools-kit'
import { getInstanceName } from '../shared/vue'
import { clearhighlight, createUpdateHighlight, highlight, unhighlight } from './highlight'
import { updatePanelData } from './panel'

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

function setupPropsWatch(instance: BACE_VUE_INSTANCE, uuid: string) {
  const props = instance.props || {}

  // 使用Proxy监听props的变化
  return new Proxy(props, {
    set(target: any, key: string, value: any) {
      const oldValue = target[key]
      target[key] = value

      if (oldValue !== value) {
        updatePanelData(uuid, {
          propsHistory: [{
            key: String(key),
            oldValue,
            newValue: value,
            timestamp: Date.now(),
          }],
        })
      }

      return true
    },
  })
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

  // 设置props监听
  if (instance.props) {
    instance.props = setupPropsWatch(instance, uuid)
  }

  // 给组件DOM添加唯一标识
  if (el && typeof el === 'object') {
    (el as HTMLElement).setAttribute('data-vue-scan-id', uuid)
    // 保存组件名称，方便后续使用
    (el as HTMLElement).setAttribute('data-vue-scan-name', name)
  }

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

      // 如果元素被高亮，需要保持高亮状态
      const el = instance?.subTree?.el || instance.$el
      if (el && typeof el === 'object') {
        const isHighlighted = (el as HTMLElement).hasAttribute('data-vue-scan-highlighted')
        if (isHighlighted) {
          // 确保高亮状态在更新后仍然存在
          requestAnimationFrame(() => {
            (el as HTMLElement).setAttribute('data-vue-scan-highlighted', 'true')
          })
        }
      }

      highlight(instance, uuid, instance.__flashCount || 0, {
        ...options,
        renderTime, // 传递渲染时间到highlight函数
      })

      // 更新面板数据
      updatePanelData(uuid, {
        componentName: name,
        renderTime,
        lastRenderTime: renderTime,
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
