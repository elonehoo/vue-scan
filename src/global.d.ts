declare global {
  interface Window {
    __VUE_SCAN__?: import('./auto').VueScanGlobal
  }
}

export {}
