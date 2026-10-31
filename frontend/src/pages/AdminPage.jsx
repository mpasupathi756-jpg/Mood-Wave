import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  BarChart2, Users, Music, Shield, Home, Loader,
  Plus, Trash2, X, Check, Search, RefreshCw,
  Download, Eye, EyeOff, Activity, AlertTriangle
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const MOOD_COLORS = {
  happy:'#f59e0b', sad:'#818cf8', energetic:'#ef4444', calm:'#22c55e',
  angry:'#dc2626', romantic:'#ec4899', focused:'#06b6d4', sleepy:'#6366f1',
  party:'#f97316', workout:'#eab308'
}

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, color='text-[#20C997]', icon: Icon }) {
  return (
    <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-4 flex items-center gap-4">
      {Icon && <div className={`w-10 h-10 rounded-xl bg-[#10151C] border border-[#273241] flex items-center justify-center ${color}`}><Icon size={20}/></div>}
      <div>
        <p className={`font-display text-3xl font-bold ${color}`}>{value?.toLocaleString()}</p>
        <p className="text-xs text-[#778293] font-medium">{label}</p>
        {sub && <p className="text-xs text-[#778293] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Dashboard ───────────────────────────────────────────────── */
function Dashboard() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(r => setData(r.data)).catch(()=>toast.error('Failed to load stats')).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-[#20C997]"/></div>
  if (!data)   return <p className="text-[#F87171]">Failed to load stats</p>

  const { stats, topSongs, moodDist, userGrowth, genreDist, recentActivity } = data

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-[#F5F7FA]">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Users"   value={stats.totalUsers}    color="text-blue-400"   icon={Users}/>
        <StatCard label="Total Songs"   value={stats.totalSongs}    color="text-[#20C997]"  icon={Music}/>
        <StatCard label="Total Rooms"   value={stats.totalRooms}    color="text-[#F59E0B]"  icon={BarChart2}/>
        <StatCard label="Total Plays"   value={stats.totalPlays}    color="text-pink-400"   icon={Activity}/>
        <StatCard label="Active Rooms"  value={stats.activeRooms}   color="text-cyan-400"   icon={BarChart2}/>
        <StatCard label="New Today"     value={stats.newUsersToday} color="text-[#20C997]"  icon={Plus}/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User growth */}
        {userGrowth.length > 0 && (
          <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-[#A7B0BE] mb-4">User Growth — Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#273241"/>
                <XAxis dataKey="dt" tick={{fill:'#778293',fontSize:10}}/>
                <YAxis tick={{fill:'#778293',fontSize:10}} width={24}/>
                <Tooltip contentStyle={{background:'#10151C',border:'1px solid #273241',borderRadius:8,fontSize:12,color:'#F5F7FA'}} labelStyle={{color:'#fff'}}/>
                <Line type="monotone" dataKey="cnt" stroke="#20C997" strokeWidth={2} dot={{r:3,fill:'#20C997'}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mood distribution */}
        {moodDist.length > 0 && (
          <div className="bg-[#151C25] border border-[#273241] rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-[#A7B0BE] mb-4">Mood Distribution</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={moodDist}>
                <XAxis dataKey="mood" tick={{fill:'#778293',fontSize:10}}/>
                <YAxis tick={{fill:'#778293',fontSize:10}} width={24}/>
                <Tooltip contentStyle={{background:'#10151C',border:'1px solid #273241',borderRadius:8,fontSize:12,color:'#F5F7FA'}} labelStyle={{color:'#fff'}}/>
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {moodDist.map(e => <Cell key={e.mood} fill={MOOD_COLORS[e.mood]||'#20C997'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top songs + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-sm text-white/60 mb-3">🔥 Top Songs</h3>
          <div className="space-y-2">
            {topSongs.map((s,i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-white/25 w-5 flex-shrink-0">{i+1}</span>
                {s.cover_url && <img src={s.cover_url} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt=""/>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-white/40 truncate">{s.artist}</p>
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">{s.play_count} plays</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-sm text-white/60 mb-3">⚡ Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.slice(0,8).map((a,i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {a.song_cover && <img src={a.song_cover} className="w-7 h-7 rounded-md object-cover flex-shrink-0" alt=""/>}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-white/80 truncate">{a.username}</span>
                  <span className="text-white/40"> played </span>
                  <span className="truncate text-white/60">{a.song_title}</span>
                </div>
                <span className="text-xs text-white/25 flex-shrink-0">{new Date(a.played_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Users ───────────────────────────────────────────────────── */
function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ username:'', email:'', password:'', role:'user' })
  const [showPw, setShowPw]   = useState(false)

  const load = (q='') => {
    setLoading(true)
    api.get(`/admin/users?search=${q}&limit=50`)
      .then(r => setUsers(r.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const createUser = async () => {
    try {
      await api.post('/admin/users', newUser)
      toast.success('User created')
      setShowCreate(false)
      setNewUser({ username:'', email:'', password:'', role:'user' })
      load()
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  const toggleActive = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}`, { ...u, is_active: !u.is_active })
      toast.success(u.is_active ? 'User deactivated' : 'User activated')
      load(search)
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  const toggleRole = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}`, { ...u, role: u.role==='admin'?'user':'admin' })
      toast.success('Role updated')
      load(search)
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.username}? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${u.id}`)
      toast.success('User deleted')
      load(search)
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold">Users</h2>
        <span className="badge bg-white/8 text-white/50">{users.length}</span>
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input className="input pl-8 text-sm py-2 w-52" placeholder="Search..."
              value={search}
              onChange={e=>{setSearch(e.target.value);load(e.target.value)}}/>
          </div>
          <button onClick={()=>setShowCreate(s=>!s)} className="btn-primary btn-sm"><Plus size={14}/> Add User</button>
        </div>
      </div>

      {showCreate && (
        <div className="card space-y-3 border border-violet-500/25">
          <h3 className="font-semibold text-sm">Create New User</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Username</label>
              <input className="input text-sm" value={newUser.username} onChange={e=>setNewUser(p=>({...p,username:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Email</label>
              <input type="email" className="input text-sm" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))}/>
            </div>
            <div className="relative">
              <label className="text-xs text-white/50 block mb-1">Password</label>
              <input type={showPw?'text':'password'} className="input text-sm pr-9" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))}/>
              <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 bottom-2.5 text-white/30">
                {showPw?<EyeOff size={13}/>:<Eye size={13}/>}
              </button>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Role</label>
              <select className="input text-sm" value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createUser} className="btn-primary btn-sm"><Check size={13}/> Create</button>
            <button onClick={()=>setShowCreate(false)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-violet-400"/></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['ID','User','Email','Role','Status','Joined','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white/30 text-xs">{u.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                           style={{background: u.avatar_color||'#7c3aed'}}>
                        {u.username?.[0]}
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.role==='admin'?'bg-violet-600/20 text-violet-400':'bg-white/8 text-white/50'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_active?'bg-green-500/15 text-green-400':'bg-red-500/15 text-red-400'}`}>
                      {u.is_active?'Active':'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/35 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>toggleRole(u)} className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60">
                        {u.role==='admin'?'→ User':'→ Admin'}
                      </button>
                      <button onClick={()=>toggleActive(u)}
                        className={`btn-icon btn-sm ${u.is_active?'text-orange-400 hover:bg-orange-500/10':'text-green-400 hover:bg-green-500/10'}`}
                        title={u.is_active?'Deactivate':'Activate'}>
                        {u.is_active?<X size={13}/>:<Check size={13}/>}
                      </button>
                      <button onClick={()=>deleteUser(u)}
                        className="btn-icon btn-sm text-red-400 hover:bg-red-500/10"
                        title="Delete user">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-10 text-white/30"><Users size={32} className="mx-auto mb-2 opacity-30"/><p>No users found</p></div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Songs ───────────────────────────────────────────────────── */
function AdminSongs() {
  const [songs, setSongs]       = useState([])
  const [jamendo, setJamendo]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [jLoading, setJLoading] = useState(false)
  const [jQ, setJQ]             = useState('')
  const [tab, setTab]           = useState('db')
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ title:'', artist:'', genre:'', mood:'', audio_url:'', cover_url:'', duration:'' })

  const load = () => {
    setLoading(true)
    api.get('/songs?limit=50').then(r=>setSongs(r.data.songs||[])).finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [])

  const searchJamendo = async () => {
    if (!jQ.trim()) return
    setJLoading(true)
    try {
      const { data } = await api.get(`/songs/jamendo/search?q=${encodeURIComponent(jQ)}&limit=16`)
      setJamendo(data.tracks || [])
    } catch { toast.error('Jamendo search failed') }
    finally { setJLoading(false) }
  }

  const importTrack = async (t) => {
    try {
      await api.post('/songs/jamendo/import', t)
      toast.success(`Imported: ${t.title}`)
      load()
    } catch (err) { toast.error(err.response?.data?.msg || 'Already imported or failed') }
  }

  const addManual = async () => {
    if (!form.title || !form.artist || !form.audio_url) {
      toast.error('Title, artist, and audio URL are required'); return
    }
    try {
      await api.post('/songs', { ...form, duration: +form.duration || 0 })
      toast.success('Song added!')
      setShowAdd(false)
      setForm({ title:'', artist:'', genre:'', mood:'', audio_url:'', cover_url:'', duration:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed') }
  }

  const deleteSong = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/songs/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold">Songs</h2>
        <span className="badge bg-white/8 text-white/50">{songs.length}</span>
        <button onClick={()=>setShowAdd(s=>!s)} className="btn-primary btn-sm ml-auto"><Plus size={14}/> Add Manual</button>
      </div>

      {/* Tab: DB | Jamendo */}
      <div className="flex gap-1 border-b border-white/8">
        {['db','jamendo'].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all ${tab===t?'border-violet-500 text-white':'border-transparent text-white/40 hover:text-white'}`}>
            {t==='db'?`Library (${songs.length})`:'Import from Jamendo'}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="card space-y-3 border border-violet-500/25">
          <h3 className="font-semibold text-sm">Add Song Manually</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Title *',    key:'title'},     {label:'Artist *',   key:'artist'},
              {label:'Genre',      key:'genre'},     {label:'Mood',       key:'mood'},
              {label:'Audio URL *',key:'audio_url'}, {label:'Cover URL',  key:'cover_url'},
              {label:'Duration (s)',key:'duration'},
            ].map(({label,key})=>(
              <div key={key}>
                <label className="text-xs text-white/50 block mb-1">{label}</label>
                <input className="input text-sm" value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addManual} className="btn-primary btn-sm"><Check size={13}/> Add</button>
            <button onClick={()=>setShowAdd(false)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {tab==='db' ? (
        loading ? <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-violet-400"/></div> : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['','Title','Artist','Genre','Mood','Plays','Added By','Actions'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {songs.map(s=>(
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-2.5">
                      <img src={s.cover_url||'https://placehold.co/36x36/1a1a2e/8b5cf6?text=♪'} className="w-9 h-9 rounded-lg object-cover" alt=""
                        onError={e=>{e.target.src='https://placehold.co/36x36/1a1a2e/8b5cf6?text=♪'}}/>
                    </td>
                    <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{s.title}</td>
                    <td className="px-4 py-2.5 text-white/55 max-w-[120px] truncate">{s.artist}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{s.genre||'—'}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{s.mood||'—'}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{s.play_count}</td>
                    <td className="px-4 py-2.5 text-white/35 text-xs">{s.added_by_name||'System'}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={()=>deleteSong(s.id,s.title)} className="btn-icon btn-sm text-red-400 hover:bg-red-500/10">
                        <Trash2 size={13}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!songs.length && <div className="text-center py-10 text-white/30"><Music size={32} className="mx-auto mb-2 opacity-30"/><p>No songs yet</p></div>}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Search Jamendo (e.g. jazz, happy, ambient)..."
              value={jQ} onChange={e=>setJQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchJamendo()}/>
            <button onClick={searchJamendo} disabled={jLoading} className="btn-primary btn-sm">
              {jLoading?<Loader size={14} className="animate-spin"/>:<Search size={14}/>} Search
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {jamendo.map(t=>(
              <div key={t.jamendo_id} className="card-sm space-y-2">
                <img src={t.cover_url} alt={t.title}
                  className="w-full aspect-square rounded-xl object-cover"
                  onError={e=>{e.target.src='https://placehold.co/200x200/1a1a2e/8b5cf6?text=♪'}}/>
                <p className="text-sm font-semibold truncate">{t.title}</p>
                <p className="text-xs text-white/45 truncate">{t.artist}</p>
                <button onClick={()=>importTrack(t)} className="btn-primary w-full text-xs py-1.5">
                  <Download size={12}/> Import
                </button>
              </div>
            ))}
          </div>
          {!jamendo.length && !jLoading && jQ && (
            <p className="text-center text-white/30 py-8">No results — try different keywords</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Audit Log ───────────────────────────────────────────────── */
function AuditLog() {
  const [log, setLog]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/audit').then(r=>setLog(r.data.log||[])).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold">Audit Log</h2>
        <button onClick={()=>{setLoading(true);api.get('/admin/audit').then(r=>setLog(r.data.log||[])).finally(()=>setLoading(false))}}
          className="btn-ghost btn-sm ml-auto"><RefreshCw size={14}/> Refresh</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-violet-400"/></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Admin','Action','Target','Time'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map(l=>(
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-2.5 font-medium text-violet-400">{l.username}</td>
                  <td className="px-4 py-2.5"><span className="badge bg-white/8 text-white/60 font-mono text-xs">{l.action}</span></td>
                  <td className="px-4 py-2.5 text-white/45 max-w-[200px] truncate">{l.target||'—'}</td>
                  <td className="px-4 py-2.5 text-white/30 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!log.length && <div className="text-center py-10 text-white/30"><AlertTriangle size={28} className="mx-auto mb-2 opacity-30"/><p>No audit entries yet</p></div>}
        </div>
      )}
    </div>
  )
}

/* ── Admin Shell ─────────────────────────────────────────────── */
export default function AdminPage() {
  const { user } = useAuthStore()
  const NAV = [
    { to:'/admin',        label:'Dashboard', icon:BarChart2, end:true },
    { to:'/admin/users',  label:'Users',     icon:Users },
    { to:'/admin/songs',  label:'Songs',     icon:Music },
    { to:'/admin/audit',  label:'Audit Log', icon:Activity },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F14] text-[#F5F7FA]">
      {/* Admin sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#10151C] border-r border-[#273241] flex flex-col">
        <div className="px-5 py-5 border-b border-[#273241]">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#20C997]"/>
            <span className="font-display font-bold text-[#F5F7FA]">Admin Panel</span>
          </div>
          <p className="text-xs text-[#778293] mt-1">{user?.username}</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1">
          {NAV.map(({to,label,icon:Icon,end})=>(
            <NavLink key={to} to={to} end={end}
              className={({isActive})=>`nav-link ${isActive?'active':''}`}>
              <Icon size={16}/> {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-[#273241] pt-3">
          <Link to="/" className="nav-link text-[#A7B0BE] hover:text-[#F5F7FA]"><Home size={16}/> Back to App</Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B0F14]">
        <Routes>
          <Route index       element={<Dashboard />} />
          <Route path="users"  element={<AdminUsers />} />
          <Route path="songs"  element={<AdminSongs />} />
          <Route path="audit"  element={<AuditLog  />} />
        </Routes>
      </main>
    </div>
  )
}
