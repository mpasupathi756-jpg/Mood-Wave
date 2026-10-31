import React, { useState } from 'react'
import { Search, Loader, Sparkles, Play, Disc } from 'lucide-react'
import { SongCard } from '../components/SongCard/SongCard'
import { searchTracks } from '../services/jamendo'
import usePlayerStore from '../store/playerStore'
import toast from 'react-hot-toast'

const SEARCH_PRESETS = [
  'Chillhop Lo-Fi',
  'Deep House EDM',
  'Acoustic Indie',
  'Ambient Sleep',
  'Cyberpunk Synthwave',
  'Piano Meditation',
  'Epic Cinematic',
  'Upbeat Pop',
]

export function SearchPage() {
  const [q, setQ]             = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const setQueue = usePlayerStore(s => s.setQueue)

  const doSearch = async (query = q) => {
    const term = query.trim()
    if (!term) return
    setLoading(true)
    setSearched(true)
    try {
      const { tracks } = await searchTracks(term, 30)
      setResults(tracks)
      if (!tracks.length) toast('No tracks found for this term', { icon: '🔍' })
    } catch {
      toast.error('Search request failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetClick = (preset) => {
    setQ(preset)
    doSearch(preset)
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-xl mx-auto">
      {/* Title & Play Results */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#F5F7FA]">Search Tracks</h1>
          <p className="text-[#778293] text-sm mt-0.5">Explore over a million free tracks powered by Jamendo</p>
        </div>
        {results.length > 0 && !loading && (
          <button
            onClick={() => setQueue(results, 0)}
            className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Play size={13} fill="currentColor" /> Play Results ({results.length})
          </button>
        )}
      </div>

      {/* Search Input */}
      <form onSubmit={e => { e.preventDefault(); doSearch() }} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#778293]" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by artist, song title, vibe or genre..."
          className="input pl-11 pr-28 text-sm h-12 bg-[#10151C] border-[#273241] focus:border-[#20C997] rounded-xl text-[#F5F7FA] placeholder-[#778293]"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary btn-sm h-8 px-4 rounded-lg font-semibold"
        >
          {loading ? <Loader size={14} className="animate-spin text-[#0B0F14]" /> : 'Search'}
        </button>
      </form>

      {/* Quick Search Preset Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] text-[#778293] uppercase tracking-wider font-semibold whitespace-nowrap flex items-center gap-1">
          <Sparkles size={11} className="text-[#20C997]" /> Popular:
        </span>
        {SEARCH_PRESETS.map(preset => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#151C25] hover:bg-[#1B2633] border border-[#273241] text-[#A7B0BE] hover:text-[#F5F7FA] hover:border-[#37475D] transition-all whitespace-nowrap"
          >
            {preset}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size={30} className="animate-spin text-[#20C997]" />
        </div>
      ) : (
        <>
          {searched && (
            <p className="text-[#778293] text-xs">
              Found <span className="font-semibold text-[#F5F7FA]">{results.length}</span> track{results.length !== 1 ? 's' : ''} for "{q}"
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {results.map((s, i) => (
              <SongCard key={s.id || s.jamendo_id || i} song={s} queue={results} index={i} />
            ))}
          </div>

          {!searched && (
            <div className="bg-[#151C25] border border-[#273241] rounded-2xl text-center py-20 text-[#778293] space-y-3">
              <Disc size={44} className="mx-auto opacity-30 text-[#20C997]" />
              <p className="font-display text-lg text-[#F5F7FA] font-semibold">Discover High-Fidelity Tracks</p>
              <p className="text-xs text-[#778293] max-w-sm mx-auto">
                Type an artist, genre, or click a popular tag above to stream instantly with zero ads.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPage
