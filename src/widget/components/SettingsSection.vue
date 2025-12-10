<script setup lang="ts">
/**
 * Settings Section - 设置面板
 * 配置持久化和偏好设置
 */
import { computed } from 'vue'
import {
  resetConfig,
  setConfigValue,
  useConfig,
} from '../../core/config'

const config = useConfig()

// 高亮颜色选项
const colorOptions = [
  { label: 'Purple', value: '#8E61E3' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Orange', value: '#F59E0B' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Cyan', value: '#06B6D4' },
]

// 位置选项
const positionOptions = [
  { label: 'Top Left', value: 'top-left' },
  { label: 'Top Right', value: 'top-right' },
  { label: 'Bottom Left', value: 'bottom-left' },
  { label: 'Bottom Right', value: 'bottom-right' },
] as const

// 更新配置
function handleToggle(key: 'enabled' | 'showPanel' | 'enableFPS' | 'enablePerformance' | 'audioNotifications' | 'showComponentName' | 'showRenderCount' | 'showRenderTime') {
  setConfigValue(key, !config.value[key])
}

function handleColorChange(color: string) {
  setConfigValue('highlightColor', color)
}

function handlePositionChange(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') {
  setConfigValue('panelPosition', position)
}

function handleThresholdChange(key: 'fpsWarningThreshold' | 'renderTimeWarningThreshold', value: number) {
  setConfigValue(key, value)
}

function handleReset() {
  // eslint-disable-next-line no-alert
  if (window.confirm('确定要重置所有设置吗？')) {
    resetConfig()
  }
}

const currentColorLabel = computed(() => {
  const found = colorOptions.find(c => c.value === config.value.highlightColor)
  return found?.label || 'Custom'
})
</script>

<template>
  <div class="settings-section">
    <!-- 基本设置 -->
    <div class="settings-group">
      <div class="group-title">
        Basic
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Enable Scanning</span>
          <span class="setting-hint">Toggle component render tracking</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.enabled }"
          @click="handleToggle('enabled')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Show Panel</span>
          <span class="setting-hint">Display the Vue Scan widget</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.showPanel }"
          @click="handleToggle('showPanel')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Audio Alerts</span>
          <span class="setting-hint">Play sound on slowdowns</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.audioNotifications }"
          @click="handleToggle('audioNotifications')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>
    </div>

    <!-- 监控设置 -->
    <div class="settings-group">
      <div class="group-title">
        Monitoring
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">FPS Monitor</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.enableFPS }"
          @click="handleToggle('enableFPS')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Performance Monitor</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.enablePerformance }"
          @click="handleToggle('enablePerformance')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item column">
        <div class="setting-info">
          <span class="setting-label">FPS Warning Threshold</span>
        </div>
        <div class="slider-row">
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            :value="config.fpsWarningThreshold"
            @input="handleThresholdChange('fpsWarningThreshold', Number(($event.target as HTMLInputElement).value))"
          >
          <span class="slider-value">{{ config.fpsWarningThreshold }} FPS</span>
        </div>
      </div>

      <div class="setting-item column">
        <div class="setting-info">
          <span class="setting-label">Render Time Warning</span>
        </div>
        <div class="slider-row">
          <input
            type="range"
            min="8"
            max="100"
            step="4"
            :value="config.renderTimeWarningThreshold"
            @input="handleThresholdChange('renderTimeWarningThreshold', Number(($event.target as HTMLInputElement).value))"
          >
          <span class="slider-value">{{ config.renderTimeWarningThreshold }}ms</span>
        </div>
      </div>
    </div>

    <!-- 显示设置 -->
    <div class="settings-group">
      <div class="group-title">
        Display
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Show Component Name</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.showComponentName }"
          @click="handleToggle('showComponentName')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Show Render Count</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.showRenderCount }"
          @click="handleToggle('showRenderCount')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Show Render Time</span>
        </div>
        <button
          class="toggle-button"
          :class="{ active: config.showRenderTime }"
          @click="handleToggle('showRenderTime')"
        >
          <span class="toggle-track">
            <span class="toggle-thumb" />
          </span>
        </button>
      </div>

      <div class="setting-item column">
        <div class="setting-info">
          <span class="setting-label">Highlight Color</span>
          <span class="setting-hint">{{ currentColorLabel }}</span>
        </div>
        <div class="color-options">
          <button
            v-for="color in colorOptions"
            :key="color.value"
            class="color-button"
            :class="{ active: config.highlightColor === color.value }"
            :style="{ backgroundColor: color.value }"
            :title="color.label"
            @click="handleColorChange(color.value)"
          />
        </div>
      </div>

      <div class="setting-item column">
        <div class="setting-info">
          <span class="setting-label">Panel Position</span>
        </div>
        <div class="position-options">
          <button
            v-for="pos in positionOptions"
            :key="pos.value"
            class="position-button"
            :class="{ active: config.panelPosition === pos.value }"
            @click="handlePositionChange(pos.value)"
          >
            {{ pos.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="settings-footer">
      <button class="reset-button" @click="handleReset">
        Reset to Defaults
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-section {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-group {
  background-color: #18181B;
  border-radius: 8px;
  padding: 12px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: #71717A;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #27272A;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.column {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 12px;
  color: #E4E4E7;
}

.setting-hint {
  font-size: 10px;
  color: #71717A;
}

.toggle-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.toggle-track {
  display: flex;
  align-items: center;
  width: 36px;
  height: 20px;
  background-color: #3F3F46;
  border-radius: 10px;
  padding: 2px;
  transition: background-color 0.2s;
}

.toggle-button.active .toggle-track {
  background-color: #8B5CF6;
}

.toggle-thumb {
  width: 16px;
  height: 16px;
  background-color: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-button.active .toggle-thumb {
  transform: translateX(16px);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-row input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #3F3F46;
  border-radius: 2px;
  outline: none;
}

.slider-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #8B5CF6;
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 11px;
  color: #A1A1AA;
  min-width: 50px;
  text-align: right;
}

.color-options {
  display: flex;
  gap: 8px;
}

.color-button {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-button:hover {
  transform: scale(1.1);
}

.color-button.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
}

.position-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.position-button {
  padding: 6px 8px;
  font-size: 10px;
  background-color: #27272A;
  border: 1px solid #3F3F46;
  border-radius: 4px;
  color: #A1A1AA;
  cursor: pointer;
  transition: all 0.2s;
}

.position-button:hover {
  background-color: #3F3F46;
}

.position-button.active {
  background-color: #8B5CF6;
  border-color: #8B5CF6;
  color: #fff;
}

.settings-footer {
  padding-top: 8px;
}

.reset-button {
  width: 100%;
  padding: 8px;
  font-size: 12px;
  background-color: #27272A;
  border: 1px solid #3F3F46;
  border-radius: 6px;
  color: #EF4444;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #EF4444;
  border-color: #EF4444;
  color: #fff;
}
</style>
