import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export const useTimeEntriesStore = defineStore('timeEntries', () => {
  // State
  const todayEntries = ref([])
  const weekEntries = ref([])
  const allEntries = ref([])
  const dailyTotals = ref({})
  const expandedDays = ref([])
  const todaySummary = ref(null)
  const weekSummary = ref(null)
  const currentEntry = ref({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00'
  })
  const filterDate = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const sortDirection = ref('desc') // 'asc' or 'desc'
  const isLoadingEntries = ref(false)
  
  // Computed values
  const getDayEntries = computed(() => {
    return (dateStr) => weekEntries.value.filter(entry => entry.date === dateStr)
  })
  
  // Helper for date ranges
  function getCurrentWeekRange() {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, ...
    
    // Calculate days to subtract to get to Monday
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1
    
    // Create a new date object for start of week (Monday)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - daysToSubtract)
    
    // Calculate end of week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Add 6 days to Monday to get to Sunday
    
    // Reset the time parts to ensure consistent comparison
    startOfWeek.setHours(0, 0, 0, 0)
    endOfWeek.setHours(23, 59, 59, 999)
    
    // Format as YYYY-MM-DD strings
    const startStr = startOfWeek.toISOString().split('T')[0]
    const endStr = endOfWeek.toISOString().split('T')[0]
    
    return {
      start: startStr,
      end: endStr,
      startDate: startOfWeek,
      endDate: endOfWeek
    }
  }
  
  // Actions
  async function loadTimeEntries() {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Load today's entries
      const todayResponse = await apiService.get('/time-entries/', { 
        params: { entry_date: today } 
      })
      
      // Ensure response data is an array
      todayEntries.value = Array.isArray(todayResponse.data) ? todayResponse.data : []
      
      // If data isn't an array, log error for debugging
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
      
      // If data isn't an array, log error for debugging
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
  
  function calculateDailyTotals() {
    const totals = {}
    
    weekEntries.value.forEach(entry => {
      const dateStr = entry.date
      if (!totals[dateStr]) {
        totals[dateStr] = { minutes: 0, count: 0 }
      }
      
      // Calculate duration
      const [startHours, startMins] = entry.start_time.split(':').map(Number)
      const [endHours, endMins] = entry.end_time.split(':').map(Number)
      
      let durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins)
      if (durationMinutes < 0) durationMinutes += 24 * 60 // Handle overnight
      
      // Add to the daily total
      totals[dateStr].minutes += durationMinutes
      totals[dateStr].count += 1
    })
    
    dailyTotals.value = totals
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
  
  async function saveTimeEntry() {
    try {
      const payload = {
        date: currentEntry.value.date,
        start_time: currentEntry.value.startTime,
        end_time: currentEntry.value.endTime
      }
      
      await apiService.post('/time-entries/', payload)
      
      // Reset form and reload data
      resetForm()
      await loadTimeEntries()
      
      return { success: true }
    } catch (error) {
      console.error('Error saving time entry:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to save time entry' 
      }
    }
  }
  
  async function deleteTimeEntry(id) {
    try {
      await apiService.delete(`/time-entries/${id}`)
      await loadTimeEntries()
      return { success: true }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to delete time entry' 
      }
    }
  }
  
  function resetForm() {
    currentEntry.value = {
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00'
    }
  }
  
  function adjustTime(type, minutes) {
    const timeField = type === 'start' ? 'startTime' : 'endTime'
    const currentTime = currentEntry.value[timeField]
    
    // Parse the time
    const [hours, mins] = currentTime.split(':').map(Number)
    
    // Calculate new time
    let totalMinutes = hours * 60 + mins + minutes
    if (totalMinutes < 0) totalMinutes = 0
    if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1
    
    const newHours = Math.floor(totalMinutes / 60)
    const newMinutes = totalMinutes % 60
    
    // Format back to 24-hour format (HH:MM)
    currentEntry.value[timeField] = 
      `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
  }
  
  function setTimeToNow(type) {
    const timeField = type === 'start' ? 'startTime' : 'endTime'
    const now = new Date()
    
    // Get hours and minutes
    let hours = now.getHours()
    let minutes = now.getMinutes()
    
    // Round to nearest 5 minutes
    minutes = Math.round(minutes / 5) * 5
    
    // Adjust if minutes rolled over to 60
    if (minutes === 60) {
      minutes = 0
      hours = (hours + 1) % 24  // Ensure we don't go past 24 hours
    }
    
    // Format back to 24-hour format (HH:MM)
    currentEntry.value[timeField] = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  // Load all time entries, optionally filtered by month
  async function loadAllTimeEntries() {
    try {
      isLoadingEntries.value = true
      
      // Get all time entries
      const response = await apiService.get('/time-entries/')
      
      // Ensure response.data is an array
      let entries = Array.isArray(response.data) ? response.data : []
      
      // If data isn't an array, log error for debugging
      if (!Array.isArray(response.data)) {
        console.error('API response is not an array:', response.data)
      }
      
      // Filter by month if needed
      if (filterDate.value) {
        entries = entries.filter(entry => 
          entry.date.startsWith(filterDate.value)
        )
      }
      
      // Sort entries
      allEntries.value = sortTimeEntries(entries, sortDirection.value)
      
      return { success: true }
    } catch (error) {
      console.error('Error loading all time entries:', error)
      allEntries.value = [] // Ensure we set an empty array on error
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to load time entries' 
      }
    } finally {
      isLoadingEntries.value = false
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
  
  return {
    todayEntries,
    weekEntries,
    allEntries,
    dailyTotals,
    expandedDays,
    todaySummary,
    weekSummary,
    currentEntry,
    filterDate,
    sortDirection,
    isLoadingEntries,
    getDayEntries,
    loadTimeEntries,
    loadAllTimeEntries,
    calculateDailyTotals,
    toggleDayEntries,
    saveTimeEntry,
    deleteTimeEntry,
    resetForm,
    adjustTime,
    setTimeToNow,
    toggleSortDirection,
    sortTimeEntries
  }
})