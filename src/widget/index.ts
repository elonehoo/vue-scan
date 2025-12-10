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
    /* React-Scan Style Theme - Purple & Dark */
    :host {
      all: initial;
      font-family: Menlo, Consolas, Monaco, 'Liberation Mono', 'Lucida Console', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #fff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      outline: none !important;
    }

    *::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    *::-webkit-scrollbar-track {
      background: transparent;
    }

    *::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    *::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.4);
    }

    .vue-scan-widget {
      position: fixed;
      z-index: 2147483647;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }

    /* Main Widget Container - React-Scan Style */
    .widget-container {
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-width: 320px;
      max-width: 550px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Drag Handle / Header - React-Scan Style */
    .drag-handle {
      cursor: move;
      padding: 0 12px;
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #000;
      border-bottom: 1px solid #222;
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
      background: #8e61e3;
      box-shadow: 0 0 8px rgba(142, 97, 227, 0.5);
    }

    .logo-text {
      font-weight: 500;
      font-size: 13px;
      color: #fff;
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
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .header-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    /* Toolbar - React-Scan Style */
    .toolbar {
      display: flex;
      align-items: center;
      min-height: 36px;
      max-height: 36px;
      padding: 0 8px;
      gap: 4px;
      border-bottom: 1px solid #222;
      background: #0a0a0a;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 8px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: #999;
      cursor: pointer;
      transition: all 0.15s;
    }

    .toolbar-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .toolbar-btn.active {
      color: #8e61e3;
    }

    .toolbar-btn.active:hover {
      background: rgba(142, 97, 227, 0.1);
    }

    .toolbar-divider {
      width: 1px;
      height: 16px;
      background: #333;
      margin: 0 4px;
    }

    /* Toggle Switch - React-Scan Style */
    .toggle-switch {
      position: relative;
      width: 32px;
      height: 18px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      background: #666;
      border: 2px solid #444;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .toggle-switch.active {
      background: rgba(142, 97, 227, 0.4);
    }

    .toggle-switch.active::after {
      transform: translateX(14px);
      background: #fff;
      border-color: #8e61e3;
    }

    /* Tabs - React-Scan Style */
    .tabs {
      display: flex;
      background: #0a0a0a;
      border-bottom: 1px solid #222;
    }

    .tab {
      flex: 1;
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #666;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tab:hover {
      color: #888;
      background: rgba(255, 255, 255, 0.02);
    }

    .tab.active {
      color: #8e61e3;
      border-bottom-color: #8e61e3;
    }

    /* Content Area - React-Scan Style */
    .content-area {
      flex: 1;
      overflow: hidden;
      max-height: 350px;
      background: #0a0a0a;
    }

    .content-scroll {
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Section Header - React-Scan Style */
    .section-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: 28px;
      background: #0a0a0a;
      border-bottom: 1px solid #222;
      color: #888;
      font-size: 11px;
    }

    /* FPS Section - React-Scan Style */
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
      color: #666;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .fps-value {
      font-size: 24px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      transition: color 0.2s;
    }

    .fps-value.good { color: #22c55e; }
    .fps-value.warning { color: #f59e0b; }
    .fps-value.bad { color: #ef4444; }

    .fps-stats {
      display: flex;
      gap: 16px;
      font-size: 10px;
      color: #666;
    }

    .fps-chart {
      height: 40px;
      margin-top: 8px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
      overflow: hidden;
    }

    /* Metrics Section - React-Scan Style */
    .metrics-section {
      padding: 12px;
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
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 4px;
      border: 1px solid transparent;
      transition: all 0.15s;
    }

    .metric-item:hover {
      border-color: #333;
    }

    .metric-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 12px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .metric-value.good { color: #22c55e; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.bad { color: #ef4444; }

    /* Memory Bar - React-Scan Style */
    .memory-bar {
      margin-top: 8px;
    }

    .memory-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
      color: #666;
    }

    .memory-bar-track {
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      overflow: hidden;
    }

    .memory-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, #8e61e3 0%, #a855f7 100%);
      transition: width 0.3s;
    }

    /* Components Section - React-Scan Style */
    .components-section {
      padding: 8px;
    }

    .search-container {
      padding: 0 4px 8px;
    }

    .search-input {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid #333;
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      font-family: inherit;
      transition: all 0.15s;
    }

    .search-input::placeholder {
      color: #555;
      font-style: italic;
    }

    .search-input:focus {
      border-color: #8e61e3;
      background: rgba(142, 97, 227, 0.05);
    }

    .component-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .component-item {
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .component-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: #333;
    }

    .component-item.selected {
      background: rgba(142, 97, 227, 0.1);
      border-color: rgba(142, 97, 227, 0.3);
    }

    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .component-name {
      font-weight: 500;
      font-size: 12px;
      color: #fff;
    }

    .component-count {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      color: #a855f7;
    }

    .count-badge {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 500;
      color: #a855f7;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 4px;
    }

    .component-details {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #222;
      font-size: 11px;
      color: #666;
    }

    .component-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .component-detail-row .label {
      color: #555;
    }

    .component-detail-row .value {
      color: #888;
    }

    /* Collapsed Bar - React-Scan Style */
    .collapsed-bar {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition: all 0.2s;
    }

    .collapsed-bar:hover {
      background: #0a0a0a;
    }

    .collapsed-fps {
      font-size: 13px;
      font-weight: 600;
      margin-left: 8px;
      font-variant-numeric: tabular-nums;
    }

    .collapsed-fps.good { color: #22c55e; }
    .collapsed-fps.warning { color: #f59e0b; }
    .collapsed-fps.bad { color: #ef4444; }

    /* Inspector Section - React-Scan Style */
    .inspector-section {
      padding: 12px;
    }

    .inspector-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #666;
      text-align: center;
    }

    .inspector-hint-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .inspector-hint-text {
      font-size: 12px;
      line-height: 1.6;
    }

    .inspector-component {
      padding: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid #333;
      border-radius: 6px;
    }

    .inspector-component-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 12px;
    }

    .inspector-component-tag {
      padding: 2px 6px;
      background: rgba(142, 97, 227, 0.2);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      color: #8e61e3;
    }

    .inspector-props {
      margin-top: 12px;
    }

    .inspector-props-title {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
    }

    .inspector-prop {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11px;
      border-bottom: 1px solid #222;
    }

    .inspector-prop:last-child {
      border-bottom: none;
    }

    .inspector-prop-name {
      color: #a855f7;
    }

    .inspector-prop-value {
      color: #888;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Empty State - React-Scan Style */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #555;
      text-align: center;
    }

    .empty-state-icon {
      font-size: 24px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: 12px;
      color: #666;
    }

    /* Flash Animation - React-Scan Style */
    @keyframes countFlash {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); background: rgba(168, 85, 247, 0.2); }
      100% { transform: scale(1); }
    }

    .count-flash {
      animation: countFlash 0.3s ease;
    }

    /* Notification Badge - React-Scan Style */
    .notification-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      min-width: 12px;
      height: 12px;
      padding: 0 3px;
      background: #ef4444;
      border-radius: 6px;
      font-size: 8px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Severity Colors */
    .severity-low { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .severity-medium { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .severity-high { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

    /* Property View - React-Scan Style */
    .property-view {
      font-size: 11px;
    }

    .property-row {
      display: flex;
      padding: 4px 8px;
      margin-left: 12px;
      border-left: 1px solid #333;
    }

    .property-key {
      color: #a855f7;
      margin-right: 8px;
    }

    .property-value {
      color: #888;
    }

    .property-value.string { color: #22c55e; }
    .property-value.number { color: #60a5fa; }
    .property-value.boolean { color: #f59e0b; }
    .property-value.null { color: #666; font-style: italic; }

    /* Button Styles */
    button {
      font-family: inherit;
      cursor: pointer;
    }

    /* Tab with Notification Badge - React-Scan Style */
    .notification-tab {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .notification-icon {
      font-size: 12px;
    }

    .notification-tab .notification-badge {
      position: relative;
      top: 0;
      right: 0;
      min-width: 16px;
      height: 14px;
      padding: 0 4px;
      font-size: 9px;
    }

    /* Notification Section - React-Scan Style */
    .notification-section {
      padding: 0;
    }

    .notification-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #0a0a0a;
      border-bottom: 1px solid #222;
    }

    .notification-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #fff;
      font-weight: 500;
    }

    .notification-title .badge {
      min-width: 16px;
      height: 14px;
      padding: 0 4px;
      border-radius: 7px;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .badge-high {
      background: #ef4444;
      color: #fff;
    }

    .badge-warning {
      background: #f59e0b;
      color: #000;
    }

    .clear-btn {
      background: transparent;
      border: 1px solid #333;
      border-radius: 4px;
      color: #888;
      font-size: 10px;
      padding: 4px 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .clear-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-color: #444;
    }

    .event-list {
      max-height: 280px;
      overflow-y: auto;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid #1a1a1a;
      cursor: pointer;
      transition: background 0.15s;
    }

    .event-item:hover {
      background: #111;
    }

    .event-item.selected {
      background: #18181b;
    }

    .event-icon {
      font-size: 14px;
      flex-shrink: 0;
    }

    .event-info {
      flex: 1;
      min-width: 0;
    }

    .event-name {
      font-size: 11px;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-meta {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
    }

    .event-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 13px;
      color: #888;
      margin-bottom: 8px;
    }

    .empty-hint {
      font-size: 11px;
      color: #555;
    }

    /* Event Detail - React-Scan Style */
    .event-detail {
      background: #0a0a0a;
      border-top: 1px solid #222;
      padding: 12px;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .detail-kind {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-severity {
      font-size: 10px;
      font-weight: 600;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }

    .detail-label {
      color: #666;
    }

    .detail-value {
      color: #fff;
      font-family: 'Menlo', 'Consolas', monospace;
    }

    .detail-subtitle {
      font-size: 10px;
      color: #888;
      margin-top: 8px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-renders {
      margin-top: 8px;
    }

    .render-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      background: #111;
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 11px;
    }

    .render-name {
      flex: 1;
      color: #8e61e3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .render-count {
      color: #666;
      font-size: 10px;
    }

    .render-time {
      color: #f59e0b;
      font-family: 'Menlo', 'Consolas', monospace;
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .pulse {
      animation: pulse 2s ease-in-out infinite;
    }
  `
}
