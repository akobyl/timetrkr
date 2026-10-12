const MINUTES_PER_DAY = 1440

const minutesOfDay = (time) => {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  return hours * 60 + minutes + seconds / 60
}

const nextDay = (date) => {
  const day = new Date(`${date}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + 1)
  return day.toISOString().slice(0, 10)
}

// Split overnight work onto its actual calendar dates, then merge overlaps.
export function effectiveMinutesByDate(entries, startDate, endDate) {
  const intervals = new Map()
  const add = (date, start, end) => {
    if (date < startDate || date > endDate || start >= end) return
    if (!intervals.has(date)) intervals.set(date, [])
    intervals.get(date).push([start, end])
  }
  for (const entry of entries) {
    const start = minutesOfDay(entry.start_time)
    const end = minutesOfDay(entry.end_time)
    if (end < start) {
      add(entry.date, start, MINUTES_PER_DAY)
      add(nextDay(entry.date), 0, end)
    } else {
      add(entry.date, start, end)
    }
  }
  const totals = {}
  for (const [date, ranges] of intervals) {
    let total = 0
    let previousEnd = 0
    for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
      total += Math.max(0, end - Math.max(start, previousEnd))
      previousEnd = Math.max(previousEnd, end)
    }
    totals[date] = total
  }
  return totals
}
