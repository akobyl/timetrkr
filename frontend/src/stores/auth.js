import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { apiService } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const tokenExpiryTime = ref(parseInt(localStorage.getItem('tokenExpiry')) || null)
  
  const isAuthenticated = computed(() => !!token.value)
  
  // Login function
  async function login(credentials) {
    try {
      const formData = new FormData()
      formData.append('username', credentials.username)
      formData.append('password', credentials.password)
      
      // Use direct axios call with specific configuration for token endpoint
      const response = await axios.post('/token', formData, {
        headers: {
          // Let axios set the content type as multipart/form-data
          'Accept': 'application/json'
        }
      })
      
      token.value = response.data.access_token
      localStorage.setItem('token', token.value)
      
      // Save credentials for session restoration (optional)
      localStorage.setItem('username', credentials.username)
      localStorage.setItem('password', credentials.password)
      
      // Set expiry time to 6 days from now
      const sixDaysFromNow = new Date()
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6)
      tokenExpiryTime.value = sixDaysFromNow.getTime()
      localStorage.setItem('tokenExpiry', tokenExpiryTime.value)
      
      await fetchUserProfile()
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }
  
  // Register function
  async function register(userData) {
    try {
      const response = await apiService.post('/users/', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      }
    }
  }
  
  // Logout function
  function logout() {
    token.value = null
    user.value = null
    tokenExpiryTime.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('tokenExpiry')
    localStorage.removeItem('username')
    localStorage.removeItem('password')
  }
  
  // Fetch user profile
  async function fetchUserProfile() {
    try {
      if (!token.value) return
      
      const response = await apiService.get('/users/me/')
      user.value = response.data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      if (error.response?.status === 401) {
        logout()
      }
    }
  }
  
  return {
    user,
    token,
    tokenExpiryTime,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserProfile
  }
})