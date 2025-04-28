<template>
  <div class="history-view">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>Time Entry History</h3>
        <div>
          <input type="month" class="form-control" v-model="timeEntriesStore.filterDate">
        </div>
      </div>
      <div class="card-body text-center py-5">
        <i class="bi bi-clock-history" style="font-size: 3rem;"></i>
        <br><br>
        <p class="text-muted">Complete time entry history features coming soon!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTimeEntriesStore } from '../stores/timeEntries'

const timeEntriesStore = useTimeEntriesStore()
</script>