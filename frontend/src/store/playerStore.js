import { create } from 'zustand'
import { Howl } from 'howler'
import api from '../services/api'
import toast from 'react-hot-toast'

// Single Howl instance tracked outside store to avoid serialisation issues
let _howl    = null
let _ticker  = null
let _playStart = null  // timestamp when play began
let _playPos   = 0     // position at last play/seek

function stopTicker() {
  if (_ticker) { clearInterval(_ticker); _ticker = null }
}

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

const getStoredLikedSongs = () => {
  try {
    return JSON.parse(localStorage.getItem('mw_liked_songs') || '[]')
  } catch {
    return []
  }
}

const initialLiked = getStoredLikedSongs()
const initialLikedIds = new Set(initialLiked.map(s => String(s.id || s.jamendo_id)))

const usePlayerStore = create((set, get) => ({
  song     : null,
  queue    : [],
  qIdx     : 0,
  playing  : false,
  progress : 0,       // 0-1
  duration : 0,
  currentSec: 0,
  volume   : 0.8,
  shuffle  : false,
  repeat   : false,
  roomCode : null,
  roomHostId: null,
  loading  : false,

  // Mood atmosphere
  activeMood: 'calm',
  moodColor : '#10b981',
  setActiveMood: (mood, color) => set({ activeMood: mood, moodColor: color || '#8b5cf6' }),

  // Unified Like System
  likedSongs: initialLiked,
  likedSongIds: initialLikedIds,

  isLiked: (id) => {
    if (!id) return false
    return get().likedSongIds.has(String(id))
  },

  toggleLike: async (songToToggle) => {
    if (!songToToggle) return false
    const sId = String(songToToggle.id || songToToggle.jamendo_id)
    const { likedSongs, likedSongIds, song } = get()
    const alreadyLiked = likedSongIds.has(sId)

    let nextLikedSongs
    const nextLikedIds = new Set(likedSongIds)

    if (alreadyLiked) {
      nextLikedSongs = likedSongs.filter(s => String(s.id || s.jamendo_id) !== sId)
      nextLikedIds.delete(sId)
      toast.success('Removed from Liked Songs')
    } else {
      const enriched = { ...songToToggle, liked: true }
      nextLikedSongs = [enriched, ...likedSongs.filter(s => String(s.id || s.jamendo_id) !== sId)]
      nextLikedIds.add(sId)
      toast.success('Added to Liked Songs ❤️')
    }

    // Save locally immediately
    try {
      localStorage.setItem('mw_liked_songs', JSON.stringify(nextLikedSongs))
    } catch {}

    // Update state
    set({
      likedSongs: nextLikedSongs,
      likedSongIds: nextLikedIds,
      song: song && String(song.id || song.jamendo_id) === sId ? { ...song, liked: !alreadyLiked } : song,
    })

    // Sync with backend if possible
    try {
      const targetParam = songToToggle.id || songToToggle.jamendo_id
      await api.post(`/songs/${targetParam}/like`, { song: songToToggle })
    } catch (e) {
      // Ignored for guest/offline mode - local like remains active
    }

    return !alreadyLiked
  },

  loadLikedSongs: async () => {
    try {
      const { data } = await api.get('/songs/liked')
      if (data?.ok && Array.isArray(data.songs)) {
        const local = getStoredLikedSongs()
        // Merge server and local
        const map = new Map()
        local.forEach(s => map.set(String(s.id || s.jamendo_id), s))
        data.songs.forEach(s => map.set(String(s.id || s.jamendo_id), { ...s, liked: true }))
        const merged = Array.from(map.values())
        const mergedIds = new Set(merged.map(s => String(s.id || s.jamendo_id)))
        localStorage.setItem('mw_liked_songs', JSON.stringify(merged))
        set({ likedSongs: merged, likedSongIds: mergedIds })
      }
    } catch {}
  },

  // ── Internal: load Howl ────────────────────────────────────────
  _load: (song, autoplay = true) => {
    stopTicker()
    if (_howl) { _howl.unload(); _howl = null }
    if (!song?.audio_url) return

    set({ song, loading: true, progress: 0, currentSec: 0, duration: 0, playing: false })
    _playPos = 0

    _howl = new Howl({
      src    : [song.audio_url],
      html5  : true,
      volume : get().volume,
      format : ['mp3'],
      onload : () => {
        set({ duration: _howl.duration(), loading: false })
        if (autoplay) _howl.play()
      },
      onplay : () => {
        _playStart = Date.now()
        set({ playing: true, loading: false })

        // Native OS Media Session Integration (Windows / macOS / Mobile media overlays)
        if ('mediaSession' in navigator) {
          try {
            navigator.mediaSession.metadata = new window.MediaMetadata({
              title  : song.title || 'MoodWave Stream',
              artist : song.artist || 'MoodWave',
              album  : song.album || 'MoodWave Sessions',
              artwork: [
                { src: song.cover_url, sizes: '300x300', type: 'image/jpeg' },
                { src: song.cover_url, sizes: '512x512', type: 'image/jpeg' }
              ]
            })
            navigator.mediaSession.setActionHandler('play', () => get().toggle())
            navigator.mediaSession.setActionHandler('pause', () => get().toggle())
            navigator.mediaSession.setActionHandler('previoustrack', () => get().prev())
            navigator.mediaSession.setActionHandler('nexttrack', () => get().next())
            navigator.mediaSession.setActionHandler('seekto', (details) => {
              if (details.seekTime !== undefined) get().seekToSec(details.seekTime)
            })
            navigator.mediaSession.playbackState = 'playing'
          } catch {}
        }

        _ticker = setInterval(() => {
          if (!_howl) return
          const pos = _howl.seek() ?? 0
          const dur = _howl.duration() || 1
          set({ progress: pos / dur, currentSec: pos })
        }, 250)
      },
      onpause: () => {
        stopTicker()
        _playPos = _howl?.seek() ?? 0
        set({ playing: false })
        if ('mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'paused' } catch {}
        }
      },
      onstop : () => {
        stopTicker()
        set({ playing: false, progress: 0, currentSec: 0 })
        if ('mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'none' } catch {}
        }
      },
      onend  : () => {
        stopTicker()
        set({ playing: false })
        const dur = _howl?.duration() || 0
        const { song } = get()
        if (song) {
          api.post('/songs/play', {
            jamendo_id   : song.jamendo_id || null,
            song_title   : song.title,
            song_artist  : song.artist,
            song_cover   : song.cover_url,
            duration_played: Math.round(dur),
            completed    : 1,
          }).catch(() => {})
        }
        get()._advance()
      },
      onloaderror: (_, err) => {
        console.warn('Playback stream error, automatically advancing:', err)
        set({ loading: false, playing: false })
        toast.error('Stream unreachable — skipping to next track')
        setTimeout(() => {
          const { queue } = get()
          if (queue.length > 1) get().next()
        }, 1000)
      },
      onplayerror: (_, err) => {
        console.warn('Audio autoplay blocked, awaiting interaction:', err)
        set({ loading: false, playing: false })
        _howl?.once('unlock', () => {
          _howl?.play()
        })
      },
    })
  },

  // ── Internal: auto-advance ─────────────────────────────────────
  _advance: () => {
    const { queue, qIdx, shuffle, repeat } = get()
    if (!queue.length) return
    if (repeat) { get()._load(queue[qIdx]); return }
    let next = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (qIdx + 1) % queue.length
    set({ qIdx: next })
    get()._load(queue[next])
  },

  // ── Public API ────────────────────────────────────────────────
  setQueue: (songs, startIdx = 0) => {
    if (!songs?.length) return
    set({ queue: songs, qIdx: startIdx })
    get()._load(songs[startIdx])
  },

  playSong: (song) => {
    const { queue } = get()
    let idx = queue.findIndex(s => (s.id && s.id === song.id) || (s.jamendo_id && s.jamendo_id === song.jamendo_id))
    if (idx === -1) { set(s => ({ queue: [song, ...s.queue], qIdx: 0 })); idx = 0 }
    else set({ qIdx: idx })
    get()._load(song)
  },

  toggle: () => {
    if (!_howl) return
    if (get().playing) _howl.pause()
    else _howl.play()
  },

  seek: (ratio) => {
    if (!_howl) return
    const pos = ratio * (get().duration || 0)
    _howl.seek(pos)
    _playPos = pos
    _playStart = Date.now()
    set({ progress: ratio, currentSec: pos })
  },

  seekToSec: (sec) => {
    if (!_howl) return
    _howl.seek(sec)
    const dur = get().duration || 1
    set({ progress: sec / dur, currentSec: sec })
  },

  setVolume: (v) => {
    const vol = Math.max(0, Math.min(1, v))
    if (_howl) _howl.volume(vol)
    set({ volume: vol })
  },

  toggleMute: () => {
    const { volume, prevVolume } = get()
    if (volume > 0) {
      if (_howl) _howl.volume(0)
      set({ prevVolume: volume, volume: 0 })
    } else {
      const restore = prevVolume || 0.8
      if (_howl) _howl.volume(restore)
      set({ volume: restore })
    }
  },

  next: () => {
    const { queue, qIdx, shuffle } = get()
    if (!queue.length) return
    const next = shuffle ? Math.floor(Math.random() * queue.length) : (qIdx + 1) % queue.length
    set({ qIdx: next })
    get()._load(queue[next])
  },

  prev: () => {
    const { queue, qIdx, currentSec } = get()
    if (!queue.length) return
    if (currentSec > 3) { get().seek(0); return }
    const prev = (qIdx - 1 + queue.length) % queue.length
    set({ qIdx: prev })
    get()._load(queue[prev])
  },

  toggleShuffle : () => set(s => ({ shuffle: !s.shuffle })),
  toggleRepeat  : () => set(s => ({ repeat:  !s.repeat  })),
  addToQueue    : (song) => set(s => ({ queue: [...s.queue, song] })),
  clearQueue    : () => { stopTicker(); if (_howl) { _howl.unload(); _howl = null } ; set({ queue: [], song: null, playing: false, progress: 0, currentSec: 0 }) },

  // For room sync — load without disturbing queue management
  roomLoad: (song, autoplay = true) => { get()._load(song, autoplay) },
  roomSeek: (sec) => { if (_howl) { _howl.seek(sec); set({ currentSec: sec, progress: sec / (get().duration || 1) }) } },
  roomPlay: () => { if (_howl && !get().playing) _howl.play() },
  roomPause: () => { if (_howl && get().playing) _howl.pause() },

  setRoomCode: (code) => set({ roomCode: code }),
  setRoomHostId: (hostId) => set({ roomHostId: hostId }),
  clearRoomCode: () => set({ roomCode: null, roomHostId: null }),

  fmt,
}))

export default usePlayerStore
