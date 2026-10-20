import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addUpdateListener,
  clearAllComponentData,
  getAllComponentData,
  getComponentData,
  getRecentComponents,
  removeComponentData,
  updateComponentRenderData,
} from '../src/shared/store'

beforeEach(() => clearAllComponentData())

describe('component render store', () => {
  it('accumulates render timings, notifies listeners, and unsubscribes', () => {
    const listener = vi.fn()
    const unsubscribe = addUpdateListener(listener)
    updateComponentRenderData('counter', { componentName: 'Counter', renderTime: 10 })
    updateComponentRenderData('counter', { renderTime: 20 })
    expect(getComponentData('counter')).toMatchObject({
      componentName: 'Counter',
      renderCount: 2,
      renderTime: 20,
      totalRenderTime: 30,
      averageRenderTime: 15,
    })
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith('counter', expect.objectContaining({ renderCount: 2 }))
    unsubscribe()
    updateComponentRenderData('counter', { renderTime: 0 })
    expect(listener).toHaveBeenCalledTimes(2)
    expect(getComponentData('counter')?.averageRenderTime).toBe(10)
  })

  it('bounds recent entries, moves repeated entries to the front, and cleans up', () => {
    for (let index = 0; index < 60; index++)
      updateComponentRenderData(String(index), { componentName: `Counter${index}` })
    expect(getRecentComponents()).toHaveLength(50)
    expect(getRecentComponents()[0]).toBe('59')
    expect(getRecentComponents()[49]).toBe('10')
    updateComponentRenderData('25', {})
    expect(getRecentComponents()[0]).toBe('25')
    expect(getRecentComponents().filter(id => id === '25')).toHaveLength(1)
    removeComponentData('25')
    expect(getComponentData('25')).toBeUndefined()
    expect(getRecentComponents()).not.toContain('25')
    clearAllComponentData()
    expect(getAllComponentData().size).toBe(0)
    expect(getRecentComponents()).toEqual([])
  })
})
