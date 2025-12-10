import type { VueAppInstance } from '@vue/devtools-kit'
import { updateComponentRenderData } from '../shared/store'
import { getComponentBoundingRect, getInstanceName } from '../shared/vue'
import { getCanvasRenderer } from './canvas-renderer'
import { clearhighlight, createUpdateHighlight, highlight } from './highlight'

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

function setupPropsWatch(instance: BACE_VUE_INSTANCE, _uuid: string) {
  const props = instance.props || {}

  // 使用Proxy监听props的变化（仅用于触发高亮，不再记录历史）
  return new Proxy(props, {
    set(target: any, key: string, value: any) {
      target[key] = value
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
    const element = el as HTMLElement
    element.setAttribute('data-vue-scan-id', uuid)
    element.setAttribute('data-component-id', uuid) // 添加备用ID
    element.setAttribute('data-vue-scan-name', name)
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

      // 获取最新的DOM元素
      const currentEl = instance?.subTree?.el || instance.$el
      if (currentEl && typeof currentEl === 'object') {
        const element = currentEl as HTMLElement
        // 确保ID始终存在
        element.setAttribute('data-vue-scan-id', uuid)
        element.setAttribute('data-component-id', uuid)
        element.setAttribute('data-vue-scan-name', name)

        // 保持高亮状态
        if (element.hasAttribute('data-vue-scan-highlighted')) {
          requestAnimationFrame(() => {
            element.setAttribute('data-vue-scan-highlighted', 'true')
          })
        }
      }

      highlight(instance, uuid, instance.__flashCount || 0, {
        ...options,
        renderTime, // 传递渲染时间到highlight函数
      })

      // 使用 Canvas 渲染器进行高亮
      const canvasRenderer = getCanvasRenderer()
      if (canvasRenderer && currentEl) {
        const bounds = getComponentBoundingRect(instance)
        if (bounds.width > 0 && bounds.height > 0) {
          canvasRenderer.highlight(uuid, {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
            name,
            renderCount: instance.__flashCount || 0,
            renderTime,
          })
        }
      }

      // 更新组件渲染数据（供 widget 显示）
      updateComponentRenderData(uuid, {
        componentName: name,
        renderTime,
      })
    })

    // 移除自动取消高亮的timeout
    if (instance.__flashTimeout) {
      clearTimeout(instance.__flashTimeout)

      instance.__flashTimeout = null
    }

    instance.__flashTimeout = setTimeout(() => {
      clearhighlight(uuid)
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
