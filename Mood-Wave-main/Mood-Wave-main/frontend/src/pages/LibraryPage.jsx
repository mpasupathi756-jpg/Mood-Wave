import React, { useEffect, useState } from 'react'
import { Library, Heart, ListMusic, BarChart2, Plus, Loader, Smile } from 'lucide-react'
import { motion } from 'framer-motion'
import { SongRow } from '../components/SongCard/SongCard'
import api from '../services/api'
import usePlayerStore from '../store/playerStore'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MOOD_COLORS = {
  happy: '#20C997', sad: '#818CF8', energetic: '#34D399', calm: '#20C997',
  angry: '#F87171', romantic: '#F472B6', focused: '#06B6D4', sleepy: '#A78BFA',
  party: '#FB923C', workout: '#FBBF24'
}
const TABS = ['Liked Songs', 'Playlists', 'Mood Journal']

export default function LibraryPage() {
  const [tab, setTab]             = useState(0)
  const [playlists, setPlaylists] = useState([])
  const [moodStats, setMoodStats] = useState([])
  const [moodHistory, setMoodHistory] = useState([])
  const [loading, setLoading]     = useState(true)
  const [newPL, setNewPL]         = useState(false)
  const [plName, setPlName]       = useState('')
  const { setQueue, likedSongs, loadLikedSongs } = usePlayerStore()

  useEffect(() => {
    setLoading(true)
    loadLikedSongs().catch(() => {})
    Promise.all([
      api.get('/playlists').catch(() => ({ data: { playlists: [] } })),
      api.get('/mood/stats').catch(() => ({ data: { distribution: [], weekly: [] } })),
      api.get('/mood/history').catch(() => ({ data: { history: [] } })),
    ]).then(([pl, ms, mh]) => {
      setPlaylists(pl.data.playlists || [])
      setMoodStats(ms.data.distribution || [])
      setMoodHistory(mh.data.history || [])
    }).finally(() => setLoading(false))
  }, [])

  const createPlaylist = async () => {
    if (!plName.trim()) return
    try {
      const { data } = await api.post('/playlists', { name: plName.trim() })
      if (data.ok) {
        setPlaylists(p => [...p, { id: data.id, name: plName.trim(), song_count: 0 }])
        setPlName('')
        setNewPL(false)
        toast.success('Playlist created!')
      }
    } catch {
      setPlaylists(p => [...p, { id: Date.now(), name: plName.trim(), song_count: 0 }])
      setPlName('')
      setNewPL(false)
      toast.success('Playlist created!')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center flex-shrink-0">
          <Library size={20} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F5F7FA]">Your Library</h1>
          <p className="text-[#778293] text-sm">Curated favorites, mood history & playlists</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#273241] pb-2">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              tab === i
                ? 'bg-[#20C997] text-[#0B0F14] shadow-sm'
                : 'text-[#778293] hover:text-[#F5F7FA] hover:bg-[#1B2633]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size={26} className="animate-spin text-[#20C997]" />
        </div>
      ) : tab === 0 ? (
        /* ── Liked Songs ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-[#20C997] fill-[#20C997]" />
              <span className="font-semibold text-sm text-[#F5F7FA]">{likedSongs.length} liked tracks</span>
            </div>
            {likedSongs.length > 0 && (
              <button
                onClick={() => setQueue(likedSongs, 0)}
                className="btn-primary btn-sm font-semibold"
              >
                Play All Liked
              </button>
            )}
          </div>

          {likedSongs.length === 0 ? (
            <div className="bg-[#151C25] border border-[#273241] rounded-2xl text-center py-20 text-[#778293] space-y-3">
              <Heart size={40} className="mx-auto opacity-30 text-[#20C997]" />
              <p className="text-base font-semibold text-[#F5F7FA]">No liked songs yet</p>
              <p className="text-xs text-[#778293] max-w-sm mx-auto">
                Click the heart icon on any song to save it to your personal favorites library.
              </p>
            </div>
          ) : (
            <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-2 space-y-1">
              {likedSongs.map((s, i) => (
                <SongRow
                  key={s.id || s.jamendo_id || i}
                  song={s}
                  queue={likedSongs}
                  index={i}
                  num={i + 1}
                  showAlbum
                />
              ))}
            </div>
          )}
        </div>
      ) : tab === 1 ? (
        /* ── Playlists ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-[#A7B0BE]">{playlists.length} playlists</span>
            <button onClick={() => setNewPL(p => !p)} className="btn-primary btn-sm font-semibold">
              <Plus size={15} /> New Playlist
            </button>
          </div>

          {newPL && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151C25] border border-[#273241] p-3 rounded-xl flex gap-2">
              <input
                value={plName}
                onChange={e => setPlName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                className="input flex-1 text-sm py-2 bg-[#10151C] border-[#273241]"
                placeholder="Give your playlist a title..."
                autoFocus
              />
              <button onClick={createPlaylist} className="btn-primary btn-sm font-semibold">Create</button>
              <button onClick={() => setNewPL(false)} className="btn-ghost btn-sm">✕</button>
            </motion.div>
          )}

          {playlists.length === 0 ? (
            <div className="bg-[#151C25] border border-[#273241] rounded-2xl text-center py-20 text-[#778293] space-y-2">
              <ListMusic size={40} className="mx-auto opacity-30 text-[#20C997]" />
              <p className="text-base font-semibold text-[#F5F7FA]">No custom playlists yet</p>
              <p className="text-xs text-[#778293]">Create your first collection using the button above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map(pl => (
                <div key={pl.id} className="bg-[#151C25] border border-[#273241] hover:bg-[#1B2633] hover:border-[#37475D] rounded-2xl p-4 cursor-pointer group transition-all">
                  <div className="w-full aspect-square rounded-xl bg-[#10151C] border border-[#273241] flex items-center justify-center mb-3 text-[#20C997] group-hover:scale-[1.02] transition-transform">
                    <ListMusic size={32} />
                  </div>
                  <p className="font-semibold text-sm truncate text-[#F5F7FA]">{pl.name}</p>
                  <p className="text-xs text-[#778293] mt-0.5">{pl.song_count || 0} songs</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Mood Journal ── */
        <div className="space-y-6">
          <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#20C997]" />
              <h2 className="font-display font-semibold text-base text-[#F5F7FA]">Emotional Soundscape Breakdown</h2>
            </div>
            {moodStats.length === 0 ? (
              <div className="text-center py-10 text-[#778293] text-sm">
                <Smile size={32} className="mx-auto mb-2 opacity-30 text-[#20C997]" />
                Listen to songs and pick moods to generate your emotional journey analytics.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moodStats}>
                    <XAxis dataKey="mood" stroke="#778293" tick={{ fontSize: 12, fill: '#778293' }} />
                    <YAxis stroke="#778293" tick={{ fontSize: 12, fill: '#778293' }} />
                    <Tooltip
                      contentStyle={{ background: '#10151C', border: '1px solid #273241', borderRadius: '10px', color: '#F5F7FA' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {moodStats.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={MOOD_COLORS[entry.mood] || '#20C997'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* History stream */}
          <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 space-y-3">
            <h3 className="font-semibold text-xs text-[#778293] uppercase tracking-wider">Recent Mood Logs</h3>
            {moodHistory.length === 0 ? (
              <p className="text-[#778293] text-xs">No recent mood logs recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {moodHistory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#10151C] border border-[#273241]">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji || '🎵'}</span>
                      <div>
                        <p className="text-sm font-semibold capitalize text-[#F5F7FA]">{item.mood}</p>
                        {item.input_text && <p className="text-xs text-[#778293] italic">"{item.input_text}"</p>}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#778293] font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
