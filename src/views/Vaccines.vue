<template>
  <div>
    <div class="page-header">
      <h2>Vaccines</h2>
      <button class="btn btn-primary" @click="showModal = true">Add Record</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Vaccine Name</th>
            <th>Age (Days)</th>
            <th>Age (Weeks)</th>
            <th>Age (Months)</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in vaccines" :key="entry.id">
            <td>{{ formatDate(entry.date) }}</td>
            <td><strong>{{ entry.vaccine_name }}</strong></td>
            <td>{{ entry.age_in_days || '-' }}</td>
            <td>{{ entry.age_in_weeks || '-' }}</td>
            <td>{{ entry.age_in_months || '-' }}</td>
            <td>{{ entry.notes || '-' }}</td>
            <td>
              <button class="btn btn-secondary" @click="editEntry(entry)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteEntry(entry.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="vaccines.length === 0">
            <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
              No vaccine records found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingEntry ? 'Edit Record' : 'Add Vaccine Record' }}</h3>
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
            <label>Vaccine Name *</label>
            <input v-model="form.vaccine_name" type="text" required placeholder="Enter vaccine name" />
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div class="form-group">
              <label>Age in Days</label>
              <input v-model.number="form.age_in_days" type="number" min="0" placeholder="Optional" />
            </div>
            <div class="form-group">
              <label>Age in Weeks</label>
              <input v-model.number="form.age_in_weeks" type="number" min="0" placeholder="Optional" />
            </div>
            <div class="form-group">
              <label>Age in Months</label>
              <input v-model.number="form.age_in_months" type="number" min="0" placeholder="Optional" />
            </div>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="form.notes" rows="3" placeholder="Optional notes about the vaccine..."></textarea>
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

const vaccines = ref([])
const showModal = ref(false)
const editingEntry = ref(null)
const form = ref({
  date: new Date().toISOString().split('T')[0],
  vaccine_name: '',
  age_in_days: null,
  age_in_weeks: null,
  age_in_months: null,
  notes: ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const loadVaccines = async () => {
  try {
    const response = await api.get('/vaccines/')
    vaccines.value = response.data
  } catch (error) {
    console.error('Error loading vaccines:', error)
    vaccines.value = []
  }
}

const saveEntry = async () => {
  try {
    const payload = {
      date: form.value.date,
      vaccine_name: form.value.vaccine_name.trim(),
      age_in_days: form.value.age_in_days || null,
      age_in_weeks: form.value.age_in_weeks || null,
      age_in_months: form.value.age_in_months || null,
      notes: form.value.notes && form.value.notes.trim() !== '' ? form.value.notes.trim() : null
    }

    if (editingEntry.value) {
      // For updates, don't send date - dates cannot be changed
      const updatePayload = {}
      if (form.value.vaccine_name !== editingEntry.value.vaccine_name) {
        updatePayload.vaccine_name = form.value.vaccine_name.trim()
      }
      if (form.value.age_in_days !== editingEntry.value.age_in_days) {
        updatePayload.age_in_days = form.value.age_in_days || null
      }
      if (form.value.age_in_weeks !== editingEntry.value.age_in_weeks) {
        updatePayload.age_in_weeks = form.value.age_in_weeks || null
      }
      if (form.value.age_in_months !== editingEntry.value.age_in_months) {
        updatePayload.age_in_months = form.value.age_in_months || null
      }
      const originalNotes = editingEntry.value.notes || ''
      const newNotes = form.value.notes ? form.value.notes.trim() : ''
      if (newNotes !== originalNotes) {
        updatePayload.notes = newNotes || null
      }
      
      await api.put(`/vaccines/${editingEntry.value.id}`, updatePayload)
    } else {
      await api.post('/vaccines/', payload)
    }
    closeModal()
    loadVaccines()
  } catch (error) {
    console.error('Error saving entry:', error)
    const errorMessage = error.response?.data?.detail || 'Error saving entry. Please try again.'
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

const editEntry = (entry) => {
  editingEntry.value = entry
  form.value = {
    date: entry.date.split('T')[0],
    vaccine_name: entry.vaccine_name,
    age_in_days: entry.age_in_days,
    age_in_weeks: entry.age_in_weeks,
    age_in_months: entry.age_in_months,
    notes: entry.notes || ''
  }
  showModal.value = true
}

const deleteEntry = async (id) => {
  if (!confirm('Are you sure you want to delete this vaccine record?')) return
  try {
    await api.delete(`/vaccines/${id}`)
    loadVaccines()
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
    vaccine_name: '',
    age_in_days: null,
    age_in_weeks: null,
    age_in_months: null,
    notes: ''
  }
}

onMounted(() => {
  loadVaccines()
})
</script>

