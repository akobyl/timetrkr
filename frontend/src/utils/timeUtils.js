/**
 * Time calculation and formatting utilities
 */

/**
 * Calculate duration between two time strings in minutes
 * @param {string} startTime - Time in HH:MM format
 * @param {string} endTime - Time in HH:MM format
 * @returns {number} Duration in minutes
 */
export function calculateDurationMinutes(startTime, endTime) {
  const [startHours, startMins] = startTime.split(':').map(Number)
  const [endHours, endMins] = endTime.split(':').map(Number)
  
  let durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins)
  if (durationMinutes < 0) durationMinutes += 24 * 60 // Handle overnight
  
  return durationMinutes
}

/**
 * Format minutes as "Xh Ym" string
 * @param {number} totalMinutes - Total minutes
 * @returns {string} Formatted duration string
 */
export function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

/**
 * Adjust time by specified minutes, keeping 5-minute increments
 * @param {string} timeStr - Time in HH:MM format
 * @param {number} minutes - Minutes to add/subtract
 * @returns {string} Adjusted time in HH:MM format
 */
export function adjustTime(timeStr, minutes) {
  // Parse the time
  const [hours, mins] = timeStr.split(':').map(Number)
  
  // Calculate new time
  let totalMinutes = hours * 60 + mins + minutes
  if (totalMinutes < 0) totalMinutes = 0
  if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 5 // Ensure we stay on 5-min increment
  
  // Round to nearest 5-minute increment
  totalMinutes = Math.round(totalMinutes / 5) * 5
  
  const newHours = Math.floor(totalMinutes / 60)
  const newMinutes = totalMinutes % 60
  
  // Format to 24-hour format with only HH:MM (no seconds)
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
}

/**
 * Get current time rounded to nearest 5 minutes
 * @returns {string} Current time in HH:MM format
 */
export function getCurrentTimeRounded() {
  const now = new Date()
  
  // Get local hours and minutes
  let hours = now.getHours()
  let minutes = now.getMinutes()
  
  // Round to nearest 5 minutes
  minutes = Math.round(minutes / 5) * 5
  
  // Adjust if minutes rolled over to 60
  if (minutes === 60) {
    minutes = 0
    hours = (hours + 1) % 24  // Ensure we don't go past 24 hours
  }
  
  // Format to 24-hour format with only HH:MM (no seconds)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}