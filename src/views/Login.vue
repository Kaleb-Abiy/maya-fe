<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Maya Inventory</h2>
      <p class="subtitle">Admin Login</p>
      
      <form @submit.prevent="handleLogin" class="login-form" novalidate>
        <div class="form-group">
          <label>Username</label>
          <input
            v-model="form.username"
            type="text"
            required
            placeholder="Enter your username"
            :disabled="loading"
            :class="{ error: error }"
            @focus="error = ''"
            @input="error = ''"
          />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
            :class="{ error: error }"
            @focus="error = ''"
            @input="error = ''"
          />
        </div>
        
        <div v-if="error" class="error-message" role="alert">
          <strong>⚠️</strong> {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <div class="register-link">
          <p>Don't have an account? <router-link to="/register">Register here</router-link></p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

const form = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  // Clear previous error
  error.value = ''
  
  // Validate inputs first (client-side validation)
  if (!form.value.username || form.value.username.trim().length === 0) {
    error.value = 'Please enter your username.'
    return
  }
  
  if (!form.value.password || form.value.password.length === 0) {
    error.value = 'Please enter your password.'
    return
  }
  
  // Set loading state
  loading.value = true
  
  try {
    const response = await api.post('/auth/login-json', {
      username: form.value.username.trim(),
      password: form.value.password
    })
    
    // Store token
    localStorage.setItem('token', response.data.access_token)
    
    // Fetch user info
    const userResponse = await api.get('/users/me')
    localStorage.setItem('user', JSON.stringify(userResponse.data))
    
    // Clear password field for security (but keep username)
    form.value.password = ''
    
    // Trigger a custom event to notify App.vue about the login
    window.dispatchEvent(new Event('storage'))
    
    // Small delay to ensure state updates, then redirect
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Redirect to dashboard
    router.push('/')
  } catch (err) {
    // Handle different error formats
    if (err.response?.data) {
      const errorData = err.response.data
      
      // Handle validation errors (array format)
      if (Array.isArray(errorData.detail)) {
        const errorMessages = errorData.detail.map(e => {
          const field = e.loc ? e.loc.join(' ') : 'field'
          return `${field}: ${e.msg}`
        })
        error.value = errorMessages.join('. ')
      } 
      // Handle string error messages
      else if (typeof errorData.detail === 'string') {
        error.value = errorData.detail
      }
      // Handle status code specific errors
      else if (err.response.status === 401) {
        error.value = 'Invalid username or password. Please check your credentials and try again.'
      } else if (err.response.status === 403) {
        error.value = errorData.detail || 'Your account has been deactivated. Please contact an administrator.'
      } else {
        error.value = errorData.message || 'Login failed. Please try again.'
      }
    } 
    // Handle network errors
    else if (err.message) {
      if (err.message.includes('Network Error') || err.message.includes('timeout')) {
        error.value = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else {
        error.value = 'Login failed. Please try again later.'
      }
    } 
    // Default error
    else {
      error.value = 'Invalid username or password. Please check your credentials and try again.'
    }
    
    // Clear password field on error for security, but keep username
    form.value.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 8px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-card h2 {
  color: #2c5f7c;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.login-form {
  margin-top: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #2c5f7c;
}

.form-group input.error {
  border-color: #dc3545;
  border-width: 2px;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border-left: 4px solid #dc3545;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-block {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-top: 1rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.register-link a {
  color: #2c5f7c;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>

