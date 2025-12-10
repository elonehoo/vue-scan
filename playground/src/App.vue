<script setup lang="ts">
import { ref } from 'vue'
import TodoList from './components/TodoList.vue'
import TodoItem from './components/TodoItem.vue'
import Counter from './components/Counter.vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos = ref<Todo[]>([
  { id: 1, text: '测试 Vue Scan 渲染追踪', completed: false },
  { id: 2, text: '查看 FPS 监控', completed: true },
])

const newTodoText = ref('')
let nextId = 3

function addTodo() {
  if (newTodoText.value.trim()) {
    todos.value.push({
      id: nextId++,
      text: newTodoText.value.trim(),
      completed: false,
    })
    newTodoText.value = ''
  }
}

function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

function removeTodo(id: number) {
  todos.value = todos.value.filter(t => t.id !== id)
}

function clearCompleted() {
  todos.value = todos.value.filter(t => !t.completed)
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🔍 Vue Scan Playground</h1>
      <p class="subtitle">
        添加、完成或删除任务来观察组件渲染追踪
      </p>
    </header>

    <!-- 计数器组件 -->
    <Counter />

    <!-- 添加新任务 -->
    <div class="add-todo">
      <input
        v-model="newTodoText"
        type="text"
        placeholder="输入新任务..."
        class="todo-input"
        @keyup.enter="addTodo"
      >
      <button class="add-btn" @click="addTodo">
        添加
      </button>
    </div>

    <!-- 任务列表 -->
    <TodoList>
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @toggle="toggleTodo"
        @remove="removeTodo"
      />
    </TodoList>

    <!-- 底部操作栏 -->
    <div class="footer">
      <span class="count">{{ todos.filter(t => !t.completed).length }} 项未完成</span>
      <button
        v-if="todos.some(t => t.completed)"
        class="clear-btn"
        @click="clearCompleted"
      >
        清除已完成
      </button>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: #fff;
}

.app-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 40px 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.add-todo {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(66, 184, 131, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: #42b883;
}

.todo-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.add-btn {
  padding: 12px 24px;
  background: #42b883;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.add-btn:hover {
  background: #3aa876;
}

.add-btn:active {
  transform: scale(0.98);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.clear-btn {
  padding: 8px 16px;
  background: transparent;
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.clear-btn:hover {
  background: #ff6b6b;
  color: #fff;
}
</style>
