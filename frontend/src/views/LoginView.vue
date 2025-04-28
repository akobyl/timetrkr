<template>
  <div class="login-view">
    <div class="auth-container">
      <div class="card">
        <div class="card-header">
          <h3 class="text-center">TimeTrkr Login</h3>
        </div>
        <div class="card-body">
          <div class="alert alert-danger" v-if="error">{{ error }}</div>
          <form @submit.prevent="handleLogin" v-if="!showRegisterForm">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" v-model="loginForm.username" required>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" v-model="loginForm.password" required>
            </div>
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">{{ isLoading ? 'Logging in...' : 'Login' }}</button>
              <button type="button" class="btn btn-outline-secondary" @click="showRegisterForm = true">
                Register
              </button>
            </div>
          </form>

          <div v-if="showRegisterForm">
            <h4 class="text-center">Register</h4>
            <form @submit.prevent="handleRegister">
              <div class="mb-3">
                <label for="reg-username" class="form-label">Username</label>
                <input type="text" class="form-control" id="reg-username" v-model="registerForm.username" required>
              </div>
              <div class="mb-3">
                <label for="reg-password" class="form-label">Password</label>
                <input type="password" class="form-control" id="reg-password" v-model="registerForm.password" required>
              </div>
              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-success" :disabled="isLoading">{{ isLoading ? 'Registering...' : 'Register' }}</button>
                <button type="button" class="btn btn-outline-secondary" @click="showRegisterForm = false">
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
  username: '',
  password: ''
})

const showRegisterForm = ref(false)
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  try {
    isLoading.value = true
    error.value = ''
    
    const result = await authStore.login(loginForm.value)
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again.'
    console.error('Login error:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  try {
    isLoading.value = true
    error.value = ''
    
    const result = await authStore.register(registerForm.value)
    
    if (result.success) {
      // Auto login after registration
      loginForm.value.username = registerForm.value.username
      loginForm.value.password = registerForm.value.password
      showRegisterForm.value = false
      await handleLogin()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again.'
    console.error('Registration error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 5rem auto;
}
</style>