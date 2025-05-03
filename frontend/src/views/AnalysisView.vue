<template>
  <div class="analysis-view">
    <div class="card">
      <div class="card-header">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <h3 class="mb-3 mb-lg-0">Time Analysis</h3>
          
          <!-- Desktop layout -->
          <div class="d-none d-lg-flex date-controls-wrapper align-items-center">
            <div class="dropdown date-preset-dropdown me-3">
              <button class="btn btn-outline-primary dropdown-toggle" type="button" 
                      id="datePresetDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                {{ selectedPreset ? getPresetLabel(selectedPreset) : 'Select Range' }}
              </button>
              <ul class="dropdown-menu" aria-labelledby="datePresetDropdown">
                <!-- Week-based options -->
                <li><h6 class="dropdown-header">Weeks</h6></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('current_week')">Current Week</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_week')">Last Week</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_2_weeks')">Last 2 Weeks</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_4_weeks')">Last 4 Weeks</a></li>
                <!-- Month-based options -->
                <li><hr class="dropdown-divider"></li>
                <li><h6 class="dropdown-header">Months</h6></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('current_month')">Current Month</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_month')">Last Month</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_3_months')">Last 3 Months</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_6_months')">Last 6 Months</a></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('this_year')">This Year</a></li>
                <!-- Custom range option -->
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" @click.prevent="selectedPreset = ''">Custom Range</a></li>
              </ul>
            </div>
            
            <div class="desktop-date-inputs d-flex" v-show="!selectedPreset || selectedPreset === ''">
              <div class="input-group me-2" style="width: 230px;">
                <span class="input-group-text">From</span>
                <input type="date" class="form-control" v-model="startDate" :max="endDate" @change="manualDateInput = true">
              </div>
              <div class="input-group me-2" style="width: 230px;">
                <span class="input-group-text">To</span>
                <input type="date" class="form-control" v-model="endDate" :min="startDate" @change="manualDateInput = true">
              </div>
            </div>
            
            <!-- Desktop apply button (single button for both preset and custom) -->
            <button class="btn btn-primary ms-2" 
                  @click="fetchTimeData" 
                  :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              Apply
            </button>
          </div>
          
          <!-- Mobile layout -->
          <div class="d-block d-lg-none date-preset-group">
            <button class="btn btn-outline-primary dropdown-toggle" type="button" 
                    id="mobilePresetDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              {{ selectedPreset ? getPresetLabel(selectedPreset) : 'Select Range' }}
            </button>
            <ul class="dropdown-menu" aria-labelledby="mobilePresetDropdown">
              <!-- Week-based options -->
              <li><h6 class="dropdown-header">Weeks</h6></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('current_week')">Current Week</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_week')">Last Week</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_2_weeks')">Last 2 Weeks</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_4_weeks')">Last 4 Weeks</a></li>
              <!-- Month-based options -->
              <li><hr class="dropdown-divider"></li>
              <li><h6 class="dropdown-header">Months</h6></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('current_month')">Current Month</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_month')">Last Month</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_3_months')">Last 3 Months</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('last_6_months')">Last 6 Months</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectPreset('this_year')">This Year</a></li>
              <!-- Custom range option -->
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" @click.prevent="selectedPreset = ''">Custom Range</a></li>
            </ul>
          </div>
        </div>
        
        <!-- Mobile custom date inputs -->
        <div class="d-block d-lg-none date-controls-custom mt-2" v-show="!selectedPreset || selectedPreset === ''">
          <div class="row g-2">
            <div class="col-6">
              <div class="input-group">
                <span class="input-group-text">From</span>
                <input type="date" class="form-control" v-model="startDate" :max="endDate" @change="manualDateInput = true">
              </div>
            </div>
            <div class="col-6">
              <div class="input-group">
                <span class="input-group-text">To</span>
                <input type="date" class="form-control" v-model="endDate" :min="startDate" @change="manualDateInput = true">
              </div>
            </div>
            <div class="col-12 mt-2">
              <button class="btn btn-primary w-100" @click="fetchTimeData" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                Apply
              </button>
            </div>
          </div>
        </div>
        
        <!-- Mobile apply button for presets -->
        <div class="d-block d-lg-none mt-2" v-show="selectedPreset && selectedPreset !== ''">
          <button class="btn btn-primary w-100" @click="fetchTimeData" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
            Apply
          </button>
        </div>
        
        <!-- Selected date range display -->
        <div class="selected-date-range mt-2" v-if="startDate && endDate">
          <small class="text-muted">
            Viewing data from {{ formatDateDisplay(startDate) }} to {{ formatDateDisplay(endDate) }}
          </small>
        </div>
      </div>
      <div class="card-body">
        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Loading time data...</p>
        </div>

        <div v-else-if="dailyHours.length === 0" class="text-muted text-center py-5">
          <i class="bi bi-bar-chart-line" style="font-size: 3rem;"></i>
          <br><br>
          No time entries found for the selected date range.
          <br>
          <button class="btn btn-outline-primary mt-3" @click="setDefaultDateRange">
            Reset to Default Range
          </button>
        </div>

        <div v-else>
          <div class="mb-4">
            <h4>Daily Hours Histogram</h4>
            <div style="position: relative; height: 300px; width: 100%;">
              <canvas ref="histogramChart"></canvas>
            </div>
          </div>

          <div class="mb-4 mt-5">
            <h4>Weekly Hours</h4>
            <div style="position: relative; height: 300px; width: 100%;">
              <canvas ref="weeklyChart"></canvas>
            </div>
          </div>

          <div class="mb-4 mt-5">
            <h4>Time of Day Heat Map</h4>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas ref="heatChart"></canvas>
            </div>
          </div>

          <div class="mt-5">
            <h4>Summary</h4>
            <div class="row">
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="card-title">Total Hours</h5>
                    <p class="card-text display-6">{{ totalHours.toFixed(1) }}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="card-title">Average Daily</h5>
                    <p class="card-text display-6">{{ avgHoursPerDay.toFixed(1) }}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="card-title">Days Tracked</h5>
                    <p class="card-text display-6">{{ daysWithEntries }}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="card-title">Max Hours</h5>
                    <p class="card-text display-6">{{ maxHours.toFixed(1) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { apiService } from '../services/api'
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

// Data
const startDate = ref('')
const endDate = ref('')
const selectedPreset = ref('')
const isLoading = ref(false)
const error = ref(null)
const dailyHours = ref([])
const weeklyHours = ref([])
const timeHeatData = ref([])
const histogramChart = ref(null)
const weeklyChart = ref(null)
const heatChart = ref(null)
const dailyChartInstance = ref(null)
const weeklyChartInstance = ref(null)
const heatChartInstance = ref(null)

// Setup date range (default to current week)
const setDefaultDateRange = () => {
  // Reset manual input flag
  manualDateInput = false

  const now = new Date()
  // Get current week dates (Sunday to Saturday)
  const { start, end } = getWeekDates(now)

  // Format as YYYY-MM-DD in local time
  endDate.value = formatYYYYMMDD(end)
  startDate.value = formatYYYYMMDD(start)

  // Set preset selection to current week
  selectedPreset.value = 'current_week'
}

// Handle date presets
const applyDatePreset = (event = null) => {
  // Reset manual input flag since we're applying a preset
  manualDateInput = false

  const now = new Date()
  let start, end

  switch (selectedPreset.value) {
    // Week-based options
    case 'current_week':
      // Current week (Sunday to Saturday)
      const thisWeek = getWeekDates(now);
      start = thisWeek.start;
      end = thisWeek.end;
      break;

    case 'last_week':
      // Last week (Sunday to Saturday of previous week)
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekDates = getWeekDates(lastWeek);
      start = lastWeekDates.start;
      end = lastWeekDates.end;
      break;

    case 'last_2_weeks':
      // Last 2 weeks - using exact 14 days from today
      // Get the current week's Sunday
      const currentWeek2 = getWeekDates(now);
      // For 2 weeks, start exactly 14 days before the end date
      const exactTwoWeeksAgo = new Date(currentWeek2.end);
      exactTwoWeeksAgo.setDate(exactTwoWeeksAgo.getDate() - 13); // 14 days including today
      start = exactTwoWeeksAgo;
      end = currentWeek2.end;
      break;

    case 'last_4_weeks':
      // Last 4 weeks - using exact 28 days from today
      // Get the current week's end date
      const currentWeekEnd = getWeekDates(now).end;
      // For 4 weeks, start exactly 28 days before the end date
      const exactFourWeeksAgo = new Date(currentWeekEnd);
      exactFourWeeksAgo.setDate(exactFourWeeksAgo.getDate() - 27); // 28 days including today
      start = exactFourWeeksAgo;
      end = currentWeekEnd;
      break;

    // Month-based options
    case 'current_month':
      // First and last day of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break

    case 'last_month':
      // Last month: 1st to last day of previous month
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break

    case 'last_3_months':
      // Last 3 months: 1st day of month from 3 months ago to last day of current month
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break

    case 'last_6_months':
      // Last 6 months: 1st day of month from 6 months ago to last day of current month
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break

    case 'this_year':
      // This year: January 1st to last day of current month
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break

    default:
      // Custom range - do nothing
      return
  }

  // Format date values consistently in local time
  startDate.value = formatYYYYMMDD(start)
  endDate.value = formatYYYYMMDD(end)

  // Log the date range for debugging
  console.log(`Date range applied: ${startDate.value} to ${endDate.value}`)

  // Fetch data with new range
  fetchTimeData()
}

// Computed properties for summary stats
const totalHours = computed(() => {
  return dailyHours.value.reduce((total, day) => total + day.hours, 0)
})

const avgHoursPerDay = computed(() => {
  if (daysWithEntries.value === 0) return 0
  return totalHours.value / daysWithEntries.value
})

const daysWithEntries = computed(() => {
  return dailyHours.value.filter(day => day.hours > 0).length
})

const maxHours = computed(() => {
  if (dailyHours.value.length === 0) return 0
  return Math.max(...dailyHours.value.map(day => day.hours))
})

// Fetch time entries and calculate daily and weekly hours
const fetchTimeData = async () => {
  if (!startDate.value || !endDate.value) {
    error.value = 'Please select a start and end date'
    return
  }

  try {
    isLoading.value = true
    error.value = null

    // Get all time entries
    const response = await apiService.get('/time-entries/')

    // Ensure response is an array
    const entries = Array.isArray(response.data) ? response.data : []
    console.log('API returned entries:', entries.length)

    // Generate a date range array (all days between start and end)
    const dateRange = generateDateRange(startDate.value, endDate.value)
    console.log('Date range generated:', dateRange.length, 'days')
    console.log('Date range start:', dateRange[0], 'end:', dateRange[dateRange.length - 1])

    // Verify that the date range includes the end date
    if (dateRange.length > 0 && dateRange[dateRange.length - 1] !== endDate.value) {
      console.warn(`Warning: Date range does not include the end date! End date: ${endDate.value}, Last date in range: ${dateRange[dateRange.length - 1]}`)
    }

    // Calculate daily total hours
    dailyHours.value = dateRange.map(date => {
      // Find entries for this date
      const dayEntries = entries.filter(entry => entry.date === date)

      // Calculate total hours
      let totalMinutes = 0
      dayEntries.forEach(entry => {
        const startParts = entry.start_time.split(':').map(Number)
        const endParts = entry.end_time.split(':').map(Number)

        let startMinutes = startParts[0] * 60 + startParts[1]
        let endMinutes = endParts[0] * 60 + endParts[1]

        // Handle overnight entries
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60
        }

        totalMinutes += endMinutes - startMinutes
      })

      // Convert minutes to hours
      const hours = totalMinutes / 60

      return {
        date: formatDate(date),
        rawDate: date,
        hours
      }
    })

    // Calculate weekly hours
    // Group days into Sunday-Saturday weeks and sum up hours
    const weekMap = new Map()

    // Parse start and end dates to use for boundary checking
    const startDateObj = new Date(startDate.value)
    const endDateObj = new Date(endDate.value)

    // First, get the exact Sunday of the selected start date
    // Use the exact start date from selected range, don't go back to previous Sunday
    // This ensures we don't include weeks that are not in the selected range
    const targetSunday = new Date(startDateObj)

    console.log(`Original start date: ${startDateObj.toISOString()} (day of week: ${startDateObj.getDay()})`)

    // Only adjust to previous Sunday if explicitly requested via startOnSunday flag
    const startOnSunday = false // Set to true if you want to always start on Sunday

    if (startOnSunday && targetSunday.getDay() > 0) {
      const dayOfWeek = targetSunday.getDay()
      targetSunday.setDate(targetSunday.getDate() - dayOfWeek)
      console.log(`Adjusted to previous Sunday: ${targetSunday.toISOString()}`)
    }

    // For each Sunday-Saturday week that intersects our date range
    let weekStart = new Date(targetSunday)
    let weekIndex = 1 // Start with Week 1

    console.log("Starting week calculation with first Sunday:", weekStart.toISOString())

    // Only generate weeks that have their start date within our date range
    // This prevents generating weeks that start before our range
    while (weekStart <= endDateObj) {
      // Only add weeks that start on or after our start date
      if (weekStart < startDateObj) {
        console.log(`Skipping week that starts before our range: ${weekStart.toISOString()}`)
        // Move to next week
        weekStart = new Date(weekStart)
        weekStart.setDate(weekStart.getDate() + 7)
        continue
      }

      // Calculate end of this week (Saturday)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      // Create a unique key for this week
      const weekKey = `Week-${formatYYYYMMDD(weekStart)}`

      // Convert to strings for formatting properly
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      // Format dates directly using Date objects to avoid any inconsistencies
      // Get the formatted display strings directly from the Date objects
      const displayStartStr = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const displayEndStr = weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

      console.log(`Week ${weekIndex}: ${weekStartStr} (${displayStartStr}) to ${weekEndStr} (${displayEndStr})`)

      // Create an entry for this week
      weekMap.set(weekKey, {
        weekNumber: weekIndex,
        startDate: new Date(weekStart), // Keep for sorting
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        weekLabel: `${displayStartStr} - ${displayEndStr}`, // Use date range as label
        weekRange: `${displayStartStr} - ${displayEndStr}`,
        hours: 0,
        sortKey: weekStart.getTime() // Sort by start date timestamp
      })

      // Move to next week
      weekStart = new Date(weekStart)
      weekStart.setDate(weekStart.getDate() + 7)
      weekIndex++
    }

    // Now, assign each day's hours to the appropriate week
    // Only process days that fall exactly within our date range
    dailyHours.value.forEach(day => {
      if (!day.rawDate) return

      const date = new Date(day.rawDate)

      // Skip dates outside our range (strict check)
      if (date < startDateObj || date > endDateObj) {
        console.log(`Skipping out-of-range date: ${day.rawDate}`)
        return
      }

      // Find which week this day belongs to, but only within the selected range
      // For example, if we've selected Apr 20-26, we only want days to go into that week
      // and not into the previous week (Apr 13-19) if a day happens to fall in that range

      // Check each of our predefined weeks
      let found = false
      for (const [weekKey, weekData] of weekMap.entries()) {
        // Check if this day falls within this week's range
        const weekStartDate = new Date(weekData.weekStart)
        const weekEndDate = new Date(weekData.weekEnd)

        // Day must be within this specific week's range
        if (date >= weekStartDate && date <= weekEndDate) {
          // Add hours to this week
          weekData.hours += day.hours
          found = true
          break
        }
      }

      if (!found) {
        console.warn(`Day ${day.rawDate} doesn't match any week in range ${startDate.value} to ${endDate.value}`)
      }
    })

    // Convert map to array, filter with stronger criteria, and sort by week number
    weeklyHours.value = Array.from(weekMap.values())
      .filter(week => {
        // Always keep weeks with hours
        if (week.hours > 0) {
          return true
        }

        // For zero-hour weeks, apply stricter filtering
        const weekStart = new Date(week.weekStart)
        const weekEnd = new Date(week.weekEnd)

        // If the week is completely contained within our date range, keep it
        // This ensures we show zero-hour weeks that are explicitly in our range
        if (weekStart >= startDateObj && weekEnd <= endDateObj) {
          return true
        }

        // For partial overlap weeks with zero hours, filter them out
        return false
      })
      .sort((a, b) => a.sortKey - b.sortKey)

    // We want to show all weeks in the selected date range, even if they have 0 hours
    // This ensures the weekly chart covers the exact same date range as the daily chart

    // Calculate the heat map data (time of day frequency)
    // We'll create 5-minute blocks throughout the day (288 blocks)
    const timeBlocks = 288; // 24 hours * 12 blocks per hour (5-minute intervals)
    const timeBlockCounts = new Array(timeBlocks).fill(0);
    const daysWithEntries = new Set(); // Track unique days with entries

    // Process each time entry
    entries.forEach(entry => {
      // Only process entries within the selected date range
      if (entry.date < startDate.value || entry.date > endDate.value) return;

      // Add this day to our set of days with entries
      daysWithEntries.add(entry.date);

      // Convert start and end times to minute offsets in the day
      const [startHour, startMin] = entry.start_time.split(':').map(Number);
      const [endHour, endMin] = entry.end_time.split(':').map(Number);

      // Calculate start and end blocks
      let startBlock = Math.floor((startHour * 60 + startMin) / 5);
      let endBlock = Math.floor((endHour * 60 + endMin) / 5);

      // Handle overnight entries
      if (endBlock < startBlock) {
        endBlock += timeBlocks;
      }

      // Mark each 5-minute block in this time range
      for (let block = startBlock; block <= endBlock; block++) {
        const actualBlock = block % timeBlocks; // Wrap around for overnight entries
        timeBlockCounts[actualBlock]++;
      }
    });

    // Create the heat map data structure
    timeHeatData.value = timeBlockCounts.map((count, index) => {
      // Calculate the hour and minute for this block
      const totalMinutes = index * 5;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      // Format the time label as HH:MM (no seconds)
      const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      return {
        time: timeLabel,
        count: count,
        // Calculate a normalized value for color intensity (0-1)
        intensity: daysWithEntries.size > 0 ? count / daysWithEntries.size : 0
      };
    });


  } catch (err) {
    console.error('Error fetching time data:', err)
    error.value = 'Failed to load time data. Please try again later.'
  } finally {
    isLoading.value = false
    await nextTick()

    if (dailyHours.value.length > 0) {
      updateDailyChart()
      updateWeeklyChart()
      updateHeatChart()
    }
  }
}

// Helper function to get week of month (1-5)
const getWeekOfMonth = (date) => {
  // Create a copy of the date
  const d = new Date(date)
  // Get the day of the month (1-31)
  const day = d.getDate()
  // Divide by 7 and round up to get the week number (1-5)
  return Math.ceil(day / 7)
}

// Helper function to get the start date (Sunday) and end date (Saturday) of a week
const getWeekDates = (date) => {
  // Create a copy of the date to avoid modifying the original
  const d = new Date(date)

  // Calculate start date (Sunday) - go back to the Sunday of this week
  const day = d.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Create a new date for Sunday (beginning of week)
  const start = new Date(d)
  // If not already Sunday, go back to the previous Sunday
  if (day !== 0) {
    start.setDate(d.getDate() - day)
  }
  start.setHours(0, 0, 0, 0) // Set to start of day

  // Calculate end date (Saturday = Sunday + 6 days)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999) // Set to end of day

  console.log(`Week dates for ${d.toISOString()}: ${start.toISOString()} to ${end.toISOString()}`)

  return { start, end }
}

// Helper to generate all dates in a range (inclusive of both start and end)
const generateDateRange = (start, end) => {
  console.log(`Generating date range from ${start} to ${end}`)

  // Start with empty array
  const dates = []

  // Parse dates by components to avoid timezone issues
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)

  // Create Date objects for comparison (set to noon to avoid timezone issues)
  const startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0)
  const endDate = new Date(endYear, endMonth - 1, endDay, 12, 0, 0)

  // Extra safety check
  if (startDate > endDate) {
    console.error('Start date is after end date')
    return dates
  }

  // Initialize current date to start date
  let currentYear = startYear
  let currentMonth = startMonth - 1 // JS months are 0-indexed
  let currentDay = startDay

  // Keep generating dates until we've reached or passed the end date
  while (true) {
    // Create a date object for the current date (set to noon)
    const currentDate = new Date(currentYear, currentMonth, currentDay, 12, 0, 0)

    // Stop if we've passed the end date
    if (currentDate > endDate) {
      break
    }

    // Format current date and add to array
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
    dates.push(formattedDate)

    // If we've reached the end date, we're done
    if (currentYear === endYear && currentMonth === endMonth - 1 && currentDay === endDay) {
      break
    }

    // Advance to next day
    currentDay++

    // Check if we need to roll over to next month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    if (currentDay > daysInMonth) {
      currentDay = 1
      currentMonth++

      // Check if we need to roll over to next year
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear++
      }
    }
  }

  // Add debugging info
  if (dates.length > 0) {
    console.log(`Generated ${dates.length} dates from ${dates[0]} to ${dates[dates.length - 1]}`)
  } else {
    console.warn('No dates were generated!')
  }

  return dates
}

// Helper function to format Date as YYYY-MM-DD in local timezone
const formatYYYYMMDD = (date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format date for display
const formatDate = (dateStr) => {
  // Handle both ISO strings and Date objects
  let date;
  if (dateStr instanceof Date) {
    date = new Date(dateStr); // Create a copy to avoid modifying the original
    date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  } else {
    const parts = dateStr.split('-');
    // JavaScript months are 0-based (0 = January)
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);

    // Create a date object at noon to avoid timezone issues
    date = new Date(year, month, day, 12, 0, 0);
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Format date for the display below the date picker
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  
  const date = new Date(year, month, day);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Get friendly label for preset options
const getPresetLabel = (preset) => {
  const presetLabels = {
    'current_week': 'Current Week',
    'last_week': 'Last Week',
    'last_2_weeks': 'Last 2 Weeks',
    'last_4_weeks': 'Last 4 Weeks',
    'current_month': 'Current Month',
    'last_month': 'Last Month',
    'last_3_months': 'Last 3 Months',
    'last_6_months': 'Last 6 Months',
    'this_year': 'This Year',
    '': 'Custom Range'
  };
  
  return presetLabels[preset] || 'Select Range';
}

// Handle preset selection 
const selectPreset = (preset) => {
  selectedPreset.value = preset;
  applyDatePreset();
}

// Update daily chart
const updateDailyChart = () => {
  if (!histogramChart.value) {
    console.error('Daily chart canvas ref is not available yet.');
    return;
  }

  // Destroy existing chart instance if it exists to prevent memory leaks
  if (dailyChartInstance.value) {
    console.log('Destroying existing daily chart instance');
    dailyChartInstance.value.destroy();
    dailyChartInstance.value = null;
  }

  // Prepare data - ensure we have correct date labels
  const labels = dailyHours.value.map(day => day.date);
  const data = dailyHours.value.map(day => day.hours);

  // Create a new chart instance
  console.log('Creating new daily chart instance');
  const ctx = histogramChart.value.getContext('2d');
  if (!ctx) {
    console.error('Failed to get daily chart canvas context');
    return;
  }

  dailyChartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours',
        data: data,
        backgroundColor: 'rgba(13, 110, 253, 0.5)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours' }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (tooltipItems) { return tooltipItems[0].label; },
            label: function (context) { return `${context.formattedValue} hours`; }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
  console.log('New daily chart instance created successfully');
};

// Update weekly chart
const updateWeeklyChart = () => {
  if (!weeklyChart.value) {
    console.error('Weekly chart canvas ref is not available yet.');
    return;
  }

  // Destroy existing chart instance if it exists to prevent memory leaks
  if (weeklyChartInstance.value) {
    console.log('Destroying existing weekly chart instance');
    weeklyChartInstance.value.destroy();
    weeklyChartInstance.value = null;
  }

  // Prepare data 
  const labels = weeklyHours.value.map(week => week.weekLabel);
  const data = weeklyHours.value.map(week => week.hours);

  // Create a new chart instance
  console.log('Creating new weekly chart instance');
  const ctx = weeklyChart.value.getContext('2d');
  if (!ctx) {
    console.error('Failed to get weekly chart canvas context');
    return;
  }

  weeklyChartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours',
        data: data,
        backgroundColor: 'rgba(40, 167, 69, 0.5)',  // Green color for weekly chart
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours' }
        },
        x: {
          title: {
            display: true,
            text: 'Weeks (Sun-Sat)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              const index = tooltipItems[0].dataIndex;
              const week = weeklyHours.value[index];
              // Show week number and date range
              return `Week ${week.weekNumber}`;
            },
            label: function (context) {
              const week = weeklyHours.value[context.dataIndex];
              return [
                `${context.formattedValue} hours`,
                `${week.weekRange} (Sun-Sat)`
              ];
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
  console.log('New weekly chart instance created successfully');
};

// Flag to track if dates are being set manually via input fields
let manualDateInput = false

// Watch for date changes from the input fields
watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    error.value = null

    // Only reset the preset if the change came from manual input
    if (manualDateInput) {
      selectedPreset.value = ''
    }
  }
})

// Initial setup
onMounted(async () => {
  // First set the default date range
  setDefaultDateRange()

  // Wait a moment for everything to initialize
  await nextTick()

  // Then fetch data which will also update the chart
  await fetchTimeData()

  // Log if everything succeeded
  console.log('Component mounted successfully')
})

// Update heat chart - simplified version
const updateHeatChart = () => {
  if (!heatChart.value) {
    console.error('Heat chart canvas ref is not available yet.');
    return;
  }

  // Destroy existing chart instance if it exists
  if (heatChartInstance.value) {
    console.log('Destroying existing heat chart instance');
    heatChartInstance.value.destroy();
    heatChartInstance.value = null;
  }

  // Create a new chart instance
  console.log('Creating simplified heat chart instance');
  const ctx = heatChart.value.getContext('2d');
  if (!ctx) {
    console.error('Failed to get heat chart canvas context');
    return;
  }

  // Extract simple arrays of data and labels
  const labels = [];
  const data = [];

  // Process the time heat data
  for (let i = 0; i < timeHeatData.value.length; i++) {
    const item = timeHeatData.value[i];
    if (item && item.time && typeof item.count === 'number') {
      labels.push(item.time);
      data.push(item.count);
    }
  }

  console.log(`Processed ${data.length} data points for heat chart`);

  // Find maximum value for scaling
  const maxCount = Math.max(...data, 1);

  // Create chart with consistent vertical gradients
  heatChartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Activity',
        data: data,
        // Use a single gradient for all bars
        backgroundColor: function (context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This can happen when charts are not yet rendered
            return 'rgba(139, 0, 0, 0.9)'; // Dark red as fallback
          }

          // Create a flame-like gradient from black to red to orange to yellow
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');       // Black at bottom
          gradient.addColorStop(0.4, 'rgba(139, 0, 0, 0.9)');   // Dark red
          gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.9)');   // Bright red
          gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.9)'); // Orange
          gradient.addColorStop(1, 'rgba(255, 255, 0, 0.9)');   // Yellow at top

          return gradient;
        },
        borderWidth: 0,
        barPercentage: 1.0, // No gap between bars
        categoryPercentage: 1.0 // No gap between bars
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Days with Activity'
          },
          grid: {
            display: false // Remove Y-axis grid lines
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time of Day (24-hour)'
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 24, // Show hour labels only
            callback: function (value, index) {
              // Show only hour marks (every 12 intervals = 1 hour)
              if (index % 12 === 0) {
                try {
                  if (typeof value === 'string' && value.includes(':')) {
                    const hourPart = value.split(':')[0];
                    return hourPart; // Just show the hour number
                  }
                } catch (err) {
                  console.log('Error in tick callback:', err);
                }
              }
              return ''; // Hide other labels
            }
          },
          grid: {
            display: false // Remove X-axis grid lines
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          displayColors: false, // Clean up tooltip appearance
          callbacks: {
            title: function (tooltipItems) {
              // Simple title showing the time
              return `Time: ${tooltipItems[0].label || 'Unknown'}`;
            },
            label: function (context) {
              // Simple label showing the count
              return `${context.raw || 0} days with activity`;
            }
          }
        }
      }
    }
  });

};

// Clean up charts when component is unmounted
onUnmounted(() => {
  if (dailyChartInstance.value) {
    dailyChartInstance.value.destroy()
    dailyChartInstance.value = null
  }

  if (weeklyChartInstance.value) {
    weeklyChartInstance.value.destroy()
    weeklyChartInstance.value = null
  }

  if (heatChartInstance.value) {
    heatChartInstance.value.destroy()
    heatChartInstance.value = null
  }
})
</script>

<style scoped>
/* Desktop styling */
.date-controls-wrapper {
  flex-wrap: nowrap;
  width: auto;
}

.date-preset-dropdown .btn {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 150px;
}

.desktop-date-inputs {
  flex-wrap: nowrap;
}

.dropdown-menu {
  min-width: 200px;
}

/* Mobile styling */
.date-preset-group {
  width: 100%;
}

.date-preset-group .btn {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.date-controls-custom {
  width: 100%;
}

.selected-date-range {
  font-size: 0.9rem;
  color: #6c757d;
}

/* Additional mobile adjustments */
@media (max-width: 992px) {
  .card-header {
    padding: 1rem 0.75rem;
  }
  
  .input-group-text {
    padding: 0.375rem 0.5rem;
  }
}

/* Small mobile screens */
@media (max-width: 576px) {
  .card-header h3 {
    font-size: 1.5rem;
  }
}
</style>
