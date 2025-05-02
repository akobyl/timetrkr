<template>
  <div class="analysis-view">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>Time Analysis</h3>
        <div class="date-controls">
          <div class="input-group">
            <span class="input-group-text">Date Range</span>
            <input type="date" class="form-control" v-model="startDate" :max="endDate">
            <span class="input-group-text">to</span>
            <input type="date" class="form-control" v-model="endDate" :min="startDate">
            <button class="btn btn-primary" @click="fetchTimeData" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              Apply
            </button>
          </div>
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

// Setup date range (default to current month)
const setDefaultDateRange = () => {
  const now = new Date()
  
  // Start from the first day of the current month
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Set end date to May 31, 2025 (as requested)
  const end = new Date(2025, 4, 31) // May is month 4 (0-based index)
  
  // Format as YYYY-MM-DD
  endDate.value = end.toISOString().split('T')[0]
  startDate.value = start.toISOString().split('T')[0]
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
    console.log('Date range start:', dateRange[0], 'end:', dateRange[dateRange.length-1])

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
    // Group days into weeks and sum up hours
    const weekMap = new Map()
    
    dailyHours.value.forEach(day => {
      if (!day.rawDate) return
      
      const date = new Date(day.rawDate)
      // Get ISO week number (1-53)
      const weekNum = getWeekNumber(date)
      const weekYear = date.getFullYear()
      const weekKey = `${weekYear}-W${weekNum.toString().padStart(2, '0')}`
      
      if (!weekMap.has(weekKey)) {
        // Get the year from the date
        const year = date.getFullYear()
        
        // Find the first Sunday of the year
        const firstDayOfYear = new Date(year, 0, 1)
        const firstSunday = new Date(firstDayOfYear)
        if (firstSunday.getDay() !== 0) {
          firstSunday.setDate(firstSunday.getDate() + (7 - firstSunday.getDay()))
        }
        
        // Calculate the start date for this week number (Sunday)
        // Week 1 starts with the first day of the year
        // Week 2 starts with the first Sunday
        // Subsequent weeks start (weekNum - 2) * 7 days after the first Sunday
        let weekStart
        if (weekNum === 1) {
          // Week 1 is a special case - it's the days before the first Sunday
          weekStart = new Date(year, 0, 1)
        } else {
          weekStart = new Date(firstSunday)
          weekStart.setDate(firstSunday.getDate() + (weekNum - 2) * 7)
        }
        
        // Calculate end date (Saturday = Sunday + 6 days)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        // Format dates for display
        const weekStartStr = formatDate(weekStart.toISOString().split('T')[0])
        const weekEndStr = formatDate(weekEnd.toISOString().split('T')[0])
        
        weekMap.set(weekKey, {
          weekNumber: weekNum,
          year: weekYear,
          weekLabel: `Week ${weekNum} (${weekYear})`,
          weekRange: `${weekStartStr} - ${weekEndStr}`,
          hours: 0,
          // For sorting
          sortKey: weekYear * 100 + weekNum
        })
      }
      
      // Add this day's hours to the week
      weekMap.get(weekKey).hours += day.hours
    })
    
    // Convert map to array and sort by week number
    weeklyHours.value = Array.from(weekMap.values())
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
    
    console.log('Processed daily hours:', dailyHours.value.length);
    console.log('Processed weekly hours:', weeklyHours.value.length);
    console.log('Generated heat map data with', timeHeatData.value.length, 'time blocks');
    console.log('Sample daily entries:', dailyHours.value.slice(0, 3));
    console.log('Sample weekly entries:', weeklyHours.value.slice(0, 3));

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

// Helper function to get week number for Sunday-Saturday format
const getWeekNumber = (date) => {
  // Create a copy of the date
  const d = new Date(date)
  // Set to midnight to avoid timezone issues
  d.setHours(0, 0, 0, 0)
  
  // Get the first day of the year (January 1st)
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
  
  // Calculate first Sunday of the year
  const firstSunday = new Date(firstDayOfYear)
  // If January 1st is not a Sunday, move to the next Sunday
  if (firstSunday.getDay() !== 0) {
    firstSunday.setDate(firstSunday.getDate() + (7 - firstSunday.getDay()))
  }
  
  // If our date is before the first Sunday, it's in week 1
  if (d < firstSunday) {
    return 1
  }
  
  // Calculate the number of days since the first Sunday
  const daysSinceFirstSunday = Math.floor((d - firstSunday) / (24 * 60 * 60 * 1000))
  
  // Calculate the week number (add 2 because week 1 is the first week of the year)
  return Math.floor(daysSinceFirstSunday / 7) + 2
}

// Helper to generate all dates in a range (inclusive of both start and end)
const generateDateRange = (start, end) => {
  // Start with empty array
  const dates = []
  
  // Parse start and end dates
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  // Set time to noon to avoid timezone issues
  startDate.setHours(12, 0, 0, 0)
  endDate.setHours(12, 0, 0, 0)
  
  // Create a copy for iteration
  const currentDate = new Date(startDate)
  
  // Loop through each day from start to end (inclusive)
  while (currentDate <= endDate) {
    // Format the date as YYYY-MM-DD
    const year = currentDate.getFullYear()
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const day = currentDate.getDate().toString().padStart(2, '0')
    
    dates.push(`${year}-${month}-${day}`)
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

// Format date for display
const formatDate = (dateStr) => {
  const parts = dateStr.split('-')
  // JavaScript months are 0-based (0 = January)
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1 
  const day = parseInt(parts[2])
  
  // Create a date object at noon to avoid timezone issues
  const date = new Date(year, month, day, 12, 0, 0)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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
            text: 'Week (Sun-Sat)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (tooltipItems) { 
              const index = tooltipItems[0].dataIndex;
              const week = weeklyHours.value[index];
              // Week label already includes the year
              return tooltipItems[0].label;
            },
            label: function (context) { 
              const week = weeklyHours.value[context.dataIndex];
              return [
                `${context.formattedValue} hours`,
                `Sun-Sat: ${week.weekRange}`
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

// Watch for date changes
watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    error.value = null
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

// Update heat chart
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

  // We need to consolidate the data for better visualization
  // Let's group by hour for the x-axis labels to avoid overcrowding
  const hourlyLabels = [];
  for (let hour = 0; hour < 24; hour++) {
    hourlyLabels.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Prepare our dataset for the heat map
  // We'll use a line chart with custom point styling to simulate a heat map
  const data = timeHeatData.value.map(item => item.count);
  
  // Find the maximum count for scaling the color intensity
  const maxCount = Math.max(...data, 1);

  // Create a new chart instance
  console.log('Creating heat chart instance');
  const ctx = heatChart.value.getContext('2d');
  if (!ctx) {
    console.error('Failed to get heat chart canvas context');
    return;
  }
  
  // Helper function to generate a color based on intensity
  const getHeatColor = (intensity) => {
    // Scale from blue (cold) to red (hot)
    // We'll use HSL color model where hue ranges from 240 (blue) to 0 (red)
    const hue = 240 - (intensity * 240);
    return `hsl(${hue}, 100%, 50%)`;
  };

  // Create scatter plot data with proper time mapping
  const scatterData = timeHeatData.value.map((item, index) => {
    // Convert time (HH:MM) to decimal hours for x-axis positioning
    const [hours, minutes] = item.time.split(':').map(Number);
    const timeValue = hours + (minutes / 60); // decimal hours (0-24)
    
    return {
      x: timeValue,
      y: item.count,
      time: item.time,
      count: item.count,
      intensity: item.count / maxCount
    };
  }).filter(item => item.count > 0); // Only include non-zero points

  heatChartInstance.value = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Activity Frequency',
        data: scatterData,
        backgroundColor: function(context) {
          if (!context.raw) return 'rgba(0, 0, 0, 0)';
          return getHeatColor(context.raw.intensity);
        },
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        pointRadius: function(context) {
          if (!context.raw) return 0;
          // Scale the point size based on count, but with a minimum size
          return Math.max(3, Math.min(10, 3 + (context.raw.count / maxCount) * 7));
        },
        pointHoverRadius: function(context) {
          if (!context.raw) return 0;
          return Math.max(5, Math.min(12, 5 + (context.raw.count / maxCount) * 7));
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Days with Activity'
          },
          suggestedMax: Math.min(maxCount * 1.1, Math.ceil(maxCount * 1.2))
        },
        x: {
          min: 0,
          max: 24,
          title: {
            display: true,
            text: 'Time of Day (24-hour)'
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return `${Math.floor(value).toString().padStart(2, '0')}:00`;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function(tooltipItems) {
              const item = tooltipItems[0].raw;
              return `Time: ${item.time}`;
            },
            label: function(context) {
              const item = context.raw;
              return `${item.count} days with activity`;
            }
          }
        },
        legend: {
          display: false
        }
      }
    }
  });
  
  console.log('Heat chart created successfully');
};

// Clean up charts when component is unmounted
onUnmounted(() => {
  if (dailyChartInstance.value) {
    console.log('Cleaning up daily chart instance on unmount')
    dailyChartInstance.value.destroy()
    dailyChartInstance.value = null
  }
  
  if (weeklyChartInstance.value) {
    console.log('Cleaning up weekly chart instance on unmount')
    weeklyChartInstance.value.destroy()
    weeklyChartInstance.value = null
  }
  
  if (heatChartInstance.value) {
    console.log('Cleaning up heat chart instance on unmount')
    heatChartInstance.value.destroy()
    heatChartInstance.value = null
  }
})
</script>

<style scoped>
.date-controls {
  min-width: 450px;
}
</style>
