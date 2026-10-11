import assert from 'node:assert/strict'
import test from 'node:test'
import { exportEntriesToCSV, importEntriesFromCSV } from './timeEntryCsv.js'
import { validateEntry } from './validation.js'

const entry = {
  date: '2026-10-11',
  start_time: '09:00',
  end_time: '10:30',
}

test('exported API entries round-trip through import with minute precision', () => {
  const csv = exportEntriesToCSV([
    { ...entry, start_time: '09:00:00', end_time: '10:30:00' },
    { date: '2026-10-10', start_time: '23:00:00', end_time: '05:00:00' },
  ])
  assert.match(csv, /^Date,Start Time,End Time,Duration\r\n/)
  assert.match(csv, /09:00:00,10:30:00,1h 30m/)
  assert.deepEqual(importEntriesFromCSV(csv, validateEntry), {
    entries: [
      entry,
      { date: '2026-10-10', start_time: '23:00', end_time: '05:00' },
    ],
    errors: [],
  })
})

test('normalizes both headers and finds reordered columns exactly', () => {
  const csv =
    '\uFEFF" END TIME ","date"," StartTime "\r\n10:30:45,2026-10-11,09:00:30\r\n\r\n'
  assert.deepEqual(importEntriesFromCSV(csv, validateEntry), {
    entries: [entry],
    errors: [],
  })
  assert.throws(
    () =>
      importEntriesFromCSV(
        'Date,Start Time Notes,End Time\n2026-10-11,09:00,10:30',
        validateEntry
      ),
    /Missing required columns: Start Time/
  )
})

test('accepts quoted fields, embedded commas, escaped quotes and line breaks', () => {
  const csv =
    'Notes,Date,Start Time,End Time\n"a comma, a ""quote""\nand a new line",' +
    '"2026-10-11","09:00","10:30"\n'
  assert.deepEqual(importEntriesFromCSV(csv, validateEntry), {
    entries: [entry],
    errors: [],
  })
})

test('skips invalid rows while retaining valid rows and store validation', () => {
  const csv = [
    'Date,Start Time,End Time',
    '2026-10-11,09:00,10:30',
    '2026-10-11,24:00,10:30',
    '2026-10-11,09:00:60,10:30',
    '2026-10-11,09:60,10:30',
    '2026-10-11,09:01,10:30',
    '2026-10-11,17:00,09:00',
    '11/10/2026,09:00,10:30',
    '2026-10-11,09:00',
  ].join('\n')
  const result = importEntriesFromCSV(csv, validateEntry)
  assert.deepEqual(result.entries, [entry])
  assert.equal(result.errors.length, 7)
  assert.match(result.errors[0], /^Row 3: Invalid time format/)
  assert.match(result.errors[3], /5-minute increments/)
  assert.match(result.errors[4], /Start time must be before end time/)
  assert.match(result.errors[5], /Invalid date format/)
  assert.equal(result.errors[6], 'Row 9: Not enough columns')
})

test('rejects missing data, missing columns and malformed quoting', () => {
  for (const csv of ['', 'Date,Start Time,End Time\n']) {
    assert.throws(
      () => importEntriesFromCSV(csv, validateEntry),
      /at least a header and one data row/
    )
  }
  assert.throws(
    () => importEntriesFromCSV('Date\n2026-10-11', validateEntry),
    /Missing required columns: Start Time, End Time/
  )
  assert.throws(
    () =>
      importEntriesFromCSV(
        'Date,Start Time,End Time\n"2026-10-11,09:00,10:30',
        validateEntry
      ),
    /Invalid CSV:/
  )
})
