<script setup lang="ts">
import type { FPSData } from '../../core/fps'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  fpsData: FPSData | null
  fpsHistory: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const fpsStatusClass = computed(() => {
  const fps = props.fpsData?.current ?? 0
  if (fps >= 50)
    return 'good'
  if (fps >= 30)
    return 'warning'
  return 'bad'
})

// 绘制 FPS 图表
function drawChart() {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const width = canvas.width
  const height = canvas.height
  const history = props.fpsHistory

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  if (history.length < 2)
    return

  // 计算比例
  const maxFPS = Math.max(...history, 60)
  const stepX = width / (60 - 1)

  // 绘制背景网格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 3; i++) {
    const y = (height / 3) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // 绘制警告线 (30 FPS)
  const warningY = height - (30 / maxFPS) * height
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.moveTo(0, warningY)
  ctx.lineTo(width, warningY)
  ctx.stroke()
  ctx.setLineDash([])

  // 绘制 FPS 曲线 - 使用紫色主题
  ctx.beginPath()
  ctx.strokeStyle = '#8e61e3'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  history.forEach((fps, index) => {
    const x = index * stepX
    const y = height - (fps / maxFPS) * height
    if (index === 0) {
      ctx.moveTo(x, y)
    }
    else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // 绘制渐变填充 - 使用紫色主题
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(142, 97, 227, 0.3)')
  gradient.addColorStop(1, 'rgba(142, 97, 227, 0)')

  ctx.beginPath()
  history.forEach((fps, index) => {
    const x = index * stepX
    const y = height - (fps / maxFPS) * height
    if (index === 0) {
      ctx.moveTo(x, height)
      ctx.lineTo(x, y)
    }
    else {
      ctx.lineTo(x, y)
    }
  })
  ctx.lineTo((history.length - 1) * stepX, height)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()
}

watch(() => props.fpsHistory.length, drawChart)

onMounted(() => {
  // 设置 canvas 尺寸
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = 260
    canvas.height = 48
  }
})
</script>

<template>
  <div class="fps-section">
    <div class="fps-header">
      <span class="fps-label">FPS</span>
      <span class="fps-value" :class="fpsStatusClass">
        {{ fpsData?.current ?? '—' }}
      </span>
    </div>

    <div class="fps-stats">
      <span>Avg: {{ fpsData?.average ?? '—' }}</span>
      <span>Min: {{ fpsData?.min ?? '—' }}</span>
      <span>Max: {{ fpsData?.max ?? '—' }}</span>
    </div>

    <div class="fps-chart">
      <canvas ref="canvasRef" style="width: 100%; height: 100%;" />
    </div>
  </div>
</template>
