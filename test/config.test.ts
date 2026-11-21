import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  DEFAULT_CONFIG,
  getConfig,
  loadConfig,
  resetConfig,
  toggleEnabled,
  updateConfig,
} from '../src/core/config'

beforeEach(() => {
  vi.useFakeTimers()
  resetConfig()
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('persistent configuration', () => {
  it('returns independent defaults without browser storage', () => {
    const first = loadConfig()
    first.enabled = false
    expect(loadConfig()).toEqual(DEFAULT_CONFIG)
  })

  it('loads versioned settings, rejects obsolete or malformed storage, and debounces updates', async () => {
    let stored = JSON.stringify({ _version: 1, enabled: false })
    const localStorage = {
      getItem: vi.fn(() => stored),
      setItem: vi.fn(),
    }
    vi.stubGlobal('window', { localStorage })
    vi.stubGlobal('localStorage', localStorage)
    expect(loadConfig()).toMatchObject({ ...DEFAULT_CONFIG, enabled: false })
    stored = JSON.stringify({ _version: 0, enabled: false })
    expect(loadConfig()).toEqual(DEFAULT_CONFIG)
    stored = '{bad json'
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(loadConfig()).toEqual(DEFAULT_CONFIG)
    expect(warning).toHaveBeenCalledOnce()
    updateConfig({ fpsWarningThreshold: 20 })
    expect(toggleEnabled()).toBe(false)
    await nextTick()
    vi.advanceTimersByTime(299)
    expect(localStorage.setItem).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(localStorage.setItem).toHaveBeenCalledOnce()
    const [key, json] = localStorage.setItem.mock.calls[0]
    expect(key).toBe('vue-scan-config')
    expect(JSON.parse(json)).toMatchObject({ _version: 1, enabled: false, fpsWarningThreshold: 20 })
    resetConfig()
    expect(getConfig()).toEqual(DEFAULT_CONFIG)
  })
})
