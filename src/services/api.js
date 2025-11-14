import axios from 'axios'

// Use environment variable for API URL in production, or proxy path in development
const getBaseURL = () => {
  // In production, use the full API URL from environment
  if (import.meta.env.VITE_API_URL) {
    // Ensure it ends with /api/v1
    const apiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '')
    return `${apiUrl}/api/v1`
  }
  // In development, use proxy path (Vite will proxy to backend)
  return '/api/v1'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses - redirect to login (but not for login/register endpoints)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login/register page or if it's a login/register request
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register')
      const isOnAuthPage = window.location.pathname === '/login' || 
                          window.location.pathname === '/register'
      
      // Only redirect if it's not an auth endpoint and we're not on auth page
      if (!isAuthEndpoint && !isOnAuthPage) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

