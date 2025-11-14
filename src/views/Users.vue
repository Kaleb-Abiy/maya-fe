<template>
  <div class="users-container">
    <div class="page-header">
      <h1>User Management</h1>
      <p>Manage admin users and their access status</p>
    </div>

    <div class="users-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Full Name</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="text-center">Loading users...</td>
          </tr>
          <tr v-else-if="users.length === 0">
            <td colspan="7" class="text-center">No users found</td>
          </tr>
          <tr v-else v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email || '-' }}</td>
            <td>{{ user.full_name || '-' }}</td>
            <td>
              <span :class="['badge', user.is_active ? 'badge-active' : 'badge-inactive']">
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button
                v-if="user.id !== currentUserId"
                @click="toggleUserStatus(user)"
                :class="['btn', user.is_active ? 'btn-danger' : 'btn-success']"
                :disabled="updating"
              >
                {{ user.is_active ? 'Deactivate' : 'Activate' }}
              </button>
              <span v-else class="text-muted">Current User</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="error" class="error-message">
      <strong>⚠️</strong> {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'

const users = ref([])
const loading = ref(false)
const updating = ref(false)
const error = ref('')
const currentUserId = ref(null)

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Get current user info
    const currentUserResponse = await api.get('/users/me')
    currentUserId.value = currentUserResponse.data.id
    
    // Get all users
    const response = await api.get('/users/')
    users.value = response.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to load users. Please try again.'
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user) => {
  if (updating.value) return
  
  const newStatus = !user.is_active
  const action = newStatus ? 'activate' : 'deactivate'
  
  if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
    return
  }
  
  updating.value = true
  error.value = ''
  
  try {
    const response = await api.put(`/users/${user.id}/status`, {
      is_active: newStatus
    })
    
    // Update the user in the list
    const index = users.value.findIndex(u => u.id === user.id)
    if (index !== -1) {
      users.value[index] = response.data
    }
  } catch (err) {
    error.value = err.response?.data?.detail || `Failed to ${action} user. Please try again.`
    console.error(`Error ${action}ing user:`, err)
  } finally {
    updating.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #2c5f7c;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 0.95rem;
}

.users-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background-color: #2c5f7c;
  color: white;
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.data-table tbody tr:hover {
  background-color: #f9f9f9;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.badge-active {
  background-color: #d4edda;
  color: #155724;
}

.badge-inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.text-center {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.text-muted {
  color: #999;
  font-size: 0.9rem;
  font-style: italic;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  border-left: 4px solid #dc3545;
}

@media (max-width: 768px) {
  .users-container {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .page-header p {
    font-size: 0.9rem;
  }

  .users-table-container {
    overflow-x: auto;
  }

  .data-table {
    font-size: 0.85rem;
    min-width: 600px;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
    min-width: 80px;
  }

  .data-table td:last-child {
    white-space: normal;
  }

  .data-table .btn {
    width: auto;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    margin: 0.25rem 0.25rem 0.25rem 0;
  }
}

@media (max-width: 480px) {
  .users-container {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .data-table {
    font-size: 0.8rem;
    min-width: 500px;
  }

  .data-table th,
  .data-table td {
    padding: 0.4rem;
    min-width: 70px;
  }
}
</style>

