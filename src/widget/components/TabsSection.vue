<script setup lang="ts">
const model = defineModel<'stats' | 'components'>()
</script>

<template>
  <div class="tabs">
    <button
      class="tab"
      :class="{ active: model === 'stats' }"
      @click="model = 'stats'"
    >
      Stats
    </button>
    <button
      class="tab"
      :class="{ active: model === 'components' }"
      @click="model = 'components'"
    >
      Components
    </button>
  </div>
</template>
