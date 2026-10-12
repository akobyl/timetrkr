<template>

  <div class="dashboard-view">
     <TimeEntryForm /> <LoadStatus
      :loading="timeEntriesStore.isLoadingDashboard"
      :error="timeEntriesStore.dashboardError"
      :has-data="timeEntriesStore.hasDashboardData"
      @retry="timeEntriesStore.loadTimeEntries"
    /> <template v-if="timeEntriesStore.hasDashboardData"
      > <LastTimeEntryEdit />
      <div class="row">

        <div class="col-md-6"> <TodayTimePanel /> </div>

        <div class="col-md-6"> <WeekTimePanel /> </div>

      </div>
       </template
    >
  </div>

</template>

<script setup>
import { onMounted } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'
import LoadStatus from '../components/LoadStatus.vue'
import TimeEntryForm from '../components/TimeEntryForm.vue'
import LastTimeEntryEdit from '../components/LastTimeEntryEdit.vue'
import TodayTimePanel from '../components/TodayTimePanel.vue'
import WeekTimePanel from '../components/WeekTimePanel.vue'

const timeEntriesStore = useTimeEntriesStore()

onMounted(async () => {
  await timeEntriesStore.loadTimeEntries()
})
</script>

