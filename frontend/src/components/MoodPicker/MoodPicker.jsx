import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader, Zap } from 'lucide-react'
import { fetchByMood } from '../../services/jamendo'
import usePlayerStore from '../../store/playerStore'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const MOODS = [
  { id: 'happy',     emoji: '😊', label: 'Happy',      color: '#20C997' },
  { id: 'calm',      emoji: '😌', label: 'Calm',       color: '#20C997' },
  { id: 'energetic', emoji: '⚡', label: 'Energetic',  color: '#34D399' },
  { id: 'focused',   emoji: '🎯', label: 'Focused',    color: '#06B6D4' },
  { id: 'sad',       emoji: '😢', label: 'Melancholy', color: '#818CF8' },
  { id: 'romantic',  emoji: '❤️', label: 'Romantic',   color: '#F472B6' },
  { id: 'party',     emoji: '🎊', label: 'Party',      color: '#FB923C' },
  { id: 'workout',   emoji: '💪', label: 'Workout',    color: '#FBBF24' },
  { id: 'sleepy',    emoji: '😴', label: 'Sleepy',     color: '#A78BFA' },
  { id: 'angry',     emoji: '🔥', label: 'Intense',    color: '#F87171' },
]

const QUICK_PROMPTS = [
  { label: '💻 Deep Code Focus', mood: 'focused', text: 'concentrated deep work coding session' },
  { label: '⚡ Gym Workout Pump', mood: 'workout', text: 'intense gym training and power workout' },
  { label: '☕ Cozy Coffee Chill', mood: 'calm', text: 'relaxing morning coffee and peaceful acoustic vibes' },
  { label: '🌧️ Melancholy Rain', mood: 'sad', text: 'rainy window blues and nostalgic memories' },
  { label: '🎉 Weekend Party', mood: 'party', text: 'dance party celebration club energy' },
  { label: '🌙 Midnight Sleep', mood: 'sleepy', text: 'calm ambient sleep night meditation' },
]

const KEYWORD_MAP = {
  happy: ['happy', 'joy', 'smile', 'blessed', 'excited', 'good', 'great', 'awesome', 'wonderful', 'fun', 'cheerful', 'bright'],
  calm: ['calm', 'relax', 'peace', 'chill', 'zen', 'serene', 'tranquil', 'soothing', 'breeze', 'coffee', 'meditate'],
  energetic: ['energy', 'pump', 'hype', 'speed', 'jump', 'electric', 'fire', 'active', 'fast', 'power', 'alive'],
  focused: ['focus', 'study', 'code', 'coding', 'program', 'work', 'deep', 'concentrate', 'read', 'think', 'office'],
  sad: ['sad', 'cry', 'lonely', 'miss', 'heartbreak', 'grief', 'down', 'blue', 'tears', 'alone', 'hurt', 'nostalgic'],
  romantic: ['love', 'romantic', 'crush', 'heart', 'kiss', 'date', 'sweet', 'lover', 'honey', 'passion'],
  party: ['party', 'club', 'dance', 'disco', 'celebrate', 'drink', 'nightout', 'banger', 'edm', 'dj'],
  workout: ['workout', 'gym', 'lift', 'run', 'cardio', 'sweat', 'muscle', 'exercise', 'training', 'gains'],
  sleepy: ['sleep', 'tired', 'bed', 'night', 'rest', 'dream', 'drowsy', 'cozy', 'lullaby', 'midnight'],
  angry: ['angry', 'mad', 'rage', 'furious', 'metal', 'screaming', 'heavy', 'hate', 'intense', 'loud', 'fire'],
}

function detectMoodClient(input) {
  const lower = (input || '').toLowerCase()
  let bestMood = 'calm'
  let highestScore = 0

  for (const [mood, words] of Object.entries(KEYWORD_MAP)) {
    const score = words.filter(w => lower.includes(w)).length
    if (score > highestScore) {
      highestScore = score
      bestMood = mood
    }
  }
  return bestMood
}

export default function MoodPicker({ onResult }) {
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const { setQueue, setActiveMood } = usePlayerStore()

  const generate = async (moodId, customText) => {
    if (loading) return
    setLoading(true)

    const queryText = customText !== undefined ? customText : text
    let finalMood = moodId || 'calm'

    if (queryText?.trim()) {
      try {
        const { data } = await api.post('/mood/detect', { text: queryText.trim() })
        if (data.ok && data.mood) finalMood = data.mood
      } catch {
        finalMood = detectMoodClient(queryText)
      }
    } else {
      api.post('/mood/detect', { text: '', emoji: MOODS.find(m => m.id === moodId)?.emoji || '' }).catch(() => {})
    }

    const matchedConfig = MOODS.find(m => m.id === finalMood) || MOODS[1]
    setSelected(finalMood)
    setActiveMood(finalMood, matchedConfig.color)

    try {
      const songs = await fetchByMood(finalMood, 24)
      if (!songs || songs.length === 0) {
        toast.error('No songs returned for this mood — trying fallback playlist')
        return
      }

      setQueue(songs, 0)
      toast.success(`${matchedConfig.emoji} Queue set for ${matchedConfig.label} (${songs.length} tracks)`)
      onResult?.(finalMood, songs)
    } catch {
      toast.error('Music stream connection issue. Retrying...')
    } finally {
      setLoading(false)
    }
  }

  const handlePromptClick = (prompt) => {
    setText(prompt.text)
    generate(prompt.mood, prompt.text)
  }

  return (
    <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-6 space-y-5 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#20C997] flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#F5F7FA]">How are you feeling right now?</h2>
            <p className="text-xs text-[#778293]">Select a mood or describe your current state to curate the sound</p>
          </div>
        </div>

        {selected && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-[#20C997]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
            Active: <span className="capitalize">{selected}</span>
          </span>
        )}
      </div>

      {/* Smart Text input */}
      <div className="relative">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (text.trim() || selected) && generate(selected || detectMoodClient(text))}
          placeholder="Describe your vibe (e.g. 'Late night deep coding session' or 'High energy cardio workout')..."
          className="input h-12 text-sm pl-4 pr-24 bg-[#10151C] border-[#273241] focus:border-[#20C997] rounded-xl text-[#F5F7FA] placeholder-[#778293]"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {text && (
            <button
              onClick={() => setText('')}
              className="px-2 py-1 text-xs text-[#778293] hover:text-[#F5F7FA]"
            >
              ✕
            </button>
          )}
          <button
            disabled={loading || (!text.trim() && !selected)}
            onClick={() => generate(selected || detectMoodClient(text))}
            className="btn-primary btn-sm h-8 px-3 rounded-lg text-xs flex items-center gap-1 font-semibold"
          >
            {loading ? <Loader size={12} className="animate-spin text-[#0B0F14]" /> : <Sparkles size={12} />}
            <span>Tune</span>
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] text-[#778293] uppercase tracking-wider font-semibold whitespace-nowrap mr-1 flex items-center gap-1">
          <Zap size={11} className="text-[#20C997]" /> Vibes:
        </span>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => handlePromptClick(p)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#10151C] hover:bg-[#1B2633] border border-[#273241] text-[#A7B0BE] hover:text-[#F5F7FA] transition-all whitespace-nowrap flex-shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Mood Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {MOODS.map(m => {
          const isSelected = selected === m.id
          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => generate(m.id)}
              disabled={loading}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 relative overflow-hidden group ${
                isSelected
                  ? 'border-[#20C997] bg-emerald-500/10 shadow-sm text-[#20C997]'
                  : 'border-[#273241] bg-[#10151C] hover:bg-[#1B2633] hover:border-[#37475D] text-[#A7B0BE] hover:text-[#F5F7FA]'
              }`}
            >
              <span className="text-2xl mb-1 group-hover:scale-105 transition-transform">
                {m.emoji}
              </span>
              <span className="text-xs font-medium">
                {m.label}
              </span>

              {loading && isSelected && (
                <div className="absolute inset-0 bg-[#0B0F14]/75 backdrop-blur-[2px] flex items-center justify-center">
                  <Loader size={16} className="animate-spin text-[#20C997]" />
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
