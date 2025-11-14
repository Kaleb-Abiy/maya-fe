<template>
  <div>
    <div class="page-header">
      <h2>Delivery Schedule</h2>
      <button class="btn btn-primary" @click="showModal = true">Schedule Delivery</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Delivery Date</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="delivery in deliveries" :key="delivery.id">
            <td>{{ delivery.id }}</td>
            <td><strong>{{ delivery.client_name || getClientName(delivery.client_id) }}</strong></td>
            <td>{{ formatDate(delivery.delivery_date) }}</td>
            <td>
              <span v-if="delivery.issue_id">
                Issue #{{ delivery.issue_id }}<br>
                <small style="color: #666;">
                  {{ delivery.issue_date ? formatDate(delivery.issue_date) : '' }}
                  <span v-if="delivery.issue_total_price"> - ${{ parseFloat(delivery.issue_total_price).toFixed(2) }}</span>
                </small>
              </span>
              <span v-else style="color: #999;">-</span>
            </td>
            <td>
              <span :class="`badge badge-${delivery.status}`">{{ delivery.status }}</span>
            </td>
            <td>{{ delivery.notes || '-' }}</td>
            <td>
              <button 
                v-if="delivery.status === 'scheduled'" 
                class="btn btn-primary" 
                @click="markAsDelivered(delivery.id)"
                style="margin-right: 0.5rem; font-size: 0.85rem; padding: 0.4rem 0.8rem;"
              >
                Mark Delivered
              </button>
              <button class="btn btn-secondary" @click="editDelivery(delivery)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteDelivery(delivery.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="deliveries.length === 0">
            <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
              No deliveries scheduled.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingDelivery ? 'Edit Delivery' : 'Schedule New Delivery' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveDelivery">
          <div class="form-group">
            <label>Client *</label>
            <select v-model="form.client_id" required @change="onClientChange">
              <option value="">Select a client</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Delivery Date *</label>
            <input v-model="form.delivery_date" type="date" required />
          </div>
          <div class="form-group">
            <label>Issue (Optional)</label>
            <select v-model.number="form.issue_id">
              <option :value="null">No issue linked</option>
              <option v-for="issue in clientIssues" :key="issue.id" :value="issue.id">
                Issue #{{ issue.id }} - {{ formatDate(issue.issue_date) }} - ${{ parseFloat(issue.total_price).toFixed(2) }} ({{ issue.status }})
              </option>
            </select>
            <small v-if="clientIssues.length === 0 && form.client_id" style="color: #666; display: block; margin-top: 0.25rem;">
              No issues found for this client
            </small>
          </div>
          <div class="form-group">
            <label>Status *</label>
            <select v-model="form.status" required>
              <option value="scheduled">Scheduled</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="form.notes" rows="3"></textarea>
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

const deliveries = ref([])
const clients = ref([])
const clientIssues = ref([])
const showModal = ref(false)
const editingDelivery = ref(null)
const form = ref({
  client_id: '',
  delivery_date: new Date().toISOString().split('T')[0],
  issue_id: null,
  status: 'scheduled',
  notes: ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const getClientName = (clientId) => {
  const client = clients.value.find(c => c.id === clientId)
  return client ? client.name : `Client #${clientId}`
}

const loadDeliveries = async () => {
  try {
    const response = await api.get('/deliveries/')
    deliveries.value = response.data
  } catch (error) {
    console.error('Error loading deliveries:', error)
    deliveries.value = []
  }
}

const loadClients = async () => {
  try {
    const response = await api.get('/clients/')
    clients.value = response.data
  } catch (error) {
    console.error('Error loading clients:', error)
    clients.value = []
  }
}

const loadClientIssues = async (clientId) => {
  if (!clientId) {
    clientIssues.value = []
    return
  }
  try {
    const response = await api.get(`/deliveries/client-issues/${clientId}`)
    clientIssues.value = response.data
  } catch (error) {
    console.error('Error loading client issues:', error)
    clientIssues.value = []
  }
}

const onClientChange = () => {
  form.value.issue_id = null
  loadClientIssues(form.value.client_id)
}

const markAsDelivered = async (deliveryId) => {
  if (!confirm('Mark this delivery as delivered?')) return
  try {
    await api.put(`/deliveries/${deliveryId}`, { status: 'delivered' })
    loadDeliveries()
  } catch (error) {
    console.error('Error updating delivery:', error)
    alert(error.response?.data?.detail || 'Error updating delivery. Please try again.')
  }
}

const saveDelivery = async () => {
  try {
    const deliveryData = {
      ...form.value,
      issue_id: form.value.issue_id || null
    }
    if (editingDelivery.value) {
      await api.put(`/deliveries/${editingDelivery.value.id}`, deliveryData)
    } else {
      await api.post('/deliveries/', deliveryData)
    }
    closeModal()
    loadDeliveries()
  } catch (error) {
    console.error('Error saving delivery:', error)
    alert(error.response?.data?.detail || 'Error saving delivery. Please try again.')
  }
}

const editDelivery = (delivery) => {
  editingDelivery.value = delivery
  form.value = {
    client_id: delivery.client_id,
    delivery_date: delivery.delivery_date.split('T')[0],
    issue_id: delivery.issue_id || null,
    status: delivery.status,
    notes: delivery.notes || ''
  }
  loadClientIssues(delivery.client_id)
  showModal.value = true
}

const deleteDelivery = async (id) => {
  if (!confirm('Are you sure you want to delete this delivery?')) return
  try {
    await api.delete(`/deliveries/${id}`)
    loadDeliveries()
  } catch (error) {
    console.error('Error deleting delivery:', error)
    alert('Error deleting delivery. Please try again.')
  }
}

const closeModal = () => {
  showModal.value = false
  editingDelivery.value = null
  clientIssues.value = []
  form.value = {
    client_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    issue_id: null,
    status: 'scheduled',
    notes: ''
  }
}

onMounted(() => {
  loadDeliveries()
  loadClients()
})
</script>

