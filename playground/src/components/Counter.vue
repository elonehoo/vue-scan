<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}

function decrement() {
  count.value--
}

function reset() {
  count.value = 0
}
</script>

<template>
  <div class="counter">
    <h3 class="counter-title">
      计数器示例
    </h3>
    <div class="counter-display">
      {{ count }}
    </div>
    <div class="counter-buttons">
      <button class="counter-btn decrement" @click="decrement">
        −
      </button>
      <button class="counter-btn reset" @click="reset">
        重置
      </button>
      <button class="counter-btn increment" @click="increment">
        +
      </button>
    </div>
    <p class="counter-hint">
      点击按钮观察组件渲染
    </p>
  </div>
</template>

<style scoped>
.counter {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.counter-title {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  font-weight: normal;
}

.counter-display {
  font-size: 3rem;
  font-weight: bold;
  color: #42b883;
  margin-bottom: 16px;
  font-family: 'SF Mono', Monaco, monospace;
}

.counter-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.counter-btn {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.counter-btn.increment {
  background: #42b883;
  color: #fff;
}

.counter-btn.increment:hover {
  background: #3aa876;
}

.counter-btn.decrement {
  background: #ff6b6b;
  color: #fff;
}

.counter-btn.decrement:hover {
  background: #ff5252;
}

.counter-btn.reset {
  width: auto;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.85rem;
  font-weight: normal;
}

.counter-btn.reset:hover {
  background: rgba(255, 255, 255, 0.2);
}

.counter-hint {
  margin-top: 12px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}
</style>
