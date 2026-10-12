import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import {
  addCalendarDays,
  formatCalendarDate,
  formatLocalDate,
  generateDateRange,
  getCurrentWeekRange,
  getWeekRange,
  parseLocalDate,
} from './dateUtils.js'
import { effectiveMinutesByDate } from './timeTotals.js'
import { buildWeeklyHours } from './weeklyHours.js'

if (!process.env.CALENDAR_TEST_ZONE) {
  for (const zone of [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/Berlin',
    'Asia/Tokyo',
  ]) {
    test(`calendar dates and dashboard/analytics agree in ${zone}`, () => {
      const env = { ...process.env, TZ: zone, CALENDAR_TEST_ZONE: zone }
      delete env.NODE_TEST_CONTEXT
      const result = spawnSync(
        process.execPath,
        [fileURLToPath(import.meta.url)],
        {
          env,
          encoding: 'utf8',
        }
      )
      assert.equal(result.status, 0, result.stdout + result.stderr)
      assert.match(result.stdout, /# tests 3/)
    })
  }
} else {
  globalThis.window = { location: { port: '8000' } }
  const { apiService, formatUtils } = await import('../services/api.js')
  const { useTimeEntriesStore } = await import('../stores/timeEntries.js')

  test('parsing, display and arithmetic preserve calendar dates', () => {
    for (const [start, end] of [
      ['2026-03-07', '2026-03-09'],
      ['2026-10-31', '2026-11-02'],
      ['2026-03-28', '2026-03-30'],
      ['2026-10-24', '2026-10-26'],
      ['2024-02-28', '2024-03-01'],
      ['2026-12-31', '2027-01-02'],
    ]) {
      const dates = generateDateRange(start, end)
      assert.equal(dates.length, 3)
      assert.equal(dates[2], end)
      assert.equal(addCalendarDays(end, -2), start)
      for (const date of dates) {
        assert.equal(formatLocalDate(parseLocalDate(date)), date)
        assert.equal(
          formatCalendarDate(date, { day: 'numeric' }),
          String(Number(date.slice(-2)))
        )
        assert.equal(
          formatUtils.formatDate(date),
          parseLocalDate(date).toLocaleDateString()
        )
      }
    }
    assert.deepEqual(generateDateRange('2026-10-12', '2026-10-11'), [])
    assert.deepEqual(getWeekRange('2026-10-11'), {
      start: '2026-10-05',
      end: '2026-10-11',
    })
  })

  test('Wednesday ranges align to Monday, clip both ends and keep empty partial weeks', () => {
    assert.deepEqual(
      buildWeeklyHours(
        {
          '2026-10-07': 60,
          '2026-10-11': 120,
          '2026-10-12': 180,
          '2026-10-05': 999,
        },
        '2026-10-07',
        '2026-10-20'
      ),
      [
        { start: '2026-10-07', end: '2026-10-11', isPartial: true, hours: 3 },
        { start: '2026-10-12', end: '2026-10-18', isPartial: false, hours: 3 },
        { start: '2026-10-19', end: '2026-10-20', isPartial: true, hours: 0 },
      ]
    )
    assert.deepEqual(buildWeeklyHours({}, '2026-10-11', '2026-10-11'), [
      { start: '2026-10-11', end: '2026-10-11', isPartial: true, hours: 0 },
    ])
    assert.deepEqual(buildWeeklyHours({}, '2026-10-12', '2026-10-11'), [])
  })

  test('dashboard and analytics totals agree across DST and year boundaries', async (t) => {
    for (const today of [
      '2026-03-08',
      '2026-11-01',
      '2026-03-29',
      '2026-10-25',
      '2027-01-01',
    ]) {
      t.mock.timers.enable({
        apis: ['Date'],
        now: parseLocalDate(today).getTime(),
      })
      const { start, end } = getCurrentWeekRange()
      const entries = [
        {
          date: addCalendarDays(start, -1),
          start_time: '23:00',
          end_time: '01:00',
        },
        ...generateDateRange(start, end).map((date) => ({
          date,
          start_time: '09:00',
          end_time: '10:00',
        })),
        { date: start, start_time: '09:30', end_time: '11:00' },
        { date: end, start_time: '23:00', end_time: '02:00' },
        {
          date: addCalendarDays(end, 1),
          start_time: '09:00',
          end_time: '10:00',
        },
      ]
      setActivePinia(createPinia())
      const store = useTimeEntriesStore()
      const requestedRanges = []
      apiService.get = async (url, options) => {
        if (url === '/time-entries/') return { data: entries }
        requestedRanges.push(options.params)
        const totals = effectiveMinutesByDate(
          entries,
          options.params.start_date,
          options.params.end_date
        )
        return {
          data: {
            total_minutes: Object.values(totals).reduce((a, b) => a + b, 0),
          },
        }
      }
      assert.equal((await store.loadTimeEntries()).success, true)
      assert.deepEqual(requestedRanges[1], { start_date: start, end_date: end })
      const weeks = buildWeeklyHours(
        effectiveMinutesByDate(entries, start, end),
        start,
        end
      )
      assert.equal(weeks.length, 1)
      assert.equal(weeks[0].isPartial, false)
      assert.equal(weeks[0].hours, 10)
      assert.equal(store.weekSummary.total_minutes, weeks[0].hours * 60)
      assert.equal(
        Object.values(store.dailyTotals).reduce(
          (total, day) => total + day.minutes,
          0
        ),
        weeks[0].hours * 60
      )
      t.mock.timers.reset()
    }
  })
}
