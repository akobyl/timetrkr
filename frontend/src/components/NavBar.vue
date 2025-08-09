<template>
  <nav class="navbar navbar-expand-lg mb-4" :class="themeStore.isDarkMode ? 'navbar-dark bg-dark' : 'navbar-light bg-light'">
    <div class="container">
      <router-link class="navbar-brand" to="/">TimeTrkr</router-link>
      <div class="d-flex align-items-center gap-2 d-lg-none">
        <button 
          class="btn btn-outline-secondary" 
          @click="themeStore.toggleTheme"
          :title="themeStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <i :class="themeStore.isDarkMode ? 'bi bi-sun' : 'bi bi-moon'"></i>
        </button>
        <button 
          class="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">
              <i class="bi bi-speedometer2 me-1"></i> Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/analysis">
              <i class="bi bi-bar-chart-line me-1"></i> Analysis
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/history">
              <i class="bi bi-clock-history me-1"></i> History
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/profile">
              <i class="bi bi-person me-1"></i> Profile
            </router-link>
          </li>
        </ul>
        <div class="d-flex gap-2">
          <button 
            class="btn btn-outline-secondary d-none d-lg-inline-block" 
            @click="themeStore.toggleTheme"
            :title="themeStore.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <i :class="themeStore.isDarkMode ? 'bi bi-sun' : 'bi bi-moon'"></i>
          </button>
          <button class="btn btn-outline-danger" @click="logout">
            <i class="bi bi-box-arrow-right me-1"></i> Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.navbar-brand {
  font-weight: bold;
  color: #3b85f3 !important;
}
.router-link-active {
  font-weight: bold;
  color: #3b85f3 !important;
}
.navbar .btn {
  border-radius: 20px;
  padding: 5px 15px;
}
</style>