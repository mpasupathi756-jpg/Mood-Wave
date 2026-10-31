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
    const { data } = await api.post('/auth/login', { email, password })
    if (!data.ok) throw new Error(data.msg || 'Login failed')
    localStorage.setItem('mw_token', data.token)
    localStorage.setItem('mw_user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token, isAuthenticated: true })
    connect(data.token)
    return data.user
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
    const { data } = await api.post('/auth/register', { username, email, password })
    if (!data.ok) throw new Error(data.msg || 'Registration failed')
    localStorage.setItem('mw_token', data.token)
    localStorage.setItem('mw_user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token, isAuthenticated: true })
    connect(data.token)
    return data.user
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
