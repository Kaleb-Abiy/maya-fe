<template>
  <div>
    <div class="page-header">
      <h2>Daily Inventory</h2>
      <button class="btn btn-primary" @click="showModal = true">Add Daily Entry</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Normal Eggs</th>
            <th>Polluted Eggs</th>
            <th>Cracked Eggs</th>
            <th>Total Eggs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in inventory" :key="entry.id">
            <td>{{ formatDate(entry.date) }}</td>
            <td>{{ entry.normal_eggs }}</td>
            <td>{{ entry.polluted_eggs }}</td>
            <td>{{ entry.cracked_eggs }}</td>
            <td><strong>{{ entry.total_eggs }}</strong></td>
            <td>
              <button class="btn btn-secondary" @click="editEntry(entry)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteEntry(entry.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="inventory.length === 0">
            <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
              No inventory entries found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingEntry ? 'Edit Entry' : 'Add Daily Inventory Entry' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveEntry">
          <div class="form-group">
            <label>Date *</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="form-group">
            <label>Normal Eggs *</label>
            <input v-model.number="form.normal_eggs" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>Polluted Eggs *</label>
            <input v-model.number="form.polluted_eggs" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>Cracked Eggs *</label>
            <input v-model.number="form.cracked_eggs" type="number" min="0" required />
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

const inventory = ref([])
const showModal = ref(false)
const editingEntry = ref(null)
const form = ref({
  date: new Date().toISOString().split('T')[0],
  normal_eggs: 0,
  polluted_eggs: 0,
  cracked_eggs: 0
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const loadInventory = async () => {
  try {
    const response = await api.get('/inventory/')
    inventory.value = response.data
  } catch (error) {
    console.error('Error loading inventory:', error)
    inventory.value = []
  }
}

const saveEntry = async () => {
  try {
    if (editingEntry.value) {
      await api.put(`/inventory/${editingEntry.value.id}`, form.value)
    } else {
      await api.post('/inventory/', form.value)
    }
    closeModal()
    loadInventory()
  } catch (error) {
    console.error('Error saving entry:', error)
    alert(error.response?.data?.detail || 'Error saving entry. Please try again.')
  }
}

const editEntry = (entry) => {
  editingEntry.value = entry
  form.value = {
    date: entry.date.split('T')[0],
    normal_eggs: entry.normal_eggs,
    polluted_eggs: entry.polluted_eggs,
    cracked_eggs: entry.cracked_eggs
  }
  showModal.value = true
}

const deleteEntry = async (id) => {
  if (!confirm('Are you sure you want to delete this entry?')) return
  try {
    await api.delete(`/inventory/${id}`)
    loadInventory()
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
    normal_eggs: 0,
    polluted_eggs: 0,
    cracked_eggs: 0
  }
}

onMounted(() => {
  loadInventory()
})
</script>

