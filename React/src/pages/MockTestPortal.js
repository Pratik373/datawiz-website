import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { STARTER_PRICE_INR, formatINR } from '../pricingConfig'

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_Spy62mcDroIz0U'
const API_BASE = process.env.REACT_APP_API_URL || ''
const PREMIUM_TEST_LIMIT = 5
const PREMIUM_SERIES_COUNT = 5
const QUESTIONS_PER_TEST = 100
const TEST_DURATION_MINUTES = 120
const PREMIUM_SERIES_TESTS = Array.from({ length: PREMIUM_SERIES_COUNT }, (_, index) => {
  const testNumber = index + 1
  return {
    id: `premium-ccat-set-${testNumber}`,
    title: `Test ${testNumber}`,
    local_url: `/CCAT_Mock_Test_Set${testNumber}.html`,
    isPremium: true,
  }
})
const FREE_TEST_TOPICS = [
  {
    section: 'Section A',
    topics: ['English', 'Quantitative Aptitude & Reasoning', 'Computer Fundamentals & Concepts of Programming'],
  },
  {
    section: 'Section B',
    topics: ['C Programming', 'Data Structures', 'Operating Systems & Networking', 'OOP Concepts', 'Basics of Big Data & AI'],
  },
]

export default function MockTestPortal() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startingId, setStartingId] = useState('')
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [accessLoading, setAccessLoading] = useState(false)

  const loadUserAccess = useCallback(async (nextUser) => {
    if (!nextUser?.id) {
      setHasPremiumAccess(false)
      return
    }

    setAccessLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/user-test-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: nextUser.id }),
      })
      const payload = await response.json().catch(() => ({}))
      setHasPremiumAccess(response.ok && Boolean(payload.hasPremiumAccess))
    } catch {
      setHasPremiumAccess(false)
    } finally {
      setAccessLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      loadUserAccess(session?.user)
      if (session?.user && sessionStorage.getItem('pendingPayment')) {
        sessionStorage.removeItem('pendingPayment')
        setShowUnlockModal(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadUserAccess(session?.user)
      if (session?.user && sessionStorage.getItem('pendingPayment')) {
        sessionStorage.removeItem('pendingPayment')
        setShowUnlockModal(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserAccess])

  useEffect(() => {
    loadTests()
  }, [])

  const normalizedTests = useMemo(() => {
    return tests.map((test, index) => ({
      ...test,
      isFree: test.access === 'free' || index === 0,
      isPremium: test.access === 'premium' || (index > 0 && index <= PREMIUM_TEST_LIMIT),
      isSoon: index > PREMIUM_TEST_LIMIT,
    }))
  }, [tests])

  const freeTest = normalizedTests.find((test) => test.isFree)
  const premiumTests = PREMIUM_SERIES_TESTS

  const loadTests = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/student-tests`)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not load tests.')
      setTests(Array.isArray(payload.tests) ? payload.tests : [])
    } catch (err) {
      setError(err.message)
      setTests([])
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (planKey) => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/tests')
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
      if (!res.ok || order.error) throw new Error(order.details || order.error || 'Failed to create order')

      const rzp = new window.Razorpay({
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
          setShowUnlockModal(false)
          setHasPremiumAccess(true)
          loadUserAccess(user)
          alert('Payment successful!')
        },
      })
      rzp.open()
    } catch (err) {
      alert('Payment failed: ' + err.message)
    }
  }

  const startTest = async (test) => {
    if (test.isFree && test.local_url) {
      window.location.href = test.local_url
      return
    }

    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/tests')
      navigate('/login')
      return
    }

    setStartingId(test.id)
    try {
      const response = await fetch(`${API_BASE}/api/start-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, test_id: test.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.error) throw new Error(payload.error || 'Could not start this test.')
      if (payload.url) {
        window.location.href = payload.url
        return
      }
      alert(payload.message || `Starting test: ${test.title}`)
    } catch (err) {
      if (err.message.includes('Access denied')) setShowUnlockModal(true)
      else alert(err.message)
    } finally {
      setStartingId('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="text-on-surface-variant">Loading tests...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant">
        <div className="grid grid-cols-[1fr_auto_1fr] md:flex md:justify-between items-center gap-sm px-gutter py-3 md:py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-sm md:gap-md min-w-0 justify-self-start">
            <button onClick={() => navigate('/')} className="flex items-center gap-xs text-primary font-label-md text-sm md:text-label-md leading-tight transition-all active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="hidden md:block h-6 w-[1px] bg-outline-variant mx-2" />
          </div>
          <div className="font-headline-md text-[28px] md:text-headline-md font-bold text-on-surface justify-self-center md:mr-auto">DataWiz</div>
          {user ? (
            <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="justify-self-end text-on-surface-variant hover:text-primary font-label-md text-sm md:text-label-md whitespace-nowrap">
              Logout
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="justify-self-end bg-primary text-on-primary px-3 md:px-6 py-2 rounded-full font-label-md text-xs md:text-label-md leading-none whitespace-nowrap">
              <span className="hidden sm:inline">Login / Sign Up</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow pt-[96px] pb-lg px-gutter max-w-container-max mx-auto w-full">
        <div className="mb-md text-center md:text-left">
          <h1 className="font-display-lg text-[44px] md:text-[52px] leading-tight text-on-surface mb-xs">Your Tests</h1>
          <p className="font-body-lg text-[20px] leading-snug text-on-surface-variant">
            Start the free mock test or unlock the 5-test premium series for {formatINR(STARTER_PRICE_INR)}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-md mb-sm p-xs bg-surface-container rounded-xl">
          <InfoPill icon="verified" label={freeTest ? '1 Free Test' : 'No Free Test'} />
          <InfoPill icon="workspace_premium" label={`${PREMIUM_SERIES_COUNT} Test Premium Series`} />
        </div>

        {error ? (
          <EmptyState icon="cloud_off" title="Could not load tests" message={error} action="Try again" onAction={loadTests} />
        ) : tests.length === 0 ? (
          <EmptyState icon="quiz" title="No tests available" message="Create test papers from the admin dashboard to publish them here." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-stretch">
            {freeTest && (
              <section className="order-2 lg:order-1 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-sm flex flex-col justify-between gap-md">
                <div className="space-y-sm">
                  <div className="flex items-center justify-between gap-sm">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Free</span>
                    <Meta icon="timer" text={`${TEST_DURATION_MINUTES} Mins`} />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-[25px] leading-tight mb-1">{freeTest.title}</h3>
                    <p className="text-on-surface-variant font-body-md text-[18px] leading-snug">{freeTest.description || 'Start with the free C-CAT mock test.'}</p>
                  </div>
                  <div className="flex flex-wrap gap-md py-3 border-y border-outline-variant">
                    <Stat label="Questions" value={`${QUESTIONS_PER_TEST} MCQs`} />
                    <Stat label="Access" value="Free" />
                  </div>
                  <div className="space-y-sm">
                    <h4 className="font-label-md text-label-md text-on-surface">Topics Covered</h4>
                    <div className="space-y-xs">
                      {FREE_TEST_TOPICS.map((group) => (
                        <div key={group.section} className="grid grid-cols-[64px_1fr] gap-sm">
                          <div className="bg-secondary-container text-on-secondary-fixed rounded-lg px-2 py-1 text-xs font-bold flex items-center justify-center text-center min-h-[46px]">
                            {group.section}
                          </div>
                          <ul className="space-y-0.5 text-on-surface-variant font-body-sm text-[15px] leading-snug">
                            {group.topics.map((topic) => (
                              <li key={topic} className="flex gap-xs">
                                <span className="material-symbols-outlined text-primary text-[16px] mt-[2px]">check_circle</span>
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => startTest(freeTest)} className="bg-primary text-white px-lg py-3 rounded-full font-label-md text-label-md transition-all active:scale-95 w-full shadow-sm">
                  {startingId === freeTest.id ? 'Starting...' : 'Start Free Test'}
                </button>
              </section>
            )}

            <section className="order-1 lg:order-2 lg:col-span-8 bg-primary text-on-primary-container rounded-xl p-md md:p-lg flex flex-col shadow-lg relative overflow-hidden">
              <div className="space-y-md relative z-10">
                <div className="flex flex-wrap items-center gap-sm">
                  <span className="bg-secondary-container text-on-secondary-fixed px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                    Best Value
                  </span>
                  <Meta icon="workspace_premium" text={`${PREMIUM_SERIES_COUNT} Full-Length Tests`} />
                  <Meta icon="timer" text={`${TEST_DURATION_MINUTES} Mins Each`} />
                </div>
                <div className="max-w-2xl">
                  <h2 className="font-display-md text-[28px] md:text-[36px] leading-tight mb-xs">
                    Premium C-CAT 5 Test Series
                  </h2>
                  <p className="font-body-lg text-[20px] leading-snug opacity-90">
                    {hasPremiumAccess ? 'Your premium tests are unlocked and ready to start.' : 'Unlock the complete premium mock test set after login and payment.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-sm max-w-xl">
                  <SeriesStat label="Tests" value={PREMIUM_SERIES_COUNT} />
                  <SeriesStat label="Questions" value={`${PREMIUM_SERIES_COUNT * QUESTIONS_PER_TEST}`} />
                  <SeriesStat label="Access" value={hasPremiumAccess ? 'Unlocked' : 'Premium'} />
                </div>
                {hasPremiumAccess && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-sm max-w-3xl">
                    {premiumTests.map((test, index) => (
                      <button
                        key={test.id}
                        onClick={() => startTest(test)}
                        className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg p-sm text-left active:scale-95 transition-all flex flex-col gap-sm"
                      >
                        <span className="block text-xs uppercase font-bold opacity-75">Premium Test {index + 1}</span>
                        <span className="block font-headline-sm text-headline-sm leading-tight">{test.title}</span>
                        <span className="mt-auto inline-flex items-center justify-center gap-xs bg-secondary-container text-on-secondary-fixed rounded-full px-sm py-2 font-label-md text-label-md">
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          {startingId === test.id ? 'Starting...' : 'Start Test'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!hasPremiumAccess && (
                <button onClick={() => setShowUnlockModal(true)} className="relative z-10 mt-md w-full sm:w-auto sm:self-start bg-secondary-container text-on-secondary-fixed font-label-md text-sm md:text-label-md px-lg md:px-xl py-3 rounded-full active:scale-95 whitespace-nowrap">
                  <span className="hidden sm:inline">{accessLoading ? 'Checking Access...' : `Upgrade Now - ${formatINR(STARTER_PRICE_INR)}`}</span>
                  <span className="sm:hidden">{accessLoading ? 'Checking...' : `Upgrade - ${formatINR(STARTER_PRICE_INR)}`}</span>
                </button>
              )}
              <span className="material-symbols-outlined absolute right-6 bottom-4 text-secondary-container/20 text-[100px] pointer-events-none">workspace_premium</span>
            </section>
          </div>
        )}
      </main>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowUnlockModal(false)}>
          <div className="bg-white rounded-xl p-lg max-w-md w-full shadow-xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center space-y-md">
              <div className="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-secondary text-[32px]">lock</span>
              </div>
              <h2 className="font-headline-md text-headline-md">Unlock Premium Tests</h2>
              <p className="text-on-surface-variant font-body-md text-body-md">Get access to the 5-test premium series.</p>
              <div className="bg-surface-container rounded-lg p-md flex items-center justify-between">
                <span className="font-label-md text-label-md">Test Series</span>
                <span className="font-headline-md text-headline-md text-primary">{formatINR(STARTER_PRICE_INR)}</span>
              </div>
              <button onClick={() => handlePayment('starter')} className="w-full py-4 bg-primary text-on-primary rounded-full font-label-md text-label-md active:scale-95">
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

function InfoPill({ icon, label }) {
  return (
    <div className="flex items-center gap-xs px-sm py-1 bg-surface-container-lowest rounded-lg border border-outline-variant">
      <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
      <span className="font-label-md text-label-md">{label}</span>
    </div>
  )
}

function Meta({ icon, text }) {
  return (
    <span className="flex items-center gap-xs">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {text}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-on-surface-variant text-xs uppercase font-bold tracking-tighter">{label}</span>
      <span className="font-headline-sm text-headline-sm">{value}</span>
    </div>
  )
}

function SeriesStat({ label, value }) {
  return (
    <div className="bg-white/10 rounded-lg p-sm">
      <span className="block text-xs uppercase font-bold tracking-tighter opacity-80 mb-1">{label}</span>
      <span className="font-headline-md text-headline-md">{value}</span>
    </div>
  )
}

function EmptyState({ icon, title, message, action, onAction }) {
  return (
    <section className="flex flex-col items-center justify-center py-xl px-gutter text-center">
      <div className="w-48 h-48 bg-surface-container rounded-full flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-[80px] text-outline-variant">{icon}</span>
      </div>
      <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">{title}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-lg">{message}</p>
      {action && <button onClick={onAction} className="text-primary font-label-md text-label-md hover:underline">{action}</button>}
    </section>
  )
}
