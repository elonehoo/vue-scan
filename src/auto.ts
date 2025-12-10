/**
 * Vue Scan Auto Mode
 * 自动检测并注入到 Vue 应用中
 *
 * 使用方式:
 * 1. Script 标签: <script src="https://unpkg.com/vue-scan/dist/auto.global.js"></script>
 * 2. 动态加载: import('vue-scan/auto')
 */

import type { VNodeNormalizedChildren } from 'vue'
import type { VueScanBaseOptions } from './types'
import { throttle } from 'lodash-es'
import { getAPI } from './api'
import { type BACE_VUE_INSTANCE, createOnBeforeUnmountHook, createOnBeforeUpdateHook } from './core'
import { initCanvasRenderer } from './core/canvas-renderer'
import { loadConfig, updateConfig } from './core/config'
import { createInstrumentation, setOnLongRenderCallback } from './core/instrumentation'
import { recordLongRender } from './core/notifications'
import plugin from './index'
import { createWidget } from './widget'

// ============ 类型定义 ============

export interface VueScanGlobal {
  plugin: typeof plugin
  createOnBeforeUpdateHook: typeof createOnBeforeUpdateHook
  createOnBeforeUnmountHook: typeof createOnBeforeUnmountHook
  // API 方法
  setEnabled: (enabled: boolean) => void
  isEnabled: () => boolean
  showPanel: (show: boolean) => void
  togglePanel: () => boolean
  pause: () => void
  resume: () => void
  getStats: () => any
  clear: () => void
  destroy: () => void
  // 配置
  configure: (options: Partial<VueScanBaseOptions>) => void
  // 状态
  initialized: boolean
  version: string
}

declare global {
  interface Window {
    __VUE_SCAN__: VueScanGlobal
    vueScan: (options?: Partial<VueScanBaseOptions>) => void
  }
}

// ============ 版本号 ============
const VERSION = '0.0.1'

// ============ 自动初始化选项 ============
let autoInitOptions: Partial<VueScanBaseOptions> = {}

// 从 script 标签读取选项
function getScriptOptions(): Partial<VueScanBaseOptions> {
  if (typeof document === 'undefined')
    return {}

  const scripts = document.querySelectorAll('script')
  for (const script of scripts) {
    const src = script.src || ''
    if (src.includes('vue-scan') || src.includes('auto.global')) {
      // 解析 data-* 属性
      const options: Partial<VueScanBaseOptions> = {}

      if (script.dataset.enabled !== undefined) {
        options.enable = script.dataset.enabled !== 'false'
      }
      if (script.dataset.panel !== undefined) {
        options.enablePanel = script.dataset.panel !== 'false'
      }
      if (script.dataset.fps !== undefined) {
        options.enableFPS = script.dataset.fps !== 'false'
      }
      if (script.dataset.performance !== undefined) {
        options.enablePerformance = script.dataset.performance !== 'false'
      }
      if (script.dataset.fpsThreshold) {
        options.fpsWarningThreshold = Number.parseInt(script.dataset.fpsThreshold, 10)
      }
      if (script.dataset.renderThreshold) {
        options.renderTimeThreshold = Number.parseInt(script.dataset.renderThreshold, 10)
      }
      if (script.dataset.position) {
        options.initialPosition = script.dataset.position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
      }

      return options
    }
  }
  return {}
}

;(() => {
  // eslint-disable-next-line node/prefer-global/process
  if (!window.process) {
    // @ts-expect-error browser mock
    // eslint-disable-next-line node/prefer-global/process
    window.process = {
      env: {
        NODE_ENV: 'development',
      },
    }
  }

  // 获取 API
  const api = getAPI()

  // 合并 script 标签选项和已保存的配置
  const scriptOptions = getScriptOptions()
  const savedConfig = loadConfig()
  autoInitOptions = { ...savedConfig, ...scriptOptions }

  if (!window.__VUE_SCAN__) {
    window.__VUE_SCAN__ = {
      plugin,
      createOnBeforeUpdateHook,
      createOnBeforeUnmountHook,
      // API 方法
      ...api,
      // 配置方法
      configure: (options: Partial<VueScanBaseOptions>) => {
        updateConfig(options)
        autoInitOptions = { ...autoInitOptions, ...options }
      },
      // 状态
      initialized: false,
      version: VERSION,
    }
  }

  // 暴露简洁的 vueScan 函数（类似 react-scan 的 scan 函数）
  window.vueScan = (options?: Partial<VueScanBaseOptions>) => {
    if (options) {
      window.__VUE_SCAN__.configure(options)
    }
    initVueScan()
  }
})()

// ============ 初始化 Vue Scan ============

function initVueScan() {
  if (window.__VUE_SCAN__.initialized)
    return

  const options = autoInitOptions

  // 检查是否禁用
  if (options.enable === false) {
    console.warn('[vue-scan] Disabled by configuration')
    return
  }

  // 初始化 Canvas 渲染器
  initCanvasRenderer()

  // 初始化 Instrumentation 系统
  createInstrumentation('vue-scan-auto', {
    trackChanges: true,
    onRender: (_fiber, _renders) => {
      // 渲染回调由 instrumentation 内部处理
    },
  })

  // 设置长渲染回调
  setOnLongRenderCallback((name, time) => {
    recordLongRender(name, time)
  })

  // 初始化 Widget 面板
  if (options.enablePanel !== false) {
    createWidget({
      initialPosition: options.initialPosition || 'bottom-right',
      enableFPS: options.enableFPS !== false,
      enablePerformance: options.enablePerformance !== false,
      fpsWarningThreshold: options.fpsWarningThreshold || 30,
    })
  }

  window.__VUE_SCAN__.initialized = true
  // eslint-disable-next-line no-console
  console.log(`[vue-scan] v${VERSION} initialized`)
}

// Check if the __vue_app__ property exists on the #app node of the page
function injectVueScan(node: HTMLElement) {
  // @ts-expect-error vue internal
  if ((node.__vue_app__ || node.__vue__)) {
    // @ts-expect-error vue internal
    const vueInstance = node.__vue_app__._container._vnode.component as BACE_VUE_INSTANCE

    // 首先初始化 Vue Scan 核心
    initVueScan()

    // @ts-expect-error vue internal
    node.__vue_app__.use(window.__VUE_SCAN__.plugin, autoInitOptions)

    const first = !vueInstance?.__vue_scan_injected__

    if (!first) {
      console.warn(vueInstance)
    }

    function mixinChildren(children: VNodeNormalizedChildren) {
      if (!children) {
        return
      }

      if (typeof children === 'string') {
        return
      }

      if (!Array.isArray(children)) {
        return
      }

      children.forEach((item) => {
        if (typeof item !== 'object') {
          return
        }

        if (item && 'component' in item && item.component) {
          mixin(item.component as BACE_VUE_INSTANCE)
        }
        else if (item && 'children' in item) {
          mixinChildren(item.children)
        }
      })
    }

    function mixin(vueInstance: BACE_VUE_INSTANCE) {
      if (vueInstance.subTree?.el && vueInstance?.__vue_scan_injected__ !== true) {
        const onBeforeUpdate = createOnBeforeUpdateHook(vueInstance)
        const onBeforeUnmount = createOnBeforeUnmountHook(vueInstance)

        if (onBeforeUpdate) {
          if (vueInstance?.bu) {
            vueInstance.bu.push(onBeforeUpdate)
          }
          else {
            vueInstance!.bu = [onBeforeUpdate]
          }
        }

        if (onBeforeUnmount) {
          if (vueInstance?.bum) {
            vueInstance.bum.push(onBeforeUnmount)
          }
          else {
            vueInstance!.bum = [onBeforeUnmount]
          }
        }

        vueInstance.__vue_scan_injected__ = true
      }

      if (!vueInstance?.subTree?.component && vueInstance?.subTree?.children) {
        mixinChildren(vueInstance.subTree.children)
      }
      else if (vueInstance?.subTree?.component) {
        mixin(vueInstance.subTree.component as BACE_VUE_INSTANCE)
      }

      else if (!vueInstance?.subTree && vueInstance?.children) {
        mixinChildren(vueInstance.children)
      }
    }

    mixin(vueInstance)

    if (!first) {
      console.warn('vue scan inject success')
    }

    vueInstance.__vue_scan_injected__ = true
  }
}

function getMountDoms() {
  const elements = Array.from(document.body.children)

  return elements.filter((element) => {
    // @ts-expect-error vue internal
    return (!!element.__vue_app__ || !!element.__vue__)
  }) as HTMLElement[]
}

const documentObserver = new MutationObserver(throttle(() => {
  if (!window.__VUE_SCAN__) {
    return
  }

  const mountDoms = getMountDoms()

  if (mountDoms.length === 0) {
    return
  }

  documentObserver.disconnect()

  mountDoms.forEach((mountDom) => {
    // @ts-expect-error vue internal
    if (mountDom.__vue_app__) {
      // vue3
      documentObserver.disconnect()
      injectVueScan(mountDom)
    }
  })
}, 600))

documentObserver.observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true,
})
