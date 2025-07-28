/**
 * Date and time utility functions
 */

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 */
export function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a Date object as YYYY-MM-DD string in local timezone
 */
export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the current week range (Monday to Sunday)
 * @returns {Object} Object with start, end, startDate, endDate
 */
export function getCurrentWeekRange() {
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
  
  // Format as YYYY-MM-DD strings using local date format
  const startStr = formatLocalDate(startOfWeek)
  const endStr = formatLocalDate(endOfWeek)
  
  return {
    start: startStr,
    end: endStr,
    startDate: startOfWeek,
    endDate: endOfWeek
  }
}