<template>
  <div>
    <div class="page-header">
      <h2>Issues (Invoices)</h2>
      <button class="btn btn-primary" @click="showModal = true">Create Issue</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Items</th>
            <th>Unit Price</th>
            <th>Total Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="issue in issues" :key="issue.id">
            <td>{{ issue.id }}</td>
            <td>{{ getClientName(issue.client_id) }}</td>
            <td>{{ formatDate(issue.issue_date) }}</td>
            <td>{{ issue.total_items }}</td>
            <td>${{ issue.unit_price }}</td>
            <td><strong>${{ issue.total_price }}</strong></td>
            <td>
              <span :class="`badge badge-${issue.status}`">{{ issue.status }}</span>
            </td>
            <td>
              <button class="btn btn-secondary" @click="editIssue(issue)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteIssue(issue.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="issues.length === 0">
            <td colspan="8" style="text-align: center; padding: 2rem; color: #999;">
              No issues found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingIssue ? 'Edit Issue' : 'Create New Issue' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveIssue">
          <div class="form-group">
            <label>Client *</label>
            <select v-model="form.client_id" required>
              <option value="">Select a client</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Issue Date *</label>
            <input v-model="form.issue_date" type="date" required />
          </div>
          <div class="form-group">
            <label>Total Items *</label>
            <input v-model.number="form.total_items" type="number" min="1" required />
          </div>
          <div class="form-group">
            <label>Unit Price *</label>
            <input v-model.number="form.unit_price" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Payment Method *</label>
            <select v-model="form.payment_method" required @change="onPaymentMethodChange">
              <option value="immediate_paid">Immediate Paid</option>
              <option value="dube">Dube</option>
            </select>
          </div>
          <div v-if="form.payment_method === 'dube'" class="form-group">
            <label>Expected Payment Date *</label>
            <input 
              v-model="form.expected_payment_date" 
              type="date" 
              :required="form.payment_method === 'dube'"
              :value="form.expected_payment_date || ''"
              @input="form.expected_payment_date = $event.target.value || null"
            />
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

const issues = ref([])
const clients = ref([])
const showModal = ref(false)
const editingIssue = ref(null)
const form = ref({
  client_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  total_items: 0,
  unit_price: 0,
  payment_method: 'immediate_paid',
  expected_payment_date: null
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const getClientName = (clientId) => {
  const client = clients.value.find(c => c.id === clientId)
  return client ? client.name : `Client #${clientId}`
}

const loadIssues = async () => {
  try {
    const response = await api.get('/issues/')
    issues.value = response.data
  } catch (error) {
    console.error('Error loading issues:', error)
    issues.value = []
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

const saveIssue = async () => {
  try {
    // Prepare data - ensure expected_payment_date is null for immediate_paid
    const issueData = {
      ...form.value,
      expected_payment_date: form.value.payment_method === 'immediate_paid' 
        ? null 
        : (form.value.expected_payment_date || null)
    }
    
    if (editingIssue.value) {
      await api.put(`/issues/${editingIssue.value.id}`, issueData)
    } else {
      await api.post('/issues/', issueData)
    }
    closeModal()
    loadIssues()
  } catch (error) {
    console.error('Error saving issue:', error)
    alert(error.response?.data?.detail || 'Error saving issue. Please try again.')
  }
}

const onPaymentMethodChange = () => {
  if (form.value.payment_method === 'immediate_paid') {
    form.value.expected_payment_date = null
  }
}

const editIssue = (issue) => {
  editingIssue.value = issue
  form.value = {
    client_id: issue.client_id,
    issue_date: issue.issue_date.split('T')[0],
    total_items: issue.total_items,
    unit_price: parseFloat(issue.unit_price),
    payment_method: issue.payment_method || (issue.expected_payment_date ? 'dube' : 'immediate_paid'),
    expected_payment_date: issue.expected_payment_date ? issue.expected_payment_date.split('T')[0] : null
  }
  showModal.value = true
}

const deleteIssue = async (id) => {
  if (!confirm('Are you sure you want to delete this issue?')) return
  try {
    await api.delete(`/issues/${id}`)
    loadIssues()
  } catch (error) {
    console.error('Error deleting issue:', error)
    alert('Error deleting issue. Please try again.')
  }
}

const closeModal = () => {
  showModal.value = false
  editingIssue.value = null
  form.value = {
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    total_items: 0,
    unit_price: 0,
    payment_method: 'immediate_paid',
    expected_payment_date: null
  }
}

onMounted(() => {
  loadIssues()
  loadClients()
})
</script>

