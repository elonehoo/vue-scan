/**
 * Inspector 状态管理
 */

import type { ComponentInfo, InspectorState } from './types'

type StateListener = (state: InspectorState) => void
type ComponentListener = (info: ComponentInfo | null) => void

class InspectorStore {
  private _state: InspectorState = { kind: 'inspect-off' }
  private _selectedComponent: ComponentInfo | null = null
  private _stateListeners: Set<StateListener> = new Set()
  private _componentListeners: Set<ComponentListener> = new Set()

  get state(): InspectorState {
    return this._state
  }

  set state(newState: InspectorState) {
    this._state = newState
    this.notifyStateListeners()
  }

  get selectedComponent(): ComponentInfo | null {
    return this._selectedComponent
  }

  set selectedComponent(info: ComponentInfo | null) {
    this._selectedComponent = info
    this.notifyComponentListeners()
  }

  subscribeState(listener: StateListener): () => void {
    this._stateListeners.add(listener)
    return () => this._stateListeners.delete(listener)
  }

  subscribeComponent(listener: ComponentListener): () => void {
    this._componentListeners.add(listener)
    return () => this._componentListeners.delete(listener)
  }

  private notifyStateListeners(): void {
    for (const listener of this._stateListeners) {
      listener(this._state)
    }
  }

  private notifyComponentListeners(): void {
    for (const listener of this._componentListeners) {
      listener(this._selectedComponent)
    }
  }

  reset(): void {
    this._state = { kind: 'inspect-off' }
    this._selectedComponent = null
    this.notifyStateListeners()
    this.notifyComponentListeners()
  }
}

export const inspectorStore = new InspectorStore()
