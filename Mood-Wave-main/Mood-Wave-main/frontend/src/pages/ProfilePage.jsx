import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Key, Save, Loader, Palette, Check, Headphones, Sparkles, Shield, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'

const AVATAR_PALETTE = [
  '#20C997', // Emerald Primary
  '#0EA5E9', // Sky Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#10B981', // Mint
  '#64748B', // Slate
  '#1E293B', // Dark Charcoal
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, patchUser, logout } = useAuthStore()
  const [username, setUsername]   = useState(user?.username || '')
  const [bio, setBio]             = useState(user?.bio || '')
  const [color, setColor]         = useState(user?.avatar_color || '#20C997')
  const [saving, setSaving]       = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [pw, setPw]               = useState({ current: '', new: '', confirm: '' })
  const [stats, setStats]         = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/songs/history').catch(() => ({ data: { history: [] } })),
      api.get('/mood/stats').catch(() => ({ data: { distribution: [] } })),
    ]).then(([h, m]) => {
      setStats({
        plays: h.data.history?.length || 0,
        moods: m.data.distribution || [],
      })
    }).catch(() => {})
  }, [])

  const saveProfile = async (e) => {
    e?.preventDefault()
    if (!username.trim()) {
      toast.error('Username cannot be empty')
      return
    }
    setSaving(true)
    try {
      if (user?.isGuest) {
        // Guest profiles are saved locally in browser storage
        patchUser({ username: username.trim(), bio: bio.trim(), avatar_color: color })
        toast.success('Guest profile updated locally!')
        return
      }
      await api.put('/auth/profile', { username: username.trim(), bio: bio.trim(), avatar_color: color })
      patchUser({ username: username.trim(), bio: bio.trim(), avatar_color: color })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const changePw = async (e) => {
    e?.preventDefault()
    if (!pw.current) {
      toast.error('Current password is required')
      return
    }
    if (pw.new !== pw.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (pw.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSavingPw(true)
    try {
      await api.put('/auth/password', { currentPassword: pw.current, newPassword: pw.new })
      toast.success('Password changed successfully!')
      setPw({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Incorrect current password')
    } finally {
      setSavingPw(false)
    }
  }

  const topMood = stats?.moods?.[0]?.mood
  const totalMoodEvents = stats?.moods?.reduce((acc, m) => acc + m.count, 0) || 0

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F5F7FA]">Account & Profile</h1>
          <p className="text-[#778293] text-sm mt-0.5">Manage your listener identity, security, and streaming preferences</p>
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="btn-danger flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-transform hover:scale-105 active:scale-95"
          title="Sign out of MoodWave"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 1. Profile Summary Card */}
      <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Dynamic Avatar */}
            <motion.div
              animate={{ backgroundColor: color }}
              className="w-18 h-18 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl font-bold uppercase flex-shrink-0 text-white shadow-md border border-[#273241]"
              style={{ background: color }}
            >
              {username?.[0] || 'U'}
            </motion.div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-[#F5F7FA] truncate">{username || 'User'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] capitalize">
                  <Shield size={11} /> {user?.role || 'Listener'}
                </span>
              </div>
              <p className="text-xs text-[#778293] truncate">{user?.email || 'listener@moodwave.io'}</p>
              {bio && (
                <p className="text-xs text-[#A7B0BE] line-clamp-2 mt-1.5 pt-1 border-t border-[#273241]/60">
                  {bio}
                </p>
              )}
            </div>
          </div>

          {/* Statistics Block */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-around sm:justify-end border-t sm:border-t-0 sm:border-l border-[#273241] pt-4 sm:pt-0 sm:pl-6">
            <div className="bg-[#1B2633] border border-[#273241] rounded-xl px-4 py-2.5 text-center min-w-[85px]">
              <p className="font-display font-bold text-lg text-[#20C997] tabular-nums font-mono">{stats ? stats.plays : '—'}</p>
              <p className="text-[11px] text-[#778293] uppercase tracking-wider font-medium">Plays</p>
            </div>
            <div className="bg-[#1B2633] border border-[#273241] rounded-xl px-4 py-2.5 text-center min-w-[85px]">
              <p className="font-display font-bold text-lg text-[#F5F7FA] tabular-nums font-mono">{totalMoodEvents}</p>
              <p className="text-[11px] text-[#778293] uppercase tracking-wider font-medium">Moods</p>
            </div>
          </div>
        </div>

        {topMood && (
          <div className="mt-4 pt-3 border-t border-[#273241] flex items-center gap-2 text-xs text-[#A7B0BE]">
            <Sparkles size={13} className="text-[#20C997]" />
            <span>Dominant Emotional Signature: <strong className="text-[#F5F7FA] capitalize">{topMood}</strong></span>
          </div>
        )}
      </div>

      {/* 2. Edit Profile Form */}
      <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#273241]">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center">
            <User size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[#F5F7FA]">Edit Listener Details</h3>
            <p className="text-xs text-[#778293]">Update your display name, bio, and avatar color</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your display name"
              required
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
              Listener Bio
            </label>
            <textarea
              className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA] resize-none h-24 text-sm"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell other listeners about your musical tastes or creative pursuits..."
              maxLength={280}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[11px] text-[#778293] font-mono">{bio.length}/280</span>
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-2.5">
              <Palette size={13} className="inline mr-1 text-[#20C997]" /> Avatar Accent Color
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {AVATAR_PALETTE.map(c => {
                const isSelected = color.toLowerCase() === c.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-9 h-9 rounded-full transition-all flex items-center justify-center relative ${
                      isSelected ? 'ring-2 ring-white scale-110 shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ background: c }}
                    title={c}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow-md stroke-[3]" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 font-semibold"
            >
              {saving ? <Loader size={15} className="animate-spin text-[#0B0F14]" /> : <Save size={15} />}
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* 3. Change Password Security Form */}
      {!user?.isGuest ? (
        <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#273241]">
            <div className="w-8 h-8 rounded-lg bg-[#1B2633] border border-[#273241] text-[#A7B0BE] flex items-center justify-center">
              <Key size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#F5F7FA]">Security & Password</h3>
              <p className="text-xs text-[#778293]">Ensure your account remains safe with a strong passphrase</p>
            </div>
          </div>

          <form onSubmit={changePw} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                value={pw.new}
                onChange={e => setPw(p => ({ ...p, new: e.target.value }))}
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                Confirm New
              </label>
              <input
                type="password"
                className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPw || !pw.current || !pw.new}
              className="btn-secondary flex items-center gap-2 font-medium"
            >
              {savingPw ? <Loader size={15} className="animate-spin text-white" /> : <Key size={15} />}
              Update Password
            </button>
          </div>
        </form>
      </div>
      ) : (
        <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 text-sm text-[#A7B0BE]">
          <p className="font-semibold text-[#F5F7FA] mb-1">Guest Session</p>
          <p className="text-xs text-[#778293]">
            You are browsing as a guest. Your profile edits are saved locally. Register or log in to sync your library, save playlists permanently in the cloud, and manage account security.
          </p>
        </div>
      )}
    </div>
  )
}
