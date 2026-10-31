import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music2, Eye, EyeOff, Loader, Lock, Mail, Sparkles, Shield, User, ArrowRight, Server, WifiOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import ServerConfigModal from '../components/ServerConfigModal'
import { getApiBaseUrl } from '../services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [showServerModal, setShowServerModal] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const { login, loginGuest }   = useAuthStore()
  const navigate                = useNavigate()

  const currentBackend = getApiBaseUrl()

  const submit = async (e, customEmail, customPassword) => {
    if (e?.preventDefault) e.preventDefault()
    setLoading(true)
    setNetworkError(false)
    const targetEmail = customEmail || email.trim()
    const targetPassword = customPassword || password

    try {
      const user = await login(targetEmail, targetPassword)
      toast.success(`Welcome back, ${user.username}! 🎵`)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      const isNetErr = !err.response || err.message?.includes('Network Error') || err.code === 'ERR_NETWORK' || err.response?.status === 405
      if (isNetErr) {
        setNetworkError(true)
        toast.error('Cannot connect to backend server. Configure server URL below.', { duration: 5000 })
      } else {
        toast.error(err.response?.data?.msg || err.message || 'Login failed. Check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    const guest = loginGuest()
    toast.success(`Welcome ${guest.username}! Exploring in guest mode 🎧`)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle radial emerald background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1B2633]/60 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#20C997] text-[#0B0F14] flex items-center justify-center shadow-md shadow-emerald-500/20 mx-auto mb-3">
              <Music2 size={26} className="stroke-[2.5]" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#F5F7FA]">
              Mood<span className="text-[#20C997]">Wave</span>
            </h1>
            <p className="text-[#778293] text-sm">Professional audio tuned to your emotional frequency</p>
            
            {/* Backend connection pill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowServerModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#10151C] hover:bg-[#1B2633] border border-[#273241] hover:border-[#20C997] text-[#778293] hover:text-[#20C997] transition-all"
              >
                <Server size={11} className="text-[#20C997]" />
                <span className="truncate max-w-[200px]">Server: {currentBackend.replace('/api', '') || 'local'}</span>
                <span className="text-[10px] text-[#A7B0BE]">(configure)</span>
              </button>
            </div>
          </div>

          {/* Network Error alert banner */}
          {networkError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-[#F87171] space-y-2"
            >
              <div className="flex items-center gap-2 font-semibold">
                <WifiOff size={15} /> Backend Unreachable
              </div>
              <p className="text-[11px] text-[#A7B0BE]">
                The frontend could not reach your backend at <code className="text-[#F5F7FA]">{currentBackend}</code>.
              </p>
              <button
                type="button"
                onClick={() => setShowServerModal(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs text-[#F5F7FA] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Server size={12} /> Set Render Backend URL
              </button>
            </motion.div>
          )}

          {/* Quick 1-Click Access Pill */}
          <div className="p-3.5 rounded-xl bg-[#10151C] border border-[#273241] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#20C997] uppercase tracking-wider">
              <Sparkles size={13} /> Quick 1-Click Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(null, 'demo@moodwave.com', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#151C25] hover:bg-[#1B2633] border border-[#273241] text-xs font-medium text-[#F5F7FA] transition-all"
              >
                <User size={13} className="text-[#20C997]" /> Demo User
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => submit(null, 'admin@moodwave.com', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#151C25] hover:bg-[#1B2633] border border-[#273241] text-xs font-medium text-[#F5F7FA] transition-all"
              >
                <Shield size={13} className="text-[#F59E0B]" /> Admin Demo
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A7B0BE] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778293]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10 h-11 text-sm bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778293]" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10 h-11 text-sm bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778293] hover:text-[#F5F7FA] transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 h-11 text-sm font-semibold shadow-md shadow-emerald-500/20"
            >
              {loading ? <Loader size={16} className="animate-spin text-[#0B0F14]" /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Guest Mode Option */}
          <div className="pt-2 border-t border-[#273241] text-center">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#A7B0BE] hover:text-[#F5F7FA] bg-[#10151C] hover:bg-[#1B2633] border border-[#273241] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Instant Guest Mode — Listen without sign in</span>
              <ArrowRight size={14} className="text-[#20C997]" />
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center text-xs text-[#778293]">
            New to MoodWave?{' '}
            <Link to="/register" className="text-[#20C997] hover:text-[#16A87A] font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>

      <ServerConfigModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
      />
    </div>
  )
}
