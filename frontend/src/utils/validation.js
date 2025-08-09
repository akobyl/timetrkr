/**
 * Time entry validation utilities
 */

/**
 * Validate that time is on 5-minute increments
 * @param {string} timeStr - Time in HH:MM format
 * @returns {boolean} True if valid
 */
export function validateTimeIncrement(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return minutes % 5 === 0
}

/**
 * Validate that start time is before end time, handling overnight entries
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if valid
 */
export function validateTimeOrder(startTime, endTime) {
  const [startHours, startMins] = startTime.split(':').map(Number)
  const [endHours, endMins] = endTime.split(':').map(Number)

  const startMinutes = startHours * 60 + startMins
  const endMinutes = endHours * 60 + endMins

  // Handle overnight entries (end time next day)
  if (endMinutes <= startMinutes) {
    // Only allow overnight if end time is reasonably early (before 6 AM)
    return endHours < 6
  }

  return true
}

/**
 * Validate a complete time entry
 * @param {Object} entry - Entry with startTime, endTime, date
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateEntry(entry) {
  const errors = []

  if (!validateTimeIncrement(entry.startTime)) {
    errors.push(
      'Start time must be on 5-minute increments (e.g., 9:00, 9:05, 9:10)'
    )
  }

  if (!validateTimeIncrement(entry.endTime)) {
    errors.push(
      'End time must be on 5-minute increments (e.g., 9:00, 9:05, 9:10)'
    )
  }

  if (!validateTimeOrder(entry.startTime, entry.endTime)) {
    errors.push(
      'Start time must be before end time. For overnight entries, end time must be before 6:00 AM'
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
