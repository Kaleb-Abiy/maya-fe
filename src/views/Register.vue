<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Maya Inventory</h2>
      <p class="subtitle">Admin Registration</p>
      
      <form @submit.prevent="handleRegister" class="login-form">
        <div class="form-group">
          <label>Username *</label>
          <input
            v-model="form.username"
            type="text"
            required
            placeholder="Enter username"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="Enter email (optional)"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label>Full Name</label>
          <input
            v-model="form.full_name"
            type="text"
            placeholder="Enter full name (optional)"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label>Password *</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="Enter password"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label>Confirm Password *</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            required
            placeholder="Confirm password"
            :disabled="loading"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-if="success" class="success-message">
          Registration successful! Redirecting to login...
        </div>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
        
        <div class="register-link">
          <p>Already have an account? <router-link to="/login">Login here</router-link></p>
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
  email: '',
  full_name: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = false
  
  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }
  
  // Validate password length
  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters long.'
    return
  }
  
  // Validate username
  if (!form.value.username || form.value.username.trim().length === 0) {
    error.value = 'Username is required.'
    return
  }
  
  if (form.value.username.length < 3) {
    error.value = 'Username must be at least 3 characters long.'
    return
  }
  
  // Validate email format if provided
  if (form.value.email && form.value.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.value.email)) {
      error.value = 'Please enter a valid email address.'
      return
    }
  }
  
  loading.value = true
  
  try {
    await api.post('/auth/register', {
      username: form.value.username,
      email: form.value.email || null,
      full_name: form.value.full_name || null,
      password: form.value.password
    })
    
    success.value = true
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
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
      // Handle other error formats
      else {
        error.value = errorData.message || 'Registration failed. Please check your information and try again.'
      }
    } 
    // Handle network errors
    else if (err.message) {
      if (err.message.includes('Network Error') || err.message.includes('timeout')) {
        error.value = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else {
        error.value = 'Registration failed. Please try again later.'
      }
    } 
    // Default error
    else {
      error.value = 'Registration failed. Please check your information and try again.'
    }
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
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-card h2 {
    font-size: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input {
    padding: 0.6rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }

  .login-card {
    padding: 1.5rem 1rem;
  }

  .login-card h2 {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
}
</style>

