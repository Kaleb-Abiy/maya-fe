<template>
  <div>
    <div class="page-header">
      <h2>Chicken Deaths</h2>
      <button class="btn btn-primary" @click="showModal = true">Add Death Record</button>
    </div>

    <div class="card">
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
              <button class="btn btn-secondary" @click="editEntry(entry)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteEntry(entry.id)">Delete</button>
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

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingEntry ? 'Edit Death Record' : 'Add Death Record' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveEntry">
          <div class="form-group">
            <label>Date *</label>
            <input 
              v-model="form.date" 
              type="date" 
              :disabled="editingEntry !== null"
              required 
            />
            <small v-if="editingEntry !== null" style="color: #666; display: block; margin-top: 0.25rem;">
              Date cannot be changed. Delete and create a new entry if you need to change the date.
            </small>
          </div>
          <div class="form-group">
            <label>Number of Deaths *</label>
            <input v-model.number="form.deaths" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="form.notes" rows="3" placeholder="Optional notes about the deaths..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
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

const deaths = ref([])
const showModal = ref(false)
const editingEntry = ref(null)
const form = ref({
  date: new Date().toISOString().split('T')[0],
  deaths: 0,
  notes: ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
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

const saveEntry = async () => {
  try {
    if (editingEntry.value) {
      // For updates, only send fields that have changed
      const payload = {}
      
      // Don't send date when editing - dates cannot be changed
      // Only send deaths if it's different from the original
      if (form.value.deaths !== null && form.value.deaths !== undefined && 
          Number(form.value.deaths) !== editingEntry.value.deaths) {
        payload.deaths = Number(form.value.deaths)
      }
      
      // Only send notes if it's different from the original
      const originalNotes = editingEntry.value.notes || ''
      const newNotes = form.value.notes ? form.value.notes.trim() : ''
      if (newNotes !== originalNotes) {
        payload.notes = newNotes || null
      }
      
      console.log('Update payload:', payload)
      await api.put(`/chicken-deaths/${editingEntry.value.id}`, payload)
    } else {
      // For creates, send all required fields
      const payload = {
        date: form.value.date,
        deaths: Number(form.value.deaths),
        notes: form.value.notes && form.value.notes.trim() !== '' ? form.value.notes.trim() : null
      }
      await api.post('/chicken-deaths/', payload)
    }
    closeModal()
    loadDeaths()
  } catch (error) {
    console.error('Error saving entry:', error)
    console.error('Error response:', error.response)
    console.error('Error details:', error.response?.data)
    const errorMessage = error.response?.data?.detail || 'Error saving entry. Please try again.'
    if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      // Format validation errors
      const validationErrors = error.response.data.detail.map(err => {
        return `${err.loc?.join('.')}: ${err.msg}`
      }).join('\n')
      alert(`Validation errors:\n${validationErrors}`)
    } else {
      alert(errorMessage)
    }
  }
}

const editEntry = (entry) => {
  editingEntry.value = entry
  form.value = {
    date: entry.date.split('T')[0],
    deaths: entry.deaths,
    notes: entry.notes || ''
  }
  showModal.value = true
}

const deleteEntry = async (id) => {
  if (!confirm('Are you sure you want to delete this death record?')) return
  try {
    await api.delete(`/chicken-deaths/${id}`)
    loadDeaths()
  } catch (error) {
    console.error('Error deleting entry:', error)
    alert('Error deleting entry. Please try again.')
  }
}

const closeModal = () => {
  showModal.value = false
  editingEntry.value = null
  form.value = {
    date: new Date().toISOString().split('T')[0],
    deaths: 0,
    notes: ''
  }
}

onMounted(() => {
  loadDeaths()
})
</script>

