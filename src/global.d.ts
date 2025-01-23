declare global {
  interface Window {
    __VUE_SCAN__?: {
      plugin: typeof import('./index').default
      createOnBeforeUpdateHook: typeof import('./core/hook').createOnBeforeUpdateHook
      createOnBeforeUnmountHook: typeof import('./core/hook').createOnBeforeUnmountHook
    }
  }
}

export {}
