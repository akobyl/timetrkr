<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div class="container">
      <router-link class="navbar-brand" to="/">TimeTrkr</router-link>
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
        <button class="btn btn-outline-danger" @click="logout">
          <i class="bi bi-box-arrow-right me-1"></i> Logout
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
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