<template>
  <div class="card mb-4">
    <div class="card-header">
      <h3>Add Time Entry</h3>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveEntry">
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="date" class="form-label">Date</label>
            <input type="date" class="form-control" id="date" v-model="timeEntriesStore.currentEntry.date" required>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">Start Time</label>
            <div class="time-picker">
              <div class="btn-group me-2">
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="10" @click="timeEntriesStore.adjustTime('start', -15)">-15m</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="11" @click="timeEntriesStore.adjustTime('start', -5)">-5m</button>
              </div>
              <input type="time" class="form-control time-display" tabindex="1" v-model="timeEntriesStore.currentEntry.startTime" required>
              <div class="btn-group ms-2">
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="12" @click="timeEntriesStore.adjustTime('start', 5)">+5m</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="13" @click="timeEntriesStore.adjustTime('start', 15)">+15m</button>
              </div>
              <button type="button" class="btn btn-outline-primary ms-2" tabindex="14" @click="timeEntriesStore.setTimeToNow('start')">Now</button>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">End Time</label>
            <div class="time-picker">
              <div class="btn-group me-2">
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="20" @click="timeEntriesStore.adjustTime('end', -15)">-15m</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="21" @click="timeEntriesStore.adjustTime('end', -5)">-5m</button>
              </div>
              <input type="time" class="form-control time-display" tabindex="2" v-model="timeEntriesStore.currentEntry.endTime" required>
              <div class="btn-group ms-2">
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="22" @click="timeEntriesStore.adjustTime('end', 5)">+5m</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" tabindex="23" @click="timeEntriesStore.adjustTime('end', 15)">+15m</button>
              </div>
              <button type="button" class="btn btn-outline-primary ms-2" tabindex="24" @click="timeEntriesStore.setTimeToNow('end')">Now</button>
            </div>
          </div>
        </div>

        <div v-if="!validation.isValid || errorMessage" class="alert alert-warning mb-3">
          <div v-if="!validation.isValid">
            <ul class="mb-0">
              <li v-for="error in validation.errors" :key="error">{{ error }}</li>
            </ul>
          </div>
          <div v-if="errorMessage">{{ errorMessage }}</div>
        </div>

        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !validation.isValid">{{ isSubmitting ? 'Saving...' : 'Save Time Entry' }}</button>
          <button type="button" class="btn btn-outline-secondary" @click="timeEntriesStore.resetForm">Reset</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'

const timeEntriesStore = useTimeEntriesStore()
const isSubmitting = ref(false)
const errorMessage = ref('')

const validation = computed(() => timeEntriesStore.validateEntry())

async function saveEntry() {
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    
    const result = await timeEntriesStore.saveTimeEntry()
    if (!result.success) {
      errorMessage.value = result.error
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.time-picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.time-picker button {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
.time-display {
  width: 120px;
  text-align: center;
  margin: 0 0.5rem;
}
.time-picker .btn-outline-secondary {
  border-color: #ced4da;
}
.time-picker .ms-2 {
  margin-left: 0.5rem;
}
@media (max-width: 768px) {
  .time-picker {
    flex-direction: column;
    align-items: flex-start;
  }
  .time-picker .btn-group {
    margin-bottom: 0.5rem;
    width: 100%;
    display: flex;
  }
  .time-picker .btn-group button {
    flex: 1;
  }
  .time-display {
    width: 100%;
    margin: 0.5rem 0;
  }
  .time-picker button.ms-2 {
    margin-left: 0;
    margin-top: 0.5rem;
    width: 100%;
  }
}
</style>