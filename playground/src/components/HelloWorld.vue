<script setup lang="ts">
const msg = defineModel('msg', {
  default: '',
})
</script>

<template>
  <div>
    <div>
      {{ msg }}
    </div>
    input: <input v-model="msg">
  </div>
</template>
