<template>

  <div class="card mb-4">

    <div class="card-header d-flex justify-content-between align-items-center">

      <h3>Today's Time</h3>

      <div
        v-if="timeEntriesStore.todaySummary"
        class="summary-chip p-2 rounded"
      >
         <strong
          >Total: {{
            formatUtils.formatMinutes(
              timeEntriesStore.todaySummary.total_minutes
            )
          }}</strong
        >
      </div>

    </div>

    <div class="card-body">

      <div v-if="deleteError" class="alert alert-danger" role="alert">
         {{ deleteError }}
      </div>

      <p v-if="deleteStatus" role="status">{{ deleteStatus }}</p>

      <div
        v-if="timeEntriesStore.todayEntries.length === 0"
        class="text-center py-4"
      >

        <p class="text-muted">No time entries found for today.</p>

      </div>

      <table v-else class="table table-striped">

        <thead>

          <tr>

            <th>Start Time</th>

            <th>End Time</th>

            <th>Duration</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          <tr v-for="entry in sortedTodayEntries" :key="entry.id">

            <td>{{ formatUtils.formatTime(entry.start_time) }}</td>

            <td>{{ formatUtils.formatTime(entry.end_time) }}</td>

            <td>
               {{
                formatUtils.calculateDuration(entry.start_time, entry.end_time)
              }}
            </td>

            <td>
               <button
                class="btn btn-sm btn-outline-danger"
                @click="confirmDelete(entry.id)"
                :disabled="isDeleting || timeEntriesStore.isLoadingDashboard"
              >
                 Delete</button
              >
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  </div>

</template>

<script setup>
import { computed, ref } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'
import { formatUtils } from '../services/api'

const timeEntriesStore = useTimeEntriesStore()
const deleteError = ref('')
const deleteStatus = ref('')
const isDeleting = ref(false)

// Sort today's entries by start time (earliest to latest)
const sortedTodayEntries = computed(() => {
  return [...timeEntriesStore.todayEntries].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time)
  })
})

async function confirmDelete(id) {
  if (
    isDeleting.value ||
    !confirm('Are you sure you want to delete this time entry?')
  )
    return
  isDeleting.value = true
  deleteError.value = ''
  deleteStatus.value = ''
  try {
    const result = await timeEntriesStore.deleteTimeEntry(id)
    if (!result.success) {
      deleteError.value = result.error
      return
    }
    deleteStatus.value = 'Entry deleted.'
    await timeEntriesStore.loadTimeEntries()
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.summary-chip {
  background-color: var(--custom-card-header-bg);
  border: 1px solid var(--custom-card-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
</style>

