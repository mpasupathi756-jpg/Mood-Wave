import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, ArrowLeft, Heart, Sparkles, Disc
} from 'lucide-react'
import usePlayerStore from '../store/playerStore'

export default function NowPlaying() {
  const {
    song, playing, progress, duration, currentSec, volume, shuffle, repeat,
    toggle, seek, setVolume, toggleMute, next, prev, toggleShuffle, toggleRepeat,
    queue, qIdx, fmt, isLiked, toggleLike, activeMood
  } = usePlayerStore()

  const pct = (progress * 100).toFixed(2)
  const isSongLiked = isLiked(song?.id || song?.jamendo_id)

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-[#778293] gap-4 p-6">
        <div className="w-16 h-16 rounded-2xl bg-[#151C25] border border-[#273241] flex items-center justify-center">
          <Disc size={32} className="opacity-40 text-[#20C997]" />
        </div>
        <p className="font-display text-2xl font-bold text-[#F5F7FA]">No Track Playing</p>
        <p className="text-xs text-[#778293] max-w-xs text-center">
          Select a mood or play a song from Home or Search to begin your listening experience.
        </p>
        <Link to="/" className="btn-primary mt-2 font-semibold">Discover Music</Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 md:p-10 pb-36">
      {/* Subtle Atmospheric Backdrop */}
      <div
        className="now-bg fixed inset-0 opacity-15 filter blur-[90px] pointer-events-none transition-all duration-1000 scale-110"
        style={{ backgroundImage: `url(${song.cover_url})` }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(32, 201, 151, 0.08) 0%, rgba(11, 15, 20, 0.95) 70%)',
        }}
      />

      {/* Top Navigation */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <Link
          to="/"
          className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-500/25 bg-emerald-500/10 text-[#20C997] flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#20C997]" />
          Mood: <span className="font-bold">{activeMood || 'Calm'}</span>
        </span>
      </div>

      {/* Main Player Display */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md my-auto">
        {/* Vinyl Disc Container */}
        <motion.div
          key={song.id || song.jamendo_id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative group cursor-pointer"
          onClick={toggle}
        >
          {/* Subtle Aura */}
          <div
            className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-1000 pointer-events-none ${
              playing ? 'opacity-30 scale-105' : 'opacity-10 scale-95'
            }`}
            style={{ background: 'radial-gradient(circle, #20C997, transparent 70%)' }}
          />

          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full p-2 bg-[#151C25] border-4 border-[#273241] shadow-2xl flex items-center justify-center">
            {/* Spinning Album Art */}
            <img
              src={song.cover_url}
              alt={song.title}
              className={`w-full h-full rounded-full object-cover ${
                playing ? 'spin-vinyl' : 'spin-vinyl paused'
              }`}
              onError={e => { e.target.src = 'https://placehold.co/288x288/151C25/20C997?text=♪' }}
            />

            {/* Vinyl Spindle Center */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#0B0F14] border-2 border-[#273241] shadow-inner flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#20C997]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Spectrum Equalizer Bars */}
        {playing && (
          <div className="flex items-end justify-center gap-1.5 h-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#20C997]"
                style={{
                  height: `${Math.max(6, (i * 7) % 24)}px`,
                  animation: `eqBounce 0.8s ease-in-out infinite alternate ${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Track Metadata */}
        <div className="text-center w-full space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F5F7FA] tracking-tight leading-snug truncate max-w-[85%]">
              {song.title}
            </h1>
            <button
              type="button"
              onClick={() => toggleLike(song)}
              className="p-1 rounded-full hover:bg-[#1B2633] transition-colors"
              title={isSongLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                size={22}
                className={`transition-colors ${isSongLiked ? 'text-[#20C997] fill-[#20C997]' : 'text-[#778293] hover:text-[#20C997]'}`}
              />
            </button>
          </div>
          <p className="text-[#A7B0BE] text-base font-medium truncate">{song.artist}</p>
          {song.album && <p className="text-[#778293] text-xs truncate">{song.album}</p>}
        </div>

        {/* Progress Slider */}
        <div className="w-full space-y-1.5">
          <input
            type="range"
            min="0"
            max="1"
            step="0.0005"
            value={progress}
            onChange={e => seek(parseFloat(e.target.value))}
            className="range-fill w-full"
            style={{ '--pct': `${pct}%` }}
          />
          <div className="flex justify-between text-xs text-[#778293] tabular-nums font-mono px-0.5">
            <span>{fmt(currentSec)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-6 w-full justify-center">
          <button
            onClick={toggleShuffle}
            className={`transition-colors p-2 ${shuffle ? 'text-[#20C997]' : 'text-[#778293] hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle size={20} />
          </button>

          <button
            onClick={prev}
            className="text-[#A7B0BE] hover:text-white transition-colors p-2"
            title="Previous track"
          >
            <SkipBack size={26} fill="currentColor" />
          </button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={toggle}
            className="w-16 h-16 rounded-full bg-[#20C997] text-[#0B0F14] hover:bg-[#16A87A] hover:text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
          </motion.button>

          <button
            onClick={next}
            className="text-[#A7B0BE] hover:text-white transition-colors p-2"
            title="Next track"
          >
            <SkipForward size={26} fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`transition-colors p-2 ${repeat ? 'text-[#20C997]' : 'text-[#778293] hover:text-white'}`}
            title="Repeat"
          >
            <Repeat size={20} />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 w-48">
          <button
            onClick={toggleMute}
            className="text-[#778293] hover:text-white transition-colors p-1"
            title={volume === 0 ? 'Unmute' : 'Mute'}
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
            className="range-fill flex-1"
            style={{ '--pct': `${(volume * 100).toFixed(0)}%` }}
          />
        </div>

        {/* Up Next Mini Preview */}
        {queue.length > 1 && (
          <div className="w-full pt-4 border-t border-[#273241]">
            <div className="flex items-center justify-between text-xs text-[#778293] uppercase tracking-wider mb-2 font-semibold">
              <span>Up Next</span>
              <span className="font-mono">{queue.length - 1} remaining</span>
            </div>
            <div className="space-y-1.5">
              {queue.slice(qIdx + 1, qIdx + 4).map((s, i) => (
                <div
                  key={s.id || s.jamendo_id || i}
                  className="flex items-center gap-3 p-2 rounded-xl bg-[#151C25] border border-[#273241]"
                >
                  <img
                    src={s.cover_url}
                    className="w-9 h-9 rounded-lg object-cover border border-[#273241]"
                    alt=""
                    onError={e => { e.target.src = 'https://placehold.co/36x36/151C25/20C997?text=♪' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-[#F5F7FA]">{s.title}</p>
                    <p className="text-[11px] text-[#778293] truncate">{s.artist}</p>
                  </div>
                  <span className="text-[10px] text-[#778293] tabular-nums font-mono">{fmt(s.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
