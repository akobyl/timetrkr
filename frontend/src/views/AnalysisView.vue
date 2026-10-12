<template>

  <div class="analysis-view">

    <div class="card">

      <div class="card-header">

        <div
          class="d-flex flex-wrap justify-content-between align-items-center mb-2"
        >

          <h3 class="mb-3 mb-lg-0">Time Analysis</h3>
           <!-- Desktop layout -->
          <div
            class="d-none d-lg-flex date-controls-wrapper align-items-center"
          >

            <div class="dropdown date-preset-dropdown me-3">
               <button
                ref="desktopDropdownRef"
                class="btn btn-outline-primary dropdown-toggle"
                type="button"
                @click="toggleDropdown('desktop')"
                aria-expanded="false"
              >
                 {{
                  selectedPreset
                    ? getPresetLabel(selectedPreset)
                    : 'Select Range'
                }} </button
              >
              <ul class="dropdown-menu">
                 <!-- Week-based options -->
                <li><h6 class="dropdown-header">Weeks</h6></li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('current_week');
                      closeDropdown('desktop')
                    "
                    >Current Week</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('last_week');
                      closeDropdown('desktop')
                    "
                    >Last Week</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('last_2_weeks');
                      closeDropdown('desktop')
                    "
                    >Last 2 Weeks</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('last_4_weeks');
                      closeDropdown('desktop')
                    "
                    >Last 4 Weeks</a
                  >
                </li>
                 <!-- Month-based options -->
                <li><hr class="dropdown-divider" /></li>

                <li><h6 class="dropdown-header">Months</h6></li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('current_month');
                      closeDropdown('desktop')
                    "
                    >Current Month</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('last_month');
                      closeDropdown('desktop')
                    "
                    >Last Month</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('last_3_months');
                      closeDropdown('desktop')
                    "
                    >Last 3 Months</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('last_6_months');
                      closeDropdown('desktop')
                    "
                    >Last 6 Months</a
                  >
                </li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectPreset('this_year');
                      closeDropdown('desktop')
                    "
                    >This Year</a
                  >
                </li>
                 <!-- Custom range option -->
                <li><hr class="dropdown-divider" /></li>

                <li>
                   <a
                    class="dropdown-item"
                    href="#"
                    @click.prevent="
                      selectedPreset = '';
                      closeDropdown('desktop')
                    "
                    >Custom Range</a
                  >
                </li>

              </ul>

            </div>

            <div
              class="desktop-date-inputs d-flex"
              v-show="!selectedPreset || selectedPreset === ''"
            >

              <div class="input-group me-2" style="width: 230px">
                 <span class="input-group-text">From</span> <input
                  type="date"
                  class="form-control"
                  v-model="startDate"
                  :max="endDate"
                  @change="manualDateInput = true"
                />
              </div>

              <div class="input-group me-2" style="width: 230px">
                 <span class="input-group-text">To</span> <input
                  type="date"
                  class="form-control"
                  v-model="endDate"
                  :min="startDate"
                  @change="manualDateInput = true"
                />
              </div>

            </div>
             <!-- Desktop apply button (single button for both preset and custom) -->
            <button
              class="btn btn-primary ms-2"
              @click="fetchTimeData"
              :disabled="isLoading"
            >
               <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
              ></span
              > Apply </button
            >
          </div>
           <!-- Mobile layout -->
          <div class="d-block d-lg-none date-preset-group">
             <button
              ref="mobileDropdownRef"
              class="btn btn-outline-primary dropdown-toggle"
              type="button"
              @click="toggleDropdown('mobile')"
              aria-expanded="false"
            >
               {{
                selectedPreset
                  ? getPresetLabel(selectedPreset)
                  : 'Select Range'
              }} </button
            >
            <ul class="dropdown-menu">
               <!-- Week-based options -->
              <li><h6 class="dropdown-header">Weeks</h6></li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('current_week');
                    closeDropdown('mobile')
                  "
                  >Current Week</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('last_week');
                    closeDropdown('mobile')
                  "
                  >Last Week</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('last_2_weeks');
                    closeDropdown('mobile')
                  "
                  >Last 2 Weeks</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('last_4_weeks');
                    closeDropdown('mobile')
                  "
                  >Last 4 Weeks</a
                >
              </li>
               <!-- Month-based options -->
              <li><hr class="dropdown-divider" /></li>

              <li><h6 class="dropdown-header">Months</h6></li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('current_month');
                    closeDropdown('mobile')
                  "
                  >Current Month</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('last_month');
                    closeDropdown('mobile')
                  "
                  >Last Month</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('last_3_months');
                    closeDropdown('mobile')
                  "
                  >Last 3 Months</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('last_6_months');
                    closeDropdown('mobile')
                  "
                  >Last 6 Months</a
                >
              </li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectPreset('this_year');
                    closeDropdown('mobile')
                  "
                  >This Year</a
                >
              </li>
               <!-- Custom range option -->
              <li><hr class="dropdown-divider" /></li>

              <li>
                 <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="
                    selectedPreset = '';
                    closeDropdown('mobile')
                  "
                  >Custom Range</a
                >
              </li>

            </ul>

          </div>

        </div>
         <!-- Mobile custom date inputs -->
        <div
          class="d-block d-lg-none date-controls-custom mt-2"
          v-show="!selectedPreset || selectedPreset === ''"
        >

          <div class="row g-2">

            <div class="col-6">

              <div class="input-group">
                 <span class="input-group-text">From</span> <input
                  type="date"
                  class="form-control"
                  v-model="startDate"
                  :max="endDate"
                  @change="manualDateInput = true"
                />
              </div>

            </div>

            <div class="col-6">

              <div class="input-group">
                 <span class="input-group-text">To</span> <input
                  type="date"
                  class="form-control"
                  v-model="endDate"
                  :min="startDate"
                  @change="manualDateInput = true"
                />
              </div>

            </div>

          </div>

        </div>
         <!-- Single mobile apply button for both presets and custom dates -->
        <div class="d-block d-lg-none mt-2">
           <button
            class="btn btn-primary w-100"
            @click="fetchTimeData"
            :disabled="isLoading"
          >
             <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-1"
              role="status"
            ></span
            > Apply </button
          >
        </div>
         <!-- Selected date range display -->
        <div class="selected-date-range mt-2" v-if="startDate && endDate">
           <small class="text-muted"
            > Viewing data from {{ formatDateDisplay(startDate) }} to {{
              formatDateDisplay(endDate)
            }} </small
          >
        </div>

      </div>

      <div class="card-body">

        <div v-if="error" class="alert alert-danger"> {{ error }} </div>

        <div v-if="isLoading" class="text-center py-5">

          <div class="spinner-border" role="status">
             <span class="visually-hidden">Loading...</span>
          </div>

          <p class="mt-3">Loading time data...</p>

        </div>

        <div
          v-else-if="dailyHours.length === 0"
          class="text-muted text-center py-5"
        >
           <i class="bi bi-bar-chart-line" style="font-size: 3rem"></i> <br /><br />
          No time entries found for the selected date range. <br /> <button
            class="btn btn-outline-primary mt-3"
            @click="setDefaultDateRange"
          >
             Reset to Default Range </button
          >
        </div>

        <div v-else>

          <div class="mb-4">

            <h4>Daily Hours Histogram</h4>

            <div style="position: relative; height: 300px; width: 100%">
               <canvas ref="histogramChart"></canvas>
            </div>

          </div>

          <div class="mb-4 mt-5">

            <h4>Weekly Hours</h4>

            <div style="position: relative; height: 300px; width: 100%">
               <canvas ref="weeklyChart"></canvas>
            </div>

          </div>

          <div class="mb-4 mt-5">

            <h4>Time of Day Heat Map</h4>
            <p class="text-muted">
              Number of calendar days worked at each five-minute boundary.
              Overlapping entries count once per day; overnight work is split at midnight.
            </p>

            <div style="position: relative; height: 250px; width: 100%">
               <canvas ref="heatChart"></canvas>
            </div>

          </div>

          <div class="mt-5">

            <h4>Summary</h4>

            <div class="row">

              <div class="col-md-3">

                <div class="card summary-card">

                  <div class="card-body text-center">

                    <h5 class="card-title" title="Overlapping entries count once; overnight work counts on its calendar date">Effective Hours</h5>

                    <p class="card-text display-6">
                       {{ totalHours.toFixed(1) }}
                    </p>

                  </div>

                </div>

              </div>

              <div class="col-md-3">

                <div class="card summary-card">

                  <div class="card-body text-center">

                    <h5 class="card-title">Average Daily</h5>

                    <p class="card-text display-6">
                       {{ avgHoursPerDay.toFixed(1) }}
                    </p>

                  </div>

                </div>

              </div>

              <div class="col-md-3">

                <div class="card summary-card">

                  <div class="card-body text-center">

                    <h5 class="card-title">Days Tracked</h5>

                    <p class="card-text display-6">{{ daysWithEntries }}</p>

                  </div>

                </div>

              </div>

              <div class="col-md-3">

                <div class="card summary-card">

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
import { effectiveMinutesByDate } from '../utils/timeTotals.js'
import { buildTimeHeatMap } from '../utils/timeHeatMap.js'
import { buildWeeklyHours } from '../utils/weeklyHours.js'
import {
  getCurrentWeekRange,
  getWeekRange,
  getLocalDateString,
  addCalendarDays,
  generateDateRange,
  formatLocalDate as formatYYYYMMDD,
  formatCalendarDate as formatDate,
  formatCalendarDate,
} from '../utils/dateUtils.js'
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
  Legend,
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

// Dropdown refs for direct Vue control
const desktopDropdownRef = ref(null)
const mobileDropdownRef = ref(null)

// Toggle dropdown manually
const toggleDropdown = (dropdownType) => {
  const dropdown =
    dropdownType === 'desktop'
      ? desktopDropdownRef.value
      : mobileDropdownRef.value
  if (dropdown) {
    const menu = dropdown.nextElementSibling
    if (menu && menu.classList.contains('dropdown-menu')) {
      menu.classList.toggle('show')
      dropdown.setAttribute('aria-expanded', menu.classList.contains('show'))
    }
  }
}

// Close dropdown when clicking outside or selecting item
const closeDropdown = (dropdownType) => {
  const dropdown =
    dropdownType === 'desktop'
      ? desktopDropdownRef.value
      : mobileDropdownRef.value
  if (dropdown) {
    const menu = dropdown.nextElementSibling
    if (menu && menu.classList.contains('dropdown-menu')) {
      menu.classList.remove('show')
      dropdown.setAttribute('aria-expanded', 'false')
    }
  }
}

// Setup date range (default to current week)
const setDefaultDateRange = () => {
  // Reset manual input flag
  manualDateInput = false

  const { start, end } = getCurrentWeekRange()
  startDate.value = start
  endDate.value = end

  // Set preset selection to current week
  selectedPreset.value = 'current_week'
}

// Handle date presets
const applyDatePreset = () => {
  // Reset manual input flag since we're applying a preset
  manualDateInput = false

  const now = new Date()
  let start, end

  switch (selectedPreset.value) {
    case 'current_week':
    case 'last_week':
    case 'last_2_weeks':
    case 'last_4_weeks': {
      const week = getWeekRange(getLocalDateString())
      const weeks = selectedPreset.value === 'last_4_weeks' ? 4 : 2
      if (selectedPreset.value === 'last_week') {
        startDate.value = addCalendarDays(week.start, -7)
        endDate.value = addCalendarDays(week.end, -7)
      } else {
        startDate.value =
          selectedPreset.value === 'current_week'
            ? week.start
            : addCalendarDays(week.start, -7 * (weeks - 1))
        endDate.value = week.end
      }
      fetchTimeData()
      return
    }

    // Month-based options
    case 'current_month': {
      // First and last day of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    }

    case 'last_month': {
      // Last month: 1st to last day of previous month
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    }

    case 'last_3_months': {
      // Last 3 months: 1st day of month from 3 months ago to last day of current month
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    }

    case 'last_6_months': {
      // Last 6 months: 1st day of month from 6 months ago to last day of current month
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    }

    case 'this_year': {
      // This year: January 1st to last day of current month
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    }

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
  return dailyHours.value.filter((day) => day.hours > 0).length
})

const maxHours = computed(() => {
  if (dailyHours.value.length === 0) return 0
  return Math.max(...dailyHours.value.map((day) => day.hours))
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
    console.log(
      'Date range start:',
      dateRange[0],
      'end:',
      dateRange[dateRange.length - 1]
    )

    // Verify that the date range includes the end date
    if (
      dateRange.length > 0 &&
      dateRange[dateRange.length - 1] !== endDate.value
    ) {
      console.warn(
        `Warning: Date range does not include the end date! End date: ${endDate.value}, Last date in range: ${dateRange[dateRange.length - 1]}`
      )
    }

    const minutesByDate = effectiveMinutesByDate(
      entries,
      startDate.value,
      endDate.value
    )
    dailyHours.value = dateRange.map((date) => {
      const hours = (minutesByDate[date] || 0) / 60

      return {
        date: formatDate(date),
        rawDate: date,
        hours,
      }
    })

    weeklyHours.value = buildWeeklyHours(
      minutesByDate,
      startDate.value,
      endDate.value
    ).map((week, index) => {
      const range = `${formatDate(week.start)} - ${formatDate(week.end)}`
      const label = `${range}${week.isPartial ? ' (partial week)' : ''}`
      return {
        ...week,
        weekNumber: index + 1,
        weekLabel: label,
        weekRange: label,
      }
    })

    timeHeatData.value = buildTimeHeatMap(
      entries,
      startDate.value,
      endDate.value
    )
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

const formatDateDisplay = (value) =>
  formatCalendarDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

// Get friendly label for preset options
const getPresetLabel = (preset) => {
  const presetLabels = {
    current_week: 'Current Week',
    last_week: 'Last Week',
    last_2_weeks: 'Last 2 Weeks',
    last_4_weeks: 'Last 4 Weeks',
    current_month: 'Current Month',
    last_month: 'Last Month',
    last_3_months: 'Last 3 Months',
    last_6_months: 'Last 6 Months',
    this_year: 'This Year',
    '': 'Custom Range',
  }

  return presetLabels[preset] || 'Select Range'
}

// Handle preset selection
const selectPreset = (preset) => {
  selectedPreset.value = preset
  applyDatePreset()
}

// Update daily chart
const updateDailyChart = () => {
  if (!histogramChart.value) {
    console.error('Daily chart canvas ref is not available yet.')
    return
  }

  // Destroy existing chart instance if it exists to prevent memory leaks
  if (dailyChartInstance.value) {
    console.log('Destroying existing daily chart instance')
    dailyChartInstance.value.destroy()
    dailyChartInstance.value = null
  }

  // Prepare data - ensure we have correct date labels
  const labels = dailyHours.value.map((day) => day.date)
  const data = dailyHours.value.map((day) => day.hours)

  // Create a new chart instance
  console.log('Creating new daily chart instance')
  const ctx = histogramChart.value.getContext('2d')
  if (!ctx) {
    console.error('Failed to get daily chart canvas context')
    return
  }

  dailyChartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hours',
          data: data,
          backgroundColor: 'rgba(13, 110, 253, 0.5)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours' },
        },
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              return tooltipItems[0].label
            },
            label: function (context) {
              return `${context.formattedValue} hours`
            },
          },
        },
        legend: {
          display: false,
        },
      },
    },
  })
  console.log('New daily chart instance created successfully')
}

// Update weekly chart
const updateWeeklyChart = () => {
  if (!weeklyChart.value) {
    console.error('Weekly chart canvas ref is not available yet.')
    return
  }

  // Destroy existing chart instance if it exists to prevent memory leaks
  if (weeklyChartInstance.value) {
    console.log('Destroying existing weekly chart instance')
    weeklyChartInstance.value.destroy()
    weeklyChartInstance.value = null
  }

  // Prepare data
  const labels = weeklyHours.value.map((week) => week.weekLabel)
  const data = weeklyHours.value.map((week) => week.hours)

  // Create a new chart instance
  console.log('Creating new weekly chart instance')
  const ctx = weeklyChart.value.getContext('2d')
  if (!ctx) {
    console.error('Failed to get weekly chart canvas context')
    return
  }

  weeklyChartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hours',
          data: data,
          backgroundColor: 'rgba(40, 167, 69, 0.5)', // Green color for weekly chart
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Hours' },
        },
        x: {
          title: {
            display: true,
            text: 'Weeks (Mon–Sun)',
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              const index = tooltipItems[0].dataIndex
              const week = weeklyHours.value[index]
              // Show week number and date range
              return `Week ${week.weekNumber}`
            },
            label: function (context) {
              const week = weeklyHours.value[context.dataIndex]
              return [`${context.formattedValue} hours`, `${week.weekRange}`]
            },
          },
        },
        legend: {
          display: false,
        },
      },
    },
  })
  console.log('New weekly chart instance created successfully')
}

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
    console.error('Heat chart canvas ref is not available yet.')
    return
  }

  // Destroy existing chart instance if it exists
  if (heatChartInstance.value) {
    console.log('Destroying existing heat chart instance')
    heatChartInstance.value.destroy()
    heatChartInstance.value = null
  }

  // Create a new chart instance
  console.log('Creating simplified heat chart instance')
  const ctx = heatChart.value.getContext('2d')
  if (!ctx) {
    console.error('Failed to get heat chart canvas context')
    return
  }

  // Extract simple arrays of data and labels
  const labels = []
  const data = []

  // Process the time heat data
  for (let i = 0; i < timeHeatData.value.length; i++) {
    const item = timeHeatData.value[i]
    if (item && item.time && typeof item.count === 'number') {
      labels.push(item.time)
      data.push(item.count)
    }
  }

  console.log(`Processed ${data.length} data points for heat chart`)

  // Find maximum value for scaling - used for potential future scaling
  Math.max(...data, 1)

  // Create chart with consistent vertical gradients
  heatChartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Days with Activity',
          data: data,
          // Use a single gradient for all bars
          backgroundColor: function (context) {
            const chart = context.chart
            const { ctx, chartArea } = chart

            if (!chartArea) {
              // This can happen when charts are not yet rendered
              return 'rgba(139, 0, 0, 0.9)' // Dark red as fallback
            }

            // Create a flame-like gradient from black to red to orange to yellow
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.bottom,
              0,
              chartArea.top
            )
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)') // Black at bottom
            gradient.addColorStop(0.4, 'rgba(139, 0, 0, 0.9)') // Dark red
            gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.9)') // Bright red
            gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.9)') // Orange
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0.9)') // Yellow at top

            return gradient
          },
          borderWidth: 0,
          barPercentage: 1.0, // No gap between bars
          categoryPercentage: 1.0, // No gap between bars
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          title: {
            display: true,
            text: 'Days with Activity',
          },
          grid: {
            display: false, // Remove Y-axis grid lines
          },
        },
        x: {
          title: {
            display: true,
            text: 'Time of Day (24-hour)',
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
                    const hourPart = value.split(':')[0]
                    return hourPart // Just show the hour number
                  }
                } catch (err) {
                  console.log('Error in tick callback:', err)
                }
              }
              return '' // Hide other labels
            },
          },
          grid: {
            display: false, // Remove X-axis grid lines
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          displayColors: false, // Clean up tooltip appearance
          callbacks: {
            title: function (tooltipItems) {
              // Simple title showing the time
              return `Time: ${tooltipItems[0].label || 'Unknown'}`
            },
            label: function (context) {
              // Simple label showing the count
              return `${context.raw || 0} days with activity`
            },
          },
        },
      },
    },
  })
}

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
  background-color: var(--bs-body-bg) !important;
  border-color: var(--bs-border-color) !important;
  color: var(--bs-body-color) !important;
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
  background-color: var(--bs-body-bg) !important;
  border-color: var(--bs-border-color) !important;
  color: var(--bs-body-color) !important;
}

.date-controls-custom {
  width: 100%;
}

.selected-date-range {
  font-size: 0.9rem;
  color: var(--bs-body-color);
  background-color: var(--bs-body-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--bs-border-color);
  opacity: 0.8;
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

.summary-card {
  background-color: var(--custom-card-header-bg) !important;
  border-color: var(--custom-card-border) !important;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
</style>

