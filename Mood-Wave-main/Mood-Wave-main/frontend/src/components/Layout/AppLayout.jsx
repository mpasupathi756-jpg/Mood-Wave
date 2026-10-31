import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Search, Library, User, Radio, Headphones,
  Music2, LogOut, Shield, ChevronLeft, ChevronRight,
  Keyboard, X
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Player from '../Player/Player'
import usePlayerStore from '../../store/playerStore'

const NAV = [
  { to: '/',        icon: Home,       label: 'Home',           end: true },
  { to: '/search',  icon: Search,     label: 'Search' },
  { to: '/library', icon: Library,    label: 'Library' },
  { to: '/room',    icon: Radio,      label: 'Listen Together' },
  { to: '/now',     icon: Headphones, label: 'Now Playing' },
  { to: '/profile', icon: User,       label: 'Profile' },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in form inputs
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return
      }

      const store = usePlayerStore.getState()

      if (e.code === 'Space') {
        e.preventDefault()
        store.toggle()
      } else if (e.key === 'n' || e.key === 'N' || (e.shiftKey && e.key === 'ArrowRight')) {
        e.preventDefault()
        store.next()
      } else if (e.key === 'p' || e.key === 'P' || (e.shiftKey && e.key === 'ArrowLeft')) {
        e.preventDefault()
        store.prev()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        store.toggleMute?.()
      } else if (e.key === 'l' || e.key === 'L') {
        if (store.song) {
          e.preventDefault()
          store.toggleLike(store.song)
        }
      } else if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts(s => !s)
      } else if (e.key === 'Escape') {
        setShowShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F14] text-[#F5F7FA] relative selection:bg-emerald-500/20 selection:text-white">
      {/* Subtle Ambient Radial Highlight */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 25% 15%, rgba(32, 201, 151, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(27, 38, 51, 0.4) 0%, transparent 60%)'
        }}
      />

      {/* Sidebar (Desktop & Tablet) */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-shrink-0 bg-[#10151C] border-r border-[#273241] flex-col relative z-20 h-screen select-none"
      >
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#273241] h-18 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#20C997] text-[#0B0F14] shadow-md shadow-emerald-500/20">
            <Music2 size={19} className="stroke-[2.5]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="overflow-hidden"
              >
                <span className="font-display font-bold text-lg tracking-tight text-[#F5F7FA] whitespace-nowrap">
                  Mood<span className="text-[#20C997]">Wave</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <Shield size={18} className="flex-shrink-0 text-amber-400" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Admin Panel
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )}
        </nav>

        {/* Footer: User Details + Shortcuts + Sign Out */}
        <div className="border-t border-[#273241] p-3 flex-shrink-0 bg-[#0E1319]">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 mb-2 rounded-xl bg-[#151C25] border border-[#273241]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 text-white"
                style={{ background: user?.avatar_color || '#20C997' }}
              >
                {user?.username?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-[#F5F7FA]">{user?.username || 'User'}</p>
                <p className="text-[11px] text-[#778293] capitalize">
                  {user?.isGuest ? 'Guest Mode' : user?.role || 'Listener'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowShortcuts(true)}
            className={`nav-link w-full text-[#A7B0BE] hover:text-[#F5F7FA] hover:bg-[#1B2633] mb-1 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? 'Shortcuts (?)' : undefined}
          >
            <Keyboard size={16} className="flex-shrink-0 text-[#778293]" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between flex-1 text-xs">
                  <span>Shortcuts</span>
                  <kbd className="text-[10px] bg-[#1B2633] border border-[#273241] px-1.5 py-0.5 rounded text-[#A7B0BE] font-mono">?</kbd>
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className={`nav-link w-full text-[#F87171] hover:text-white hover:bg-rose-500/10 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#151C25] border border-[#273241] flex items-center justify-center text-[#A7B0BE] hover:text-white transition-colors z-30 shadow-md"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-28 md:pb-24">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Bottom Floating/Fixed Player */}
        <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30">
          <Player />
        </div>

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#10151C] border-t border-[#273241] flex items-center justify-around z-40 px-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#20C997] font-semibold scale-105' : 'text-[#778293] hover:text-[#A7B0BE]'
                }`
              }
            >
              <Icon size={17} />
              <span className="mt-0.5 truncate max-w-[50px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#151C25] border border-[#273241] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#F5F7FA]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#273241]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#20C997]">
                    <Keyboard size={16} />
                  </div>
                  <h3 className="font-display font-bold text-base text-[#F5F7FA]">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-1.5 rounded-lg text-[#778293] hover:text-white hover:bg-[#1B2633] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { keys: ['Space'], desc: 'Play / Pause playback' },
                  { keys: ['N', 'Shift + →'], desc: 'Next track' },
                  { keys: ['P', 'Shift + ←'], desc: 'Previous track' },
                  { keys: ['M'], desc: 'Mute / Unmute audio' },
                  { keys: ['L'], desc: 'Like current playing song' },
                  { keys: ['?'], desc: 'Toggle this shortcuts modal' },
                  { keys: ['Esc'], desc: 'Close dialogs' },
                ].map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg hover:bg-[#1B2633] transition-colors">
                    <span className="text-[#A7B0BE]">{desc}</span>
                    <div className="flex items-center gap-1.5">
                      {keys.map(k => (
                        <kbd key={k} className="px-2 py-0.5 rounded bg-[#10151C] border border-[#273241] text-[11px] font-mono font-medium text-[#20C997] shadow-sm">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] text-[#778293] text-center">
                Hardware media keys & OS lock screen controls are also active.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
