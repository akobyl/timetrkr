<template>

  <div class="profile-view">

    <div class="card">

      <div class="card-header">

        <h3>User Profile</h3>

      </div>

      <div class="card-body">

        <div class="text-center mb-4">
           <i class="bi bi-person-circle" style="font-size: 5rem"></i>
          <h4 class="mt-3" v-if="authStore.user">
             {{ authStore.user.username }}
          </h4>

        </div>

        <div class="border rounded p-3 mb-3">

          <h5>Account Information</h5>

          <p class="text-muted">
             User settings and preferences will be available here in a future
            update.
          </p>

        </div>

        <div class="border rounded p-3">

          <h5>App Settings</h5>

          <p class="text-muted">Customize application settings coming soon!</p>

        </div>

      </div>

    </div>

  </div>

</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.user) {
    authStore.fetchUserProfile()
  }
})
</script>

