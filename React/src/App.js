import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import ResetPassword from './pages/ResetPassword'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import StudyMaterial from './pages/StudyMaterial'
import MockTestPortal from './pages/MockTestPortal'
import Blogs from './pages/Blogs'
import AiCoursesBlog from './pages/AiCoursesBlog'
import WhatsHappeningBlog from './pages/WhatsHappeningBlog'
import CdacCcatGuideBlog from './pages/CdacCcatGuideBlog'
import CdacCoursesComparisonBlog from './pages/CdacCoursesComparisonBlog'

function MaintenanceGate({ children }) {
  const MAINTENANCE = process.env.REACT_APP_MAINTENANCE_MODE === 'true'
  const location = useLocation()
  const path = location.pathname

  const isAlwaysOpen = path === '/login' || path === '/reset-password' || path.startsWith('/admin')
  const [status, setStatus] = useState(MAINTENANCE && !isAlwaysOpen ? 'checking' : 'allowed')

  useEffect(() => {
    if (!MAINTENANCE || isAlwaysOpen) {
      setStatus('allowed')
      return
    }

    let cancelled = false
    setStatus('checking')

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (!cancelled) setStatus('blocked')
          return
        }
        if (session.user.email === 'adminspp@datawiz.com') {
          if (!cancelled) setStatus('allowed')
          return
        }
        try {
          const res = await fetch('/api/maintenance-whitelist')
          const json = await res.json()
          const list = (json.emails || []).map(e => e.email.toLowerCase())
          if (!cancelled) {
            setStatus(list.includes(session.user.email.toLowerCase()) ? 'allowed' : 'blocked')
          }
        } catch {
          if (!cancelled) setStatus('blocked')
        }
      } catch {
        if (!cancelled) setStatus('blocked')
      }
    })()

    return () => { cancelled = true }
  }, [MAINTENANCE, isAlwaysOpen, path])

  if (!MAINTENANCE) return children
  if (isAlwaysOpen) return children
  if (status === 'allowed') return children
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-on-surface-variant">Loading...</div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-gutter text-center">
      <div className="max-w-md">
        <span className="material-symbols-outlined text-6xl text-outline mb-4">construction</span>
        <h1 className="font-headline-md text-headline-md mb-2">Under Maintenance</h1>
        <p className="text-on-surface-variant font-body-md text-body-md">
          We're currently performing some upgrades. Please check back shortly.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MaintenanceGate>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/study-material" element={<StudyMaterial />} />
          <Route path="/tests" element={<MockTestPortal />} />
          <Route path="/mock-tests" element={<MockTestPortal />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/ai-courses" element={<AiCoursesBlog />} />
          <Route path="/blogs/whats-happening-in-ai" element={<WhatsHappeningBlog />} />
          <Route path="/blogs/cdac-ccat-guide-august-2026" element={<CdacCcatGuideBlog />} />
          <Route path="/blogs/cdac-courses-comparison-august-2026" element={<CdacCoursesComparisonBlog />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </MaintenanceGate>
    </BrowserRouter>
  )
}

export default App
