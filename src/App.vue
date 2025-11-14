<template>
  <div id="app">
    <nav v-if="showNavbar" class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <h1 class="logo">Maya Inventory</h1>
          <button class="hamburger" @click="toggleMobileMenu" :aria-expanded="mobileMenuOpen" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div v-if="mobileMenuOpen" class="mobile-menu-backdrop" @click="closeMobileMenu"></div>
        <ul class="nav-menu" :class="{ 'mobile-open': mobileMenuOpen }">
          <li><router-link to="/" @click="closeMobileMenu">Dashboard</router-link></li>
          <li><router-link to="/clients" @click="closeMobileMenu">Clients</router-link></li>
          <li><router-link to="/inventory" @click="closeMobileMenu">Inventory</router-link></li>
          <li><router-link to="/issues" @click="closeMobileMenu">Issues</router-link></li>
          <li><router-link to="/payments" @click="closeMobileMenu">Payments</router-link></li>
          <li><router-link to="/deliveries" @click="closeMobileMenu">Deliveries</router-link></li>
          <li><router-link to="/users" @click="closeMobileMenu">Users</router-link></li>
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
const mobileMenuOpen = ref(false)

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

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  authToken.value = null
  currentUser.value = null
  mobileMenuOpen.value = false
  router.push('/login')
}

// Watch for route changes to reload user if needed
watch(() => route.path, () => {
  // Update token ref from localStorage
  const token = localStorage.getItem('token')
  authToken.value = token
  
  // Close mobile menu on route change
  closeMobileMenu()
  
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
.nav-brand {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.hamburger {
  display: none;
  flex-direction: column;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  gap: 0.25rem;
  z-index: 1001;
}

.hamburger span {
  display: block;
  width: 25px;
  height: 3px;
  background-color: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger[aria-expanded="true"] span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.hamburger[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}

.hamburger[aria-expanded="true"] span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

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

/* Mobile styles */
@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }

  .mobile-menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .nav-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    max-width: 85%;
    height: 100vh;
    background-color: #2c5f7c;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 4rem 1rem 1rem;
    gap: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    overflow-y: auto;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  }

  .nav-menu.mobile-open {
    transform: translateX(0);
  }

  .nav-menu li {
    width: 100%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav-menu a {
    display: block;
    padding: 1rem;
    width: 100%;
    text-align: left;
  }

  .user-menu {
    margin-left: 0;
    margin-top: auto;
    padding-top: 1rem;
    flex-direction: column;
    gap: 1rem;
    border-top: 2px solid rgba(255, 255, 255, 0.2);
  }

  .username {
    text-align: center;
    width: 100%;
    padding: 0.5rem;
  }

  .btn-logout {
    width: 100%;
    padding: 0.75rem;
  }
}
</style>

