import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Plus, Send, Copy, LogOut, Loader, Lock, Crown, Music, Play, Pause, Users, Sparkles, Volume2, Globe } from 'lucide-react'
import { connect, getSocket } from '../services/socket'
import { fetchByMood } from '../services/jamendo'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import usePlayerStore from '../store/playerStore'
import toast from 'react-hot-toast'

const REACTIONS = ['🔥','❤️','😂','😮','👏','🎵','✨','🤘']
const MOODS     = ['happy','calm','energetic','sad','romantic','focused','party','workout','sleepy','angry']

function Avatar({ username, color, size = 8 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 text-white shadow-sm border border-[#273241]"
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        background: color || '#20C997'
      }}
      title={username}
    >
      {username?.[0] || '?'}
    </div>
  )
}

/* ── LOBBY WITH "LISTEN TO OTHER" OPTION ─────────────────────────── */
function Lobby({ onCreate, onJoin, joining }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [priv, setPriv] = useState(false)
  const [pw,   setPw]   = useState('')
  const [tab,  setTab]  = useState('browse') // 'browse' (Listen to Other), 'create', 'join'
  const [publicRooms, setPublicRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Fetch active public rooms for "Listen to Other"
  useEffect(() => {
    let mounted = true
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms/all')
        if (mounted && res.data?.rooms) {
          setPublicRooms(res.data.rooms)
        }
      } catch (err) {
        // Fallback or empty
      } finally {
        if (mounted) setLoadingRooms(false)
      }
    }
    fetchRooms()
    const timer = setInterval(fetchRooms, 5000)
    return () => { mounted = false; clearInterval(timer) }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[82vh] p-4 md:p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <Radio size={28} className="animate-pulse" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#F5F7FA]">Listen Together</h1>
          <p className="text-[#778293] mt-1.5 text-sm max-w-md mx-auto">
            Connect with 3 or more friends and listen to songs in real-time synchronized playback.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-[#10151C] border border-[#273241] rounded-xl p-1 shadow-inner">
          {[
            { id: 'browse', label: '🎧 Listen to Others', icon: Globe },
            { id: 'create', label: '+ Create Party', icon: Plus },
            { id: 'join',   label: 'Join Code', icon: Radio },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${
                tab === t.id ? 'bg-[#20C997] text-[#0B0F14] shadow-md font-bold' : 'text-[#778293] hover:text-[#F5F7FA]'
              }`}
            >
              <t.icon size={15} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Action Card */}
        <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          {tab === 'browse' ? (
            /* Option: Listen to Other (Browse Active Parties) */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#273241]">
                <div>
                  <h3 className="font-semibold text-sm text-[#F5F7FA]">Live Listening Rooms</h3>
                  <p className="text-[11px] text-[#778293]">Jump into an active session and listen along</p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#20C997] border border-emerald-500/20 font-mono">
                  {publicRooms.length} Active
                </span>
              </div>

              {loadingRooms ? (
                <div className="flex items-center justify-center py-10 gap-2 text-xs text-[#778293]">
                  <Loader size={18} className="animate-spin text-[#20C997]" /> Discovering live rooms...
                </div>
              ) : publicRooms.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#10151C] flex items-center justify-center mx-auto text-[#778293]">
                    <Users size={20} />
                  </div>
                  <p className="text-xs text-[#A7B0BE]">No active rooms right now.</p>
                  <button
                    onClick={() => setTab('create')}
                    className="btn-primary text-xs py-2 px-4 mx-auto"
                  >
                    Be the first to create one!
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {publicRooms.map(r => (
                    <div
                      key={r.code}
                      className="p-3.5 rounded-xl bg-[#10151C] border border-[#273241] hover:border-[#20C997]/50 flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#F5F7FA] truncate group-hover:text-[#20C997] transition-colors">
                            {r.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#151C25] text-[#A7B0BE] border border-[#273241]">
                            {r.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#778293]">
                          <span>Host: <strong className="text-[#A7B0BE] font-medium">{r.hostUsername || 'Admin'}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#20C997]">
                            <Users size={12} /> {r.members?.length || 1}+ users connected
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onJoin(r.code, '')}
                        disabled={joining}
                        className="btn-primary btn-sm px-3.5 py-1.5 text-xs flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Volume2 size={13} />
                        <span>Listen In</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === 'create' ? (
            /* Create Room */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                  Room Name
                </label>
                <input
                  className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                  placeholder="e.g. Midnight Beats & Coding"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim(), priv, pw)}
                />
              </div>

              <div className="p-3 rounded-xl bg-[#10151C]/70 border border-[#273241] text-xs text-[#A7B0BE] flex items-center gap-2">
                <Users size={16} className="text-[#20C997] flex-shrink-0" />
                <span>Supports <strong>3 or more users</strong> listening simultaneously with zero audio latency.</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#A7B0BE] select-none">
                <input
                  type="checkbox"
                  checked={priv}
                  onChange={e => setPriv(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#20C997] bg-[#10151C]"
                />
                <Lock size={14} className="text-[#778293]" /> Private Room (Password Protected)
              </label>

              {priv && (
                <input
                  className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                  type="password"
                  placeholder="Set room password..."
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                />
              )}

              <button
                onClick={() => name.trim() && onCreate(name.trim(), priv, pw)}
                disabled={joining}
                className="btn-primary w-full py-3 font-semibold mt-2 shadow-lg shadow-emerald-500/20"
              >
                {joining ? <Loader size={16} className="animate-spin text-[#0B0F14]" /> : <Plus size={16} />}
                {joining ? 'Creating Room...' : 'Start Listening Party'}
              </button>
            </div>
          ) : (
            /* Join by code */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Room Code
                </label>
                <input
                  className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] font-mono tracking-widest text-center text-xl uppercase h-14 text-[#20C997] font-bold"
                  placeholder="VIBE01"
                  value={code}
                  maxLength={8}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && code.trim() && onJoin(code.trim(), pw)}
                />
              </div>

              <button
                onClick={() => code.trim() && onJoin(code.trim(), pw)}
                disabled={joining}
                className="btn-primary w-full py-3 font-semibold mt-2 shadow-lg shadow-emerald-500/20"
              >
                {joining ? <Loader size={16} className="animate-spin text-[#0B0F14]" /> : <Radio size={16} />}
                {joining ? 'Joining Party...' : 'Join Party'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── ACTIVE ROOM INTERFACE (WITH 3+ USERS SYNC) ──────────────────── */
function ActiveRoom({ room, initialMembers, initialMessages, onLeave }) {
  const { user } = useAuthStore()
  const player = usePlayerStore()
  const [socket, setSocket] = useState(getSocket())
  const [members, setMembers] = useState(initialMembers || [])
  const [messages, setMessages] = useState(initialMessages || [])
  const [chatInput, setChatInput] = useState('')
  const [reactions, setReactions] = useState([])
  const [songs, setSongs] = useState([])
  const [songLoad, setSongLoad] = useState(true)
  const [activeTab, setActiveTab] = useState('songs')
  const [selMood, setSelMood] = useState('happy')
  const [hostId, setHostId] = useState(room.host_id)
  const chatEnd = useRef(null)
  const isHost = hostId === user?.id

  // Load songs by mood for room
  const loadMoodSongs = async (mood) => {
    setSongLoad(true)
    setSelMood(mood)
    try {
      const res = await api.get(`/songs/mood/${mood}?limit=20`)
      if (res.data?.songs && res.data.songs.length > 0) {
        setSongs(res.data.songs)
      } else {
        const tracks = await fetchByMood(mood, 20)
        setSongs(tracks)
      }
    } catch {
      toast.error('Failed to load songs')
    } finally {
      setSongLoad(false)
    }
  }

  useEffect(() => { loadMoodSongs('happy') }, [])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Dual Sync Engine: WebSocket + HTTP Polling Fallback
  useEffect(() => {
    let active = true

    // 1. HTTP Polling every 2.5s for infallible sync across 3+ users
    const pollInterval = setInterval(async () => {
      if (!active) return
      try {
        const res = await api.get(`/rooms/${room.code}/sync`)
        if (res.data && active) {
          if (res.data.members) setMembers(res.data.members)
          if (res.data.hostId !== undefined) setHostId(res.data.hostId)

          // Playback sync for listeners
          if (!isHost && res.data.currentSong) {
            const serverSong = res.data.currentSong
            const serverPos = res.data.position || 0
            const serverPlaying = res.data.isPlaying

            if (!player.song || player.song.id !== serverSong.id) {
              player.roomLoad(serverSong, serverPlaying)
              setTimeout(() => { player.roomSeek(serverPos) }, 500)
            } else {
              // Drift compensation if offset > 2 seconds
              const currentPos = player.howl?.seek() || 0
              if (Math.abs(currentPos - serverPos) > 2.0) {
                player.roomSeek(serverPos)
              }
              if (serverPlaying && !player.playing) player.roomPlay()
              else if (!serverPlaying && player.playing) player.roomPause()
            }
          }
        }
      } catch (err) {
        // Silent polling catch
      }
    }, 2500)

    // 2. WebSocket listener if available
    const token = localStorage.getItem('mw_token')
    let ws = socket
    if (!ws && token) {
      ws = connect(token)
      setSocket(ws)
    }

    if (ws) {
      ws.emit?.('room:join', { code: room.code })
      player.setRoomCode(room.code)
      player.setRoomHostId(room.host_id)

      ws.on?.('room:state', ({ currentSong, isPlaying, position, hostId: hid }) => {
        if (hid) setHostId(hid)
        if (currentSong?.audio_url) {
          player.roomLoad(currentSong, false)
          setTimeout(() => {
            player.roomSeek(position || 0)
            if (isPlaying) player.roomPlay()
          }, 600)
        }
      })

      ws.on?.('room:member-update', ({ members: m }) => setMembers(m))
      ws.on?.('room:chat', msg => setMessages(p => [...p, msg]))
      ws.on?.('room:react', r => {
        const id = Date.now() + Math.random()
        setReactions(prev => [...prev, { id, emoji: r.emoji }])
        setTimeout(() => setReactions(p => p.filter(x => x.id !== id)), 2000)
      })
    }

    return () => {
      active = false
      clearInterval(pollInterval)
    }
  }, [room.code, isHost, player.song?.id])

  // Play a song in the room (Host broadcasts to all 3+ users)
  const playRoomSong = async (song) => {
    player.roomLoad(song, true)
    try {
      // Sync via REST
      await api.post(`/rooms/${room.code}/sync`, {
        song,
        position: 0,
        isPlaying: true
      })
      // Sync via Socket if connected
      if (socket?.connected) {
        socket.emit('room:song', { code: room.code, song })
      }
      toast.success(`Broadcasting "${song.title}" to room!`, { icon: '🎵' })
    } catch (err) {
      toast.error('Failed to broadcast track')
    }
  }

  // Send Chat
  const sendChat = async (e) => {
    e?.preventDefault()
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput('')

    try {
      const res = await api.post(`/rooms/${room.code}/chat`, { content: text })
      if (res.data?.message) {
        setMessages(p => [...p, res.data.message])
      }
      if (socket?.connected) {
        socket.emit('room:chat', { code: room.code, content: text })
      }
    } catch {
      toast.error('Could not send message')
    }
  }

  // Send Reaction
  const sendReaction = (emoji) => {
    const id = Date.now() + Math.random()
    setReactions(p => [...p, { id, emoji }])
    setTimeout(() => setReactions(p => p.filter(x => x.id !== id)), 2000)
    if (socket?.connected) {
      socket.emit('room:react', { code: room.code, emoji })
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(room.code)
    toast.success(`Copied room code: ${room.code}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)] max-w-6xl mx-auto p-2 md:p-6">
      <div className="bg-[#151C25] border border-[#273241] rounded-2xl flex flex-col flex-1 overflow-hidden shadow-2xl relative">
        {/* Room Header */}
        <div className="px-4 py-3.5 md:px-6 md:py-4 border-b border-[#273241] flex items-center justify-between gap-3 bg-[#10151C]/50 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#20C997] animate-ping" />
              <h2 className="font-display font-bold text-base md:text-lg text-[#F5F7FA] truncate">
                {room.name}
              </h2>
              {isHost && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  <Crown size={11} /> HOST
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#778293]">
              <button
                onClick={copyCode}
                className="flex items-center gap-1 hover:text-[#20C997] font-mono bg-[#1B2633] px-2 py-0.5 rounded text-[11px] transition-colors"
                title="Click to copy room code"
              >
                <span>Code: {room.code}</span>
                <Copy size={11} />
              </button>
              <span>•</span>
              <span className="text-[#20C997] font-semibold flex items-center gap-1">
                <Users size={12} /> {members.length} {members.length >= 3 ? 'Users in Sync' : 'Listening'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLeave}
              className="btn-danger btn-sm text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <LogOut size={13} />
              <span>Leave</span>
            </button>
          </div>
        </div>

        {/* Connected Listeners Bar (3 or more users indicator) */}
        <div className="px-4 py-2 bg-[#10151C] border-b border-[#273241] flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] font-semibold text-[#778293] uppercase tracking-wider whitespace-nowrap">
            Listeners ({members.length}):
          </span>
          <div className="flex items-center gap-2">
            {members.map(m => (
              <div
                key={m.userId || m.id || Math.random()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151C25] border border-[#273241] flex-shrink-0"
              >
                <Avatar username={m.username} color={m.avatarColor} size={5} />
                <span className="text-xs text-[#F5F7FA] font-medium">{m.username}</span>
                {m.isHost && <Crown size={11} className="text-amber-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Live Audio Sync Ticker */}
        {player.song && (
          <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-3 flex-shrink-0">
            <img
              src={player.song.cover_url}
              className="w-9 h-9 rounded-lg object-cover border border-[#273241]"
              alt=""
              onError={e => { e.target.src = 'https://placehold.co/36x36/151C25/20C997?text=♪' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#20C997] truncate">{player.song.title}</p>
              <p className="text-[11px] text-[#A7B0BE] truncate">{player.song.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#20C997] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full">
                ⚡ Real-time Synced
              </span>
            </div>
          </div>
        )}

        {/* Floating Emoji Reactions */}
        <div className="relative overflow-hidden pointer-events-none" style={{ height: 0 }}>
          <AnimatePresence>
            {reactions.map(r => (
              <motion.span
                key={r.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -100, scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8 }}
                className="absolute text-4xl z-50"
                style={{ right: '8%', bottom: 20 }}
              >
                {r.emoji}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-2 px-4 pt-2 border-b border-[#273241] flex-shrink-0 bg-[#151C25]">
          {[
            { id: 'songs', label: '🎵 Room Playlist & Queue' },
            { id: 'chat',  label: `💬 Live Chat (${messages.length})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 -mb-px transition-all ${
                activeTab === t.id
                  ? 'border-[#20C997] text-[#20C997]'
                  : 'border-transparent text-[#778293] hover:text-[#F5F7FA]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {activeTab === 'songs' ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <p className="text-xs text-[#778293]">
                  {isHost
                    ? <>Click any track to broadcast synchronized playback to <strong className="text-[#F5F7FA]">all {members.length} members</strong>.</>
                    : <>Listening with <strong className="text-[#20C997]">{members.length} friends</strong> in this room.</>}
                </p>
                {/* Mood Tag Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => loadMoodSongs(m)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border transition-all ${
                        selMood === m
                          ? 'bg-[#20C997] text-[#0B0F14] border-[#20C997]'
                          : 'border-[#273241] bg-[#10151C] text-[#A7B0BE] hover:text-[#F5F7FA]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {songLoad ? (
                <div className="flex items-center justify-center py-12 gap-2 text-xs text-[#778293]">
                  <Loader size={18} className="animate-spin text-[#20C997]" /> Loading {selMood} tracks...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {songs.map(song => (
                    <div
                      key={song.id}
                      onClick={() => playRoomSong(song)}
                      className="p-3 rounded-xl bg-[#10151C] border border-[#273241] hover:border-[#20C997] flex items-center gap-3 cursor-pointer transition-all group"
                    >
                      <img
                        src={song.cover_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={e => { e.target.src = 'https://placehold.co/48x48/151C25/20C997?text=♪' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#F5F7FA] group-hover:text-[#20C997] truncate transition-colors">
                          {song.title}
                        </p>
                        <p className="text-xs text-[#778293] truncate">{song.artist}</p>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-[#20C997]/10 text-[#20C997] flex items-center justify-center group-hover:bg-[#20C997] group-hover:text-[#0B0F14] transition-all">
                        <Play size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Live Room Chat */
            <div className="flex flex-col h-full space-y-3">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 max-h-[380px]">
                {messages.length === 0 ? (
                  <p className="text-center py-10 text-xs text-[#778293]">No messages yet. Say hello to the room!</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id || Math.random()} className="flex items-start gap-2.5 text-xs">
                      <Avatar username={m.username} color={m.avatarColor} size={6} />
                      <div className="bg-[#10151C] border border-[#273241] rounded-2xl px-3 py-2 max-w-sm">
                        <span className="font-bold text-[#20C997] mr-1.5">{m.username}:</span>
                        <span className="text-[#F5F7FA]">{m.content}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEnd} />
              </div>

              {/* Chat Reactions bar */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#273241]">
                <span className="text-[11px] text-[#778293] mr-1">React:</span>
                {REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="p-1 hover:scale-125 transition-transform text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={sendChat} className="flex gap-2">
                <input
                  className="input flex-1 bg-[#10151C] border-[#273241] text-xs py-2.5 text-[#F5F7FA]"
                  placeholder="Send message to room..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn-primary px-4 py-2.5 text-xs">
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── MAIN ROOM PAGE COMPONENT ────────────────────────────────────── */
export default function RoomPage() {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()
  const [activeRoom, setActiveRoom] = useState(null)
  const [joining, setJoining] = useState(false)

  // Handle auto-join from URL param
  useEffect(() => {
    if (urlCode && !activeRoom) {
      handleJoin(urlCode, '')
    }
  }, [urlCode])

  const handleCreate = async (name, isPrivate, password) => {
    setJoining(true)
    try {
      const res = await api.post('/rooms', { name, is_private: isPrivate, password })
      if (res.data?.room) {
        setActiveRoom(res.data.room)
        toast.success(`Room created! Code: ${res.data.room.code}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room')
    } finally {
      setJoining(false)
    }
  }

  const handleJoin = async (code, password) => {
    setJoining(true)
    try {
      const res = await api.post('/rooms/join', { code, password })
      if (res.data?.room) {
        setActiveRoom(res.data.room)
        toast.success(`Connected to room: ${res.data.room.name}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join room')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = () => {
    setActiveRoom(null)
    navigate('/room')
  }

  return activeRoom ? (
    <ActiveRoom
      room={activeRoom}
      initialMembers={activeRoom.members}
      onLeave={handleLeave}
    />
  ) : (
    <Lobby
      onCreate={handleCreate}
      onJoin={handleJoin}
      joining={joining}
    />
  )
}
