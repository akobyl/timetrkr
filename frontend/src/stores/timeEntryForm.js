import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '../services/api'
import { getLocalDateString } from '../utils/dateUtils'
import { adjustTime, getCurrentTimeRounded } from '../utils/timeUtils'
import { validateEntry } from '../utils/validation'

export const useTimeEntryFormStore = defineStore('timeEntryForm', () => {
  // State
  const currentEntry = ref({
    date: getLocalDateString(),
    startTime: '09:00',
    endTime: '17:00',
  })

  // Actions
  function resetForm() {
    currentEntry.value = {
      date: getLocalDateString(),
      startTime: '09:00',
      endTime: '17:00',
    }
  }

  function adjustEntryTime(type, minutes) {
    const timeField = type === 'start' ? 'startTime' : 'endTime'
    currentEntry.value[timeField] = adjustTime(
      currentEntry.value[timeField],
      minutes
    )
  }

  function setTimeToNow(type) {
    const timeField = type === 'start' ? 'startTime' : 'endTime'
    currentEntry.value[timeField] = getCurrentTimeRounded()
  }

  async function saveTimeEntry() {
    try {
      // Validate entry before sending
      const validation = validateEntry(currentEntry.value)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join('; '),
        }
      }

      const payload = {
        date: currentEntry.value.date,
        start_time: currentEntry.value.startTime,
        end_time: currentEntry.value.endTime,
      }

      await apiService.post('/time-entries/', payload)

      // Reset form after successful save
      resetForm()

      return { success: true }
    } catch (error) {
      console.error('Error saving time entry:', error)
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to save time entry',
      }
    }
  }

  return {
    currentEntry,
    resetForm,
    adjustEntryTime,
    setTimeToNow,
    saveTimeEntry,
  }
})
