<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h3>Today's Time</h3>
      <div v-if="timeEntriesStore.todaySummary" class="bg-light p-2 rounded">
        <strong>Total: {{ formatUtils.formatMinutes(timeEntriesStore.todaySummary.total_minutes) }}</strong>
      </div>
    </div>
    <div class="card-body">
      <div v-if="timeEntriesStore.todayEntries.length === 0" class="text-center py-4">
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
          <tr v-for="entry in timeEntriesStore.todayEntries" :key="entry.id">
            <td>{{ formatUtils.formatTime(entry.start_time) }}</td>
            <td>{{ formatUtils.formatTime(entry.end_time) }}</td>
            <td>{{ formatUtils.calculateDuration(entry.start_time, entry.end_time) }}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(entry.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useTimeEntriesStore } from '../stores/timeEntries'
import { formatUtils } from '../services/api'

const timeEntriesStore = useTimeEntriesStore()

function confirmDelete(id) {
  if (confirm('Are you sure you want to delete this time entry?')) {
    timeEntriesStore.deleteTimeEntry(id)
  }
}
</script>