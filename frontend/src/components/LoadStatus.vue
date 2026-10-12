<template>

  <div v-if="error" class="alert alert-warning" role="alert">

    <p class="mb-1">{{ error }}</p>

    <p v-if="hasData" class="mb-1">
       Showing previously loaded data; it may be out of date.
    </p>
     <button
      class="btn btn-sm btn-outline-primary"
      :disabled="loading"
      @click="$emit('retry')"
    >
       Retry refresh</button
    >
  </div>

  <p v-if="loading" role="status">
     {{ hasData ? 'Refreshing time entries...' : 'Loading time entries...' }}
  </p>

</template>

<script setup>
defineProps({ loading: Boolean, error: String, hasData: Boolean })
defineEmits(['retry'])
</script>

