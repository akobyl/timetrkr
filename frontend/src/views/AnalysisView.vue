<template>
  <div class="analysis-view">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>Time Analysis</h3>
        <div class="date-controls">
          <div class="input-group">
            <span class="input-group-text">Date Range</span>
            <input 
              type="date" 
              class="form-control" 
              v-model="startDate"
              :max="endDate"
            >
            <span class="input-group-text">to</span>
            <input 
              type="date" 
              class="form-control" 
              v-model="endDate"
              :min="startDate"
            >
            <button 
              class="btn btn-primary" 
              @click="fetchTimeData"
              :disabled="isLoading"
            >
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
            <div style="position: relative; height: 400px; width: 100%;">
              <canvas ref="histogramChart"></canvas>
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
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { apiService } from '../services/api'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

// Register Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// Data
const startDate = ref('')
const endDate = ref('')
const isLoading = ref(false)
const error = ref(null)
const dailyHours = ref([])
const histogramChart = ref(null)
const chartInstance = ref(null)

// Setup date range (default to last 30 days)
const setDefaultDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  
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

// Fetch time entries and calculate daily hours
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
    
    console.log('Processed daily hours:', dailyHours.value.length)
    console.log('Sample entries:', dailyHours.value.slice(0, 3))
    
    // Wait for DOM to update before initializing chart
    await nextTick()
    
    // Update chart after DOM has updated
    updateChart()
    
  } catch (err) {
    console.error('Error fetching time data:', err)
    error.value = 'Failed to load time data. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

// Helper to generate all dates in a range
const generateDateRange = (start, end) => {
  const dates = []
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  // Set time to midnight to avoid timezone issues
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  // Loop through dates and add each one
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

// Format date for display
const formatDate = (dateStr) => {
  const parts = dateStr.split('-')
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Update chart with current data
const updateChart = async () => {
  try {
    // Wait for DOM to be ready
    await nextTick()
    
    // Clean up any existing chart
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
    
    // Check if chart reference exists
    if (!histogramChart.value) {
      console.error('Chart canvas reference is not available')
      return
    }
    
    // Make sure we have data to show
    if (dailyHours.value.length === 0) {
      console.warn('No data available for chart')
      return
    }
    
    // Log canvas dimensions
    console.log('Canvas dimensions:', 
      histogramChart.value.width, 
      histogramChart.value.height,
      histogramChart.value.clientWidth,
      histogramChart.value.clientHeight
    )
    
    // Get context and create chart
    const ctx = histogramChart.value.getContext('2d')
    
    // Prepare data - only include days with hours > 0
    const filteredData = dailyHours.value.filter(day => day.hours > 0)
    
    // Use raw data if no filtered data is available
    const chartData = filteredData.length > 0 ? filteredData : dailyHours.value
    
    // Prepare labels and data
    const labels = chartData.map(day => day.date)
    const data = chartData.map(day => day.hours)
    
    console.log('Creating chart with data points:', data.length)
    
    // Create chart with simpler config
    chartInstance.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hours',
          data: data,
          backgroundColor: 'rgba(13, 110, 253, 0.5)', // Bootstrap primary color
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
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
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                return `${context.formattedValue} hours`;
              }
            }
          },
          legend: {
            display: false
          }
        }
      }
    })
    
    console.log('Chart instance created successfully')
  } catch (err) {
    console.error('Error creating chart:', err)
  }
}

// Watch for date changes
watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    error.value = null
  }
})

// Initial setup
onMounted(async () => {
  setDefaultDateRange()
  await fetchTimeData()
  
  // Log whether canvas is available
  console.log('Canvas element available:', !!histogramChart.value)
  
  // Force chart update after a short delay to ensure DOM is ready
  setTimeout(() => {
    if (dailyHours.value.length > 0) {
      updateChart()
    }
  }, 500)
})
</script>

<style scoped>
.date-controls {
  min-width: 450px;
}
</style>