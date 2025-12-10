/**
 * Vue Scan Widget - 统一的调试面板
 * 模仿 react-scan 的设计，提供一个可拖拽、可折叠的调试面板
 */

import type { App } from 'vue'
import { createApp } from 'vue'
import WidgetApp from './WidgetApp.vue'

let widgetInstance: App | null = null
let widgetContainer: HTMLDivElement | null = null

export interface WidgetOptions {
  /** 初始位置 */
  initialPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** 是否启用 FPS 监控 */
  enableFPS?: boolean
  /** 是否启用性能监控 */
  enablePerformance?: boolean
  /** FPS 警告阈值 */
  fpsWarningThreshold?: number
}

export function createWidget(options: WidgetOptions = {}) {
  if (widgetContainer) {
    return widgetContainer
  }

  // 创建 Shadow DOM 容器
  widgetContainer = document.createElement('div')
  widgetContainer.id = 'vue-scan-widget-root'
  widgetContainer.setAttribute('data-vue-scan', 'true')

  // 使用 Shadow DOM 隔离样式
  const shadowRoot = widgetContainer.attachShadow({ mode: 'open' })

  // 创建挂载点
  const mountPoint = document.createElement('div')
  mountPoint.id = 'vue-scan-mount'
  shadowRoot.appendChild(mountPoint)

  // 注入样式
  const styleElement = document.createElement('style')
  styleElement.textContent = getWidgetStyles()
  shadowRoot.appendChild(styleElement)

  document.body.appendChild(widgetContainer)

  // 创建 Vue 应用
  widgetInstance = createApp(WidgetApp, {
    options,
  })

  widgetInstance.mount(mountPoint)

  return widgetContainer
}

export function destroyWidget() {
  if (widgetInstance) {
    widgetInstance.unmount()
    widgetInstance = null
  }
  if (widgetContainer) {
    widgetContainer.remove()
    widgetContainer = null
  }
}

function getWidgetStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      all: initial;
      font-family: 'SF Mono', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #fff;
    }

    .vue-scan-widget {
      position: fixed;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }

    .vue-scan-widget * {
      box-sizing: border-box;
    }

    /* Widget 主容器 */
    .widget-container {
      background: rgba(10, 10, 10, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-width: 280px;
      max-width: 400px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .widget-container.collapsed {
      min-width: auto;
      max-width: auto;
    }

    /* 拖拽手柄区域 */
    .drag-handle {
      cursor: move;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(66, 184, 131, 0.1);
      border-bottom: 1px solid rgba(66, 184, 131, 0.2);
    }

    .drag-handle:hover {
      background: rgba(66, 184, 131, 0.15);
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #42b883;
      box-shadow: 0 0 8px #42b883;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .logo-text {
      font-weight: 600;
      font-size: 13px;
      color: #42b883;
    }

    .header-controls {
      display: flex;
      gap: 4px;
    }

    .header-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .header-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.3);
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.2s;
    }

    .toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .toolbar-btn.active {
      background: rgba(66, 184, 131, 0.2);
      border-color: #42b883;
      color: #42b883;
    }

    .toolbar-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Toggle 开关 */
    .toggle-switch {
      position: relative;
      width: 36px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-switch.active {
      background: rgba(66, 184, 131, 0.4);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch.active::after {
      transform: translateX(16px);
      background: #42b883;
    }

    /* 内容区域 */
    .content-area {
      flex: 1;
      overflow: hidden;
      max-height: 400px;
    }

    .content-scroll {
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .content-scroll::-webkit-scrollbar {
      width: 4px;
    }

    .content-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .content-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }

    /* 面板标签页 */
    .tabs {
      display: flex;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
    }

    .tab {
      flex: 1;
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tab:hover {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.8);
    }

    .tab.active {
      color: #42b883;
      background: rgba(66, 184, 131, 0.1);
      border-bottom: 2px solid #42b883;
    }

    /* FPS 区域 */
    .fps-section {
      padding: 12px;
    }

    .fps-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }

    .fps-label {
      color: rgba(255, 255, 255, 0.5);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .fps-value {
      font-size: 28px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      transition: color 0.3s;
    }

    .fps-value.good { color: #42b883; }
    .fps-value.warning { color: #ffd93d; }
    .fps-value.bad { color: #ff6b6b; }

    .fps-stats {
      display: flex;
      gap: 16px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
    }

    .fps-chart {
      height: 48px;
      margin-top: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      overflow: hidden;
    }

    /* 性能指标 */
    .metrics-section {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
    }

    .metric-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 11px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .metric-value.good { color: #42b883; }
    .metric-value.warning { color: #ffd93d; }
    .metric-value.bad { color: #ff6b6b; }

    /* 内存进度条 */
    .memory-bar {
      margin-top: 8px;
    }

    .memory-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
    }

    .memory-bar-track {
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .memory-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s, background 0.3s;
    }

    /* 组件列表 */
    .components-section {
      padding: 8px;
    }

    .component-item {
      padding: 8px 10px;
      margin-bottom: 4px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .component-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .component-item.selected {
      background: rgba(66, 184, 131, 0.15);
      border: 1px solid rgba(66, 184, 131, 0.3);
    }

    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .component-name {
      font-weight: 600;
      font-size: 12px;
      color: #fff;
    }

    .component-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      padding: 0 6px;
      background: rgba(66, 184, 131, 0.2);
      border-radius: 9px;
      font-size: 10px;
      font-weight: 600;
      color: #42b883;
    }

    .component-details {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
    }

    .component-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    /* 折叠状态 */
    .collapsed-bar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: rgba(10, 10, 10, 0.95);
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.2s;
    }

    .collapsed-bar:hover {
      background: rgba(20, 20, 20, 0.95);
    }

    .collapsed-fps {
      font-size: 14px;
      font-weight: 700;
      margin-left: 8px;
    }

    /* 调整大小手柄 */
    .resize-handle {
      position: absolute;
      background: transparent;
    }

    .resize-handle-corner {
      width: 12px;
      height: 12px;
    }

    .resize-handle-edge {
      width: 100%;
      height: 4px;
    }

    /* 空状态 */
    .empty-state {
      padding: 24px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
    }

    .empty-state-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .empty-state-text {
      font-size: 12px;
    }

    /* 动画 */
    @keyframes flash {
      0% { background: rgba(66, 184, 131, 0.3); }
      100% { background: transparent; }
    }

    .flash {
      animation: flash 0.5s ease-out;
    }

    /* 搜索框 */
    .search-input {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      outline: none;
      transition: all 0.2s;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .search-input:focus {
      border-color: #42b883;
      background: rgba(66, 184, 131, 0.05);
    }

    /* 通知徽章 */
    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 14px;
      height: 14px;
      padding: 0 4px;
      background: #ff6b6b;
      border-radius: 7px;
      font-size: 9px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `
}
