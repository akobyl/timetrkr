import Papa from 'papaparse'
import { calculateDurationMinutes, formatMinutes } from './timeUtils.js'

const requiredColumns = ['Date', 'Start Time', 'End Time']

function normalizeHeader(header) {
  return header.toLowerCase().replace(/\s/g, '')
}

function normalizeTime(time) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) {
    throw new Error('Invalid time format (expected HH:MM or HH:MM:SS)')
  }
  // Entries have minute precision, matching the API's time normalization.
  return time.slice(0, 5)
}

export function exportEntriesToCSV(entries) {
  return Papa.unparse({
    fields: [...requiredColumns, 'Duration'],
    data: entries.map((entry) => [
      entry.date,
      entry.start_time,
      entry.end_time,
      formatMinutes(calculateDurationMinutes(entry.start_time, entry.end_time)),
    ]),
  })
}

export function importEntriesFromCSV(text, validateEntry) {
  const result = Papa.parse(text, {
    delimiter: ',',
    skipEmptyLines: 'greedy',
  })
  if (result.errors.length > 0) {
    throw new Error(`Invalid CSV: ${result.errors[0].message}`)
  }
  if (result.data.length < 2) {
    throw new Error('CSV file must have at least a header and one data row')
  }

  const header = result.data[0].map(normalizeHeader)
  const indices = requiredColumns.map((column) =>
    header.indexOf(normalizeHeader(column))
  )
  const missingColumns = requiredColumns.filter(
    (_, index) => indices[index] < 0
  )
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
  }

  const entries = []
  const errors = []
  for (let i = 1; i < result.data.length; i++) {
    try {
      const row = result.data[i]
      if (row.length <= Math.max(...indices)) {
        throw new Error('Not enough columns')
      }
      const [date, start, end] = indices.map((index) => row[index].trim())
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Invalid date format (expected YYYY-MM-DD)')
      }
      const startTime = normalizeTime(start)
      const endTime = normalizeTime(end)
      const validation = validateEntry({ date, startTime, endTime })
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      entries.push({ date, start_time: startTime, end_time: endTime })
    } catch (error) {
      // Row numbers refer to CSV records, which may span multiple lines.
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }
  return { entries, errors }
}
