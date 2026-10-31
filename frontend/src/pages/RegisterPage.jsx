import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music2, Loader, User, Mail, Lock } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const up = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (f.password !== f.confirm) { toast.error('Passwords do not match'); return }
    if (f.password.length < 6)   { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(f.username.trim(), f.email.trim(), f.password)
      toast.success('Account created! Welcome to MoodWave 🎵')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const fields = [
    { key: 'username', label: 'Username',         type: 'text',     icon: User, placeholder: 'yourname' },
    { key: 'email',    label: 'Email',             type: 'email',    icon: Mail, placeholder: 'you@example.com' },
    { key: 'password', label: 'Password',          type: 'password', icon: Lock, placeholder: '••••••••' },
    { key: 'confirm',  label: 'Confirm Password',  type: 'password', icon: Lock, placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#20C997] text-[#0B0F14] flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/20">
              <Music2 size={26} className="stroke-[2.5]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#F5F7FA]">Create Account</h1>
            <p className="text-[#778293] text-sm">Join the MoodWave listening community</p>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {fields.map(({ key, label, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-[#A7B0BE] mb-1.5 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778293]" />
                  <input
                    type={type}
                    value={f[key]}
                    onChange={up(key)}
                    className="input pl-10 text-sm bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                    placeholder={placeholder}
                    required
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-3 font-semibold shadow-md shadow-emerald-500/20">
              {loading ? <Loader size={16} className="animate-spin text-[#0B0F14]" /> : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-[#778293]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#20C997] hover:text-[#16A87A] font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
