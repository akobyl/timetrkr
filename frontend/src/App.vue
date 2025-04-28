<template>
  <NavBar v-if="authStore.isAuthenticated" />
  <router-view></router-view>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'

const authStore = useAuthStore()
</script>

<style>
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css');

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.container {
  max-width: 800px;
  margin-top: 2rem;
}

.card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.content-view {
  min-height: 500px;
  padding-bottom: 2rem;
}
</style>