import axios from 'axios'

// Determine if we're in production or development based on environment or URL
const isProd = window.location.port === '8000' || window.location.port === '80' || window.location.port === '443' || window.location.port === '';

// Create axios instance with appropriate base URL for env
const apiService = axios.create({
  baseURL: isProd ? '' : '/api', // In prod, don't use /api prefix as it's directly served
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
  response => {
    // Validate that list endpoints return arrays
    const url = response.config.url;
    // If endpoint should return an array but doesn't, convert to empty array and log error
    if ((url.endsWith('/time-entries/') || url.endsWith('/time-entries')) && !Array.isArray(response.data)) {
      console.error('Expected array response from API but got:', response.data);
      response.data = []; // Ensure we always return an array for endpoints that should return arrays
    }
    return response;
  },
  error => {
    // Log details about the error for debugging
    console.error('API Error:', error.message);
    console.error('Request URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Response Data:', error.response?.data);
    
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
    } else if (error.response && error.response.status === 405) {
      // Handle 405 Method Not Allowed by logging details
      console.error('Method Not Allowed Error. URL:', error.config?.url, 'Method:', error.config?.method);
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
    // Ensure time is in HH:MM format, removing seconds if present
    if (!timeStr) return '';
    
    // If there are seconds (HH:MM:SS), remove them
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    
    return timeStr;
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