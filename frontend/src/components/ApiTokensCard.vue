<template>

  <div class="border rounded p-3 mb-3">

    <h5>API Tokens</h5>

    <p class="text-muted">
       Tokens let scripts and other tools read and post your time entries by
      sending <code>Authorization: Bearer &lt;token&gt;</code>. They do not
      expire until revoked.
    </p>

    <div v-if="newToken" class="alert alert-success">
       <strong>Copy your new token now.</strong> It will not be shown again.
      <div class="input-group mt-2">
         <input
          type="text"
          class="form-control font-monospace"
          :value="newToken"
          readonly
          @focus="$event.target.select()"
        /> <button class="btn btn-outline-secondary" @click="copyToken">
           {{ copied ? 'Copied' : 'Copy' }} </button
        >
      </div>

    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <form class="input-group mb-3" @submit.prevent="createToken">
       <input
        v-model.trim="name"
        type="text"
        class="form-control"
        placeholder="Token name (e.g. laptop script)"
        maxlength="100"
        required
      /> <button class="btn btn-primary" type="submit">Create token</button>
    </form>

    <ul v-if="tokens.length" class="list-group">

      <li
        v-for="token in tokens"
        :key="token.id"
        class="list-group-item d-flex justify-content-between align-items-center"
      >

        <div>

          <div>{{ token.name }}</div>
           <small class="text-muted"
            > Created {{ formatDate(token.created_at) }} · Last used {{
              token.last_used_at ? formatDate(token.last_used_at) : 'never'
            }} </small
          >
        </div>
         <button
          class="btn btn-sm btn-outline-danger"
          @click="revokeToken(token)"
        >
           Revoke </button
        >
      </li>

    </ul>

    <p v-else class="text-muted mb-0">No API tokens yet.</p>

  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiService } from '../services/api'

const tokens = ref([])
const name = ref('')
const newToken = ref('')
const copied = ref(false)
const error = ref('')

// Backend timestamps are naive UTC, so mark them as such before parsing
const formatDate = (iso) => new Date(`${iso}Z`).toLocaleString()

async function run(action, failureMessage) {
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e.response?.data?.detail || failureMessage
  }
}

const loadTokens = () =>
  run(async () => {
    tokens.value = (await apiService.get('/api-tokens/')).data
  }, 'Failed to load API tokens')

const createToken = () =>
  run(async () => {
    const { data } = await apiService.post('/api-tokens/', { name: name.value })
    newToken.value = data.token
    copied.value = false
    name.value = ''
    await loadTokens()
  }, 'Failed to create API token')

const revokeToken = (token) => {
  if (
    !window.confirm(
      `Revoke "${token.name}"? Anything using it will stop working.`
    )
  ) {
    return
  }
  return run(async () => {
    await apiService.delete(`/api-tokens/${token.id}`)
    await loadTokens()
  }, 'Failed to revoke API token')
}

async function copyToken() {
  await window.navigator.clipboard.writeText(newToken.value)
  copied.value = true
}

onMounted(loadTokens)
</script>

