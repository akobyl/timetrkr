<template>
  <div class="history-view">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3>Time Entry History</h3>
        <div class="d-flex gap-2 align-items-center">
          <button 
            class="btn btn-sm btn-outline-secondary" 
            @click="previousMonth"
            :disabled="timeEntriesStore.isLoadingEntries"
            title="Previous Month"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          
          <input 
            type="month" 
            class="form-control" 
            v-model="timeEntriesStore.filterDate" 
            @change="loadEntries"
            :disabled="timeEntriesStore.isLoadingEntries || showAllEntries"
          >
          
          <button 
            class="btn btn-sm btn-outline-secondary" 
            @click="nextMonth"
            :disabled="timeEntriesStore.isLoadingEntries"
            title="Next Month"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          
          <button 
            class="btn btn-sm"
            :class="showAllEntries ? 'btn-primary' : 'btn-outline-primary'"
            @click="toggleAllEntries"
            :disabled="timeEntriesStore.isLoadingEntries"
            title="Show All Entries"
          >
            All
          </button>
          
          <button 
            class="btn btn-outline-secondary" 
            @click="timeEntriesStore.toggleSortDirection"
            :disabled="timeEntriesStore.isLoadingEntries"
          >
            <i class="bi" :class="sortIcon"></i> Sort
          </button>
          
          <button 
            class="btn btn-outline-success" 
            @click="exportToCSV"
            :disabled="timeEntriesStore.isLoadingEntries"
          >
            <i class="bi bi-download"></i> Export
          </button>
          
          <button 
            class="btn btn-outline-primary" 
            @click="triggerImport"
            :disabled="timeEntriesStore.isLoadingEntries"
          >
            <i class="bi bi-upload"></i> Import
          </button>
          
          <input 
            type="file" 
            id="csvFileInput" 
            accept=".csv" 
            @change="importFromCSV" 
            style="display: none;"
          >
        </div>
      </div>
      <div class="card-body p-0">
        <!-- Loading state -->
        <div v-if="timeEntriesStore.isLoadingEntries" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading time entries...</p>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="timeEntriesStore.allEntries.length === 0" class="text-center py-5">
          <i class="bi bi-clock-history" style="font-size: 3rem;"></i>
          <br><br>
          <p class="text-muted">No time entries found for this period.</p>
        </div>
        
        <!-- Entries table -->
        <div v-else class="table-responsive">
          <table class="table table-striped table-hover mb-0">
            <thead class="table-header">
              <tr>
                <th>Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in timeEntriesStore.allEntries" :key="entry.id">
                <td>{{ formatUtils.formatDate(entry.date) }}</td>
                <td>{{ formatUtils.formatTime(entry.start_time) }}</td>
                <td>{{ formatUtils.formatTime(entry.end_time) }}</td>
                <td>{{ formatUtils.calculateDuration(entry.start_time, entry.end_time) }}</td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button 
                      class="btn btn-outline-primary" 
                      @click="editEntry(entry)"
                      title="Edit"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                      class="btn btn-outline-danger" 
                      @click="confirmDelete(entry.id)"
                      title="Delete"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer-custom d-flex justify-content-between" v-if="timeEntriesStore.allEntries.length > 0">
        <div>
          <strong>{{ timeEntriesStore.allEntries.length }}</strong> entries
        </div>
        <div>
          <span class="badge" :class="showAllEntries ? 'bg-primary' : 'bg-info'">
            {{ showAllEntries ? 'All Entries' : timeEntriesStore.filterDate }}
          </span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Edit Modal -->
  <EditTimeEntryModal
    :entry="editingEntry"
    @update="onEntryUpdated"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimeEntriesStore } from '../stores/timeEntries'
import { formatUtils } from '../services/api'
import EditTimeEntryModal from '../components/EditTimeEntryModal.vue'
import { Modal } from 'bootstrap'

const timeEntriesStore = useTimeEntriesStore()
const editingEntry = ref(null)
const showAllEntries = ref(false)
const importStatus = ref('')
const importError = ref('')

// Sort direction icon
const sortIcon = computed(() => {
  return timeEntriesStore.sortDirection === 'asc' 
    ? 'bi-sort-down-alt' 
    : 'bi-sort-up'
})

// Load entries
async function loadEntries() {
  await timeEntriesStore.loadAllTimeEntries(showAllEntries.value)
}

// Navigate to previous month
function previousMonth() {
  if (showAllEntries.value) return
  
  const [year, month] = timeEntriesStore.filterDate.split('-').map(Number)
  let newMonth = month - 1
  let newYear = year
  
  if (newMonth < 1) {
    newMonth = 12
    newYear--
  }
  
  // Update filterDate (YYYY-MM format)
  timeEntriesStore.filterDate = `${newYear}-${newMonth.toString().padStart(2, '0')}`
  loadEntries()
}

// Navigate to next month
function nextMonth() {
  if (showAllEntries.value) return
  
  const [year, month] = timeEntriesStore.filterDate.split('-').map(Number)
  let newMonth = month + 1
  let newYear = year
  
  if (newMonth > 12) {
    newMonth = 1
    newYear++
  }
  
  // Update filterDate (YYYY-MM format)
  timeEntriesStore.filterDate = `${newYear}-${newMonth.toString().padStart(2, '0')}`
  loadEntries()
}

// Toggle between showing all entries or filtered by month
function toggleAllEntries() {
  showAllEntries.value = !showAllEntries.value
  loadEntries()
}

// Edit entry
function editEntry(entry) {
  // Create a copy of the entry for editing
  editingEntry.value = {
    id: entry.id,
    date: entry.date,
    start_time: entry.start_time,
    end_time: entry.end_time
  }
  
  // Open the modal
  const modalEl = document.getElementById('editEntryModal')
  const modal = new Modal(modalEl)
  modal.show()
}

// Handle entry updated
function onEntryUpdated() {
  loadEntries()
}

// Confirm and delete entry
function confirmDelete(id) {
  if (confirm('Are you sure you want to delete this time entry?')) {
    timeEntriesStore.deleteTimeEntry(id).then(() => {
      loadEntries()
    })
  }
}

// Load entries on component mount
onMounted(() => {
  loadEntries()
})

// Export to CSV
function exportToCSV() {
  try {
    console.log('Export button clicked')
    const entries = timeEntriesStore.allEntries
    console.log('Entries found:', entries.length)
    
    if (entries.length === 0) {
      alert('No entries to export')
      return
    }

    // Create CSV header
    const csvHeader = 'Date,Start Time,End Time,Duration\n'
    
    // Create CSV rows
    const csvRows = entries.map(entry => {
      const duration = formatUtils.calculateDuration(entry.start_time, entry.end_time)
      return `${entry.date},${entry.start_time},${entry.end_time},"${duration}"`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      // Generate filename with current date
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const filename = showAllEntries.value 
        ? `timetrkr-export-all-${dateStr}.csv`
        : `timetrkr-export-${timeEntriesStore.filterDate}-${dateStr}.csv`
      
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Failed to export CSV. Please try again.')
  }
}

// Trigger import file picker
function triggerImport() {
  document.getElementById('csvFileInput').click()
}

// Import from CSV
async function importFromCSV(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    importStatus.value = 'Reading file...'
    importError.value = ''
    
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row')
    }
    
    // Parse header
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    const requiredColumns = ['date', 'start time', 'end time']
    
    // Check for required columns
    const missingColumns = requiredColumns.filter(col => 
      !header.some(h => h.includes(col.replace(' ', '')))
    )
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
    }
    
    // Find column indices
    const dateIndex = header.findIndex(h => h.includes('date'))
    const startIndex = header.findIndex(h => h.includes('start'))
    const endIndex = header.findIndex(h => h.includes('end'))
    
    if (dateIndex === -1 || startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find required columns in CSV')
    }
    
    importStatus.value = 'Parsing entries...'
    
    // Parse data rows
    const newEntries = []
    const errors = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''))
        
        if (row.length < Math.max(dateIndex, startIndex, endIndex) + 1) {
          errors.push(`Row ${i + 1}: Not enough columns`)
          continue
        }
        
        const date = row[dateIndex]
        const startTime = row[startIndex]
        const endTime = row[endIndex]
        
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          errors.push(`Row ${i + 1}: Invalid date format (expected YYYY-MM-DD)`)
          continue
        }
        
        // Validate time format (HH:MM)
        if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
          errors.push(`Row ${i + 1}: Invalid time format (expected HH:MM)`)
          continue
        }
        
        // Validate entry using store validation
        const validation = timeEntriesStore.validateEntry({
          startTime,
          endTime,
          date
        })
        
        if (!validation.isValid) {
          errors.push(`Row ${i + 1}: ${validation.errors.join(', ')}`)
          continue
        }
        
        newEntries.push({
          date,
          start_time: startTime,
          end_time: endTime
        })
        
      } catch (rowError) {
        errors.push(`Row ${i + 1}: ${rowError.message}`)
      }
    }
    
    if (newEntries.length === 0) {
      throw new Error('No valid entries found in CSV file')
    }
    
    // Show summary and confirm import
    const confirmMessage = `Found ${newEntries.length} valid entries to import.${errors.length > 0 ? ` ${errors.length} rows had errors and will be skipped.` : ''}\n\nProceed with import?`
    
    if (!confirm(confirmMessage)) {
      importStatus.value = ''
      event.target.value = '' // Reset file input
      return
    }
    
    importStatus.value = 'Importing entries...'
    
    // Import entries one by one
    let successCount = 0
    let failCount = 0
    
    for (const entry of newEntries) {
      try {
        // Set the current entry in the store before saving
        timeEntriesStore.currentEntry.date = entry.date
        timeEntriesStore.currentEntry.startTime = entry.start_time
        timeEntriesStore.currentEntry.endTime = entry.end_time
        
        const result = await timeEntriesStore.saveTimeEntry()
        if (result.success) {
          successCount++
        } else {
          failCount++
          console.error('Failed to import entry:', entry, result.error)
        }
      } catch (error) {
        failCount++
        console.error('Failed to import entry:', entry, error)
      }
    }
    
    // Reload entries
    await loadEntries()
    
    // Show results
    let resultMessage = `Import completed!\n${successCount} entries imported successfully.`
    if (failCount > 0) {
      resultMessage += `\n${failCount} entries failed to import.`
    }
    if (errors.length > 0) {
      resultMessage += `\n${errors.length} rows were skipped due to validation errors.`
    }
    
    alert(resultMessage)
    importStatus.value = ''
    
  } catch (error) {
    console.error('Import error:', error)
    importError.value = error.message
    alert(`Import failed: ${error.message}`)
    importStatus.value = ''
  }
  
  // Reset file input
  event.target.value = ''
}

// Watch for sort direction changes
watch(() => timeEntriesStore.sortDirection, () => {
  // When sort direction changes, entries are automatically re-sorted in the store
})
</script>

<style scoped>
.history-view .card {
  border-radius: 10px;
  overflow: hidden;
}

.table-header {
  background-color: var(--custom-card-header-bg) !important;
  border-color: var(--custom-card-border) !important;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.card-footer-custom {
  background-color: var(--custom-card-header-bg) !important;
  border-top: 1px solid var(--custom-card-border) !important;
  padding: 0.75rem 1.25rem;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
</style>