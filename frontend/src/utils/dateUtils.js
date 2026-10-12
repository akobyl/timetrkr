// Date-only values are YYYY-MM-DD strings. Convert by local components at noon
// for calendar arithmetic and display; never parse them as UTC timestamps.
export function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getLocalDateString() {
  return formatLocalDate(new Date())
}

export function addCalendarDays(value, days) {
  const date = parseLocalDate(value)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

export function generateDateRange(start, end) {
  const dates = []
  for (let date = start; date <= end; date = addCalendarDays(date, 1)) {
    dates.push(date)
  }
  return dates
}

// The application's week policy is Monday through Sunday.
export function getWeekRange(value) {
  const offset = (parseLocalDate(value).getDay() + 6) % 7
  const start = addCalendarDays(value, -offset)
  return { start, end: addCalendarDays(start, 6) }
}

export function getCurrentWeekRange(today = new Date()) {
  const { start, end } = getWeekRange(formatLocalDate(today))
  const startDate = parseLocalDate(start)
  const endDate = parseLocalDate(end)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)
  return { start, end, startDate, endDate }
}

export function formatCalendarDate(
  value,
  options = { month: 'short', day: 'numeric' }
) {
  return value
    ? parseLocalDate(value).toLocaleDateString(undefined, options)
    : ''
}
