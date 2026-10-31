'use strict';
const { query, queryOne } = require('../config/db');

const MOOD_KEYWORDS = {
  happy    : ['happy','joy','excited','great','awesome','wonderful','amazing','fantastic','love','blessed','grateful','😊','😄','🎉','❤️','🥳'],
  sad      : ['sad','cry','depressed','unhappy','miss','lonely','hurt','heartbreak','down','blue','crying','😢','😭','💔','😞'],
  angry    : ['angry','mad','furious','frustrated','annoyed','rage','hate','upset','pissed','😠','😡','🤬','💢'],
  calm     : ['calm','peaceful','relax','chill','quiet','serene','meditate','zen','tranquil','😌','🧘','🌿','☮️'],
  energetic: ['energetic','pump','workout','run','gym','dance','hype','motivated','strong','power','💪','🏃','⚡','🔥','🏋️'],
  romantic : ['love','romantic','date','heart','crush','miss you','adore','sweet','💕','💖','🌹','💝','😍'],
  focused  : ['focus','study','work','concentrate','productive','code','grind','deep work','📚','💻','🎯','🧠'],
  sleepy   : ['sleepy','tired','exhausted','rest','bed','night','sleep','drowsy','yawn','😴','🌙','💤'],
  party    : ['party','celebrate','club','nightout','vibe','banger','lit','tonight','🎊','🍾','🎵','🥂'],
  workout  : ['gym','workout','exercise','training','sweat','gains','lifting','running','🏋️','🏃','💦','🏅'],
};

const MOOD_EMOJIS = {
  happy:'😊', sad:'😢', angry:'😠', calm:'😌',
  energetic:'⚡', romantic:'❤️', focused:'🎯',
  sleepy:'😴', party:'🎊', workout:'💪',
};

function detectMood(text) {
  const lower = (text || '').toLowerCase();
  const scores = {};
  for (const [mood, kws] of Object.entries(MOOD_KEYWORDS)) {
    scores[mood] = kws.filter(kw => lower.includes(kw.toLowerCase())).length;
  }
  const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
  return { mood: best[1] > 0 ? best[0] : 'calm', confidence: best[1] };
}

/* POST /api/mood/detect */
exports.detect = async (req, res) => {
  try {
    const { text, emoji } = req.body;
    if (!text && !emoji) return res.status(400).json({ ok: false, msg: 'text or emoji required' });

    const combined = `${text||''} ${emoji||''}`;
    const { mood, confidence } = detectMood(combined);

    // Save if logged in
    if (req.user) {
      await query(
        'INSERT INTO mood_history (user_id, mood, emoji, input_text) VALUES (?,?,?,?)',
        [req.user.id, mood, MOOD_EMOJIS[mood]||null, text||null]
      );
    }

    return res.json({ ok: true, mood, emoji: MOOD_EMOJIS[mood]||'🎵', confidence: Math.min(confidence/3, 1) });
  } catch (err) {
    console.error('detect:', err);
    return res.status(500).json({ ok: false, msg: 'Detection failed' });
  }
};

/* GET /api/mood/history */
exports.history = async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM mood_history WHERE user_id=? ORDER BY created_at DESC LIMIT 60',
      [req.user.id]
    );
    return res.json({ ok: true, history: rows });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};

/* GET /api/mood/stats */
exports.stats = async (req, res) => {
  try {
    const [distribution, weekly] = await Promise.all([
      query(
        `SELECT mood, COUNT(*) AS count FROM mood_history WHERE user_id=? GROUP BY mood ORDER BY count DESC`,
        [req.user.id]
      ),
      query(
        `SELECT DATE(created_at) AS date, mood, COUNT(*) AS count
         FROM mood_history WHERE user_id=? AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at), mood ORDER BY date ASC`,
        [req.user.id]
      ),
    ]);
    return res.json({ ok: true, distribution, weekly });
  } catch {
    return res.status(500).json({ ok: false, msg: 'Failed' });
  }
};
