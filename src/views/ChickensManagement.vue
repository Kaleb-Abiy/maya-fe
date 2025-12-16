<template>
  <div>
    <div class="page-header">
      <h2>Chickens Management</h2>
    </div>

    <!-- Statistics Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Initial Count</h3>
        <p style="margin: 0; font-size: 2rem; font-weight: bold;">{{ stats.initial_count }}</p>
        <button 
          class="btn" 
          @click="openInitialCountModal"
          style="margin-top: 1rem; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);"
        >
          {{ stats.initial_count > 0 ? 'Update' : 'Set' }} Initial Count
        </button>
      </div>
      
      <div class="card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Total Deaths</h3>
        <p style="margin: 0; font-size: 2rem; font-weight: bold;">{{ stats.total_deaths }}</p>
      </div>
      
      <div class="card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Current Count</h3>
        <p style="margin: 0; font-size: 2rem; font-weight: bold;">{{ stats.current_count }}</p>
      </div>
    </div>

    <!-- Death Records Section -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="margin: 0;">Death Records</h3>
        <button class="btn btn-primary" @click="showDeathModal = true">Add Death Record</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Deaths</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in deaths" :key="entry.id">
            <td>{{ formatDate(entry.date) }}</td>
            <td><strong>{{ entry.deaths }}</strong></td>
            <td>{{ entry.notes || '-' }}</td>
            <td>
              <button class="btn btn-secondary" @click="editDeathEntry(entry)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteDeathEntry(entry.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="deaths.length === 0">
            <td colspan="4" style="text-align: center; padding: 2rem; color: #999;">
              No death records found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Initial Count Modal -->
    <div v-if="showInitialCountModal" class="modal" @click.self="closeInitialCountModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ stats.initial_count > 0 ? 'Update' : 'Set' }} Initial Chicken Count</h3>
          <button class="close-btn" @click="closeInitialCountModal">&times;</button>
        </div>
        <form @submit.prevent="saveInitialCount">
          <div class="form-group">
            <label>Initial Chicken Count *</label>
            <input 
              v-model.number="initialCountForm.initial_chicken_count" 
              type="number" 
              min="0" 
              required 
              placeholder="Enter total number of chickens"
            />
            <small style="color: #666; display: block; margin-top: 0.5rem;">
              This represents the total number of chickens you have. Deaths will be subtracted from this count.
            </small>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeInitialCountModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Death Record Modal -->
    <div v-if="showDeathModal" class="modal" @click.self="closeDeathModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingDeathEntry ? 'Edit Death Record' : 'Add Death Record' }}</h3>
          <button class="close-btn" @click="closeDeathModal">&times;</button>
        </div>
        <form @submit.prevent="saveDeathEntry">
          <div class="form-group">
            <label>Date *</label>
            <input 
              v-model="deathForm.date" 
              type="date" 
              :disabled="editingDeathEntry !== null"
              required 
            />
            <small v-if="editingDeathEntry !== null" style="color: #666; display: block; margin-top: 0.25rem;">
              Date cannot be changed. Delete and create a new entry if you need to change the date.
            </small>
          </div>
          <div class="form-group">
            <label>Number of Deaths *</label>
            <input v-model.number="deathForm.deaths" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="deathForm.notes" rows="3" placeholder="Optional notes about the deaths..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDeathModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const stats = ref({
  initial_count: 0,
  total_additions: 0,
  total_deaths: 0,
  current_count: 0
})
const deaths = ref([])
const showInitialCountModal = ref(false)
const showDeathModal = ref(false)
const editingDeathEntry = ref(null)
const initialCountForm = ref({
  initial_chicken_count: 0
})
const deathForm = ref({
  date: new Date().toISOString().split('T')[0],
  deaths: 0,
  notes: ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const loadStats = async () => {
  try {
    const response = await api.get('/chickens/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const loadDeaths = async () => {
  try {
    const response = await api.get('/chicken-deaths/')
    deaths.value = response.data
  } catch (error) {
    console.error('Error loading deaths:', error)
    deaths.value = []
  }
}

const openInitialCountModal = () => {
  initialCountForm.value = {
    initial_chicken_count: stats.value.initial_count
  }
  showInitialCountModal.value = true
}

const closeInitialCountModal = () => {
  showInitialCountModal.value = false
  initialCountForm.value = {
    initial_chicken_count: stats.value.initial_count
  }
}

const saveInitialCount = async () => {
  try {
    await api.put('/settings/initial-chicken-count', initialCountForm.value)
    await loadStats()
    closeInitialCountModal()
    alert('Initial chicken count updated successfully!')
  } catch (error) {
    console.error('Error saving initial count:', error)
    alert(error.response?.data?.detail || 'Error saving initial count. Please try again.')
  }
}

const saveDeathEntry = async () => {
  try {
    if (editingDeathEntry.value) {
      // Don't send date when editing - dates cannot be changed
      const payload = {}
      
      // Only send deaths if it's different from the original
      if (deathForm.value.deaths !== null && deathForm.value.deaths !== undefined && 
          Number(deathForm.value.deaths) !== editingDeathEntry.value.deaths) {
        payload.deaths = Number(deathForm.value.deaths)
      }
      
      // Only send notes if it's different from the original
      const originalNotes = editingDeathEntry.value.notes || ''
      const newNotes = deathForm.value.notes ? deathForm.value.notes.trim() : ''
      if (newNotes !== originalNotes) {
        payload.notes = newNotes || null
      }
      
      await api.put(`/chicken-deaths/${editingDeathEntry.value.id}`, payload)
    } else {
      const payload = {
        date: deathForm.value.date,
        deaths: Number(deathForm.value.deaths),
        notes: deathForm.value.notes && deathForm.value.notes.trim() !== '' ? deathForm.value.notes.trim() : null
      }
      await api.post('/chicken-deaths/', payload)
    }
    closeDeathModal()
    loadDeaths()
    loadStats() // Reload stats to update current count
  } catch (error) {
    console.error('Error saving death entry:', error)
    const errorMessage = error.response?.data?.detail || 'Error saving death entry. Please try again.'
    if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      const validationErrors = error.response.data.detail.map(err => {
        return `${err.loc?.join('.')}: ${err.msg}`
      }).join('\n')
      alert(`Validation errors:\n${validationErrors}`)
    } else {
      alert(errorMessage)
    }
  }
}

const editDeathEntry = (entry) => {
  editingDeathEntry.value = entry
  deathForm.value = {
    date: entry.date.split('T')[0],
    deaths: entry.deaths,
    notes: entry.notes || ''
  }
  showDeathModal.value = true
}

const deleteDeathEntry = async (id) => {
  if (!confirm('Are you sure you want to delete this death record?')) return
  try {
    await api.delete(`/chicken-deaths/${id}`)
    loadDeaths()
    loadStats() // Reload stats to update current count
  } catch (error) {
    console.error('Error deleting entry:', error)
    alert('Error deleting entry. Please try again.')
  }
}

const closeDeathModal = () => {
  showDeathModal.value = false
  editingDeathEntry.value = null
  deathForm.value = {
    date: new Date().toISOString().split('T')[0],
    deaths: 0,
    notes: ''
  }
}

onMounted(() => {
  loadStats()
  loadDeaths()
})
</script>

