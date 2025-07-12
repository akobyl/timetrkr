<template>
  <div v-if="lastEntry" class="card mb-4">
    <div class="card-header">
      <h5>Edit Last Entry</h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="updateEntry">
        <div class="row">
          <div class="col-md-3">
            <label for="lastDate" class="form-label">Date</label>
            <input type="date" class="form-control" id="lastDate" v-model="editEntry.date" required>
          </div>
          <div class="col-md-3">
            <label for="lastStartTime" class="form-label">Start Time</label>
            <input type="time" class="form-control" id="lastStartTime" v-model="editEntry.start_time" required>
          </div>
          <div class="col-md-3">
            <label for="lastEndTime" class="form-label">End Time</label>
            <input type="time" class="form-control" id="lastEndTime" v-model="editEntry.end_time" required>
          </div>
          <div class="col-md-3 d-flex align-items-end gap-2">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="isUpdating">
              {{ isUpdating ? 'Updating...' : 'Update' }}
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="resetEdit">
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'

const timeEntriesStore = useTimeEntriesStore()
const isUpdating = ref(false)

// Get the most recent entry from all entries
const lastEntry = computed(() => {
  const allEntries = [...timeEntriesStore.todayEntries, ...timeEntriesStore.weekEntries]
  if (allEntries.length === 0) return null
  
  // Sort by date and time to get the most recent
  const sorted = allEntries.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) return dateCompare
    return b.start_time.localeCompare(a.start_time)
  })
  
  return sorted[0]
})

// Editable copy of the last entry
const editEntry = ref({
  date: '',
  start_time: '',
  end_time: ''
})

// Watch for changes to lastEntry and update editEntry
watch(lastEntry, (newEntry) => {
  if (newEntry) {
    editEntry.value = {
      date: newEntry.date,
      start_time: newEntry.start_time,
      end_time: newEntry.end_time
    }
  }
}, { immediate: true })

async function updateEntry() {
  if (!lastEntry.value) return
  
  try {
    isUpdating.value = true
    
    const payload = {
      date: editEntry.value.date,
      start_time: editEntry.value.start_time,
      end_time: editEntry.value.end_time
    }
    
    await timeEntriesStore.updateTimeEntry(lastEntry.value.id, payload)
    await timeEntriesStore.loadTimeEntries()
    
  } catch (error) {
    console.error('Error updating last entry:', error)
  } finally {
    isUpdating.value = false
  }
}

function resetEdit() {
  if (lastEntry.value) {
    editEntry.value = {
      date: lastEntry.value.date,
      start_time: lastEntry.value.start_time,
      end_time: lastEntry.value.end_time
    }
  }
}
</script>

<style scoped>
.card-header h5 {
  margin: 0;
  font-size: 1rem;
  color: #6c757d;
}
</style>