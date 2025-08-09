import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false)

  // Initialize theme from localStorage or system preference
  function initializeTheme() {
    const savedTheme = localStorage.getItem('timetrkr-theme')
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      // Use system preference
      isDarkMode.value = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
    }
    applyTheme()
  }

  // Apply theme to document
  function applyTheme() {
    if (isDarkMode.value) {
      document.documentElement.setAttribute('data-bs-theme', 'dark')
      document.body.classList.add('dark-theme')
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light')
      document.body.classList.remove('dark-theme')
    }
  }

  // Toggle theme
  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value
  }

  // Watch for theme changes and persist to localStorage
  watch(isDarkMode, (newValue) => {
    localStorage.setItem('timetrkr-theme', newValue ? 'dark' : 'light')
    applyTheme()
  })

  return {
    isDarkMode,
    initializeTheme,
    toggleTheme,
  }
})
