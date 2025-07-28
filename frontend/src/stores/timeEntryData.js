import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import { getLocalDateString, getCurrentWeekRange } from '../utils/dateUtils'
import { calculateDurationMinutes } from '../utils/timeUtils'
import { validateEntry } from '../utils/validation'

export const useTimeEntryDataStore = defineStore('timeEntryData', () => {
  // State
  const todayEntries = ref([])
  const weekEntries = ref([])
  const allEntries = ref([])
  const dailyTotals = ref({})
  const expandedDays = ref([])
  const todaySummary = ref(null)
  const weekSummary = ref(null)
  const filterDate = ref(getLocalDateString().slice(0, 7)) // YYYY-MM format
  const sortDirection = ref('desc')
  const isLoadingEntries = ref(false)

  // Computed values
  const getDayEntries = computed(() => {
    return (dateStr) => weekEntries.value
      .filter(entry => entry.date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  })

  // Actions
  async function loadTodayAndWeekEntries() {
    try {
      // Get today's date in local timezone
      const today = getLocalDateString()
      
      // Load today's entries
      const todayResponse = await apiService.get('/time-entries/', { 
        params: { entry_date: today } 
      })
      
      // Ensure response data is an array
      todayEntries.value = Array.isArray(todayResponse.data) ? todayResponse.data : []
      
      if (!Array.isArray(todayResponse.data)) {
        console.error('Today API response is not an array:', todayResponse.data)
      }
      
      // Get today's summary
      const todaySummaryResponse = await apiService.get('/time-summary/', {
        params: {
          start_date: today,
          end_date: today
        }
      })
      todaySummary.value = todaySummaryResponse.data
      
      // Get the current week's date range (Monday to Sunday)
      const weekRange = getCurrentWeekRange()
      const startOfWeekStr = weekRange.start
      const endOfWeekStr = weekRange.end
      
      // Load all entries then filter client-side
      const allEntriesResponse = await apiService.get('/time-entries/')
      
      // Ensure all entries response data is an array
      const allEntries = Array.isArray(allEntriesResponse.data) ? allEntriesResponse.data : []
      
      if (!Array.isArray(allEntriesResponse.data)) {
        console.error('All entries API response is not an array:', allEntriesResponse.data)
      }
      
      // Filter entries from the full week and sort by date
      weekEntries.value = allEntries
        .filter(entry => {
          const entryDate = String(entry.date)
          const isInWeek = entryDate >= startOfWeekStr && entryDate <= endOfWeekStr
          return isInWeek
        })
        .sort((a, b) => {
          // Sort by date ascending and then by start time
          if (a.date !== b.date) {
            return a.date < b.date ? -1 : 1
          }
          return a.start_time < b.start_time ? -1 : 1
        })
      
      // Reset expanded days when loading new data
      expandedDays.value = []
      
      // Calculate daily totals for the week
      calculateDailyTotals()
      
      // Get weekly summary for the full week
      const weekSummaryResponse = await apiService.get('/time-summary/', {
        params: {
          start_date: startOfWeekStr,
          end_date: endOfWeekStr
        }
      })
      weekSummary.value = weekSummaryResponse.data
      
    } catch (error) {
      console.error('Error loading time entries:', error)
      
      // Ensure we have default values on error
      todayEntries.value = []
      weekEntries.value = []
      todaySummary.value = null
      weekSummary.value = null
    }
  }

  async function loadAllTimeEntries(showAll = false) {
    try {
      isLoadingEntries.value = true
      
      let response;
      
      // Use server-side filtering only when not in "show all" mode
      if (!showAll && filterDate.value) {
        // Make API request with month filter (YYYY-MM format)
        response = await apiService.get('/time-entries/', {
          params: { month_filter: filterDate.value }
        });
      } else {
        // Get all time entries without filter
        response = await apiService.get('/time-entries/');
      }
      
      // Ensure response.data is an array
      let entries = Array.isArray(response.data) ? response.data : [];
      
      // If data isn't an array, log error for debugging
      if (!Array.isArray(response.data)) {
        console.error('API response is not an array:', response.data);
      }
      
      // Sort entries
      allEntries.value = sortTimeEntries(entries, sortDirection.value);
      
      return { success: true };
    } catch (error) {
      console.error('Error loading all time entries:', error);
      allEntries.value = []; // Ensure we set an empty array on error
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to load time entries' 
      };
    } finally {
      isLoadingEntries.value = false;
    }
  }

  function calculateDailyTotals() {
    const totals = {}
    
    weekEntries.value.forEach(entry => {
      const dateStr = entry.date
      if (!totals[dateStr]) {
        totals[dateStr] = { minutes: 0, count: 0 }
      }
      
      // Calculate duration
      const durationMinutes = calculateDurationMinutes(entry.start_time, entry.end_time)
      
      // Add to the daily total
      totals[dateStr].minutes += durationMinutes
      totals[dateStr].count += 1
    })
    
    // Sort the totals by date to ensure chronological order
    const sortedTotals = {}
    Object.keys(totals)
      .sort((a, b) => a.localeCompare(b))
      .forEach(dateStr => {
        sortedTotals[dateStr] = totals[dateStr]
      })
    
    dailyTotals.value = sortedTotals
  }

  // Toggle display of entries for a specific day
  function toggleDayEntries(dateStr) {
    const index = expandedDays.value.indexOf(dateStr)
    if (index === -1) {
      // Add to expanded list
      expandedDays.value.push(dateStr)
    } else {
      // Remove from expanded list
      expandedDays.value.splice(index, 1)
    }
  }

  // Sort time entries by date and time
  function sortTimeEntries(entries, direction = 'desc') {
    return [...entries].sort((a, b) => {
      const dateA = a.date
      const dateB = b.date
      
      if (dateA !== dateB) {
        return direction === 'asc' 
          ? dateA.localeCompare(dateB) 
          : dateB.localeCompare(dateA)
      }
      
      // If dates are same, sort by time
      const timeA = a.start_time
      const timeB = b.start_time
      
      return direction === 'asc' 
        ? timeA.localeCompare(timeB) 
        : timeB.localeCompare(timeA)
    })
  }

  // Toggle sort direction
  function toggleSortDirection() {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    // Re-sort entries with new direction
    allEntries.value = sortTimeEntries(allEntries.value, sortDirection.value)
  }

  async function updateTimeEntry(id, entryData) {
    try {
      // Validate entry before sending
      const validation = validateEntry({
        startTime: entryData.start_time,
        endTime: entryData.end_time,
        date: entryData.date
      })
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; ')
        }
      }
      
      await apiService.put(`/time-entries/${id}`, entryData)
      await loadTodayAndWeekEntries() // Reload data after update
      return { success: true }
    } catch (error) {
      console.error('Error updating time entry:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update time entry' 
      }
    }
  }

  async function deleteTimeEntry(id) {
    try {
      await apiService.delete(`/time-entries/${id}`)
      await loadTodayAndWeekEntries() // Reload data after delete
      return { success: true }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to delete time entry' 
      }
    }
  }

  return {
    // State
    todayEntries,
    weekEntries,
    allEntries,
    dailyTotals,
    expandedDays,
    todaySummary,
    weekSummary,
    filterDate,
    sortDirection,
    isLoadingEntries,
    
    // Computed
    getDayEntries,
    
    // Actions
    loadTodayAndWeekEntries,
    loadAllTimeEntries,
    calculateDailyTotals,
    toggleDayEntries,
    sortTimeEntries,
    toggleSortDirection,
    updateTimeEntry,
    deleteTimeEntry
  }
})