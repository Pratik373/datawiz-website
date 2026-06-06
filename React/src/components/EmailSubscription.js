import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function EmailSubscription({ compact }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setMessage('Please enter your email')
      setMessageType('error')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.from('emails').insert([{ email, created_at: new Date() }])
      if (error) {
        if (error.message?.includes('duplicate')) {
          setMessage('Already registered! Redirecting...')
          setMessageType('success')
          setTimeout(() => navigate('/mock-tests'), 1500)
        } else {
          setMessage('Error saving email. Try again.')
          setMessageType('error')
        }
      } else {
        setMessage('Thank you! Redirecting...')
        setMessageType('success')
        setEmail('')
        setTimeout(() => navigate('/mock-tests'), 1500)
      }
    } catch {
      setMessage('Something went wrong.')
      setMessageType('error')
    }
    setLoading(false)
  }

  if (compact) {
    return (
      <section className="bg-primary-container rounded-xl p-lg flex flex-col md:flex-row items-center gap-lg">
        <div className="flex-grow space-y-xs text-on-primary-container">
          <h2 className="font-display text-headline-md">Stay Ahead of the Curve</h2>
          <p className="font-body-md">Get exam updates and free study bits delivered to your inbox.</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-base">
          <input
            className="px-md py-4 rounded-full border-none focus:ring-2 focus:ring-secondary-fixed w-full sm:w-64 font-input-text"
            placeholder="Your study email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-lg py-4 bg-secondary-fixed text-on-secondary-fixed font-label-md rounded-full hover:bg-secondary-fixed-dim transition-all active:scale-95"
          >
            {loading ? 'Sending...' : 'Get Access'}
          </button>
        </form>
        {message && (
          <div className={`text-sm ${messageType === 'error' ? 'text-on-error-container' : 'text-on-primary-container'}`}>
            {message}
          </div>
        )}
      </section>
    )
  }

  return (
    <section id="subscribe" className="subscription">
      <div className="container">
        <h2>Free Mock Test Access</h2>
        <p>Enter your email for free mock test access and get instant entry to the exam.</p>
        <form className="email-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Your email for free mock test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Getting Access...' : 'Get Access'}
            </button>
          </div>
          {message && <div className={`message ${messageType}`}>{message}</div>}
        </form>
      </div>
    </section>
  )
}
