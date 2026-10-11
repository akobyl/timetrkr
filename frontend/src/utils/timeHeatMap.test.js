import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTimeHeatMap } from './timeHeatMap.js'

const entry = (start_time, end_time, date = '2026-10-11') => ({
  date,
  start_time,
  end_time,
})
const heatMap = (entries, start = '2026-10-11', end = start) =>
  buildTimeHeatMap(entries, start, end)
const block = (data, time) => data.find((item) => item.time === time)

test('adjacent intervals exclude their endpoints without double counting', () => {
  const data = heatMap([entry('09:00', '09:05'), entry('09:05', '09:10')])
  assert.equal(data.length, 288)
  assert.deepEqual(
    data.filter((item) => item.count),
    [
      { time: '09:00', count: 1, intensity: 1 },
      { time: '09:05', count: 1, intensity: 1 },
    ]
  )
})

test('overlapping and duplicate entries count once per calendar day', () => {
  const data = heatMap(
    [
      entry('09:00', '09:15'),
      entry('09:05', '09:20'),
      entry('09:00', '09:15'),
      entry('09:05', '09:10', '2026-10-12'),
    ],
    '2026-10-11',
    '2026-10-12'
  )
  assert.deepEqual(block(data, '09:00'), {
    time: '09:00',
    count: 1,
    intensity: 0.5,
  })
  assert.deepEqual(block(data, '09:05'), {
    time: '09:05',
    count: 2,
    intensity: 1,
  })
  assert.ok(data.every((item) => item.intensity >= 0 && item.intensity <= 1))
})

test('empty and zero-duration entries contribute no activity or active days', () => {
  assert.ok(
    heatMap([]).every((item) => item.count === 0 && item.intensity === 0)
  )
  const zero = entry('02:00:00', '02:00:00', '2026-10-12')
  assert.ok(heatMap([zero], zero.date).every((item) => item.count === 0))
  const data = heatMap(
    [entry('09:00', '09:05'), zero],
    '2026-10-11',
    '2026-10-12'
  )
  assert.equal(block(data, '09:00').intensity, 1)
})

test('overnight work wraps to the next calendar day and unions with its entries', () => {
  const data = heatMap(
    [entry('23:55', '00:10'), entry('00:00', '00:05', '2026-10-12')],
    '2026-10-11',
    '2026-10-12'
  )
  assert.deepEqual(
    data.filter((item) => item.count),
    [
      { time: '00:00', count: 1, intensity: 0.5 },
      { time: '00:05', count: 1, intensity: 0.5 },
      { time: '23:55', count: 1, intensity: 0.5 },
    ]
  )
})

test('clips overnight work to the selected range, including carry-in across year end', () => {
  const overnight = entry('23:55', '00:05', '2026-12-31')
  const carryIn = heatMap([overnight], '2027-01-01')
  assert.deepEqual(
    carryIn.filter((item) => item.count),
    [{ time: '00:00', count: 1, intensity: 1 }]
  )
  const carryOut = heatMap([overnight], '2026-12-31')
  assert.deepEqual(
    carryOut.filter((item) => item.count),
    [{ time: '23:55', count: 1, intensity: 1 }]
  )
  assert.ok(
    heatMap([overnight], '2027-01-02').every((item) => item.count === 0)
  )
})

test('an overnight entry ending at midnight does not occupy the next day', () => {
  const data = heatMap([entry('23:55', '00:00')], '2026-10-11', '2026-10-12')
  assert.deepEqual(
    data.filter((item) => item.count),
    [{ time: '23:55', count: 1, intensity: 1 }]
  )
})

test('samples exact boundaries with second precision using half-open intervals', () => {
  const data = heatMap([entry('09:00:30', '09:10:00')])
  assert.deepEqual(
    data.filter((item) => item.count),
    [{ time: '09:05', count: 1, intensity: 1 }]
  )
})
