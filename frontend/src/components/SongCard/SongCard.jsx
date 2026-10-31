import React from 'react'
import { Play, Pause, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import usePlayerStore from '../../store/playerStore'

export function fmt(sec) {
  if (!sec) return '--:--'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

/* ── Card (grid item) ────────────────────────────────────────── */
export function SongCard({ song, queue = [], index = 0 }) {
  const { song: current, playing, setQueue, toggle, playSong, isLiked, toggleLike } = usePlayerStore()
  const isSongLiked = isLiked(song.id || song.jamendo_id)
  const isActive = (current?.id && current.id === song.id) || (current?.jamendo_id && current.jamendo_id === song.jamendo_id)

  const handleClick = () => {
    if (isActive) { toggle(); return }
    if (queue.length > 1) setQueue(queue, index)
    else playSong(song)
  }

  const handleToggleLike = async (e) => {
    e.stopPropagation()
    await toggleLike(song)
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      className={`rounded-2xl p-3 cursor-pointer group relative overflow-hidden transition-all duration-250 border bg-[#151C25] song-card-animated ${
        isActive
          ? 'border-[#20C997] bg-emerald-500/10 shadow-lg shadow-emerald-500/20 ring-1 ring-[#20C997]/40'
          : 'border-[#273241] hover:bg-[#1B2633] hover:border-[#37475D]'
      }`}
    >
      {/* Cover Artwork */}
      <div className="relative mb-3 aspect-square rounded-xl overflow-hidden bg-[#10151C] border border-[#273241]/60">
        <img
          src={song.cover_url}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { e.target.src = 'https://placehold.co/300x300/151C25/20C997?text=Music' }}
          loading="lazy"
        />
        {/* Overlay Play Button */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
          <div className="w-11 h-11 rounded-full bg-[#20C997] text-[#0B0F14] hover:bg-[#16A87A] hover:text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transform group-hover:scale-105 transition-transform">
            {isActive && playing ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </div>
        </div>

        {/* Active Equalizer */}
        {isActive && playing && (
          <div className="absolute bottom-2 right-2 flex items-end gap-1 h-5 bg-[#0B0F14]/85 px-2 py-1 rounded-md border border-[#273241] backdrop-blur-md">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="eq-bar bg-[#20C997]"
                style={{ height: '4px', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Genre Tag */}
        {song.genre && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0B0F14]/80 border border-[#273241] text-[#A7B0BE] backdrop-blur-md text-[10px] uppercase font-semibold tracking-wider">
            {song.genre}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-xs md:text-sm font-semibold truncate mb-0.5 leading-snug ${isActive ? 'text-[#20C997]' : 'text-[#F5F7FA]'}`}>
            {song.title}
          </p>
          <p className="text-[11px] md:text-xs text-[#A7B0BE] truncate">{song.artist}</p>
        </div>
        <button
          type="button"
          onClick={handleToggleLike}
          className="p-1 rounded-lg hover:bg-[#10151C] transition-colors flex-shrink-0 text-[#778293] hover:text-[#20C997]"
          title={isSongLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            size={15}
            className={`transition-colors ${isSongLiked ? 'text-[#20C997] fill-[#20C997]' : 'text-[#778293] hover:text-[#20C997]'}`}
          />
        </button>
      </div>

      <p className="text-[10px] md:text-[11px] text-[#778293] mt-1 tabular-nums font-mono">{fmt(song.duration)}</p>
    </motion.div>
  )
}

/* ── Row (list item) ─────────────────────────────────────────── */
export function SongRow({ song, queue = [], index = 0, num, showAlbum = false, onToggleLike }) {
  const { song: current, playing, setQueue, toggle, playSong, isLiked, toggleLike } = usePlayerStore()
  const isSongLiked = isLiked(song.id || song.jamendo_id)
  const isActive = (current?.id && current.id === song.id) || (current?.jamendo_id && current.jamendo_id === song.jamendo_id)

  const handleClick = () => {
    if (isActive) { toggle(); return }
    if (queue.length > 1) setQueue(queue, index)
    else playSong(song)
  }

  const handleToggleLike = async (e) => {
    e.stopPropagation()
    const nextState = await toggleLike(song)
    if (typeof onToggleLike === 'function') onToggleLike(nextState)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer group border ${
        isActive
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'border-transparent hover:bg-[#1B2633] hover:border-[#273241]'
      }`}
    >
      {/* Number / Equalizer */}
      <div className="w-6 text-center flex-shrink-0">
        {isActive && playing ? (
          <div className="flex items-end justify-center gap-0.5 h-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="eq-bar bg-[#20C997]"
                style={{ height: '3px', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-[#778293] group-hover:text-[#A7B0BE] tabular-nums font-mono">
            {num ?? index + 1}
          </span>
        )}
      </div>

      {/* Cover Image */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#10151C] border border-[#273241]">
        <img
          src={song.cover_url}
          alt={song.title}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = 'https://placehold.co/40x40/151C25/20C997?text=♪' }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          {isActive && playing ? (
            <Pause size={14} fill="white" className="text-white" />
          ) : (
            <Play size={14} fill="white" className="text-white ml-0.5" />
          )}
        </div>
      </div>

      {/* Title & Artist */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-[#20C997] font-semibold' : 'text-[#F5F7FA]'}`}>
          {song.title}
        </p>
        <p className="text-xs text-[#A7B0BE] truncate mt-0.5">{song.artist}</p>
      </div>

      {/* Album (optional) */}
      {showAlbum && (
        <div className="hidden md:block w-48 truncate text-xs text-[#778293]">
          {song.album || 'Single'}
        </div>
      )}

      {/* Duration */}
      <div className="text-xs text-[#778293] tabular-nums font-mono w-12 text-right">
        {fmt(song.duration)}
      </div>

      {/* Like Button */}
      <button
        type="button"
        onClick={handleToggleLike}
        className="p-1 rounded-lg hover:bg-[#10151C] transition-colors flex-shrink-0 text-[#778293] hover:text-[#20C997]"
        title={isSongLiked ? 'Unlike' : 'Like'}
      >
        <Heart
          size={16}
          className={`transition-colors ${isSongLiked ? 'text-[#20C997] fill-[#20C997]' : 'text-[#778293] hover:text-[#20C997]'}`}
        />
      </button>
    </div>
  )
}
