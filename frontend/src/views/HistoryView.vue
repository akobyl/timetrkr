<template>
  <div class="history-view">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>Time Entry History</h3>
        <div class="d-flex gap-2">
          <input 
            type="month" 
            class="form-control" 
            v-model="timeEntriesStore.filterDate" 
            @change="loadEntries"
            :disabled="timeEntriesStore.isLoadingEntries"
          >
          <button 
            class="btn btn-outline-secondary" 
            @click="timeEntriesStore.toggleSortDirection"
            :disabled="timeEntriesStore.isLoadingEntries"
          >
            <i class="bi" :class="sortIcon"></i> Sort
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <!-- Loading state -->
        <div v-if="timeEntriesStore.isLoadingEntries" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading time entries...</p>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="timeEntriesStore.allEntries.length === 0" class="text-center py-5">
          <i class="bi bi-clock-history" style="font-size: 3rem;"></i>
          <br><br>
          <p class="text-muted">No time entries found for this period.</p>
        </div>
        
        <!-- Entries table -->
        <div v-else class="table-responsive">
          <table class="table table-striped table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in timeEntriesStore.allEntries" :key="entry.id">
                <td>{{ formatUtils.formatDate(entry.date) }}</td>
                <td>{{ formatUtils.formatTime(entry.start_time) }}</td>
                <td>{{ formatUtils.formatTime(entry.end_time) }}</td>
                <td>{{ formatUtils.calculateDuration(entry.start_time, entry.end_time) }}</td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button 
                      class="btn btn-outline-primary" 
                      @click="editEntry(entry)"
                      title="Edit"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                      class="btn btn-outline-danger" 
                      @click="confirmDelete(entry.id)"
                      title="Delete"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer d-flex justify-content-between bg-light" v-if="timeEntriesStore.allEntries.length > 0">
        <div>
          <strong>{{ timeEntriesStore.allEntries.length }}</strong> entries
        </div>
        <div>
          <span class="badge bg-info">{{ timeEntriesStore.filterDate }}</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Edit Modal -->
  <EditTimeEntryModal
    :entry="editingEntry"
    @update="onEntryUpdated"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'
import { formatUtils } from '../services/api'
import EditTimeEntryModal from '../components/EditTimeEntryModal.vue'
import { Modal } from 'bootstrap'

const timeEntriesStore = useTimeEntriesStore()
const editingEntry = ref(null)

// Sort direction icon
const sortIcon = computed(() => {
  return timeEntriesStore.sortDirection === 'asc' 
    ? 'bi-sort-down-alt' 
    : 'bi-sort-up'
})

// Load entries
async function loadEntries() {
  await timeEntriesStore.loadAllTimeEntries()
}

// Edit entry
function editEntry(entry) {
  // Create a copy of the entry for editing
  editingEntry.value = {
    id: entry.id,
    date: entry.date,
    start_time: entry.start_time,
    end_time: entry.end_time
  }
  
  // Open the modal
  const modalEl = document.getElementById('editEntryModal')
  const modal = new Modal(modalEl)
  modal.show()
}

// Handle entry updated
function onEntryUpdated() {
  loadEntries()
}

// Confirm and delete entry
function confirmDelete(id) {
  if (confirm('Are you sure you want to delete this time entry?')) {
    timeEntriesStore.deleteTimeEntry(id).then(() => {
      loadEntries()
    })
  }
}

// Load entries on component mount
onMounted(() => {
  loadEntries()
})

// Watch for sort direction changes
watch(() => timeEntriesStore.sortDirection, () => {
  // When sort direction changes, entries are automatically re-sorted in the store
})
</script>

<style scoped>
.history-view .card {
  border-radius: 10px;
  overflow: hidden;
}
</style>