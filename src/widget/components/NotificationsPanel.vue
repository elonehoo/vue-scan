<script setup lang="ts">
/**
 * Notifications Panel - 完整的通知面板
 * 类似 react-scan 的 Notifications 视图
 */
import type { SlowdownEvent } from '../../core/notifications'
import { ref } from 'vue'
import EventDetailsView from './EventDetailsView.vue'
import SlowdownHistory from './SlowdownHistory.vue'

defineEmits<{
  (e: 'close'): void
}>()

const selectedEvent = ref<SlowdownEvent | null>(null)
const selectedEventId = ref<string | null>(null)

function handleSelectEvent(event: SlowdownEvent) {
  selectedEvent.value = event
  selectedEventId.value = event.id
}

function handleCloseDetails() {
  selectedEvent.value = null
  selectedEventId.value = null
}
</script>

<template>
  <div class="notifications-panel">
    <div class="panel-left">
      <SlowdownHistory
        :selected-event-id="selectedEventId"
        @select="handleSelectEvent"
      />
    </div>
    <div class="panel-right">
      <EventDetailsView
        :event="selectedEvent"
        @close="handleCloseDetails"
      />
    </div>
  </div>
</template>

<style scoped>
.notifications-panel {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #09090B;
  color: #E4E4E7;
}

.panel-left {
  width: 200px;
  min-width: 200px;
  height: 100%;
}

.panel-right {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
</style>
