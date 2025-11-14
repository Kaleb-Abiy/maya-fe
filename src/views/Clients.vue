<template>
  <div>
    <div class="page-header">
      <h2>Clients</h2>
      <button class="btn btn-primary" @click="showModal = true">Add Client</button>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.id">
            <td>{{ client.id }}</td>
            <td>{{ client.name }}</td>
            <td>{{ client.email || '-' }}</td>
            <td>{{ client.phone || '-' }}</td>
            <td>{{ client.address || '-' }}</td>
            <td>
              <button class="btn btn-secondary" @click="editClient(client)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger" @click="deleteClient(client.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="clients.length === 0">
            <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
              No clients found. Add your first client to get started.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingClient ? 'Edit Client' : 'Add New Client' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveClient">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.name" type="text" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" type="tel" />
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea v-model="form.address" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Website</label>
            <input v-model="form.website" type="url" />
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

const clients = ref([])
const showModal = ref(false)
const editingClient = ref(null)
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  website: ''
})

const loadClients = async () => {
  try {
    const response = await api.get('/clients/')
    clients.value = response.data
  } catch (error) {
    console.error('Error loading clients:', error)
    clients.value = []
  }
}

const saveClient = async () => {
  try {
    if (editingClient.value) {
      await api.put(`/clients/${editingClient.value.id}`, form.value)
    } else {
      await api.post('/clients/', form.value)
    }
    closeModal()
    loadClients()
  } catch (error) {
    console.error('Error saving client:', error)
    alert('Error saving client. Please try again.')
  }
}

const editClient = (client) => {
  editingClient.value = client
  form.value = { ...client }
  showModal.value = true
}

const deleteClient = async (id) => {
  if (!confirm('Are you sure you want to delete this client?')) return
  try {
    await api.delete(`/clients/${id}`)
    loadClients()
  } catch (error) {
    console.error('Error deleting client:', error)
    alert(error.response?.data?.detail || 'Error deleting client. Please try again.')
  }
}

const closeModal = () => {
  showModal.value = false
  editingClient.value = null
  form.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  }
}

onMounted(() => {
  loadClients()
})
</script>

