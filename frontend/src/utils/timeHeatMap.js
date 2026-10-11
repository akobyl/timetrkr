const BLOCK_MINUTES = 5
const BLOCKS_PER_DAY = 288

const minutesOfDay = (time) => {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  return hours * 60 + minutes + seconds / 60
}

const nextCalendarDay = (date) => {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString().slice(0, 10)
}

// Sample activity at each five-minute boundary: start <= time < end.
// Count each calendar day once, including overnight work on its actual date.
export function buildTimeHeatMap(entries, startDate, endDate) {
  const occupiedByDate = new Map()

  const addBlocks = (date, start, end) => {
    if (date < startDate || date > endDate || start >= end) return
    const firstBlock = Math.ceil(start / BLOCK_MINUTES)
    const endBlock = Math.ceil(end / BLOCK_MINUTES)
    if (firstBlock >= endBlock) return

    if (!occupiedByDate.has(date)) occupiedByDate.set(date, new Set())
    const occupied = occupiedByDate.get(date)
    for (let block = firstBlock; block < endBlock; block++) {
      occupied.add(block)
    }
  }

  for (const entry of entries) {
    const start = minutesOfDay(entry.start_time)
    const end = minutesOfDay(entry.end_time)
    if (end < start) {
      addBlocks(entry.date, start, 24 * 60)
      addBlocks(nextCalendarDay(entry.date), 0, end)
    } else {
      addBlocks(entry.date, start, end)
    }
  }

  const counts = new Array(BLOCKS_PER_DAY).fill(0)
  for (const occupied of occupiedByDate.values()) {
    for (const block of occupied) counts[block]++
  }

  return counts.map((count, index) => {
    const minutes = index * BLOCK_MINUTES
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
    const minute = String(minutes % 60).padStart(2, '0')
    return {
      time: `${hour}:${minute}`,
      count,
      intensity: occupiedByDate.size ? count / occupiedByDate.size : 0,
    }
  })
}
