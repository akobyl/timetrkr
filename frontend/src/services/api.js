import axios from 'axios'

// Create axios instance with base URL
const apiService = axios.create({
  baseURL: '/api', // This will be served from the same origin as the Vue app
  timeout: 30000
})

// Add request interceptor for authentication
apiService.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
apiService.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 responses (unauthorized)
    if (error.response && error.response.status === 401) {
      const errorMsg = error.response?.data?.detail || ''
      if (errorMsg.includes('credentials') || errorMsg.includes('token')) {
        console.warn('Authentication error:', errorMsg)
        
        // Clear auth data
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiry')
        localStorage.removeItem('username')
        localStorage.removeItem('password')
        
        // Redirect to login
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Utility format functions
const formatUtils = {
  formatDate(dateStr) {
    // Format YYYY-MM-DD to localized date
    const parts = dateStr.split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // JS months are 0-based
    const day = parseInt(parts[2])
    
    const date = new Date(year, month, day)
    return date.toLocaleDateString()
  },
  
  formatTime(timeStr) {
    // Format HH:MM to display time
    return timeStr
  },
  
  formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return `${hours}h ${mins}m`
  },
  
  calculateDuration(startTime, endTime) {
    const [startHours, startMins] = startTime.split(':').map(Number)
    const [endHours, endMins] = endTime.split(':').map(Number)
    
    let durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins)
    if (durationMinutes < 0) durationMinutes += 24 * 60 // Handle overnight
    
    const hours = Math.floor(durationMinutes / 60)
    const mins = durationMinutes % 60
    return `${hours}h ${mins}m`
  }
}

export { apiService, formatUtils }