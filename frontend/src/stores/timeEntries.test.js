import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'

globalThis.window = { location: { port: '8000' } }
const { apiService } = await import('../services/api.js')
const { useTimeEntriesStore } = await import('./timeEntries.js')
const entry = {
  id: 1,
  date: '2026-10-11',
  start_time: '09:00',
  end_time: '10:00',
}
const failure = { response: { data: { detail: 'Service unavailable' } } }
let store
beforeEach(() => {
  setActivePinia(createPinia())
  store = useTimeEntriesStore()
  apiService.get = async (url) => ({
    data: url === '/time-entries/' ? [entry] : { total_minutes: 60 },
  })
  apiService.post =
    apiService.put =
    apiService.delete =
      async () => ({ data: entry })
})
test('initial failure exposes an error instead of an empty state', async () => {
  apiService.get = async () => {
    throw failure
  }
  assert.equal((await store.loadTimeEntries()).success, false)
  assert.equal(store.hasDashboardData, false)
  assert.match(store.dashboardError, /Service unavailable/)
  assert.equal(store.isLoadingDashboard, false)
})
test('partial refresh failure preserves the complete snapshot', async () => {
  await store.loadTimeEntries()
  const snapshot = () =>
    JSON.stringify([
      store.todayEntries,
      store.weekEntries,
      store.todaySummary,
      store.weekSummary,
      store.dailyTotals,
    ])
  const previous = snapshot()
  apiService.get = async (url) => {
    if (url === '/time-summary/') throw failure
    return { data: [] }
  }
  await store.loadTimeEntries()
  assert.equal(store.hasDashboardData, true)
  assert.equal(snapshot(), previous)
  assert.ok(store.dashboardError)
})
test('history preserves data and period on failure, retry clears error', async () => {
  await store.loadAllTimeEntries()
  const period = store.loadedHistoryPeriod
  store.filterDate = '2020-01'
  apiService.get = async () => {
    throw failure
  }
  assert.equal((await store.loadAllTimeEntries()).success, false)
  assert.deepEqual(store.allEntries, [entry])
  assert.equal(store.loadedHistoryPeriod, period)
  apiService.get = async () => ({ data: [] })
  await store.loadAllTimeEntries()
  assert.equal(store.historyError, '')
  assert.deepEqual(store.allEntries, [])
})
test('malformed lists preserve existing data', async () => {
  await store.loadTimeEntries()
  await store.loadAllTimeEntries()
  apiService.get = async () => ({ data: '<html>Unavailable</html>' })
  assert.equal((await store.loadTimeEntries()).success, false)
  assert.equal((await store.loadAllTimeEntries()).success, false)
  assert.deepEqual(store.todayEntries, [entry])
  assert.deepEqual(store.allEntries, [entry])
})
test('all mutation failures return actionable errors and preserve draft', async () => {
  store.currentEntry.endTime = '12:00'
  apiService.post =
    apiService.put =
    apiService.delete =
      async () => {
        throw failure
      }
  for (const result of [
    await store.saveTimeEntry(),
    await store.updateTimeEntry(1, entry),
    await store.deleteTimeEntry(1),
  ]) {
    assert.equal(result.success, false)
    assert.match(result.error, /Service unavailable.*try again/)
  }
  assert.equal(store.currentEntry.endTime, '12:00')
})
test('write succeeds independently of refresh; refresh retry never writes', async () => {
  let writes = 0
  apiService.post = async () => {
    writes++
    return { data: entry }
  }
  apiService.get = async () => {
    throw failure
  }
  assert.equal((await store.saveTimeEntry()).success, true)
  assert.equal(store.currentEntry.endTime, '17:00')
  assert.equal((await store.loadTimeEntries()).success, false)
  await store.loadTimeEntries()
  assert.equal(writes, 1)
})
test('successful delete removes rows even when refresh fails', async () => {
  await store.loadTimeEntries()
  await store.loadAllTimeEntries()
  assert.equal((await store.deleteTimeEntry(1)).success, true)
  apiService.get = async () => {
    throw failure
  }
  await store.loadTimeEntries()
  assert.deepEqual(store.todayEntries, [])
  assert.deepEqual(store.allEntries, [])
})
