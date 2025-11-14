<template>
  <div>
    <div class="page-header">
      <h2>Payments</h2>
      <button class="btn btn-primary" @click="showModal = true">Record Payment</button>
    </div>

    <!-- Unpaid Issues Section -->
    <div v-if="unpaidIssues.length > 0" class="card" style="margin-bottom: 1.5rem; border-left: 4px solid #dc3545;">
      <h3 style="margin-bottom: 1rem; color: #dc3545;">Unpaid Issues (Due/Overdue)</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Issue ID</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Total Amount</th>
            <th>Total Paid</th>
            <th>Remaining</th>
            <th>Status</th>
            <th>Expected Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="issue in unpaidIssues" :key="issue.issue_id">
            <td>{{ issue.issue_id }}</td>
            <td>{{ issue.client_name }}</td>
            <td>{{ formatDate(issue.issue_date) }}</td>
            <td><strong>${{ parseFloat(issue.total_price).toFixed(2) }}</strong></td>
            <td>${{ parseFloat(issue.total_paid || 0).toFixed(2) }}</td>
            <td><strong>${{ (parseFloat(issue.total_price) - parseFloat(issue.total_paid || 0)).toFixed(2) }}</strong></td>
            <td>
              <span :class="`badge badge-${issue.status}`">{{ issue.status }}</span>
            </td>
            <td>{{ issue.expected_payment_date ? formatDate(issue.expected_payment_date) : '-' }}</td>
            <td>
              <button class="btn btn-primary" @click="recordPaymentForIssue(issue)">Record Payment</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- All Payments Section -->
    <div class="card">
      <h3 style="margin-bottom: 1rem;">All Payments</h3>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Issue ID</th>
            <th>Amount</th>
            <th>Payment Date</th>
            <th>Method</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.id">
            <td>{{ payment.id }}</td>
            <td>{{ payment.issue_id }}</td>
            <td><strong>${{ payment.amount }}</strong></td>
            <td>{{ formatDate(payment.payment_date) }}</td>
            <td>{{ payment.method || '-' }}</td>
            <td>
              <button class="btn btn-secondary" @click="editPayment(payment)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deletePayment(payment.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="payments.length === 0">
            <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
              No payments found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingPayment ? 'Edit Payment' : 'Record New Payment' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="savePayment">
          <div v-if="!editingPayment" class="form-group">
            <label>Issue *</label>
            <select v-model.number="form.issue_id" required @change="onIssueChange">
              <option value="">Select an issue</option>
              <option v-for="issue in unpaidIssues" :key="issue.issue_id" :value="issue.issue_id">
                Issue #{{ issue.issue_id }} - {{ issue.client_name }} (${{ parseFloat(issue.total_price).toFixed(2) }})
              </option>
            </select>
            <small v-if="selectedIssue" style="color: #666; display: block; margin-top: 0.25rem;">
              Total: ${{ parseFloat(selectedIssue.total_price).toFixed(2) }} | 
              Paid: ${{ parseFloat(selectedIssue.total_paid || 0).toFixed(2) }} | 
              Remaining: ${{ (parseFloat(selectedIssue.total_price) - parseFloat(selectedIssue.total_paid || 0)).toFixed(2) }}
            </small>
          </div>
          <div v-else class="form-group">
            <label>Issue ID</label>
            <input v-model.number="form.issue_id" type="number" disabled />
          </div>
          <div class="form-group">
            <label>Amount *</label>
            <input v-model.number="form.amount" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Payment Date *</label>
            <input v-model="form.payment_date" type="date" required />
          </div>
          <div class="form-group">
            <label>Payment Method</label>
            <select v-model="form.method">
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div v-if="!editingPayment && selectedIssue && selectedIssue.status !== 'paid'" class="form-group">
            <label>
              <input type="checkbox" v-model="form.update_status" />
              Update issue status to 'paid'
            </label>
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

const payments = ref([])
const unpaidIssues = ref([])
const showModal = ref(false)
const editingPayment = ref(null)
const selectedIssue = ref(null)
const form = ref({
  issue_id: '',
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  method: '',
  update_status: true
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const loadPayments = async () => {
  try {
    const response = await api.get('/payments/')
    payments.value = response.data
  } catch (error) {
    console.error('Error loading payments:', error)
    payments.value = []
  }
}

const loadUnpaidIssues = async () => {
  try {
    const response = await api.get('/payments/unpaid-issues')
    unpaidIssues.value = response.data
  } catch (error) {
    console.error('Error loading unpaid issues:', error)
    unpaidIssues.value = []
  }
}

const onIssueChange = () => {
  selectedIssue.value = unpaidIssues.value.find(issue => issue.issue_id === form.value.issue_id)
  if (selectedIssue.value) {
    const remaining = parseFloat(selectedIssue.value.total_price) - parseFloat(selectedIssue.value.total_paid || 0)
    form.value.amount = remaining > 0 ? remaining : 0
  }
}

const recordPaymentForIssue = (issue) => {
  selectedIssue.value = issue
  form.value.issue_id = issue.issue_id
  const remaining = parseFloat(issue.total_price) - parseFloat(issue.total_paid || 0)
  form.value.amount = remaining > 0 ? remaining : 0
  form.value.payment_date = new Date().toISOString().split('T')[0]
  form.value.update_status = true
  showModal.value = true
}

const savePayment = async () => {
  try {
    if (editingPayment.value) {
      await api.put(`/payments/${editingPayment.value.id}`, form.value)
    } else {
      await api.post('/payments/', form.value)
    }
    closeModal()
    loadPayments()
    loadUnpaidIssues()
  } catch (error) {
    console.error('Error saving payment:', error)
    alert(error.response?.data?.detail || 'Error saving payment. Please try again.')
  }
}

const editPayment = (payment) => {
  editingPayment.value = payment
  selectedIssue.value = null
  form.value = {
    issue_id: payment.issue_id,
    amount: parseFloat(payment.amount),
    payment_date: payment.payment_date.split('T')[0],
    method: payment.method || '',
    update_status: false  // Don't update status when editing existing payment
  }
  showModal.value = true
}

const deletePayment = async (id) => {
  if (!confirm('Are you sure you want to delete this payment?')) return
  try {
    await api.delete(`/payments/${id}`)
    loadPayments()
    loadUnpaidIssues()
  } catch (error) {
    console.error('Error deleting payment:', error)
    alert('Error deleting payment. Please try again.')
  }
}

const closeModal = () => {
  showModal.value = false
  editingPayment.value = null
  selectedIssue.value = null
  form.value = {
    issue_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    method: '',
    update_status: true
  }
}

onMounted(() => {
  loadPayments()
  loadUnpaidIssues()
})
</script>

