import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Clients from '../views/Clients.vue'
import Inventory from '../views/Inventory.vue'
import Issues from '../views/Issues.vue'
import Payments from '../views/Payments.vue'
import Deliveries from '../views/Deliveries.vue'
import Users from '../views/Users.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { 
    path: '/', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/clients', 
    name: 'Clients', 
    component: Clients,
    meta: { requiresAuth: true }
  },
  { 
    path: '/inventory', 
    name: 'Inventory', 
    component: Inventory,
    meta: { requiresAuth: true }
  },
  { 
    path: '/issues', 
    name: 'Issues', 
    component: Issues,
    meta: { requiresAuth: true }
  },
  { 
    path: '/payments', 
    name: 'Payments', 
    component: Payments,
    meta: { requiresAuth: true }
  },
  { 
    path: '/deliveries', 
    name: 'Deliveries', 
    component: Deliveries,
    meta: { requiresAuth: true }
  },
  { 
    path: '/users', 
    name: 'Users', 
    component: Users,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth && !token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/')
  } else {
    next()
  }
})

export default router

