import {
  addCalendarDays,
  generateDateRange,
  getWeekRange,
} from './dateUtils.js'

// Include every intersecting Monday–Sunday week, even when it has no work.
export function buildWeeklyHours(minutesByDate, start, end) {
  const weeks = []
  for (
    let monday = getWeekRange(start).start;
    monday <= end;
    monday = addCalendarDays(monday, 7)
  ) {
    const sunday = addCalendarDays(monday, 6)
    const clippedStart = monday < start ? start : monday
    const clippedEnd = sunday > end ? end : sunday
    if (clippedStart > clippedEnd) continue
    const minutes = generateDateRange(clippedStart, clippedEnd).reduce(
      (total, date) => total + (minutesByDate[date] || 0),
      0
    )
    weeks.push({
      start: clippedStart,
      end: clippedEnd,
      isPartial: clippedStart !== monday || clippedEnd !== sunday,
      hours: minutes / 60,
    })
  }
  return weeks
}
