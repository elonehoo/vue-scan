import { afterEach, describe, expect, it, vi } from 'vitest'
import { getScriptOptions } from '../src/core/script-options'

afterEach(() => vi.unstubAllGlobals())

describe('auto-mode script options', () => {
  it('supports server-side option inspection without a document', () => {
    expect(getScriptOptions()).toEqual({})
  })

  it('maps data attributes to the public plugin option names', () => {
    vi.stubGlobal('document', {
      querySelectorAll: () => [
        { src: '/unrelated.js', dataset: { panel: 'true' } },
        { src: '/vue-scan/auto.iife.js', dataset: {
          enabled: 'false',
          panel: 'false',
          fps: 'true',
          performance: 'false',
          fpsThreshold: '24',
          renderThreshold: '32',
          position: 'top-left',
        } },
      ],
    })
    expect(getScriptOptions()).toEqual({
      enable: false,
      enablePanel: false,
      enableFPS: true,
      enablePerformance: false,
      fpsWarningThreshold: 24,
      renderTimeWarningThreshold: 32,
      panelPosition: 'top-left',
    })
  })
})
