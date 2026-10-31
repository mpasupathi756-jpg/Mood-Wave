import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Loader, Disc, Play, Sparkles, Clock } from 'lucide-react'
import MoodPicker from '../components/MoodPicker/MoodPicker'
import { SongCard } from '../components/SongCard/SongCard'
import useAuthStore from '../store/authStore'
import usePlayerStore from '../store/playerStore'
import { fetchFeatured, fetchByGenre } from '../services/jamendo'
import api from '../services/api'

const GENRES = ['Electronic', 'Pop', 'Rock', 'Ambient', 'Jazz', 'Classical', 'Hip-Hop', 'Folk']

export default function HomePage() {
  const { user } = useAuthStore()
  const { setQueue } = usePlayerStore()
  const [featured, setFeatured]         = useState([])
  const [moodSongs, setMoodSongs]       = useState([])
  const [currentMood, setMood]          = useState(null)
  const [genreSongs, setGenreSongs]     = useState([])
  const [selGenre, setSelGenre]         = useState('Electronic')
  const [loading, setLoading]           = useState(true)
  const [genreLoading, setGenreLoading] = useState(false)
  const [listenHistory, setListenHistory] = useState([])

  useEffect(() => {
    fetchFeatured(12)
      .then(setFeatured)
      .catch(console.error)
      .finally(() => setLoading(false))

    api.get('/songs/history')
      .then(r => setListenHistory(r.data.history || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setGenreLoading(true)
    fetchByGenre(selGenre, 8)
      .then(setGenreSongs)
      .catch(console.error)
      .finally(() => setGenreLoading(false))
  }, [selGenre])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.username || 'Explorer'

  return (
    <div className="p-6 md:p-8 space-y-9 max-w-screen-xl mx-auto">
      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] mb-2.5 animate-pulse-glow">
            <Sparkles size={12} className="text-[#20C997] animate-spin" style={{ animationDuration: '6s' }} /> Mood Harmony Engine
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#F5F7FA]">
            {greeting}, <span className="text-[#20C997] drop-shadow-[0_0_12px_rgba(32,201,151,0.35)]">{displayName}</span>
          </h1>
          <p className="text-[#778293] mt-1 text-sm">
            Tune your frequency. Discover songs crafted for your emotional vibe.
          </p>
        </div>

        {featured.length > 0 && (
          <button
            onClick={() => setQueue(featured, 0)}
            className="btn-primary self-start md:self-auto flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" /> Play Trending Mix
          </button>
        )}
      </div>

      {/* Mood Picker Core */}
      <MoodPicker
        onResult={(mood, songs) => {
          setMood(mood)
          setMoodSongs(songs.slice(0, 12))
        }}
      />

      {/* Dynamic Mood Queue Results */}
      {moodSongs.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#20C997] animate-pulse" />
              <h2 className="section-title mb-0 capitalize text-lg text-[#F5F7FA]">
                {currentMood} Stream
              </h2>
              <span className="badge bg-[#1B2633] text-[#A7B0BE] border border-[#273241]">
                {moodSongs.length} curated tracks
              </span>
            </div>

            <button
              onClick={() => setQueue(moodSongs, 0)}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Play size={13} fill="currentColor" /> Play All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {moodSongs.map((s, i) => (
              <SongCard key={s.id || s.jamendo_id || i} song={s} queue={moodSongs} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Trending Worldwide */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#20C997]" />
          <h2 className="section-title mb-0">Trending Worldwide</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={26} className="animate-spin text-[#20C997]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {featured.map((s, i) => (
              <SongCard key={s.id || s.jamendo_id || i} song={s} queue={featured} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Genre */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Disc size={18} className="text-[#20C997]" />
          <h2 className="section-title mb-0">Browse by Sonic Style</h2>
        </div>

        {/* Genre Pill Selection */}
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setSelGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                selGenre === g
                  ? 'bg-[#20C997] text-[#0B0F14] border-[#20C997] shadow-sm'
                  : 'border-[#273241] bg-[#151C25] text-[#A7B0BE] hover:text-[#F5F7FA] hover:bg-[#1B2633] hover:border-[#37475D]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {genreLoading ? (
          <div className="flex justify-center py-10">
            <Loader size={24} className="animate-spin text-[#20C997]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {genreSongs.map((s, i) => (
              <SongCard key={s.id || s.jamendo_id || i} song={s} queue={genreSongs} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Listening History */}
      {listenHistory.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#778293]" />
            <h2 className="section-title mb-0 text-[#A7B0BE]">Recently Played History</h2>
          </div>
          <div className="bg-[#151C25] border border-[#273241] rounded-2xl space-y-1 p-2">
            {listenHistory.slice(0, 6).map((h, i) => (
              <div
                key={h.id || i}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#1B2633] transition-colors"
              >
                <span className="text-xs text-[#778293] w-5 font-mono">{i + 1}</span>
                {h.song_cover ? (
                  <img src={h.song_cover} className="w-9 h-9 rounded-lg object-cover border border-[#273241]" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[#10151C] border border-[#273241] flex items-center justify-center text-xs text-[#778293]">♪</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-[#F5F7FA]">{h.song_title || 'Untitled'}</p>
                  <p className="text-xs text-[#778293] truncate">{h.song_artist || 'Unknown'}</p>
                </div>
                <span className="text-xs text-[#778293] font-mono">{new Date(h.played_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
