import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Server, CheckCircle2, AlertCircle, X, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { getApiBaseUrl } from '../services/api'
import toast from 'react-hot-toast'

export default function ServerConfigModal({ isOpen, onClose }) {
  const [url, setUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState(null) // { ok: bool, msg: string }

  useEffect(() => {
    if (isOpen) {
      const current = localStorage.getItem('mw_api_url') || import.meta.env.VITE_API_URL || ''
      setUrl(current)
      setStatus(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTest = async () => {
    const raw = url.trim()
    if (!raw) {
      toast.error('Please enter a backend URL')
      return
    }
    let target = raw.replace(/\/+$/, '')
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target
    }
    const healthUrl = target.endsWith('/api') ? `${target}/health` : `${target}/api/health`

    setTesting(true)
    setStatus(null)
    try {
      const res = await axios.get(healthUrl, { timeout: 8000 })
      if (res.data?.ok) {
        setStatus({
          ok: true,
          msg: `Connected successfully! Runtime: ${res.data.runtime || 'Java 21 + Jakarta Servlets'}`,
        })
        toast.success('Connection verified! 🎉')
      } else {
        setStatus({ ok: false, msg: 'Server responded, but health status was not ok' })
      }
    } catch (err) {
      setStatus({
        ok: false,
        msg: err.response
          ? `Server error (${err.response.status}): ${err.response.statusText}`
          : `Unreachable: ${err.message}. Is your Render backend deployed and active?`,
      })
      toast.error('Could not reach backend')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    let clean = url.trim().replace(/\/+$/, '')
    if (clean) {
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean
      }
      if (!clean.endsWith('/api')) clean = clean + '/api'
      localStorage.setItem('mw_api_url', clean)
      toast.success('Backend URL saved!')
    } else {
      localStorage.removeItem('mw_api_url')
      toast.success('Reset to default /api')
    }
    onClose()
    // Reload to re-initialize stores with new URL
    setTimeout(() => {
      window.location.reload()
    }, 300)
  }

  const handleReset = () => {
    localStorage.removeItem('mw_api_url')
    setUrl('')
    setStatus(null)
    toast.success('Reset to default')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#151C25] border border-[#273241] max-w-lg w-full p-6 rounded-2xl shadow-2xl relative text-[#F5F7FA] space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#778293] hover:text-white hover:bg-[#1B2633] transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center">
              <Server size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#F5F7FA]">Backend Connection Settings</h2>
              <p className="text-xs text-[#778293]">Connect this frontend to your deployed Java backend</p>
            </div>
          </div>

          {/* Info note */}
          <div className="p-3 rounded-xl bg-[#10151C] border border-[#273241] text-xs text-[#A7B0BE] space-y-1.5">
            <p>
              When hosting on Vercel, enter your <strong>Render Web Service URL</strong> below so the app knows where to authenticate and fetch songs from Supabase.
            </p>
            <p className="text-[#778293] font-mono text-[11px]">
              Example: <span className="text-[#20C997]">https://moodwave-backend.onrender.com</span>
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider">
              Backend API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://your-service.onrender.com"
                className="input flex-1 h-10 text-xs bg-[#10151C] border-[#273241] text-[#F5F7FA] focus:border-[#20C997]"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !url.trim()}
                className="btn-ghost btn-sm h-10 px-3 text-xs flex items-center gap-1.5 font-semibold border border-[#273241] hover:border-[#20C997]"
              >
                {testing ? <Loader2 size={13} className="animate-spin text-[#20C997]" /> : <RefreshCw size={13} />}
                Test
              </button>
            </div>
          </div>

          {/* Test Status feedback */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                status.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-[#20C997]'
                  : 'bg-red-500/10 border-red-500/30 text-[#F87171]'
              }`}
            >
              {status.ok ? (
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{status.msg}</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#273241]">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#778293] hover:text-[#F5F7FA] underline transition-colors"
            >
              Reset to Default
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost btn-sm text-xs px-4">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary btn-sm text-xs px-5 font-semibold shadow-md shadow-emerald-500/20"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

