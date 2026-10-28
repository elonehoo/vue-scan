import type { VueScanBaseOptions } from '../types'

// 从 script 标签读取选项
export function getScriptOptions(): Partial<VueScanBaseOptions> {
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
        options.renderTimeWarningThreshold = Number.parseInt(script.dataset.renderThreshold, 10)
      }
      if (script.dataset.position) {
        options.panelPosition = script.dataset.position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
      }

      return options
    }
  }
  return {}
}
