import axios from 'axios'

export const getApiBaseUrl = () => {
  // 1. Manually configured backend URL in browser storage (works immediately on Vercel without redeploying!)
  const userUrl = typeof window !== 'undefined' ? localStorage.getItem('mw_api_url') : null
  if (userUrl && userUrl.trim()) {
    let clean = userUrl.trim().replace(/\/+$/, '')
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean
    }
    // If user entered root URL e.g. https://xyz.onrender.com, ensure /api is appended if needed
    if (!clean.endsWith('/api')) {
      clean = clean + '/api'
    }
    return clean
  }

  // 2. Vite environment variable set at build time in Vercel
  if (import.meta.env.VITE_API_URL) {
    let clean = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '')
    return clean
  }

  // 3. Fallback: relative path (for local dev Vite proxy)
  return '/api'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  cfg.baseURL = getApiBaseUrl()
  const token = localStorage.getItem('mw_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('mw_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
