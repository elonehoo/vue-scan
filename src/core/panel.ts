import { getComponentBoundingRect } from '../shared/vue'
import { type ComponentBoundingRect, highlight } from './highlight'

interface PropChange {
  key: string
  oldValue: any
  newValue: any
  timestamp: number
}

interface PanelData {
  componentName: string
  renderCount: number
  renderTime: number
  lastRenderTime: number
  averageRenderTime: number
  totalRenderTime: number
  props: Record<string, any> // 当前props值
  propsHistory: PropChange[] // props变化历史
  data: Record<string, any> // 当前data值
  dataHistory: PropChange[] // data变化历史
}

class DebugPanel {
  private panel: HTMLElement
  private componentData: Map<string, PanelData> = new Map()
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private selectedUuid: string | null = null
  private filter: string = ''
  private expandedComponents: Set<string> = new Set()
  private isAllExpanded = false // 添加跟踪全部展开状态

  constructor() {
    this.panel = document.createElement('div')
    this.initializePanel()
    this.setupDragging()
  }

  private initializePanel() {
    this.panel.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 12px;
      z-index: 10000;
      cursor: move;
      max-height: 80vh;
      overflow-y: auto;
    `
    this.panel.innerHTML = `
      <div style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 8px;">Vue Scan Debug Panel</div>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button id="clear-history" style="padding: 4px 8px; border-radius: 4px; border: none; background: #666;">
            Clear History
          </button>
          <button id="toggle-all" style="padding: 4px 8px; border-radius: 4px; border: none; background: #666;">
            Expand All
          </button>
        </div>
        <input
          type="text"
          id="component-filter"
          placeholder="Filter components..."
          style="width: 100%; padding: 4px; border-radius: 4px; border: 1px solid #666; background: rgba(255,255,255,0.1); color: white;"
        >
      </div>
      <div id="vue-scan-content"></div>
    `
    document.body.appendChild(this.panel)
    this.setupEventListeners()
  }

  private setupDragging() {
    this.panel.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.dragStartX = e.clientX - this.panel.offsetLeft
      this.dragStartY = e.clientY - this.panel.offsetTop
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging)
        return
      const left = e.clientX - this.dragStartX
      const top = e.clientY - this.dragStartY
      this.panel.style.left = `${left}px`
      this.panel.style.top = `${top}px`
      this.panel.style.right = 'auto'
    })

    document.addEventListener('mouseup', () => {
      this.isDragging = false
    })
  }

  private setupEventListeners() {
    const clearBtn = this.panel.querySelector('#clear-history')
    const toggleBtn = this.panel.querySelector('#toggle-all')
    const filterInput = this.panel.querySelector('#component-filter')

    clearBtn?.addEventListener('click', () => {
      this.componentData.forEach((data) => {
        data.propsHistory = []
        data.dataHistory = []
      })
      this.render()
    })

    toggleBtn?.addEventListener('click', () => {
      this.isAllExpanded = !this.isAllExpanded
      if (this.isAllExpanded) {
        // 展开所有
        Array.from(this.componentData.keys()).forEach((uuid) => {
          this.expandedComponents.add(uuid)
        })
        toggleBtn.textContent = 'Collapse All'
      }
      else {
        // 收起所有
        this.expandedComponents.clear()
        toggleBtn.textContent = 'Expand All'
      }
      this.render()
    })

    filterInput?.addEventListener('input', (e) => {
      this.filter = (e.target as HTMLInputElement).value.toLowerCase()
      this.render()
    })

    // 委托事件监听
    this.panel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const componentEl = target.closest('[data-component-uuid]')
      if (componentEl) {
        const uuid = componentEl.getAttribute('data-component-uuid')
        if (uuid) {
          if (target.classList.contains('component-header')) {
            this.toggleExpand(uuid)
          }
          else if (target.classList.contains('locate-button')) {
            this.highlightComponent(uuid)
          }
        }
      }
    })
  }

  private toggleExpand(uuid: string) {
    if (this.expandedComponents.has(uuid)) {
      this.expandedComponents.delete(uuid)
    }
    else {
      this.expandedComponents.add(uuid)
    }
    this.render()
  }

  private highlightComponent(uuid: string) {
    this.selectedUuid = this.selectedUuid === uuid ? null : uuid
    const data = this.componentData.get(uuid)

    if (!data) 
return

    const targetElement = document.querySelector(`[data-vue-scan-id="${uuid}"]`)
    if (!targetElement) {
      console.warn(`[vue-scan] Cannot find element with id ${uuid}`)
      return
    }

    // 定位到组件
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    // 使用面板状态来控制高亮
    if (this.selectedUuid === uuid) {
      this.addHighlight(targetElement, uuid)
    }
 else {
      this.removeHighlight(targetElement, uuid)
    }

    this.render()
  }

  // 新增：添加高亮样式
  private addHighlight(element: Element, uuid: string) {
    element.setAttribute('data-vue-scan-highlighted', 'true')
    this.showComponentLabel(element, uuid)
    this.updateHighlightStyle()
  }

  // 新增：移除高亮样式
  private removeHighlight(element: Element, uuid: string) {
    element.removeAttribute('data-vue-scan-highlighted')
    this.removeComponentLabel(uuid)
    this.updateHighlightStyle()
  }

  // 新增：更新所有高亮样式
  private updateHighlightStyle() {
    // 移除旧的样式
    const oldStyle = document.getElementById('vue-scan-highlight-style')
    if (oldStyle) 
oldStyle.remove()

    // 添加新的样式
    const style = document.createElement('style')
    style.id = 'vue-scan-highlight-style'
    style.textContent = `
      [data-vue-scan-highlighted="true"] {
        outline: 2px solid #42b883 !important;
        outline-offset: 2px !important;
      }
    `
    document.head.appendChild(style)
  }

  private showComponentLabel(element: Element, uuid: string) {
    const label = document.createElement('div')
    label.id = `vue-scan-label-${uuid}`
    label.style.cssText = `
      position: fixed;
      background: #42b883;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 10000;
    `

    const name = element.getAttribute('data-vue-scan-name') || 'Unknown'
    const data = this.componentData.get(uuid)
    label.textContent = `${name} (${data?.renderCount || 0} renders)`

    document.body.appendChild(label)
    this.updateLabelPosition(element, label)

    // 监听滚动和调整大小事件
    window.addEventListener('scroll', () => this.updateLabelPosition(element, label))
    window.addEventListener('resize', () => this.updateLabelPosition(element, label))
  }

  private updateLabelPosition(element: Element, label: HTMLElement) {
    const rect = element.getBoundingClientRect()
    label.style.top = `${rect.top - label.offsetHeight - 4}px`
    label.style.left = `${rect.left}px`
  }

  private removeComponentLabel(uuid: string) {
    const label = document.getElementById(`vue-scan-label-${uuid}`)
    if (label) {
      label.remove()
    }
  }

  updateComponentData(uuid: string, data: Partial<PanelData>) {
    let componentInfo = this.componentData.get(uuid)
    if (!componentInfo) {
      componentInfo = {
        componentName: data.componentName || '',
        renderCount: 0,
        renderTime: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        totalRenderTime: 0,
        props: {},
        propsHistory: [],
        data: {},
        dataHistory: [],
      }
      this.componentData.set(uuid, componentInfo)
    }

    // 更新数据
    Object.assign(componentInfo, {
      ...data,
      renderCount: (componentInfo.renderCount || 0) + 1,
      totalRenderTime: (componentInfo.totalRenderTime || 0) + (data.renderTime || 0),
    })

    // 计算平均渲染时间
    componentInfo.averageRenderTime = componentInfo.totalRenderTime / componentInfo.renderCount

    this.render()
  }

  private render() {
    const content = document.getElementById('vue-scan-content')
    if (!content)
      return

    const filteredData = Array.from(this.componentData.entries())
      .filter(([_uuid, data]) =>
        data.componentName.toLowerCase().includes(this.filter),
      )

    const html = filteredData
      .map(([uuid, data]) => `
        <div
          class="component-item"
          data-component-uuid="${uuid}"
          style="
            margin-bottom: 12px;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            ${this.selectedUuid === uuid ? 'border: 1px solid #fff;' : ''}
          "
        >
          <div class="component-header" style="display: flex; justify-content: space-between; cursor: pointer;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${data.componentName}
              <span style="opacity: 0.5; font-size: 0.9em;">(${data.renderCount})</span>
            </div>
            <button
              class="locate-button"
              style="padding: 2px 6px; border-radius: 3px; border: none; background: #666;"
            >
              Locate
            </button>
          </div>
          ${this.expandedComponents.has(uuid) ? this.renderComponentDetails(data) : ''}
        </div>
      `)
      .join('')

    content.innerHTML = html
  }

  private renderComponentDetails(data: PanelData) {
    return `
      <div style="margin-top: 8px; font-size: 11px;">
        <div>Last render: ${data.lastRenderTime?.toFixed(2)}ms</div>
        <div>Average: ${data.averageRenderTime?.toFixed(2)}ms</div>
        <div>Total: ${data.totalRenderTime?.toFixed(2)}ms</div>
        ${this.renderProps(data)}
        ${this.renderPropsHistory(data)}
      </div>
    `
  }

  private renderProps(data: PanelData) {
    if (!Object.keys(data.props || {}).length)
      return ''

    return `
      <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
        <div style="font-weight: bold; margin-bottom: 4px;">Props:</div>
        ${Object.entries(data.props || {})
          .map(([key, value]) => `
            <div style="display: flex; justify-content: space-between;">
              <span>${key}:</span>
              <span>${this.formatValue(value)}</span>
            </div>
          `)
          .join('')}
      </div>
    `
  }

  private renderPropsHistory(data: PanelData) {
    if (!data.propsHistory?.length)
      return ''

    return `
      <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
        <div style="font-weight: bold; margin-bottom: 4px;">Props History:</div>
        ${data.propsHistory.slice(-5).map(change => `
          <div style="font-size: 11px; margin-bottom: 4px;">
            ${change.key}: ${this.formatValue(change.oldValue)} → ${this.formatValue(change.newValue)}
          </div>
        `).join('')}
      </div>
    `
  }

  private formatValue(value: any): string {
    if (value === null)
      return 'null'
    if (value === undefined)
      return 'undefined'
    if (typeof value === 'object') {
      return JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
    }
    return String(value)
  }

  destroy() {
    // 清理高亮样式
    const styleElement = document.getElementById('vue-scan-highlight-style')
    if (styleElement) {
      styleElement.remove()
    }

    // 清理所有高亮状态
    document.querySelectorAll('[data-vue-scan-highlighted]').forEach((el) => {
      el.removeAttribute('data-vue-scan-highlighted')
    })

    // 清理所有标签
    document.querySelectorAll('[id^="vue-scan-label-"]').forEach(el => el.remove())

    // 移除面板
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel)
    }
  }
}

let debugPanel: DebugPanel | null = null // 修改为初始值为 null

export function initDebugPanel() {
  if (!debugPanel) {
    debugPanel = new DebugPanel()
  }
  return debugPanel
}

window.addEventListener('unload', () => {
  if (debugPanel) {
    debugPanel.destroy()
    debugPanel = null
  }
})

export function updatePanelData(uuid: string, data: Partial<PanelData>) {
  if (!debugPanel) {
    debugPanel = initDebugPanel()
  }
  debugPanel.updateComponentData(uuid, data)
}

export type { PanelData }
