<script setup lang="ts">
interface Todo {
  id: number
  text: string
  completed: boolean
}

const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: number]
  remove: [id: number]
}>()
</script>

<template>
  <div class="todo-item" :class="{ completed: props.todo.completed }">
    <button
      class="checkbox"
      :class="{ checked: props.todo.completed }"
      @click="emit('toggle', props.todo.id)"
    >
      <svg v-if="props.todo.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>

    <span class="todo-text">{{ props.todo.text }}</span>

    <button class="remove-btn" @click="emit('remove', props.todo.id)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.todo-item.completed {
  opacity: 0.6;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(66, 184, 131, 0.5);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: #42b883;
}

.checkbox.checked {
  background: #42b883;
  border-color: #42b883;
}

.checkbox svg {
  width: 14px;
  height: 14px;
  color: #fff;
}

.todo-text {
  flex: 1;
  font-size: 1rem;
  color: #fff;
  transition: text-decoration 0.2s;
}

.completed .todo-text {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.5);
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.todo-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}

.remove-btn svg {
  width: 16px;
  height: 16px;
  color: #ff6b6b;
}
</style>
