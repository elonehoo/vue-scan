import type { VNodeNormalizedChildren } from 'vue'
import { throttle } from 'lodash-es'
import { type BACE_VUE_INSTANCE, createOnBeforeUnmountHook, createOnBeforeUpdateHook } from './core'
import plugin from './index'

(() => {
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

  if (!window.__VUE_SCAN__) {
    window.__VUE_SCAN__ = {
      plugin,
      createOnBeforeUpdateHook,
      createOnBeforeUnmountHook,
    }
  }
})()

// Check if the __vue_app__ property exists on the #app node of the page
function injectVueScan(node: HTMLElement) {
  // @ts-expect-error vue internal
  if ((node.__vue_app__ || node.__vue__)) {
    // @ts-expect-error vue internal
    const vueInstance = node.__vue_app__._container._vnode.component as BACE_VUE_INSTANCE

    // @ts-expect-error vue internal
    node.__vue_app__.use(window.__VUE_SCAN__.plugin)

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
