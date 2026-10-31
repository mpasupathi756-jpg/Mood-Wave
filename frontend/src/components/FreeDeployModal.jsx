import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CheckCircle, X, Database, Globe, Server, ShieldCheck } from 'lucide-react'

export default function FreeDeployModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#151C25] border border-[#273241] max-w-2xl w-full p-6 md:p-8 max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl relative text-[#F5F7FA]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#778293] hover:text-white hover:bg-[#1B2633] transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center shadow-md">
              <Cloud size={24} />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-[#F5F7FA]">Deploy MoodWave Freely</h2>
              <p className="text-xs text-[#778293]">Production-ready zero-cost stack with high availability</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-[#A7B0BE]">
            {/* Architecture Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#10151C] border border-[#273241] space-y-1">
                <div className="flex items-center gap-2 text-[#20C997] font-semibold text-xs">
                  <Globe size={14} /> 1. FRONTEND
                </div>
                <p className="font-bold text-[#F5F7FA] text-sm">Vercel or Netlify</p>
                <p className="text-[11px] text-[#778293]">Global edge CDN, automatic HTTPS, free tier.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#10151C] border border-[#273241] space-y-1">
                <div className="flex items-center gap-2 text-[#20C997] font-semibold text-xs">
                  <Server size={14} /> 2. BACKEND API
                </div>
                <p className="font-bold text-[#F5F7FA] text-sm">Render.com</p>
                <p className="text-[11px] text-[#778293]">Web Service for Node.js + WebSockets + Socket.io.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#10151C] border border-[#273241] space-y-1">
                <div className="flex items-center gap-2 text-[#20C997] font-semibold text-xs">
                  <Database size={14} /> 3. DATABASE
                </div>
                <p className="font-bold text-[#F5F7FA] text-sm">TiDB Cloud / Aiven</p>
                <p className="text-[11px] text-[#778293]">PostgreSQL on Supabase (500MB free, auto SSL, connection pooling).</p>
              </div>
            </div>

            {/* Step-by-step breakdown */}
            <div className="space-y-3.5">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-[#10151C] border border-[#273241] space-y-2">
                <div className="flex items-center gap-2 text-[#20C997] font-semibold">
                  <CheckCircle size={16} /> Step 1: Free PostgreSQL Database (Supabase)
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#A7B0BE] pl-1">
                  <li>Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#20C997] hover:underline">supabase.com</a> and create a free project.</li>
                  <li>Go to <strong>Project Settings</strong> → <strong>Database</strong> → Copy your connection URI (Transaction Pooler).</li>
                  <li>Open the <strong>SQL Editor</strong> tab and run the script in <code className="text-[#20C997] font-mono">backend/config/schema.sql</code>.</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-[#10151C] border border-[#273241] space-y-2">
                <div className="flex items-center gap-2 text-[#20C997] font-semibold">
                  <CheckCircle size={16} /> Step 2: Deploy Backend to Render.com
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#A7B0BE] pl-1">
                  <li>Push your MoodWave repository to GitHub.</li>
                  <li>Go to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-[#20C997] hover:underline">render.com</a> → <strong>New Web Service</strong> → Connect repository.</li>
                  <li>Set Root Directory: <code className="text-[#20C997] font-mono">moodwave-main/backend</code></li>
                  <li>Set Build Command: <code className="text-[#20C997] font-mono">npm install</code></li>
                  <li>Set Start Command: <code className="text-[#20C997] font-mono">node server.js</code></li>
                </ol>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-[#10151C] border border-[#273241] space-y-2">
                <div className="flex items-center gap-2 text-[#20C997] font-semibold">
                  <CheckCircle size={16} /> Step 3: Deploy Frontend to Vercel
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#A7B0BE] pl-1">
                  <li>Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-[#20C997] hover:underline">vercel.com</a> → <strong>Add New Project</strong>.</li>
                  <li>Set Root Directory: <code className="text-[#20C997] font-mono">moodwave-main/frontend</code></li>
                  <li>Add Environment Variable: <code className="text-[#20C997] font-mono">VITE_API_URL</code> pointing to your Render backend.</li>
                  <li>Click <strong>Deploy</strong>!</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#273241]">
              <span className="text-xs text-[#778293] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#20C997]" />
                Resilient Mode: Frontend continues streaming with local fallback if backend is dormant.
              </span>
              <button
                onClick={onClose}
                className="btn-primary btn-sm px-5 font-semibold self-end sm:self-auto"
              >
                Got It
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
