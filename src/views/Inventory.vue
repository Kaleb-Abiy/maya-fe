<template>
  <div>
    <div class="page-header">
      <h2>Daily Inventory</h2>
      <button class="btn btn-primary" @click="showModal = true">Add Daily Entry</button>
    </div>

    <!-- Initial Stock Section -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">Initial Stock</h3>
          <p style="margin: 0; color: #666; font-size: 0.9rem;">
            Set your starting inventory when integrating with existing stock. This value is added to your daily inventory entries.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-weight: 500;">Current Initial Stock:</label>
            <span style="font-size: 1.2rem; font-weight: bold; color: #2c5f7c;">{{ initialStock }}</span>
          </div>
          <button class="btn btn-secondary" @click="openInitialStockModal">
            {{ initialStock > 0 ? 'Update' : 'Set' }} Initial Stock
          </button>
        </div>
      </div>
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

    <!-- Initial Stock Modal -->
    <div v-if="showInitialStockModal" class="modal" @click.self="closeInitialStockModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ initialStock > 0 ? 'Update' : 'Set' }} Initial Stock</h3>
          <button class="close-btn" @click="closeInitialStockModal">&times;</button>
        </div>
        <form @submit.prevent="saveInitialStock">
          <div class="form-group">
            <label>Initial Stock (Total Eggs) *</label>
            <input 
              v-model.number="initialStockForm.initial_stock" 
              type="number" 
              min="0" 
              required 
              placeholder="Enter total eggs in stock"
            />
            <small style="color: #666; display: block; margin-top: 0.5rem;">
              This represents the total number of eggs you have in stock before adding daily inventory entries.
            </small>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeInitialStockModal">Cancel</button>
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
const initialStock = ref(0)
const showInitialStockModal = ref(false)
const initialStockForm = ref({
  initial_stock: 0
})
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

const loadInitialStock = async () => {
  try {
    const response = await api.get('/settings/initial-stock')
    initialStock.value = response.data.initial_stock || 0
  } catch (error) {
    console.error('Error loading initial stock:', error)
    initialStock.value = 0
  }
}

const saveInitialStock = async () => {
  try {
    await api.put('/settings/initial-stock', initialStockForm.value)
    await loadInitialStock()
    closeInitialStockModal()
    alert('Initial stock updated successfully!')
  } catch (error) {
    console.error('Error saving initial stock:', error)
    alert(error.response?.data?.detail || 'Error saving initial stock. Please try again.')
  }
}

const openInitialStockModal = () => {
  initialStockForm.value = {
    initial_stock: initialStock.value
  }
  showInitialStockModal.value = true
}

const closeInitialStockModal = () => {
  showInitialStockModal.value = false
  initialStockForm.value = {
    initial_stock: initialStock.value
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
  loadInitialStock()
  initialStockForm.value = {
    initial_stock: initialStock.value
  }
})
</script>

