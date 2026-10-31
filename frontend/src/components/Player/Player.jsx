import React from 'react'
import { Link } from 'react-router-dom'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Heart, Maximize2
} from 'lucide-react'
import { motion } from 'framer-motion'
import useAuthStore from '../../store/authStore'
import usePlayerStore from '../../store/playerStore'
import { getSocket } from '../../services/socket'
import toast from 'react-hot-toast'

export default function Player() {
  const { user } = useAuthStore()
  const {
    song, playing, progress, duration, currentSec, volume,
    shuffle, repeat, loading, roomCode, roomHostId,
    toggle, seek, setVolume, toggleMute, next, prev,
    toggleShuffle, toggleRepeat, fmt,
  } = usePlayerStore()

  const roomActive = !!roomCode
  const isRoomHost = roomActive && roomHostId === user?.id
  const isRoomLocked = roomActive && !isRoomHost
  const isSongLiked = usePlayerStore(s => s.isLiked(song?.id || song?.jamendo_id))
  const storeToggleLike = usePlayerStore(s => s.toggleLike)

  const toggleSongLike = async () => {
    if (!song) return
    await storeToggleLike(song)
  }

  const pct = (progress * 100).toFixed(2)

  if (!song) {
    return (
      <div className="h-20 bg-[#10151C] border-t border-[#273241] flex items-center justify-between px-6 z-40 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#151C25] border border-[#273241] flex items-center justify-center text-[#778293] text-sm">
            ♪
          </div>
          <div>
            <p className="text-xs font-medium text-[#F5F7FA]">No track selected</p>
            <p className="text-[11px] text-[#778293]">Choose a song or mood to start listening</p>
          </div>
        </div>
        <p className="hidden md:block text-xs text-[#778293] font-mono">Press [Space] to play/pause</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="h-20 bg-[#10151C] border-t border-[#273241] flex items-center px-4 md:px-6 gap-3 md:gap-5 z-40 relative select-none"
    >
      {/* Track Info */}
      <div className="flex items-center gap-3 w-44 md:w-64 flex-shrink-0 min-w-0">
        <div className="relative flex-shrink-0">
          <img
            src={song.cover_url}
            alt={song.title}
            className={`w-11 h-11 md:w-12 md:h-12 rounded-xl object-cover border border-[#273241] ${playing ? 'spin-vinyl' : 'spin-vinyl paused'}`}
            onError={e => { e.target.src = 'https://placehold.co/48x48/10151C/20C997?text=♪' }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10151C] border border-[#273241]" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm font-semibold truncate text-[#F5F7FA] leading-tight">{song.title}</p>
          <p className="text-[11px] md:text-xs text-[#A7B0BE] truncate mt-0.5">{song.artist}</p>
        </div>
        <button
          type="button"
          onClick={toggleSongLike}
          className="p-1.5 rounded-lg hover:bg-[#1B2633] transition-colors flex-shrink-0 text-[#778293] hover:text-[#20C997]"
          title={isSongLiked ? 'Unlike song (L)' : 'Like song (L)'}
        >
          <Heart
            size={16}
            className={`transition-colors ${isSongLiked ? 'text-[#20C997] fill-[#20C997]' : 'text-[#778293] hover:text-[#20C997]'}`}
          />
        </button>
      </div>

      {/* Playback Controls & Progress */}
      <div className="flex-1 flex flex-col items-center gap-1.5 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={toggleShuffle}
            className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors ${shuffle ? 'text-[#20C997]' : 'text-[#778293] hover:text-[#F5F7FA]'}`}
            title="Shuffle"
          >
            <Shuffle size={15} />
          </button>

          <button
            onClick={prev}
            disabled={!!roomCode}
            className="p-1.5 rounded-lg text-[#A7B0BE] hover:text-white transition-colors disabled:opacity-30"
            title="Previous (P)"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={() => {
              if (isRoomLocked) {
                toast.error('Only the room host can control playback')
                return
              }
              if (roomCode) {
                const socket = getSocket()
                if (playing) {
                  socket?.emit('room:pause', { code: roomCode, position: currentSec })
                } else {
                  socket?.emit('room:play', { code: roomCode, song, position: currentSec })
                }
              }
              toggle()
            }}
            disabled={loading || isRoomLocked}
            className="w-9 h-9 rounded-full bg-[#20C997] text-[#0B0F14] hover:bg-[#16A87A] hover:text-white transition-all flex items-center justify-center active:scale-95 disabled:opacity-50 shadow-sm shadow-emerald-500/20"
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin" />
            ) : playing ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            disabled={!!roomCode}
            className="p-1.5 rounded-lg text-[#A7B0BE] hover:text-white transition-colors disabled:opacity-30"
            title="Next (N)"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors ${repeat ? 'text-[#20C997]' : 'text-[#778293] hover:text-[#F5F7FA]'}`}
            title="Repeat"
          >
            <Repeat size={15} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-[11px] text-[#778293] w-9 text-right tabular-nums font-mono">{fmt(currentSec)}</span>
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.0005"
              value={progress}
              onChange={e => {
                if (isRoomLocked) return
                const ratio = parseFloat(e.target.value)
                seek(ratio)
                if (roomCode) {
                  const socket = getSocket()
                  socket?.emit('room:seek', { code: roomCode, position: ratio * duration })
                }
              }}
              disabled={isRoomLocked}
              className="range-fill w-full"
              style={{ '--pct': `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-[#778293] w-9 tabular-nums font-mono">{fmt(duration)}</span>
        </div>
      </div>

      {/* Volume & Fullscreen Actions */}
      <div className="flex items-center gap-3 w-44 md:w-56 justify-end flex-shrink-0">
        {/* Equaliser Bars */}
        {playing && (
          <div className="hidden sm:flex items-end gap-0.5 h-3.5 mr-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="eq-bar"
                style={{ animationDelay: `${i * 0.15}s`, height: '4px' }}
              />
            ))}
          </div>
        )}

        <button
          onClick={toggleMute}
          className="text-[#778293] hover:text-[#F5F7FA] transition-colors p-1"
          title={volume === 0 ? 'Unmute (M)' : 'Mute (M)'}
        >
          {volume === 0 ? <VolumeX size={16} className="text-[#F87171]" /> : <Volume2 size={16} />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="range-fill w-16 md:w-20"
          style={{ '--pct': `${(volume * 100).toFixed(0)}%` }}
        />

        <Link
          to="/now"
          className="text-[#778293] hover:text-[#20C997] transition-colors p-1 rounded-lg"
          title="Full screen (Now Playing)"
        >
          <Maximize2 size={15} />
        </Link>
      </div>
    </motion.div>
  )
}
