import assert from 'node:assert/strict'
import test from 'node:test'
import { effectiveMinutesByDate } from './timeTotals.js'

const entry = (date, start_time, end_time) => ({ date, start_time, end_time })

test('overlaps, duplicates, nesting and touching intervals count once', () => {
  const entries = [
    entry('2026-10-10', '09:00', '10:00'),
    entry('2026-10-10', '09:30', '10:30'),
    entry('2026-10-10', '09:30', '10:30'),
    entry('2026-10-10', '09:40', '09:50'),
    entry('2026-10-10', '10:30', '11:00'),
  ]
  assert.deepEqual(
    effectiveMinutesByDate(entries.reverse(), '2026-10-10', '2026-10-10'),
    { '2026-10-10': 120 }
  )
})

test('overnight overlaps split across calendar dates and clip to the range', () => {
  const entries = [
    entry('2026-10-10', '23:00', '02:00'),
    entry('2026-10-11', '01:00', '03:00'),
  ]
  assert.deepEqual(
    effectiveMinutesByDate(entries, '2026-10-10', '2026-10-11'),
    { '2026-10-10': 60, '2026-10-11': 180 }
  )
  assert.deepEqual(
    effectiveMinutesByDate(entries, '2026-10-11', '2026-10-11'),
    { '2026-10-11': 180 }
  )
})

test('empty and zero-duration entries add no time', () => {
  assert.deepEqual(effectiveMinutesByDate([], '2026-10-10', '2026-10-11'), {})
  assert.deepEqual(
    effectiveMinutesByDate(
      [entry('2026-10-10', '01:00', '01:00')],
      '2026-10-10',
      '2026-10-11'
    ),
    {}
  )
})
