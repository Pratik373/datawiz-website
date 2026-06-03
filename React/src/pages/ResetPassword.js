import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PasswordStrengthBar, { passwordRules } from '../components/PasswordStrengthBar'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.recovery_sent_at === undefined) {
        navigate('/login')
      }
    })
  }, [navigate])

  const handleReset = async (e) => {
    e.preventDefault()
    const failedRules = passwordRules.filter((r) => !r.test(password))
    if (failedRules.length > 0) {
      setMessage(`Password must have: ${failedRules.map((r) => r.label).join(', ')}.`); setMessageType('error'); return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.'); setMessageType('error'); return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message || 'Error updating password.'); setMessageType('error')
    } else {
      setMessage('Password updated successfully! Redirecting...'); setMessageType('success')
      setTimeout(() => navigate('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-margin-mobile" style={{ backgroundColor: '#F8F7F4' }}>
      <div className="w-full max-w-[440px]">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-primary font-label-md text-label-md hover:opacity-80 mb-8 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Home
        </button>
        <div className="bg-surface-container-lowest border border-stone-border rounded-xl p-md md:p-lg">
          <h2 className="font-headline-md text-headline-md text-center mb-2">Reset Password</h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-center mb-6">Enter your new password below.</p>
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md" htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" placeholder="Create a strong password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading} className="w-full h-[48px] px-4 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
              <PasswordStrengthBar password={password} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md" htmlFor="confirm-password">Confirm Password</label>
              <input id="confirm-password" type="password" placeholder="Confirm your password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading} className="w-full h-[48px] px-4 rounded-lg border border-stone-border font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white" />
            </div>
            {message && (
              <div className={`font-body-sm text-body-sm p-3 rounded-lg ${messageType === 'error' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                {message}
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full h-[48px] bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container active:scale-95 transition-all">
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
