import type { VueAppInstance } from '@vue/devtools-kit'
import type { Plugin } from 'vue'
import type { VueScanBaseOptions, VueScanOptions } from './types'
import { destroyCanvasRenderer, initCanvasRenderer } from './core/canvas-renderer'
import { createOnBeforeUnmountHook, createOnBeforeUpdateHook } from './core/index'
import { isDev } from './shared/utils'
import { createWidget, destroyWidget } from './widget'

const plugin: Plugin<VueScanOptions> = {
  install: (app, options?: VueScanBaseOptions) => {
    const {
      enable = isDev(),
      enablePanel = true, // 默认启用面板
      enableFPS = true, // 默认启用 FPS 监控
      enablePerformance = true, // 默认启用性能监控
      fpsWarningThreshold = 30,
    } = options || {}

    if (!enable) {
      return
    }

    // 初始化 Canvas 渲染器（用于丝滑高亮效果）
    initCanvasRenderer()

    // 初始化统一的 Widget 面板
    if (enablePanel) {
      createWidget({
        initialPosition: 'bottom-right',
        enableFPS,
        enablePerformance,
        fpsWarningThreshold,
      })
    }

    app.mixin({
      mounted() {
        const instance = (() => {
          return (this as any).$
        })() as VueAppInstance

        if (!instance.__bu) {
          instance.__bu = createOnBeforeUpdateHook(instance, options)
        }

        if (!instance.__bum) {
          instance.__bum = createOnBeforeUnmountHook(instance)
        }

        instance.__vue_scan_injected__ = true
      },
      beforeUpdate() {
        const instance = (() => {
          return (this as any).$
        })() as VueAppInstance

        instance.__bu?.()
      },
      beforeUnmount() {
        const instance = (() => {
          return (this as any).$
        })() as VueAppInstance

        instance.__bum?.()
      },
    })

    // 页面卸载时清理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        destroyWidget()
        destroyCanvasRenderer()
      })
    }
  },
}

export default plugin

export * from './core/canvas-renderer'
export * from './core/fps'
export * from './core/performance'
export * from './types'
export * from './widget'
