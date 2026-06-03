import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PasswordStrengthBar, { passwordRules } from '../components/PasswordStrengthBar'

const logoUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg'
const ADMIN_EMAIL = 'adminspp@datawiz.com'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const redirectAfterAuth = useCallback((session) => {
    if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) {
      navigate('/admin/dashboard')
      return
    }
    const redirectTo = sessionStorage.getItem('redirectAfterLogin')
    if (redirectTo) {
      sessionStorage.removeItem('redirectAfterLogin')
      navigate(redirectTo)
    } else {
      navigate('/mock-tests')
    }
  }, [navigate])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user?.recovery_sent_at === undefined) {
        redirectAfterAuth(session)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') return
      if (session) redirectAfterAuth(session)
    })
    return () => subscription.unsubscribe()
  }, [navigate, redirectAfterAuth])

  const clearMessages = () => { setMessage(''); setMessageType('') }

  const switchMode = (next) => {
    setMode(next)
    clearMessages()
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setShowPassword(false)
    setShowConfirmPw(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setMessage('Please enter your email and password.'); setMessageType('error'); return
    }
    setLoading(true); clearMessages()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setMessage('Please confirm your email before logging in.'); setMessageType('warning')
      } else {
        setMessage(error.message || 'Login failed.'); setMessageType('error')
      }
    }
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) { setMessage('Please enter your full name.'); setMessageType('error'); return }
    if (!email || !password) { setMessage('Please fill all fields.'); setMessageType('error'); return }
    const failedRules = passwordRules.filter((r) => !r.test(password))
    if (failedRules.length > 0) {
      setMessage(`Password must have: ${failedRules.map((r) => r.label).join(', ')}.`); setMessageType('error'); return
    }
    if (password !== confirmPassword) { setMessage('Passwords do not match.'); setMessageType('error'); return }
    setLoading(true); clearMessages()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/login` },
    })
    if (error) {
      setMessage(error.message || 'Sign up failed.'); setMessageType('error')
    } else {
      setMode('confirmation')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true); clearMessages()
    const savedRedirect = sessionStorage.getItem('redirectAfterLogin')
    const redirectTarget = savedRedirect
      ? `${window.location.origin}${savedRedirect}`
      : `${window.location.origin}/mock-tests`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTarget, queryParams: { prompt: 'select_account', access_type: 'offline' } },
    })
    if (error) {
      setMessage(error.message || 'Google sign-in failed.'); setMessageType('error')
    }
    setGoogleLoading(false)
  }

  const resendConfirmation = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setMessage(error.message || 'Could not resend.'); setMessageType('error')
    } else {
      setMessage('Confirmation email resent!'); setMessageType('success')
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) { setMessage('Please enter your email.'); setMessageType('error'); return }
    setLoading(true); clearMessages()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setMessage(error.message || 'Could not send reset email.'); setMessageType('error')
    } else {
      setMode('reset-sent')
    }
    setLoading(false)
  }

  if (mode === 'confirmation') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-margin-mobile" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="w-full max-w-[440px]">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-primary font-label-md text-label-md transition-soft hover:opacity-80 mb-8 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </button>
          <div className="bg-surface-container-lowest border border-stone-border rounded-xl p-md md:p-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-border mb-4">
              <img className="w-full h-full object-cover" src={logoUrl} alt="DataWiz Logo" />
            </div>
            <div className="text-5xl mb-4">📧</div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Check your inbox</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              We've sent a confirmation link to <strong>{email}</strong>.<br />
              Click the link to activate your account.
            </p>
            {message && <div className={`font-body-sm text-body-sm p-3 rounded-lg mb-4 w-full ${messageType === 'error' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}`}>{message}</div>}
            <button onClick={resendConfirmation} disabled={loading} className="w-full h-[48px] border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-white active:scale-95 transition-all">
              {loading ? 'Sending...' : 'Resend confirmation email'}
            </button>
            <p className="mt-6 font-body-sm text-body-sm text-on-surface-variant">
              Already confirmed?{' '}
              <button className="text-primary font-label-md text-label-md hover:underline ml-1" onClick={() => switchMode('login')}>Log In</button>
            </p>
          </div>
          <footer className="mt-12 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant/60">&copy; 2024 DataWiz. Your trusted study companion for CDAC C-CAT Exam Prep.</p>
          </footer>
        </div>
      </div>
    )
  }

  if (mode === 'reset-sent') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-margin-mobile" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="w-full max-w-[440px]">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-primary font-label-md text-label-md transition-soft hover:opacity-80 mb-8 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </button>
          <div className="bg-surface-container-lowest border border-stone-border rounded-xl p-md md:p-lg flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-border mb-4">
              <img className="w-full h-full object-cover" src={logoUrl} alt="DataWiz Logo" />
            </div>
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Reset link sent!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              We've emailed a password reset link to <strong>{email}</strong>.
            </p>
            <button className="text-primary font-label-md text-label-md hover:underline" onClick={() => switchMode('login')}>
              &larr; Back to Sign In
            </button>
          </div>
          <footer className="mt-12 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant/60">&copy; 2024 DataWiz. Your trusted study companion for CDAC C-CAT Exam Prep.</p>
          </footer>
        </div>
      </div>
    )
  }

  if (mode === 'forgot') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-margin-mobile" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="w-full max-w-[440px]">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-primary font-label-md text-label-md transition-soft hover:opacity-80 mb-8 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </button>
          <div className="bg-surface-container-lowest border border-stone-border rounded-xl p-md md:p-lg">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-border mb-4">
                <img className="w-full h-full object-cover" src={logoUrl} alt="DataWiz Logo" />
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">DataWiz</h1>
            </div>
            <h2 className="font-headline-md text-headline-md text-center mb-2">Forgot password?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant text-center mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="forgot-email">Email</label>
                <input id="forgot-email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} disabled={loading} className="w-full h-[48px] px-4 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
              </div>
              {message && <div className={`font-body-sm text-body-sm p-3 rounded-lg ${messageType === 'error' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}`}>{message}</div>}
              <button type="submit" disabled={loading} className="w-full h-[48px] bg-primary text-on-primary rounded-full font-label-md text-label-md transition-soft hover:bg-primary-container active:scale-95">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <button className="mt-6 text-primary font-label-md text-label-md hover:underline w-full text-center" onClick={() => switchMode('login')}>
              &larr; Back to Sign In
            </button>
          </div>
          <footer className="mt-12 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant/60">&copy; 2024 DataWiz. Your trusted study companion for CDAC C-CAT Exam Prep.</p>
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-margin-mobile" style={{ backgroundColor: '#F8F7F4' }}>
      <div className="w-full max-w-[440px]">
        <div className="mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-primary font-label-md text-label-md transition-soft hover:opacity-80 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </button>
        </div>

        <div className="w-full bg-surface-container-lowest border border-stone-border rounded-xl p-md md:p-lg flex flex-col items-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-border mb-4">
              <img className="w-full h-full object-cover" src={logoUrl} alt="DataWiz Logo" />
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">DataWiz</h1>
          </div>

          <div className="w-full text-center mb-8">
            <h2 className="font-headline-sm text-[22px] text-on-surface">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              {mode === 'login' ? 'Log in to continue your preparation journey.' : 'Join free and start your C-CAT preparation'}
            </p>
          </div>

          <button onClick={handleGoogleLogin} disabled={googleLoading || loading}
            className="w-full h-[48px] border border-stone-border rounded-full bg-white flex items-center justify-center gap-3 font-label-md text-label-md text-on-surface transition-soft hover:bg-surface hover:shadow-sm active:scale-95">
            <img className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB56-3ely1lFFM8B-Rc3ToZ2PDOgeDXqN9-YHmYAsQpX-M4q4K2-4oo9hi4C12quoALBRk2QI-gkgA-vyb-4uSMsKOlXO31JmjFDm3Rao9kMuy-ied1UnNl6hIzAaaJ44IQ7IOVtjj-j15Zci9Qu7S1eaRRcR67raRS2zNc4sB1h86DNjsA7RKI8uKcyWrry-shfTD-U7mJY8N3Ln2HfUxao_jG1SLBfYgrvo0XQbrRkLxVsjgdHL15EmkjGDiWpEPdTjCUQX2ECsE" alt="Google" />
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="w-full flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-stone-border" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">or</span>
            <div className="h-[1px] flex-1 bg-stone-border" />
          </div>

          <form className="w-full flex flex-col gap-5" onSubmit={mode === 'login' ? handleLogin : handleSignUp} noValidate>
            {mode === 'signup' && (
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="signup-name">Full Name</label>
                <input id="signup-name" type="text" placeholder="Enter your full name"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  disabled={loading || googleLoading} className="w-full h-[48px] px-4 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" placeholder="name@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading} className="w-full h-[48px] px-4 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="login-password">Password</label>
                {mode === 'login' && (
                  <button type="button" className="text-primary font-label-md text-label-md transition-soft hover:underline" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <input id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  className="w-full h-[48px] px-4 pr-12 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary transition-all" tabIndex={-1}>
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {mode === 'signup' && <PasswordStrengthBar password={password} />}
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="confirm-password">Confirm Password</label>
                <div className="relative">
                  <input id="confirm-password"
                    type={showConfirmPw ? 'text' : 'password'} placeholder="Confirm your password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || googleLoading}
                    className="w-full h-[48px] px-4 pr-12 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
                  <button type="button" onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary transition-all" tabIndex={-1}>
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`font-body-sm text-body-sm p-3 rounded-lg ${
                messageType === 'error' ? 'bg-error-container text-on-error-container' :
                messageType === 'warning' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                'bg-primary-fixed text-on-primary-fixed'
              }`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading || googleLoading} className="w-full h-[48px] bg-primary text-on-primary rounded-full font-label-md text-label-md transition-soft hover:bg-primary-container active:scale-95 mt-4">
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') :
               mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button className="text-primary font-label-md text-label-md hover:underline ml-1" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant/60">&copy; 2024 DataWiz. Your trusted study companion for CDAC C-CAT Exam Prep.</p>
        </footer>
      </div>
    </div>
  )
}
