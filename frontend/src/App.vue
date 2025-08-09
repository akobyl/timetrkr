<template>
   <NavBar v-if="authStore.isAuthenticated" /> <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import NavBar from './components/NavBar.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initializeTheme()
})
</script>

<style>
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');

:root {
  --bs-body-bg: #ffffff;
  --bs-body-color: #212529;
  --custom-card-bg: #ffffff;
  --custom-card-border: rgba(0,0,0,0.1);
  --custom-card-header-bg: #f8f9fa;
  --custom-shadow: rgba(0,0,0,0.05);
}

body.dark-theme {
  --bs-body-bg: #212529;
  --bs-body-color: #ffffff;
  --custom-card-bg: #343a40;
  --custom-card-border: rgba(255,255,255,0.1);
  --custom-card-header-bg: #495057;
  --custom-shadow: rgba(0,0,0,0.3);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bs-body-bg) !important;
  color: var(--bs-body-color) !important;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.container {
  max-width: 800px;
  margin-top: 2rem;
}

.card {
  background-color: var(--custom-card-bg) !important;
  border-color: var(--custom-card-border) !important;
  box-shadow: 0 2px 4px var(--custom-shadow);
  border-radius: 8px;
  margin-bottom: 1rem;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.card-header {
  background-color: var(--custom-card-header-bg) !important;
  border-bottom-color: var(--custom-card-border) !important;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.content-view {
  min-height: 500px;
  padding-bottom: 2rem;
}
</style>

