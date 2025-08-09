import { onMounted } from 'vue'
import { useTimeEntryFormStore } from '../stores/timeEntryForm'
import { useTimeEntryDataStore } from '../stores/timeEntryData'

/**
 * Composable for managing time entries with form and data operations
 */
export function useTimeEntries() {
  const formStore = useTimeEntryFormStore()
  const dataStore = useTimeEntryDataStore()

  // Load initial data
  onMounted(async () => {
    await dataStore.loadTodayAndWeekEntries()
  })

  /**
   * Save a new time entry and reload data
   */
  async function saveEntry() {
    const result = await formStore.saveTimeEntry()
    if (result.success) {
      // Reload today and week data after successful save
      await dataStore.loadTodayAndWeekEntries()
    }
    return result
  }

  /**
   * Update an existing time entry and reload data
   */
  async function updateEntry(id, entryData) {
    const result = await dataStore.updateTimeEntry(id, entryData)
    if (result.success) {
      // Data is already reloaded in the store method
    }
    return result
  }

  /**
   * Delete a time entry and reload data
   */
  async function deleteEntry(id) {
    const result = await dataStore.deleteTimeEntry(id)
    if (result.success) {
      // Data is already reloaded in the store method
    }
    return result
  }

  return {
    // Form store
    currentEntry: formStore.currentEntry,
    resetForm: formStore.resetForm,
    adjustEntryTime: formStore.adjustEntryTime,
    setTimeToNow: formStore.setTimeToNow,

    // Data store
    todayEntries: dataStore.todayEntries,
    weekEntries: dataStore.weekEntries,
    allEntries: dataStore.allEntries,
    dailyTotals: dataStore.dailyTotals,
    expandedDays: dataStore.expandedDays,
    todaySummary: dataStore.todaySummary,
    weekSummary: dataStore.weekSummary,
    filterDate: dataStore.filterDate,
    sortDirection: dataStore.sortDirection,
    isLoadingEntries: dataStore.isLoadingEntries,
    getDayEntries: dataStore.getDayEntries,

    // Combined actions
    saveEntry,
    updateEntry,
    deleteEntry,

    // Data actions
    loadTodayAndWeekEntries: dataStore.loadTodayAndWeekEntries,
    loadAllTimeEntries: dataStore.loadAllTimeEntries,
    toggleDayEntries: dataStore.toggleDayEntries,
    toggleSortDirection: dataStore.toggleSortDirection,
  }
}
