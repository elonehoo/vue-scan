import type { VueAppInstance } from '@vue/devtools-kit'
import type { Plugin } from 'vue'
import type { VueScanBaseOptions, VueScanOptions } from './types'
import { createOnBeforeUnmountHook, createOnBeforeUpdateHook } from './core/index'
import { isDev } from './shared/utils'

const plugin: Plugin<VueScanOptions> = {
  install: (app, options?: VueScanBaseOptions) => {
    const { enable = isDev() } = options || {}

    if (!enable) {
      return
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
  },
}

export default plugin

export * from './types'
