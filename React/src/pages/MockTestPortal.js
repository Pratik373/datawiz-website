import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { listAdminTestPapers } from '../adminApi'
import { STARTER_PRICE_INR, formatINR } from '../pricingConfig'

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_Spy62mcDroIz0U'
const API_BASE = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'https://datawiz-website-dpc8.vercel.app' : '')

export default function MockTestPortal() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUnlockModal, setShowUnlockModal] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user && sessionStorage.getItem('pendingPayment')) {
        sessionStorage.removeItem('pendingPayment')
        setShowUnlockModal(true)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null)
      if (s?.user && sessionStorage.getItem('pendingPayment')) {
        sessionStorage.removeItem('pendingPayment')
        setShowUnlockModal(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      const data = await listAdminTestPapers()
      setTests(Array.isArray(data) ? data : [])
    } catch {
      setTests([])
    }
    setLoading(false)
  }

  const handlePayment = async (planKey) => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/mock-tests')
      sessionStorage.setItem('pendingPayment', 'true')
      navigate('/login')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, user_id: user.id, email: user.email }),
      })
      const order = await res.json()
      if (!res.ok || order.error) {
        throw new Error(order.details || order.error || 'Failed to create order')
      }
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'DataWiz',
        description: `${order.planName} Plan`,
        order_id: order.id,
        prefill: { email: user.email },
        handler: async (response) => {
          await fetch(`${API_BASE}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              user_id: user.id,
              tests_to_add: order.tests,
              plan: planKey,
              amount: order.amount,
            }),
          })
          alert('Payment successful!')
          setShowUnlockModal(false)
        },
        modal: { ondismiss: () => {} },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      alert('Payment failed: ' + err.message)
    }
  }

  const startTest = (test) => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/mock-tests')
      navigate('/login')
      return
    }
    if (test.type === 'html' && test.local_url) {
      window.open(test.local_url, '_blank')
      return
    }
    alert('Starting test: ' + test.title)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="text-on-surface-variant">Loading...</div>
      </div>
    )
  }

  const isLoggedIn = !!user

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-md">
            <button onClick={() => navigate('/')} className="flex items-center gap-xs text-primary font-label-md text-label-md transition-all active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Home
            </button>
            <div className="hidden md:block h-6 w-[1px] bg-outline-variant mx-2" />
            <div className="font-headline-md text-headline-md font-bold text-on-surface">DataWiz</div>
          </div>
          <div className="flex items-center gap-md">
            {isLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-sm">
                  <span className="text-on-surface-variant font-body-sm text-body-sm">{user.email}</span>
                  <span className="bg-[#e3f2fd] text-[#006565] px-3 py-1 rounded-full text-xs font-bold border border-primary/20">Free Access</span>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
                  className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md active:scale-95">
                  <span className="material-symbols-outlined">logout</span>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')}
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md active:scale-95 duration-150 shadow-sm">
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow pt-[120px] pb-xl px-gutter max-w-container-max mx-auto w-full">
        <div className="mb-lg text-center md:text-left">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">
            {isLoggedIn ? 'Mock Test Portal' : 'CDAC C-CAT Mock Tests'}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {isLoggedIn
              ? `Try the free test below. Unlock all premium tests for ${formatINR(STARTER_PRICE_INR)}.`
              : 'Sign in to track your progress and unlock premium tests. Master every section with our industry-leading preparation engine.'}
          </p>
        </div>

        {!isLoggedIn && (
          <div className="flex flex-wrap items-center gap-md mb-md p-sm bg-surface-container rounded-xl">
            <div className="flex items-center gap-xs px-sm py-1 bg-surface-container-lowest rounded-lg border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <span className="font-label-md text-label-md">3 Free Tests</span>
            </div>
            <div className="flex items-center gap-xs px-sm py-1 bg-surface-container-lowest rounded-lg border border-outline-variant">
              <span className="material-symbols-outlined text-secondary text-[18px]">workspace_premium</span>
              <span className="font-label-md text-label-md">15 Premium Tests</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
          <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col md:flex-row gap-md relative overflow-hidden">
            <div className="flex-1 space-y-md">
              <div className="flex items-center gap-sm">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Available Now</span>
                <span className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">timer</span> 60 Mins
                </span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md mb-xs">C-CAT Section A: Quantitative Aptitude & Reasoning</h2>
                <p className="text-on-surface-variant font-body-md text-body-md">Comprehensive mock test covering the essential logical reasoning and quantitative sections for the upcoming CDAC C-CAT exam.</p>
              </div>
              <div className="flex flex-wrap gap-md py-base border-y border-outline-variant">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-xs uppercase font-bold tracking-tighter">Questions</span>
                  <span className="font-headline-sm text-headline-sm">50 MCQs</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-xs uppercase font-bold tracking-tighter">Passing Score</span>
                  <span className="font-headline-sm text-headline-sm">40%</span>
                </div>
              </div>
              <button onClick={() => startTest({ title: 'C-CAT Section A' })}
                className="bg-primary hover:bg-primary-container text-white px-lg py-sm rounded-full font-label-md text-label-md transition-all active:scale-95 w-full md:w-auto shadow-sm">
                Start Free Test
              </button>
            </div>
            <div className="w-full md:w-1/3 h-48 md:h-auto rounded-lg overflow-hidden shrink-0 bg-surface-container" />
          </div>

          <div className="md:col-span-4 bg-primary text-on-primary-container rounded-xl p-md flex flex-col justify-between shadow-lg relative group">
            <div className="space-y-sm">
              <span className="material-symbols-outlined text-secondary-container text-[48px]">workspace_premium</span>
              <h3 className="font-headline-md text-headline-md leading-tight">Master the C-CAT with Premium Access</h3>
              <p className="font-body-md text-body-md opacity-90">Get 15+ full-length mock tests, detailed performance analytics, and topic-wise practice sets.</p>
            </div>
            <div className="mt-md">
              <button onClick={() => setShowUnlockModal(true)}
                className="w-full bg-secondary-container text-on-secondary-fixed font-label-md text-label-md py-sm rounded-full transition-transform group-hover:scale-[1.02] active:scale-95">
                Upgrade Now &mdash; {formatINR(STARTER_PRICE_INR)}
              </button>
            </div>
          </div>

          <div className="md:col-span-12 mt-base">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center gap-sm">
              Premium Mock Tests
              <span className="h-[1px] flex-1 bg-outline-variant" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col hover:shadow-md transition-shadow relative">
                  <div className="absolute top-md right-md">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </div>
                  <div className="mb-md">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs pr-8">
                      {i === 1 ? 'Section B: Computer Fundamentals' : 'Section C: Data Structures & Algorithms'}
                    </h4>
                    <div className="flex items-center gap-sm text-on-surface-variant font-body-sm text-body-sm">
                      <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[18px]">timer</span> {i === 1 ? '90m' : '120m'}</span>
                      <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[18px]">quiz</span> {i === 1 ? '75 Qs' : '100 Qs'}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant font-body-sm text-body-sm mb-lg flex-1">
                    {i === 1 ? 'Advanced coverage of OS, Networking, and Data Structures according to the latest syllabus.' : 'Deep dive into sorting, searching, and advanced programming concepts for high-scoring aspirants.'}
                  </p>
                  <button onClick={() => setShowUnlockModal(true)}
                    className="w-full border-2 border-secondary-container text-secondary font-label-md text-label-md py-sm rounded-full hover:bg-secondary-container/10 transition-colors flex items-center justify-center gap-xs active:scale-95">
                    <span className="material-symbols-outlined text-[18px]">lock</span> Unlock &mdash; {formatINR(STARTER_PRICE_INR)}
                  </button>
                </div>
              ))}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col opacity-80 relative">
                <div className="mb-md">
                  <div className="flex justify-between items-start mb-xs">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface-variant pr-8">Full-Length Grand Mock #1</h4>
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase">Soon</span>
                  </div>
                  <div className="flex items-center gap-sm text-on-surface-variant font-body-sm text-body-sm">
                    <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[18px]">timer</span> 180m</span>
                    <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-[18px]">quiz</span> 150 Qs</span>
                  </div>
                </div>
                <p className="text-on-surface-variant font-body-sm text-body-sm mb-lg flex-1 italic">Real exam simulation with all three sections combined. Releasing on June 15th.</p>
                <button disabled className="w-full bg-surface-variant text-on-surface-variant font-label-md text-label-md py-sm rounded-full cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mt-lg p-lg rounded-xl bg-primary-container text-on-primary-container flex flex-col md:flex-row items-center justify-between gap-md relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <h2 className="font-headline-md text-headline-md mb-xs">Prepare Smarter with Personal Analytics</h2>
              <p className="opacity-90">Sign in to see detailed performance heatmaps, topic-wise accuracy, and time management insights for every mock test you take.</p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-sm w-full md:w-auto">
              <button onClick={() => navigate('/login')} className="bg-surface-container-lowest text-primary px-8 py-3 rounded-full font-label-md text-label-md shadow-md active:scale-95">
                Create Account
              </button>
              <button onClick={() => navigate('/login')} className="border-2 border-surface-container-lowest text-on-primary px-8 py-3 rounded-full font-label-md text-label-md active:scale-95">
                Sign In
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary rounded-full opacity-20" />
          </div>
        )}

        <footer className="w-full py-lg mt-xl border-t border-outline-variant bg-surface-container-low -mx-gutter px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md max-w-container-max mx-auto">
            <div className="space-y-sm">
              <div className="flex items-center gap-xs">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-on-primary font-bold text-[14px]">D6</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-primary">DataWiz</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
                &copy; 2024 DataWiz. CDAC C-CAT Exam Prep Platform. Helping engineers transition into advanced computing since 2021.
              </p>
            </div>
            <div className="flex flex-wrap gap-lg md:justify-end items-start">
              <div className="space-y-xs">
                <span className="font-label-md text-label-md text-on-surface">Resources</span>
                <ul className="space-y-xs">
                  <li><button onClick={() => navigate('/study-material')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Study Materials</button></li>
                  <li><button onClick={() => navigate('/mock-tests')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Mock Test</button></li>
                  <li><button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Pricing</button></li>
                </ul>
              </div>
              <div className="space-y-xs">
                <span className="font-label-md text-label-md text-on-surface">Company</span>
                <ul className="space-y-xs">
                  <li><button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy Policy</button></li>
                  <li><button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms of Service</button></li>
                  <li><button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Contact Us</button></li>
                  <li><button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">FAQ</button></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowUnlockModal(false)}>
          <div className="bg-white rounded-xl p-lg max-w-md w-full shadow-xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center space-y-md">
              <div className="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-secondary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <h2 className="font-headline-md text-headline-md">Unlock Premium Access</h2>
              <p className="text-on-surface-variant font-body-md text-body-md">Get access to all premium mock tests, performance analytics, and more.</p>
              <div className="bg-surface-container rounded-lg p-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md">Starter Pack</span>
                  <span className="font-headline-md text-headline-md text-primary">{formatINR(STARTER_PRICE_INR)}</span>
                </div>
              </div>
              <button onClick={() => handlePayment('starter')}
                className="w-full py-4 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95">
                Proceed to Payment
              </button>
              <button onClick={() => setShowUnlockModal(false)} className="w-full text-on-surface-variant font-body-sm text-body-sm hover:text-primary">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
