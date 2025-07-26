<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h3>This Week's Time</h3>
      <div v-if="timeEntriesStore.weekSummary" class="summary-chip p-2 rounded">
        <strong>Total: {{ formatUtils.formatMinutes(timeEntriesStore.weekSummary.total_minutes) }}</strong>
        <div class="d-flex align-items-center mt-1">
          <span class="badge bg-primary me-1">{{ formatUtils.formatDate(timeEntriesStore.weekSummary.start_date) }}</span>
          <span class="small">to</span>
          <span class="badge bg-primary ms-1">{{ formatUtils.formatDate(timeEntriesStore.weekSummary.end_date) }}</span>
        </div>
        <small class="d-block text-muted mt-1">{{ timeEntriesStore.weekSummary.days_with_entries }} days with entries</small>
      </div>
    </div>
    <div class="card-body">
      <div v-if="timeEntriesStore.weekEntries.length === 0" class="text-center py-4">
        <p class="text-muted">No time entries found for this week.</p>
      </div>
      <div v-else>
        <!-- Daily Totals Table -->
        <div class="mb-4">
          <h5 class="mb-3">Daily Totals</h5>
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Time</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(dayData, dateStr) in timeEntriesStore.dailyTotals" :key="dateStr">
                <tr class="cursor-pointer" @click="timeEntriesStore.toggleDayEntries(dateStr)" :class="{'table-active': timeEntriesStore.expandedDays.includes(dateStr)}">
                  <td>
                    <div class="d-flex align-items-center">
                      <i :class="[timeEntriesStore.expandedDays.includes(dateStr) ? 'bi-chevron-down' : 'bi-chevron-right', 'me-2']"></i>
                      <strong>{{ formatUtils.formatDate(dateStr) }}</strong>
                    </div>
                  </td>
                  <td><span class="badge bg-success">{{ formatUtils.formatMinutes(dayData.minutes) }}</span></td>
                  <td>{{ dayData.count }} entries</td>
                </tr>
                <tr v-if="timeEntriesStore.expandedDays.includes(dateStr)">
                  <td colspan="3" class="p-0">
                    <div class="px-4 py-2 entry-details">
                      <table class="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="entry in timeEntriesStore.getDayEntries(dateStr)" :key="entry.id">
                            <td>{{ formatUtils.formatTime(entry.start_time) }}</td>
                            <td>{{ formatUtils.formatTime(entry.end_time) }}</td>
                            <td>{{ formatUtils.calculateDuration(entry.start_time, entry.end_time) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTimeEntriesStore } from '../stores/timeEntries'
import { formatUtils } from '../services/api'

const timeEntriesStore = useTimeEntriesStore()
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.summary-chip {
  background-color: var(--custom-card-header-bg);
  border: 1px solid var(--custom-card-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.entry-details {
  background-color: var(--custom-card-header-bg);
  transition: background-color 0.3s ease;
}
</style>