<script setup lang="ts">
defineSlots<{
  default(): any
}>()
</script>

<template>
  <div class="todo-list">
    <slot />
    <div v-if="!$slots.default" class="empty-list">
      <span>📝</span>
      <p>暂无任务，添加一个吧！</p>
    </div>
  </div>
</template>

<style scoped>
.todo-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.empty-list {
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
}

.empty-list span {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.empty-list p {
  font-size: 0.9rem;
}
</style>
