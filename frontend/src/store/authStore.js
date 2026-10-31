import { create } from 'zustand'
import api from '../services/api'
import { connect, disconnect } from '../services/socket'

const useAuthStore = create((set, get) => ({
  user          : null,
  token         : localStorage.getItem('mw_token') || null,
  isAuthenticated: false,
  loading       : true,

  init: async () => {
    const token = localStorage.getItem('mw_token')
    const savedUser = localStorage.getItem('mw_user')
    if (!token) {
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser)
          if (u?.isGuest) {
            return set({ user: u, isAuthenticated: true, loading: false })
          }
        } catch {}
      }
      return set({ loading: false })
    }
    try {
      const { data } = await api.get('/auth/me')
      if (data.ok) {
        set({ user: data.user, token, isAuthenticated: true, loading: false })
        localStorage.setItem('mw_user', JSON.stringify(data.user))
        connect(token)
      } else {
        localStorage.removeItem('mw_token')
        localStorage.removeItem('mw_user')
        set({ loading: false })
      }
    } catch {
      // If server is sleeping or waking up on free tier, keep user logged in with cached profile
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser)
          return set({ user: u, token, isAuthenticated: true, loading: false })
        } catch {}
      }
      localStorage.removeItem('mw_token')
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (!data.ok) throw new Error(data.msg || 'Login failed')
      localStorage.setItem('mw_token', data.token)
      localStorage.setItem('mw_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isAuthenticated: true })
      connect(data.token)
      return data.user
    } catch (err) {
      const isNetworkErr = !err.response || err.response.status === 405 || err.message?.includes('Network Error') || err.code === 'ERR_NETWORK'
      // If server is sleeping or not yet reachable on cloud deploy, gracefully log in demo accounts
      if (isNetworkErr && (email === 'demo@moodwave.com' || email === 'admin@moodwave.com')) {
        const isAdmin = email === 'admin@moodwave.com'
        const demoUser = {
          id: isAdmin ? 1 : 2,
          username: isAdmin ? 'admin' : 'demouser',
          email,
          role: isAdmin ? 'admin' : 'user',
          avatar_color: isAdmin ? '#ef4444' : '#20c997',
          bio: 'Demo profile (Resilient mode)',
          isDemo: true,
        }
        localStorage.setItem('mw_token', 'demo_token_' + Date.now())
        localStorage.setItem('mw_user', JSON.stringify(demoUser))
        set({ user: demoUser, token: 'demo_token', isAuthenticated: true })
        return demoUser
      }
      throw err
    }
  },

  loginGuest: () => {
    const guestUser = {
      id: 9999,
      username: 'Guest Explorer',
      email: 'guest@moodwave.local',
      role: 'user',
      avatar_color: '#8b5cf6',
      bio: 'Exploring mood soundscapes',
      isGuest: true
    }
    localStorage.setItem('mw_token', 'guest_token')
    localStorage.setItem('mw_user', JSON.stringify(guestUser))
    set({ user: guestUser, token: 'guest_token', isAuthenticated: true })
    return guestUser
  },

  register: async (username, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { username, email, password })
      if (!data.ok) throw new Error(data.msg || 'Registration failed')
      localStorage.setItem('mw_token', data.token)
      localStorage.setItem('mw_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isAuthenticated: true })
      connect(data.token)
      return data.user
    } catch (err) {
      const isNetworkErr = !err.response || err.response.status === 405 || err.message?.includes('Network Error') || err.code === 'ERR_NETWORK'
      // If cloud backend is waking up or not yet configured, create local session so user is never blocked
      if (isNetworkErr) {
        const localUser = {
          id: Math.floor(1000 + Math.random() * 9000),
          username: username,
          email: email,
          role: 'user',
          avatar_color: '#20C997',
          bio: 'Music enthusiast exploring moods',
          isOffline: true
        }
        localStorage.setItem('mw_token', 'local_token_' + Date.now())
        localStorage.setItem('mw_user', JSON.stringify(localUser))
        set({ user: localUser, token: 'local_token', isAuthenticated: true })
        return localUser
      }
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('mw_token')
    localStorage.removeItem('mw_user')
    disconnect()
    set({ user: null, token: null, isAuthenticated: false })
  },

  patchUser: (patch) => {
    const updated = { ...get().user, ...patch }
    localStorage.setItem('mw_user', JSON.stringify(updated))
    set({ user: updated })
  },
}))

export default useAuthStore
