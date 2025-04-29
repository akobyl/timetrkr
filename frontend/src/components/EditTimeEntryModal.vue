<template>
  <div class="modal fade" id="editEntryModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Time Entry</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" v-if="entry">
          <form id="editEntryForm" @submit.prevent="updateEntry">
            <div class="mb-3">
              <label for="edit-date" class="form-label">Date</label>
              <input type="date" class="form-control" id="edit-date" v-model="entry.date" required>
            </div>
            <div class="mb-3">
              <label for="edit-start-time" class="form-label">Start Time</label>
              <div class="input-group">
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('start', -15)">-15m</button>
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('start', -5)">-5m</button>
                <input type="time" class="form-control" id="edit-start-time" v-model="entry.start_time" required>
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('start', 5)">+5m</button>
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('start', 15)">+15m</button>
                <button type="button" class="btn btn-outline-primary" @click="setTimeToNow('start')">Now</button>
              </div>
            </div>
            <div class="mb-3">
              <label for="edit-end-time" class="form-label">End Time</label>
              <div class="input-group">
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('end', -15)">-15m</button>
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('end', -5)">-5m</button>
                <input type="time" class="form-control" id="edit-end-time" v-model="entry.end_time" required>
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('end', 5)">+5m</button>
                <button type="button" class="btn btn-outline-secondary" @click="adjustTime('end', 15)">+15m</button>
                <button type="button" class="btn btn-outline-primary" @click="setTimeToNow('end')">Now</button>
              </div>
            </div>
            
            <!-- Duration preview -->
            <div class="alert alert-info mt-3" v-if="durationPreview">
              <div class="d-flex align-items-center">
                <i class="bi bi-clock me-2"></i>
                <strong>Duration: {{ durationPreview }}</strong>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" form="editEntryForm" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { apiService, formatUtils } from '../services/api'
import { Modal } from 'bootstrap'

const props = defineProps({
  entry: {
    type: Object,
    default: null
  }
})

const emits = defineEmits(['update', 'close'])

const isSubmitting = ref(false)

// Calculate duration preview
const durationPreview = computed(() => {
  if (!props.entry) return null
  
  return formatUtils.calculateDuration(
    props.entry.start_time, 
    props.entry.end_time
  )
})

function adjustTime(type, minutes) {
  if (!props.entry) return
  
  const timeField = type === 'start' ? 'start_time' : 'end_time'
  const currentTime = props.entry[timeField]
  
  // Parse the time
  const [hours, mins] = currentTime.split(':').map(Number)
  
  // Calculate new time
  let totalMinutes = hours * 60 + mins + minutes
  if (totalMinutes < 0) totalMinutes = 0
  if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1
  
  const newHours = Math.floor(totalMinutes / 60)
  const newMinutes = totalMinutes % 60
  
  // Format back to 24-hour format (HH:MM)
  props.entry[timeField] = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
}

function setTimeToNow(type) {
  if (!props.entry) return
  
  const timeField = type === 'start' ? 'start_time' : 'end_time'
  const now = new Date()
  
  // Get hours and minutes
  let hours = now.getHours()
  let minutes = now.getMinutes()
  
  // Round to nearest 5 minutes
  minutes = Math.round(minutes / 5) * 5
  
  // Adjust if minutes rolled over to 60
  if (minutes === 60) {
    minutes = 0
    hours = (hours + 1) % 24  // Ensure we don't go past 24 hours
  }
  
  // Format back to 24-hour format (HH:MM)
  props.entry[timeField] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

async function updateEntry() {
  try {
    isSubmitting.value = true
    const payload = {
      date: props.entry.date,
      start_time: props.entry.start_time,
      end_time: props.entry.end_time
    }
    
    await apiService.put(`/time-entries/${props.entry.id}`, payload)
    
    // Close the modal
    const modalEl = document.getElementById('editEntryModal')
    const modal = Modal.getInstance(modalEl)
    if (modal) modal.hide()
    
    // Notify parent component
    emits('update')
  } catch (error) {
    console.error('Error updating time entry:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.input-group .btn {
  z-index: 0;
}
</style>