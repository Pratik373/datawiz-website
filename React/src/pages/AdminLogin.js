import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setMessage('Please enter credentials.'); setMessageType('error'); return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message || 'Login failed.'); setMessageType('error')
    } else {
      navigate('/admin/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-margin-mobile" style={{ backgroundColor: '#F8F7F4' }}>
      <main className="w-full flex items-center justify-center py-lg">
        <div className="w-full max-w-[440px] bg-white border border-stone-border rounded-xl p-md md:p-lg flex flex-col items-center">
          <div className="mb-md">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-dark text-white font-label-md text-label-md text-xs uppercase tracking-wider">
              Admin Panel
            </span>
          </div>

          <div className="mb-sm">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-stone-border p-1 bg-surface">
              <img alt="DataWiz Logo" className="w-full h-full object-cover rounded-full"
                src="https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg" />
            </div>
          </div>

          <div className="text-center mb-lg">
            <h1 className="font-headline-md text-headline-md text-on-surface mb-xs">DataWiz Admin</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed px-4">Manage tests, users, payments, and platform settings.</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-md">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input id="email" type="email" placeholder="admin@datawiz6.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
                  className="w-full h-12 pl-10 pr-4 bg-surface-container-lowest border border-stone-border rounded-lg font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>

            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                <button onClick={() => navigate('/login')} className="font-label-md text-label-md text-[12px] text-primary hover:underline cursor-pointer">Forgot password?</button>
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
                  className="w-full h-12 pl-10 pr-12 bg-surface-container-lowest border border-stone-border rounded-lg font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {message && (
              <div className={`font-body-sm text-body-sm p-3 rounded-lg ${messageType === 'error' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-brand-dark hover:bg-black text-white rounded-full font-label-md text-label-md transition-all active:scale-[0.98]">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-lg pt-md border-t border-stone-border w-full flex justify-center">
            <button onClick={() => navigate('/')} className="group flex items-center gap-xs font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-md text-center">
        <p className="font-body-sm text-body-sm text-outline">&copy; 2026 DataWiz. CDAC C-CAT Exam Prep Platform.</p>
      </footer>
    </div>
  )
}
