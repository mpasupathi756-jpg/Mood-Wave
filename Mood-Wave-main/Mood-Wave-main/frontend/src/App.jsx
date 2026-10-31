import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import AppLayout    from './components/Layout/AppLayout'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage     from './pages/HomePage'
import SearchPage   from './pages/SearchPage'
import LibraryPage  from './pages/LibraryPage'
import ProfilePage  from './pages/ProfilePage'
import NowPlaying   from './pages/NowPlaying'
import RoomPage     from './pages/RoomPage'
import AdminPage    from './pages/AdminPage'

function Guard({ children, admin }) {
  const { isAuthenticated, user, loading } = useAuthStore()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0B0F14]">
      <div className="w-10 h-10 border-2 border-[#20C997] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (admin && user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuthStore()
  if (loading) return null
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background:'#151C25', color:'#F5F7FA', border:'1px solid #273241', borderRadius:'12px', fontSize:'13px' },
          success: { iconTheme: { primary:'#20C997', secondary:'#0B0F14' } },
        }}
      />
      <Routes>
        <Route path="/login"    element={<PublicOnly><LoginPage    /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

        <Route path="/" element={<Guard><AppLayout /></Guard>}>
          <Route index          element={<HomePage   />} />
          <Route path="search"  element={<SearchPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="now"     element={<NowPlaying  />} />
          <Route path="room"    element={<RoomPage    />} />
          <Route path="room/:code" element={<RoomPage />} />
        </Route>

        <Route path="/admin/*" element={<Guard admin><AdminPage /></Guard>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
