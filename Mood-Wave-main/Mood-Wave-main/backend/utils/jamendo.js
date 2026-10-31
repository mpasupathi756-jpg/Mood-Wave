'use strict';
const axios = require('axios');

const CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '24b564e3';
const BASE      = 'https://api.jamendo.com/v3.0';

const MOOD_TAG_MAP = {
  happy    : 'happy pop upbeat cheerful',
  sad      : 'sad melancholy emotional blues',
  energetic: 'energetic rock dance party workout',
  calm     : 'calm ambient chill relaxing meditation',
  angry    : 'aggressive metal intense punk',
  romantic : 'romantic love ballad acoustic soulful',
  focused  : 'instrumental electronic study focus concentration',
  sleepy   : 'sleep lullaby soft piano ambient',
  party    : 'dance edm house party club',
  workout  : 'workout gym motivation sport rock',
};

/** Normalise a Jamendo track object to our internal shape */
function normalise(t) {
  return {
    id         : `j_${t.id}`,
    jamendo_id : String(t.id),
    title      : t.name        || 'Unknown',
    artist     : t.artist_name || 'Unknown Artist',
    album      : t.album_name  || '',
    duration   : t.duration    || 0,
    cover_url  : t.image       || `https://placehold.co/300x300/1a1a2e/5060f8?text=${encodeURIComponent(t.name||'🎵')}`,
    audio_url  : t.audio       || '',
    genre      : t.musicinfo?.tags?.genres?.[0]  || null,
    mood       : t.musicinfo?.tags?.vartags?.[0] || null,
    tags       : [
      ...(t.musicinfo?.tags?.genres  || []),
      ...(t.musicinfo?.tags?.vartags || []),
    ].join(','),
  };
}

const commonParams = (extra = {}) => ({
  client_id  : CLIENT_ID,
  format     : 'json',
  audioformat: 'mp32',
  imagesize  : 300,
  include    : 'musicinfo',
  ...extra,
});

async function fetchByMood(mood, limit = 20, offset = 0) {
  const tags = MOOD_TAG_MAP[mood] || mood;
  const { data } = await axios.get(`${BASE}/tracks/`, {
    params: commonParams({ limit, offset, tags, boost: 'popularity_week' }),
    timeout: 8000,
  });
  return (data.results || []).map(normalise);
}

async function searchTracks(q, limit = 24, offset = 0) {
  const { data } = await axios.get(`${BASE}/tracks/`, {
    params: commonParams({ limit, offset, search: q }),
    timeout: 8000,
  });
  return { tracks: (data.results || []).map(normalise), total: data.headers?.results_count || 0 };
}

async function fetchFeatured(limit = 12) {
  const { data } = await axios.get(`${BASE}/tracks/`, {
    params: commonParams({ limit, boost: 'popularity_total', order: 'popularity_total_desc' }),
    timeout: 8000,
  });
  return (data.results || []).map(normalise);
}

async function fetchByGenre(genre, limit = 20) {
  const { data } = await axios.get(`${BASE}/tracks/`, {
    params: commonParams({ limit, tags: genre.toLowerCase(), boost: 'popularity_week' }),
    timeout: 8000,
  });
  return (data.results || []).map(normalise);
}

async function fetchTrack(jamendoId) {
  const { data } = await axios.get(`${BASE}/tracks/`, {
    params: commonParams({ id: jamendoId }),
    timeout: 8000,
  });
  const t = (data.results || [])[0];
  return t ? normalise(t) : null;
}

module.exports = { fetchByMood, searchTracks, fetchFeatured, fetchByGenre, fetchTrack, MOOD_TAG_MAP };
