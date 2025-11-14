<template>
  <div id="app">
    <nav v-if="showNavbar" class="navbar">
      <div class="nav-container">
        <h1 class="logo">Maya Inventory</h1>
        <ul class="nav-menu">
          <li><router-link to="/">Dashboard</router-link></li>
          <li><router-link to="/clients">Clients</router-link></li>
          <li><router-link to="/inventory">Inventory</router-link></li>
          <li><router-link to="/issues">Issues</router-link></li>
          <li><router-link to="/payments">Payments</router-link></li>
          <li><router-link to="/deliveries">Deliveries</router-link></li>
          <li class="user-menu">
            <span class="username">{{ currentUser?.username || 'Admin' }}</span>
            <button @click="handleLogout" class="btn-logout">Logout</button>
          </li>
        </ul>
      </div>
    </nav>
    <main class="main-content" :class="{ 'no-nav': !showNavbar }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from './services/api'

const router = useRouter()
const route = useRoute()
const currentUser = ref(null)
const authToken = ref(localStorage.getItem('token'))

const isAuthenticated = computed(() => {
  return !!authToken.value
})

const showNavbar = computed(() => {
  return isAuthenticated.value && route.path !== '/login' && route.path !== '/register'
})

const loadUser = async () => {
  // Update token ref from localStorage
  authToken.value = localStorage.getItem('token')
  const token = authToken.value
  
  if (token) {
    try {
      const response = await api.get('/users/me')
      currentUser.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (error) {
      // Token might be invalid, clear it
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      authToken.value = null
      currentUser.value = null
      if (route.path !== '/login' && route.path !== '/register') {
        router.push('/login')
      }
    }
  } else {
    authToken.value = null
    currentUser.value = null
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  authToken.value = null
  currentUser.value = null
  router.push('/login')
}

// Watch for route changes to reload user if needed
watch(() => route.path, () => {
  // Update token ref from localStorage
  const token = localStorage.getItem('token')
  authToken.value = token
  
  if (token && !currentUser.value) {
    loadUser()
  } else if (!token) {
    currentUser.value = null
  }
}, { immediate: true })

// Listen for storage events (when login happens in another tab/window)
window.addEventListener('storage', (e) => {
  if (e.key === 'token') {
    authToken.value = e.newValue
    if (e.newValue && !currentUser.value) {
      loadUser()
    } else if (!e.newValue) {
      currentUser.value = null
    }
  }
})

onMounted(() => {
  loadUser()
  const userStr = localStorage.getItem('user')
  if (userStr && isAuthenticated.value) {
    try {
      currentUser.value = JSON.parse(userStr)
    } catch (e) {
      currentUser.value = null
    }
  }
})
</script>

<style scoped>
.user-menu {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  color: white;
  font-size: 0.9rem;
}

.btn-logout {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.main-content.no-nav {
  margin-top: 0;
}
</style>

