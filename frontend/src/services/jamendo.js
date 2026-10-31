import axios from 'axios'

const CID  = '24b564e3'
const BASE = 'https://api.jamendo.com/v3.0'

// Jamendo only accepts ONE tag at a time — use the most reliable single tag per mood
// Plus fallback tags if first returns 0 results
const MOOD_MAP = {
  happy    : { tags: ['happy', 'pop', 'upbeat'],        search: 'happy music' },
  sad      : { tags: ['sad', 'melancholy', 'blues'],    search: 'sad emotional' },
  energetic: { tags: ['energetic', 'rock', 'upbeat'],   search: 'energetic fast' },
  calm     : { tags: ['calm', 'ambient', 'chill'],      search: 'calm relaxing' },
  angry    : { tags: ['metal', 'rock', 'aggressive'],   search: 'intense metal' },
  romantic : { tags: ['romantic', 'love', 'acoustic'],  search: 'romantic love songs' },
  focused  : { tags: ['instrumental', 'ambient', 'electronic'], search: 'focus instrumental' },
  sleepy   : { tags: ['ambient', 'sleep', 'piano'],     search: 'soft sleep music' },
  party    : { tags: ['dance', 'electronic', 'edm'],    search: 'dance party' },
  workout  : { tags: ['rock', 'energetic', 'metal'],    search: 'workout gym' },
}

const defaults = (extra = {}) => ({
  client_id: CID,
  format   : 'json',
  audioformat: 'mp32',
  imagesize: 300,
  include  : 'musicinfo',
  ...extra,
})

const norm = t => ({
  id        : `j_${t.id}`,
  jamendo_id: String(t.id),
  title     : t.name         || 'Unknown',
  artist    : t.artist_name  || 'Unknown Artist',
  album     : t.album_name   || '',
  duration  : t.duration     || 0,
  cover_url : t.image        || `https://placehold.co/300x300/12121f/8b5cf6?text=Music`,
  audio_url : t.audio        || '',
  genre     : t.musicinfo?.tags?.genres?.[0]  || null,
  mood      : t.musicinfo?.tags?.vartags?.[0] || null,
  tags      : [...(t.musicinfo?.tags?.genres || []), ...(t.musicinfo?.tags?.vartags || [])].join(','),
})

// Try each tag until we get results, then merge
export const fetchByMood = async (mood, limit = 25) => {
  const config = MOOD_MAP[mood] || MOOD_MAP.calm
  const perTag = Math.ceil(limit / config.tags.length)
  const seen   = new Set()
  const results = []

  // Try each tag in parallel
  const promises = config.tags.map(tag =>
    axios.get(`${BASE}/tracks/`, {
      params : defaults({ limit: perTag, tags: tag, boost: 'popularity_week' }),
      timeout: 10000,
    }).then(r => r.data.results || []).catch(() => [])
  )

  const arrays = await Promise.all(promises)
  for (const arr of arrays) {
    for (const t of arr) {
      if (!seen.has(t.id) && t.audio) {
        seen.add(t.id)
        results.push(norm(t))
      }
    }
  }

  // If still empty, fallback to text search
  if (results.length === 0) {
    try {
      const { data } = await axios.get(`${BASE}/tracks/`, {
        params : defaults({ limit, search: config.search, boost: 'popularity_total' }),
        timeout: 10000,
      })
      const fallback = (data.results || []).filter(t => t.audio)
      return fallback.map(norm)
    } catch { return [] }
  }

  return results.slice(0, limit)
}

export const searchTracks = async (q, limit = 24) => {
  try {
    const { data } = await axios.get(`${BASE}/tracks/`, {
      params : defaults({ limit, search: q }),
      timeout: 10000,
    })
    const tracks = (data.results || []).filter(t => t.audio).map(norm)
    return { tracks, total: data.headers?.results_count || 0 }
  } catch { return { tracks: [], total: 0 } }
}

export const fetchFeatured = async (limit = 16) => {
  try {
    const { data } = await axios.get(`${BASE}/tracks/`, {
      params : defaults({ limit, boost: 'popularity_total', order: 'popularity_total_desc' }),
      timeout: 10000,
    })
    return (data.results || []).filter(t => t.audio).map(norm)
  } catch { return [] }
}

export const fetchByGenre = async (genre, limit = 20) => {
  try {
    const { data } = await axios.get(`${BASE}/tracks/`, {
      params : defaults({ limit, tags: genre.toLowerCase(), boost: 'popularity_week' }),
      timeout: 10000,
    })
    const results = (data.results || []).filter(t => t.audio)
    if (results.length === 0) {
      const { data: d2 } = await axios.get(`${BASE}/tracks/`, {
        params: defaults({ limit, search: genre, boost: 'popularity_total' }),
        timeout: 10000,
      })
      return (d2.results || []).filter(t => t.audio).map(norm)
    }
    return results.map(norm)
  } catch { return [] }
}

