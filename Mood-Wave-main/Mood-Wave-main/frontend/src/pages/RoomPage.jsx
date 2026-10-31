import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Plus, Send, Copy, LogOut, Loader, Lock, Crown, Music, Play, Pause, Users } from 'lucide-react'
import { connect, getSocket } from '../services/socket'
import { fetchByMood } from '../services/jamendo'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import usePlayerStore from '../store/playerStore'
import toast from 'react-hot-toast'

const REACTIONS = ['🔥','❤️','😂','😮','👏','🎵','✨','🤘']
const MOODS     = ['happy','calm','energetic','sad','romantic','focused','party','workout','sleepy','angry']

function Avatar({ username, color, size = 7 }) {
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

/* ── LOBBY ─────────────────────────────────────────────────── */
function Lobby({ onCreate, onJoin, joining }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [priv, setPriv] = useState(false)
  const [pw,   setPw]   = useState('')
  const [tab,  setTab]  = useState('create')

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center mx-auto mb-4">
            <Radio size={28} />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#F5F7FA]">Listen Together</h1>
          <p className="text-[#778293] mt-1 text-sm">Synchronize playback with up to 4 friends in real-time</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-[#10151C] border border-[#273241] rounded-xl p-1">
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-semibold capitalize transition-all ${
                tab === t ? 'bg-[#20C997] text-[#0B0F14] shadow-sm' : 'text-[#778293] hover:text-[#F5F7FA]'
              }`}
            >
              {t === 'create' ? '+ Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {/* Action Card */}
        <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 space-y-4">
          {tab === 'create' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                  Room Name
                </label>
                <input
                  className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] text-[#F5F7FA]"
                  placeholder="e.g. Midnight Coding Vibes"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim(), priv, pw)}
                />
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
                className="btn-primary w-full py-3 font-semibold mt-2"
              >
                {joining ? <Loader size={16} className="animate-spin text-[#0B0F14]" /> : <Plus size={16} />}
                {joining ? 'Creating Room...' : 'Create Room'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#A7B0BE] uppercase tracking-wider mb-1.5">
                  Room Code
                </label>
                <input
                  className="input bg-[#10151C] border-[#273241] focus:border-[#20C997] font-mono tracking-widest text-center text-xl uppercase h-14 text-[#20C997]"
                  placeholder="ABCD12"
                  value={code}
                  maxLength={8}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && code.trim() && onJoin(code.trim(), pw)}
                />
              </div>

              <button
                onClick={() => code.trim() && onJoin(code.trim(), pw)}
                disabled={joining}
                className="btn-primary w-full py-3 font-semibold mt-2"
              >
                {joining ? <Loader size={16} className="animate-spin text-[#0B0F14]" /> : <Radio size={16} />}
                {joining ? 'Joining Room...' : 'Join Room'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── ACTIVE ROOM ─────────────────────────────────────────────── */
function ActiveRoom({ room, initialMembers, initialMessages, onLeave }) {
  const { user }  = useAuthStore()
  const player    = usePlayerStore()
  const [socket, setSocket] = useState(getSocket())

  const [members,   setMembers]   = useState(initialMembers  || [])
  const [messages,  setMessages]  = useState(initialMessages || [])
  const [chatInput, setChatInput] = useState('')
  const [typing,    setTyping]    = useState([])
  const [reactions, setReactions] = useState([])
  const [songs,     setSongs]     = useState([])
  const [songLoad,  setSongLoad]  = useState(true)
  const [activeTab, setActiveTab] = useState('songs')
  const [selMood,   setSelMood]   = useState('happy')
  const [hostId,    setHostId]    = useState(room.host_id)
  const chatEnd   = useRef(null)
  const typingRef = useRef(null)
  const isHost = hostId === user?.id

  const loadMoodSongs = async (mood) => {
    setSongLoad(true)
    setSelMood(mood)
    try {
      const tracks = await fetchByMood(mood, 20)
      setSongs(tracks)
      if (tracks.length === 0) toast('No songs for this mood, try another', { icon: '🎵' })
    } catch {
      toast.error('Failed to load songs')
    } finally {
      setSongLoad(false)
    }
  }

  useEffect(() => { loadMoodSongs('happy') }, [])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Socket listeners
  useEffect(() => {
    if (!socket) {
      const token = localStorage.getItem('mw_token')
      if (token) {
        const connectedSocket = connect(token)
        setSocket(connectedSocket)
      }
      return
    }

    if (!socket.connected) {
      socket.connect?.()
    }

    socket.emit('room:join', { code: room.code })
    player.setRoomCode(room.code)
    player.setRoomHostId(room.host_id)
    setHostId(room.host_id)

    socket.on('connect_error', (err) => {
      toast.error(`Room socket error: ${err?.message || 'connection failed'}`)
    })

    socket.on('room:error', ({ msg }) => {
      toast.error(msg || 'Action not allowed')
    })

    socket.on('room:state', ({ currentSong, isPlaying, position, hostId }) => {
      if (hostId !== undefined && hostId !== null) {
        player.setRoomHostId(hostId)
        setHostId(hostId)
      }
      if (currentSong?.audio_url) {
        player.roomLoad(currentSong, false)
        setTimeout(() => {
          player.roomSeek(position || 0)
          if (isPlaying) player.roomPlay()
        }, 800)
      }
    })

    socket.on('room:play', ({ song, position }) => {
      if (song && song.id !== player.song?.id) {
        player.roomLoad(song, false)
        setTimeout(() => { player.roomSeek(position || 0); player.roomPlay() }, 600)
      } else {
        player.roomPlay()
        if (position !== undefined) setTimeout(() => player.roomSeek(position), 100)
      }
    })

    socket.on('room:pause', ({ position }) => {
      player.roomPause()
      if (position !== undefined) setTimeout(() => player.roomSeek(position), 100)
    })

    socket.on('room:seek', ({ position }) => {
      player.roomSeek(position)
    })

    socket.on('room:song', ({ song, changedBy }) => {
      if (song?.audio_url) {
        player.roomLoad(song, true)
        toast.success(`${changedBy} played "${song.title}"`, { icon: '🎵' })
      }
    })

    socket.on('room:member-update', ({ members: m }) => setMembers(m))
    socket.on('room:notification',  ({ msg }) => toast(msg, { icon: '👋', duration: 2000 }))
    socket.on('room:chat',   msg => setMessages(p => [...p, msg]))
    socket.on('room:typing', ({ username, isTyping }) =>
      setTyping(p => isTyping ? [...new Set([...p, username])] : p.filter(u => u !== username))
    )

    socket.on('room:react',  ({ emoji }) => {
      const id = Date.now() + Math.random()
      setReactions(p => [...p, { id, emoji }])
      setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2500)
    })

    return () => {
      player.clearRoomCode()
      if (!socket) return
      ['room:state','room:play','room:pause','room:seek','room:song',
       'room:member-update','room:notification','room:chat','room:typing','room:react','room:error'
      ].forEach(ev => socket.off?.(ev))
    }
  }, [socket, room.code])

  const playSongForRoom = (song) => {
    if (!isHost) {
      toast.error('Only the host can change the room song')
      return
    }
    if (!song.audio_url) {
      toast.error('No audio for this track')
      return
    }
    player.roomLoad(song, true)
    socket?.emit('room:song', { code: room.code, song })
  }

  const syncPlay = () => {
    if (!isHost) {
      toast.error('Only the host can play for everyone')
      return
    }
    socket?.emit('room:play', { code: room.code, song: player.song, position: player.currentSec })
    player.roomPlay()
  }

  const syncPause = () => {
    if (!isHost) {
      toast.error('Only the host can pause for everyone')
      return
    }
    socket?.emit('room:pause', { code: room.code, position: player.currentSec })
    player.roomPause()
  }

  const sendChat = () => {
    const msg = chatInput.trim()
    if (!msg) return
    if (!socket || !socket.connected) {
      toast.error('Not connected to room')
      return
    }
    socket.emit('room:chat', { code: room.code, content: msg })
    setChatInput('')
    socket.emit('room:typing', { code: room.code, isTyping: false })
  }

  const handleTypingInput = (v) => {
    setChatInput(v)
    if (!socket || !socket.connected) return
    socket.emit('room:typing', { code: room.code, isTyping: v.length > 0 })
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => socket?.emit('room:typing', { code: room.code, isTyping: false }), 1500)
  }

  const copyCode = () => navigator.clipboard.writeText(room.code).then(() => toast.success('Room code copied!'))
  const leave    = () => { player.clearRoomCode(); socket?.emit('room:leave', { code: room.code }); onLeave() }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Room View */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Room Header */}
        <div className="px-5 py-3.5 bg-[#10151C] border-b border-[#273241] flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base md:text-lg text-[#F5F7FA]">{room.name}</span>
              {room.host_id === user?.id && <Crown size={14} className="text-[#F59E0B]" />}
            </div>
            <button
              onClick={copyCode}
              className="text-xs font-mono font-bold text-[#20C997] hover:text-[#16A87A] flex items-center gap-1 mt-0.5"
            >
              Code: {room.code} <Copy size={11} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={isHost ? (player.playing ? syncPause : syncPlay) : undefined}
              disabled={!isHost}
              className={`btn-primary btn-sm font-semibold ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {player.playing ? <><Pause size={12} /> Pause All</> : <><Play size={12} /> Play All</>}
            </button>
            <button onClick={leave} className="btn-danger btn-sm">
              <LogOut size={13} /> Leave
            </button>
          </div>
        </div>

        {/* Now Playing Live Ticker */}
        {player.song && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-3 flex-shrink-0">
            <img
              src={player.song.cover_url}
              className="w-8 h-8 rounded-lg object-cover border border-[#273241]"
              alt=""
              onError={e => { e.target.src = 'https://placehold.co/32x32/151C25/20C997?text=♪' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#20C997] truncate">{player.song.title}</p>
              <p className="text-[11px] text-[#A7B0BE] truncate">{player.song.artist}</p>
            </div>
            {player.playing && (
              <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="eq-bar bg-[#20C997]" style={{ height: '3px', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Reactions */}
        <div className="relative overflow-hidden" style={{ height: 0 }}>
          <AnimatePresence>
            {reactions.map(r => (
              <motion.span
                key={r.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute text-3xl pointer-events-none z-50"
                style={{ right: '6%', bottom: 0 }}
              >
                {r.emoji}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 border-b border-[#273241] flex-shrink-0">
          {[['songs', '🎵 Queue & Songs'], ['chat', '💬 Room Chat']].map(([t, l]) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 -mb-px transition-all ${
                activeTab === t
                  ? 'border-[#20C997] text-[#20C997]'
                  : 'border-transparent text-[#778293] hover:text-[#F5F7FA]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'songs' ? (
            <div className="space-y-4">
              <p className="text-xs text-[#778293]">
                {isHost
                  ? <>Click any track to synchronize playback for <strong className="text-[#F5F7FA]">all members</strong>.</>
                  : <>Only the room host can change songs. You can listen together, react, and chat.</>}
              </p>

              {/* Mood selector */}
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => loadMoodSongs(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all ${
                      selMood === m
                        ? 'bg-[#20C997] text-[#0B0F14] border-[#20C997]'
                        : 'border-[#273241] bg-[#151C25] text-[#A7B0BE] hover:text-[#F5F7FA] hover:bg-[#1B2633]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {songLoad ? (
                <div className="flex items-center justify-center py-12 gap-3">
                  <Loader size={22} className="animate-spin text-[#20C997]" />
                  <span className="text-xs text-[#778293]">Loading {selMood} tracks...</span>
                </div>
              ) : songs.length === 0 ? (
                <div className="text-center py-12 text-[#778293]">
                  <Music size={36} className="mx-auto mb-3 opacity-30 text-[#20C997]" />
                  <p className="text-sm">No songs found — choose another mood</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {songs.map(song => {
                    const active = player.song?.id === song.id
                    return (
                      <motion.div
                        key={song.id}
                        whileHover={{ y: -2 }}
                        onClick={() => playSongForRoom(song)}
                        className={`bg-[#151C25] border rounded-xl p-3 cursor-pointer group transition-all ${
                          active ? 'border-[#20C997] bg-emerald-500/10' : 'border-[#273241] hover:bg-[#1B2633] hover:border-[#37475D]'
                        }`}
                      >
                        <div className="relative mb-2 aspect-square rounded-lg overflow-hidden bg-[#10151C]">
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.src = 'https://placehold.co/200x200/151C25/20C997?text=Music' }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <div className="w-9 h-9 rounded-full bg-[#20C997] text-[#0B0F14] flex items-center justify-center shadow-md">
                              {active && player.playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                            </div>
                          </div>
                          {active && player.playing && (
                            <div className="absolute bottom-1.5 right-1.5 flex items-end gap-0.5 h-3.5 bg-black/60 px-1.5 py-0.5 rounded">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="eq-bar bg-[#20C997]" style={{ height: '3px', animationDelay: `${i * 0.15}s` }} />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className={`text-xs font-semibold truncate ${active ? 'text-[#20C997]' : 'text-[#F5F7FA]'}`}>
                          {song.title}
                        </p>
                        <p className="text-[11px] text-[#778293] truncate">{song.artist}</p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-[#778293] py-12">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-xs">No messages yet — say hello to the room!</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.user_id === user?.id
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar username={msg.username} color={msg.avatar_color} />
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className="text-[11px] text-[#778293] mb-1 ml-1 font-medium">{msg.username}</span>}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs md:text-sm ${
                          isMe
                            ? 'bg-[#20C997] text-[#0B0F14] font-medium rounded-tr-sm'
                            : 'bg-[#151C25] border border-[#273241] text-[#F5F7FA] rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              {typing.length > 0 && (
                <p className="text-xs text-[#778293] italic">
                  {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
                </p>
              )}
              <div ref={chatEnd} />
            </div>
          )}
        </div>

        {/* Bottom Reaction & Chat Input */}
        <div className="px-5 py-3 border-t border-[#273241] bg-[#10151C] flex-shrink-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#778293] mr-1">React:</span>
            {REACTIONS.map(e => (
              <button
                key={e}
                onClick={() => socket?.emit('room:react', { code: room.code, emoji: e })}
                className="text-lg hover:scale-125 transition-transform px-1"
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-sm py-2 bg-[#151C25] border-[#273241] focus:border-[#20C997]"
              placeholder="Send message to room..."
              value={chatInput}
              onChange={e => handleTypingInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendChat()
                }
              }}
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim()}
              className="btn-primary px-3 font-semibold"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="hidden sm:flex w-52 flex-shrink-0 border-l border-[#273241] bg-[#10151C] flex-col">
        <div className="px-4 py-3 border-b border-[#273241]">
          <p className="text-xs text-[#A7B0BE] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Users size={12} className="text-[#20C997]" /> Members ({members.length}/4)
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {members.map(m => (
            <div key={m.userId} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-[#151C25] border border-[#273241]">
              <Avatar username={m.username} color={m.avatar_color} size={7} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-[#F5F7FA]">{m.username}</p>
                {m.userId === room.host_id && (
                  <p className="text-[10px] text-[#F59E0B] flex items-center gap-0.5">
                    <Crown size={9} /> Host
                  </p>
                )}
              </div>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-[#273241] space-y-2 bg-[#0E1319]">
          <div className="text-xs text-[#778293] space-y-1">
            <p>Room: <span className="font-mono font-bold text-[#20C997]">{room.code}</span></p>
            {room.is_private && <p className="text-[#F59E0B] flex items-center gap-1"><Lock size={10} /> Private</p>}
          </div>
          <button onClick={copyCode} className="w-full btn-secondary btn-sm text-xs">
            <Copy size={11} /> Copy Code
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── PAGE CONTROLLER ─────────────────────────────────────────── */
export default function RoomPage() {
  const { code: routeCode } = useParams()
  const navigate = useNavigate()
  const [room,    setRoom]    = useState(null)
  const [members, setMembers] = useState([])
  const [msgs,    setMsgs]    = useState([])
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(!!routeCode)

  useEffect(() => {
    if (routeCode) enterRoom(routeCode.toUpperCase())
  }, [routeCode])

  const enterRoom = async (code) => {
    setLoading(true)
    try {
      await api.post('/rooms/join', { code }).catch(() => {})
      const { data } = await api.get(`/rooms/${code}`)
      if (!data.ok) throw new Error('Room not found')
      setRoom(data.room)
      setMembers(data.members)
      setMsgs(data.messages)
    } catch (err) {
      toast.error(err.message || 'Room not found')
      navigate('/room', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (name, is_private, password) => {
    setJoining(true)
    try {
      const { data } = await api.post('/rooms', { name, is_private, password })
      if (!data.ok) throw new Error(data.msg)
      navigate(`/room/${data.room.code}`, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Failed to create room')
    } finally {
      setJoining(false)
    }
  }

  const handleJoin = async (code, password) => {
    setJoining(true)
    try {
      const { data } = await api.post('/rooms/join', { code, password })
      if (!data.ok) throw new Error(data.msg || 'Failed to join')
      navigate(`/room/${code}`, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Wrong code or password')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = () => {
    setRoom(null)
    setMembers([])
    setMsgs([])
    navigate('/room', { replace: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3">
        <Loader size={24} className="animate-spin text-[#20C997]" />
        <span className="text-sm text-[#778293]">Entering room...</span>
      </div>
    )
  }

  if (room) {
    return (
      <ActiveRoom
        room={room}
        initialMembers={members}
        initialMessages={msgs}
        onLeave={handleLeave}
      />
    )
  }

  return (
    <Lobby
      onCreate={handleCreate}
      onJoin={handleJoin}
      joining={joining}
    />
  )
}
