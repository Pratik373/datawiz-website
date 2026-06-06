import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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

function ProfileDropdown({ user, navigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="px-4 py-2 border border-primary text-primary font-label-md text-sm md:text-label-md rounded-full hover:bg-primary/5 active:scale-95 transition-all justify-self-end whitespace-nowrap"
      >
        Login
      </button>
    )
  }

  const initials = (user.user_metadata?.full_name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

  return (
    <div className="relative justify-self-end" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 group"
        aria-label="Profile menu"
      >
        <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-primary/20 group-hover:ring-primary/50 overflow-hidden transition-all">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span
          className="material-symbols-outlined text-on-surface-variant text-[18px] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
            <p className="font-label-md text-label-md text-on-surface truncate text-left">{displayName}</p>
            <p className="text-xs text-on-surface-variant truncate mt-0.5 text-left">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                navigate('/')
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">home</span>
              Home
            </button>
            <button
              onClick={() => {
                supabase.auth.signOut().then(() => {
                  setOpen(false)
                  navigate('/')
                })
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [startError, setStartError] = useState('')

  const loadUserAccess = useCallback(async (nextUser) => {
    if (!nextUser?.id) {
      setHasPremiumAccess(false)
      return false
    }

    setAccessLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/user-test-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: nextUser.id }),
      })
      const payload = await response.json().catch(() => ({}))
      const hasAccess = response.ok && Boolean(payload.hasPremiumAccess)
      setHasPremiumAccess(hasAccess)
      return hasAccess
    } catch {
      setHasPremiumAccess(false)
      return false
    } finally {
      setAccessLoading(false)
    }
  }, [])

  const handlePayment = useCallback(async (planKey, currentUser = user) => {
    const activeUser = currentUser || user
    if (!activeUser) {
      sessionStorage.setItem('redirectAfterLogin', '/tests')
      sessionStorage.setItem('pendingPayment', 'true')
      navigate('/login')
      return
    }
    setPaymentError('')
    try {
      const res = await fetch(`${API_BASE}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, user_id: activeUser.id, email: activeUser.email }),
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
        prefill: { email: activeUser.email },
        theme: { color: '#4A7C59' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                user_id: activeUser.id,
                tests_to_add: order.tests,
                plan: planKey,
                amount: order.amount,
              }),
            })
            const verifyData = await verifyRes.json().catch(() => ({}))
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.details || verifyData.error || 'Payment verification failed')
            }
            // Close modal and unlock tests immediately
            setShowUnlockModal(false)
            setHasPremiumAccess(true)
            setPaymentSuccess(true)
            // Re-verify access from server in the background
            loadUserAccess(activeUser)
            // Auto-dismiss success banner after 6 seconds
            setTimeout(() => setPaymentSuccess(false), 6000)
          } catch (verifyErr) {
            setShowUnlockModal(false)
            setPaymentError('Payment was received but verification failed. Please contact support or refresh the page.')
          }
        },
        modal: {
          ondismiss: () => {
            // User closed Razorpay modal without paying — no action needed
          },
        },
      })
      rzp.open()
    } catch (err) {
      setPaymentError('Could not start payment: ' + err.message)
    }
  }, [user, navigate, loadUserAccess])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const hasAccess = await loadUserAccess(session.user)
        if (sessionStorage.getItem('pendingPayment')) {
          sessionStorage.removeItem('pendingPayment')
          if (!hasAccess) {
            handlePayment('starter', session.user)
          }
        }
      } else {
        setHasPremiumAccess(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const hasAccess = await loadUserAccess(session.user)
        if (sessionStorage.getItem('pendingPayment')) {
          sessionStorage.removeItem('pendingPayment')
          if (!hasAccess) {
            handlePayment('starter', session.user)
          }
        }
      } else {
        setHasPremiumAccess(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const startTest = async (test) => {
    setStartError('')
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
      // Manual test type - show info
      if (payload.test_type === 'manual') {
        setStartError(payload.message || 'This test type is coming soon.')
      }
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('buy the test')) {
        setShowUnlockModal(true)
      } else {
        setStartError(err.message)
      }
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
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-4 px-6 py-4 bg-green-600 text-white shadow-lg animate-slide-down">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
            <div>
              <p className="font-bold text-sm">Payment Successful! 🎉</p>
              <p className="text-xs opacity-90">All 5 premium tests are now unlocked. Start any test below!</p>
            </div>
          </div>
          <button onClick={() => setPaymentSuccess(false)} className="shrink-0 hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Payment / Start Error Banner */}
      {(paymentError || startError) && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-4 px-6 py-4 bg-red-600 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">error</span>
            <p className="font-bold text-sm">{paymentError || startError}</p>
          </div>
          <button onClick={() => { setPaymentError(''); setStartError('') }} className="shrink-0 hover:opacity-70">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant" style={{ top: paymentSuccess || paymentError || startError ? '68px' : '0' }}>
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
          <ProfileDropdown user={user} navigate={navigate} />
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
                <button onClick={() => handlePayment('starter')} className="relative z-10 mt-md w-full sm:w-auto sm:self-start bg-secondary-container text-on-secondary-fixed font-label-md text-sm md:text-label-md px-lg md:px-xl py-3 rounded-full active:scale-95 whitespace-nowrap">
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
                <span className="material-symbols-outlined text-secondary text-[32px]">workspace_premium</span>
              </div>
              <h2 className="font-headline-md text-headline-md">Unlock Premium Tests</h2>
              <p className="text-on-surface-variant font-body-md text-body-md">Get instant access to all 5 full-length C-CAT mock tests.</p>
              <div className="bg-surface-container rounded-lg p-md space-y-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md">5 Premium Tests</span>
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant line-through text-sm">₹499</span>
                    <span className="font-headline-md text-headline-md text-primary">{formatINR(STARTER_PRICE_INR)}</span>
                  </div>
                </div>
                {['5 Full-length Mock Tests (100 Qs each)', '120 mins per test', 'Instant access after payment'].map(f => (
                  <div key={f} className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-[2px]">check_circle</span>
                    <span className="text-sm text-on-surface-variant">{f}</span>
                  </div>
                ))}
              </div>
              {!user && (
                <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg p-2">
                  You'll be asked to login first, then redirected back to complete payment.
                </p>
              )}
              <button onClick={() => handlePayment('starter')} className="w-full py-4 bg-primary text-on-primary rounded-full font-label-md text-label-md active:scale-95 font-bold">
                Pay {formatINR(STARTER_PRICE_INR)} & Unlock Tests
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
