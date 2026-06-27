import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { STARTER_PRICE_INR, PRO_PRICE_INR, STARTER_ORIGINAL_PRICE_INR, PRO_ORIGINAL_PRICE_INR, formatINR } from '../pricingConfig'
import ProfileDropdown from '../components/ProfileDropdown'
import SupportChatWidget from '../components/SupportChatWidget'


const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_Spy62mcDroIz0U'
const API_BASE = process.env.REACT_APP_API_URL || ''
const PREMIUM_TEST_LIMIT = 10
const PREMIUM_SERIES_COUNT = 10
const QUESTIONS_PER_TEST = 100
const TEST_DURATION_MINUTES = 120
const PREMIUM_SERIES_TESTS = Array.from({ length: PREMIUM_SERIES_COUNT }, (_, index) => {
  const testNumber = index + 1
  return {
    id: `premium-ccat-set-${testNumber}`,
    title: `Test ${testNumber}`,
    local_url: `/CCAT_Mock_Test_Set${testNumber}.html`,
    isPremium: true,
    isSoon: false,
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
  const [hasProAccess, setHasProAccess] = useState(false)
  const [accessLoading, setAccessLoading] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [startError, setStartError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [paymentProcessing, setPaymentProcessing] = useState(false)




  // Track if we've done the first access load — avoids skeleton on token refreshes
  const accessCheckedRef = useRef(false)

  const loadUserAccess = useCallback(async (nextUser) => {
    if (!nextUser?.id) {
      setHasPremiumAccess(false)
      setHasProAccess(false)
      setAccessLoading(false)
      accessCheckedRef.current = true
      return false
    }

    // Only show the skeleton on the very first load
    if (!accessCheckedRef.current) {
      setAccessLoading(true)
    }
    try {
      const response = await fetch(`${API_BASE}/api/user-test-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: nextUser.id }),
      })
      const payload = await response.json().catch(() => ({}))
      const hasAccess = response.ok && Boolean(payload.hasPremiumAccess)
      const hasPro = response.ok && Boolean(payload.hasProAccess)
      setHasPremiumAccess(hasAccess)
      setHasProAccess(hasPro)
      return hasAccess
    } catch {
      setHasPremiumAccess(false)
      return false
    } finally {
      setAccessLoading(false)
      accessCheckedRef.current = true
    }
  }, [])

  const applyCoupon = useCallback(async (codeToApply) => {
    const code = (codeToApply || '').trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, plan: 'pro', user_id: user?.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.valid) {
        setCouponError(data.error || 'Failed to validate coupon code');
        setAppliedCoupon('');
        setCouponDiscount(0);
      } else {
        setAppliedCoupon(code.toUpperCase());
        setCouponDiscount(data.discount);
      }
    } catch {
      setCouponError('Error validating coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  }, [user]);

  const handlePayment = useCallback(async (planKey, coupon = '', currentUser = user) => {
    const activeUser = currentUser || user
    if (!activeUser) {
      sessionStorage.setItem('redirectAfterLogin', '/tests')
      sessionStorage.setItem('pendingPlan', planKey)
      navigate('/login')
      return
    }
    
    setPaymentProcessing(true);
    setPaymentError('');
    try {
      const res = await fetch(`${API_BASE}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, user_id: activeUser.id, email: activeUser.email, couponCode: coupon }),
      })
      const order = await res.json()
      if (!res.ok || order.error) throw new Error(order.details || order.error || 'Failed to create order')

      // Handle completely free order bypass
      if (order.isFree) {
        const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: order.id,
            razorpay_payment_id: 'free_checkout',
            razorpay_signature: 'free_checkout_sig',
            user_id: activeUser.id,
            tests_to_add: order.tests,
            plan: planKey,
            amount: 0,
          }),
        })
        const verifyData = await verifyRes.json().catch(() => ({}))
        if (!verifyRes.ok || verifyData.error) {
          throw new Error(verifyData.details || verifyData.error || 'Payment verification failed')
        }
        setShowUnlockModal(false)
        setHasPremiumAccess(true)
        setPaymentSuccess(true)
        loadUserAccess(activeUser)
        setTimeout(() => setPaymentSuccess(false), 6000)
        return
      }

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'DataWiz',
        description: `${order.planName}`,
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
                amount: order.amount / 100,
              }),
            })
            const verifyData = await verifyRes.json().catch(() => ({}))
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.details || verifyData.error || 'Payment verification failed')
            }
            setShowUnlockModal(false)
            setHasPremiumAccess(true)
            setPaymentSuccess(true)
            loadUserAccess(activeUser)
            setTimeout(() => setPaymentSuccess(false), 6000)
          } catch (verifyErr) {
            setShowUnlockModal(false)
            setPaymentError('Payment was received but verification failed. Please contact support or refresh the page.')
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
          },
        },
      })
      rzp.open()
    } catch (err) {
      setPaymentError('Could not start payment: ' + err.message)
      setPaymentProcessing(false);
    }
  }, [user, navigate, loadUserAccess])

  // Stable ref so the auth useEffect (deps=[]) can always call the latest handlePayment
  const handlePaymentRef = useRef(handlePayment)
  useEffect(() => { handlePaymentRef.current = handlePayment }, [handlePayment])

  const onPayClick = useCallback(async (planKey) => {
    if (paymentProcessing) return;
    setPaymentProcessing(true);
    setPaymentError('');
    
    let couponToUse = appliedCoupon;
    
    // Auto-apply if coupon code is typed in the input field but not applied yet
    if (couponCode.trim() && !appliedCoupon) {
      setCouponLoading(true);
      setCouponError('');
      try {
        const res = await fetch(`${API_BASE}/api/validate-coupon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ couponCode: couponCode.trim(), plan: planKey === 'pro' && hasPremiumAccess ? 'upgrade' : planKey, user_id: user?.id }),
        });
        const data = await res.json();
        if (res.ok && !data.error && data.valid) {
          couponToUse = couponCode.toUpperCase().trim();
          setAppliedCoupon(couponToUse);
          setCouponDiscount(data.discount);
        } else {
          setCouponError(data.error || 'Invalid coupon code');
          setCouponLoading(false);
          setPaymentProcessing(false);
          return;
        }
      } catch {
        setCouponError('Error validating coupon. Please try again.');
        setCouponLoading(false);
        setPaymentProcessing(false);
        return;
      }
      setCouponLoading(false);
    }
    
    await handlePayment(planKey, couponToUse);
  }, [paymentProcessing, couponCode, appliedCoupon, handlePayment, user, hasPremiumAccess])

  useEffect(() => {
    // One-time session check on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const planKey = sessionStorage.getItem('pendingPlan')
        const hasPending = sessionStorage.getItem('pendingPayment') || planKey
        if (hasPending) {
          sessionStorage.removeItem('pendingPayment')
          sessionStorage.removeItem('pendingPlan')
          const hasAccess = await loadUserAccess(session.user)
          if (!hasAccess) {
            handlePaymentRef.current(planKey || 'starter')
          }
        } else {
          await loadUserAccess(session.user)
        }
      } else {
        setHasPremiumAccess(false)
        setAccessLoading(false)
      }
    })

    // Only react to real sign-in / sign-out — ignore TOKEN_REFRESHED etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        const planKey = sessionStorage.getItem('pendingPlan')
        const hasPending = sessionStorage.getItem('pendingPayment') || planKey
        if (hasPending) {
          sessionStorage.removeItem('pendingPayment')
          sessionStorage.removeItem('pendingPlan')
          const hasAccess = await loadUserAccess(session.user)
          if (!hasAccess) {
            handlePaymentRef.current(planKey || 'starter')
          }
        } else {
          await loadUserAccess(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setHasPremiumAccess(false)
        setHasProAccess(false)
        setAccessLoading(false)
      }
      // TOKEN_REFRESHED and other events are intentionally ignored
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



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

  useEffect(() => {
    localStorage.removeItem('ccat_test_completed')
    localStorage.removeItem('ccat_test_completed_id')
  }, [user])

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

  const pendingPlan = sessionStorage.getItem('pendingPlan')
  const isStarterPending = pendingPlan === 'starter'
  
  const displayTestsCount = isStarterPending ? 5 : PREMIUM_SERIES_COUNT
  const displayQuestionsCount = displayTestsCount * QUESTIONS_PER_TEST
  const displayTitle = `Premium C-CAT ${displayTestsCount} Test Series`
  const displayBadgeText = isStarterPending ? 'Popular Choice' : 'Best Value'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-4 px-6 py-4 bg-green-600 text-white shadow-lg animate-slide-down">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
            <div>
              <p className="font-bold text-sm">Payment Successful! 🎉</p>
              <p className="text-xs opacity-90">Your premium tests are now unlocked. Start any test below!</p>
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
            Start the free mock test or unlock the premium test series starting at {formatINR(STARTER_PRICE_INR)}.
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
            {freeTest && (
              <section className="order-2 lg:order-1 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-sm flex flex-col justify-start gap-md">
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

            <section className="order-1 lg:order-2 lg:col-span-8 bg-gradient-to-br from-teal-950 via-[#005c5c] to-teal-950 text-white rounded-2xl p-md md:p-lg flex flex-col shadow-xl border border-teal-800/40 relative overflow-hidden">
              {/* Modern ambient backdrop glows */}
              <div className="absolute top-[-20%] right-[-10%] w-[320px] h-[320px] bg-teal-400/10 rounded-full blur-[70px] pointer-events-none" />
              <div className="absolute bottom-[-30%] left-[-20%] w-[380px] h-[380px] bg-[#E91E63]/5 rounded-full blur-[90px] pointer-events-none" />

              <div className="space-y-md relative z-10">
                <div className="flex flex-wrap items-center gap-sm">
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm select-none">
                    {displayBadgeText}
                  </span>
                  <Meta icon="workspace_premium" text={`${displayTestsCount} Full-Length Tests`} />
                  <Meta icon="timer" text={`${TEST_DURATION_MINUTES} Mins Each`} />
                </div>
                <div className="max-w-2xl">
                  <h2 className="font-display-md text-[28px] md:text-[36px] leading-tight mb-xs font-extrabold text-white">
                    {displayTitle}
                  </h2>
                  <p className="font-body-lg text-[16px] md:text-[18px] leading-relaxed text-white/80">
                    {hasPremiumAccess 
                      ? (!hasProAccess 
                        ? 'You have the Starter Pack. Upgrade to the Complete Pack to unlock Tests 6-10.' 
                        : 'Your premium tests are unlocked and ready to start.') 
                      : 'Unlock the complete premium mock test set after login and payment.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-sm max-w-xl">
                  <SeriesStat label="Tests" value={displayTestsCount} />
                  <SeriesStat label="Questions" value={displayQuestionsCount} />
                  <SeriesStat label="Access" value={hasPremiumAccess ? 'Unlocked' : 'Premium'} />
                </div>
                {hasPremiumAccess && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-sm max-w-3xl">
                    {premiumTests.map((test, index) => {
                      const testNumber = index + 1
                      const isLocked = testNumber > 5 && !hasProAccess
                      
                      return (
                        <button
                          key={test.id}
                          onClick={() => {
                            if (test.isSoon) return
                            if (isLocked) {
                              setShowUnlockModal(true)
                              return
                            }
                            startTest(test)
                          }}
                          className={`border rounded-lg p-sm text-left active:scale-95 transition-all flex flex-col gap-sm ${
                            test.isSoon 
                              ? 'bg-white/5 border-white/5 cursor-not-allowed opacity-60' 
                              : isLocked
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                : 'bg-white/10 hover:bg-white/15 border-white/10 hover:border-white/20'
                          }`}
                          disabled={test.isSoon}
                        >
                          <span className="block text-xs uppercase font-bold opacity-75">Premium Test {testNumber}</span>
                          <span className="block font-headline-sm text-headline-sm leading-tight flex items-center gap-xs">
                            {test.title}
                            {isLocked && <span className="material-symbols-outlined text-[16px] text-yellow-500">lock</span>}
                          </span>
                          <span className="mt-auto inline-flex items-center justify-center gap-xs bg-secondary-container text-on-secondary-fixed rounded-full px-sm py-2 font-label-md text-label-md">
                            <span className="material-symbols-outlined text-[18px]">
                              {test.isSoon ? 'hourglass_empty' : isLocked ? 'lock' : 'play_circle'}
                            </span>
                            {startingId === test.id 
                              ? 'Starting...' 
                              : test.isSoon 
                                ? 'Coming Soon' 
                                : isLocked 
                                  ? 'Upgrade' 
                                  : 'Start Test'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {hasPremiumAccess && !hasProAccess && (
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-md mt-md relative z-10 space-y-sm backdrop-blur-sm">
                  <span className="block text-xs uppercase font-extrabold text-white/70 tracking-wider">Apply Coupon Code</span>
                  <div className="flex gap-sm">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="ENTER COUPON CODE"
                      disabled={couponLoading || paymentProcessing}
                      className="flex-grow px-md py-2.5 border border-white/10 rounded-lg bg-white/5 text-white font-label-md outline-none focus:border-white/30 transition-all uppercase placeholder-white/30 text-sm"
                    />
                    <button
                      onClick={() => applyCoupon(couponCode)} 
                      disabled={couponLoading || !couponCode.trim() || paymentProcessing}
                      className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-md py-2.5 rounded-lg font-black uppercase text-xs tracking-wider transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs font-bold text-red-400">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Coupon "{appliedCoupon}" applied! You saved {formatINR(couponDiscount)}.
                    </p>
                  )}
                </div>
              )}
              {accessLoading ? (
                <div className="flex gap-sm mt-md relative z-10 w-full max-w-2xl">
                  <div className="w-full h-[64px] bg-white/5 border border-white/10 rounded-full animate-pulse" />
                  <div className="w-full h-[64px] bg-white/10 border border-white/10 rounded-full animate-pulse" />
                </div>
              ) : !hasPremiumAccess ? (
                <div className="flex flex-col sm:flex-row gap-base mt-md relative z-10 w-full max-w-2xl">
                  <button 
                    onClick={() => onPayClick('starter')} 
                    disabled={paymentProcessing}
                    className="w-full sm:flex-1 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-black px-4 md:px-6 rounded-full active:scale-95 hover:scale-[1.02] transition-all text-center shadow-md text-[13px] md:text-[14px] tracking-wider uppercase h-[64px] flex items-center justify-center disabled:opacity-50"
                  >
                    {paymentProcessing ? 'Processing...' : `Unlock 5 Tests • ${formatINR(STARTER_PRICE_INR)}`}
                  </button>
                  <button 
                    onClick={() => onPayClick('pro')} 
                    disabled={paymentProcessing}
                    className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black px-4 md:px-6 rounded-full active:scale-95 hover:scale-[1.02] transition-all text-center shadow-lg shadow-amber-500/15 text-[13px] md:text-[14px] tracking-wider uppercase h-[64px] flex items-center justify-center disabled:opacity-50"
                  >
                    {paymentProcessing ? 'Processing...' : `Unlock All 10 Tests • ${formatINR(PRO_PRICE_INR)}`}
                  </button>
                </div>
              ) : !hasProAccess ? (
                <div className="flex flex-col sm:flex-row gap-base mt-md relative z-10 w-full max-w-md">
                  <button 
                    onClick={() => onPayClick('pro')} 
                    disabled={paymentProcessing}
                    className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black px-4 md:px-6 rounded-full active:scale-95 hover:scale-[1.02] transition-all text-center shadow-lg shadow-amber-500/15 text-[13px] md:text-[14px] tracking-wider uppercase h-[64px] flex items-center justify-center disabled:opacity-50"
                  >
                    {paymentProcessing ? 'Processing...' : `Upgrade to Complete Pack • ${formatINR(Math.max(0, PRO_PRICE_INR - couponDiscount))}`}
                  </button>
                </div>
              ) : null}
              <span className="material-symbols-outlined absolute right-6 bottom-4 text-white/5 text-[120px] pointer-events-none select-none">workspace_premium</span>
            </section>
          </div>
        )}
      </main>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowUnlockModal(false)}>
          <div className="bg-white rounded-xl p-lg max-w-2xl w-full shadow-xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center space-y-md">
              <div className="w-12 h-12 bg-secondary-fixed rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-secondary text-[24px]">workspace_premium</span>
              </div>
              <h2 className="font-headline-md text-headline-md">Unlock Premium Tests</h2>
              <p className="text-on-surface-variant font-body-sm leading-snug">Get instant access to full-length C-CAT mock papers. Choose the plan that fits your prep.</p>
              
              {hasPremiumAccess && !hasProAccess && (
                <div className="w-full max-w-md mx-auto bg-surface-container-low border border-outline-variant rounded-xl p-sm mt-sm text-left space-y-xs">
                  <span className="block text-[10px] uppercase font-extrabold text-on-surface-variant tracking-wider">Apply Coupon Code</span>
                  <div className="flex gap-sm">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="ENTER COUPON CODE"
                      disabled={couponLoading || paymentProcessing}
                      className="flex-grow px-sm py-1.5 border border-outline rounded-lg bg-surface-container-lowest text-on-surface font-label-md outline-none focus:border-primary transition-all uppercase placeholder-on-surface-variant/40 text-xs"
                    />
                    <button
                      onClick={() => applyCoupon(couponCode)} 
                      disabled={couponLoading || !couponCode.trim() || paymentProcessing}
                      className="bg-primary hover:bg-primary-container text-white px-sm py-1.5 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] font-bold text-red-500">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-[10px] font-bold text-green-600 flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      Coupon "{appliedCoupon}" applied! You saved {formatINR(couponDiscount)}.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm text-left mt-md">
                
                 {/* Plan 1: Starter Pack */}
                <div className={`border border-outline-variant rounded-xl p-sm flex flex-col justify-between ${hasPremiumAccess ? 'bg-surface-container-low opacity-75' : 'bg-surface-container-lowest'}`}>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm">Starter Pack</h3>
                    <p className="text-xs text-on-surface-variant mb-sm">5 Full-length Mock Tests</p>
                    <div className="flex items-baseline gap-2 mb-sm">
                      <span className="font-headline-md text-headline-md text-primary">
                        {formatINR(Math.max(0, STARTER_PRICE_INR - couponDiscount))}
                      </span>
                      <span className="text-on-surface-variant line-through text-xs">₹{STARTER_ORIGINAL_PRICE_INR}</span>
                      <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary-fixed-dim/20">80% OFF</span>
                    </div>
                    <ul className="space-y-1 text-xs text-on-surface-variant mb-md">
                      {['5 Full-length Mock Tests', '120 mins & 100 Qs per test', 'Detailed answer review', 'Direct DM Support with Admin'].map(f => (
                        <li key={f} className="flex items-start gap-1">
                           <span className="material-symbols-outlined text-primary text-[14px] shrink-0 mt-[2px]">check_circle</span>
                           <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => onPayClick('starter')} 
                    disabled={hasPremiumAccess || paymentProcessing}
                    className={`w-full py-2 rounded-full font-label-md text-xs active:scale-95 font-bold transition-all border ${
                      hasPremiumAccess 
                        ? 'border-outline-variant text-on-surface-variant cursor-not-allowed bg-transparent' 
                        : 'border-primary text-primary hover:bg-primary/5'
                    }`}
                  >
                    {hasPremiumAccess ? 'Already Owned' : 'Get Starter'}
                  </button>
                </div>

                {/* Plan 2: Complete Pack (Pro) */}
                <div className={`border-2 border-primary rounded-xl p-sm flex flex-col justify-between relative ${hasProAccess ? 'bg-surface-container-low opacity-75 border-outline-variant' : 'bg-surface-container-lowest'}`}>
                  <div className="absolute top-2 right-2 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm">Complete Pack</h3>
                    <p className="text-xs text-on-surface-variant mb-sm">10 Full-length Mock Tests</p>
                    <div className="flex items-baseline gap-2 mb-sm">
                      <span className="font-headline-md text-headline-md text-primary">
                        {formatINR(Math.max(0, PRO_PRICE_INR - couponDiscount))}
                      </span>
                      <span className="text-on-surface-variant line-through text-xs">₹{PRO_ORIGINAL_PRICE_INR}</span>
                      <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary-fixed-dim/20">85% OFF</span>
                    </div>
                    <ul className="space-y-1 text-xs text-on-surface-variant mb-md">
                      {['10 Full-length Mock Tests', 'Includes all 5 starter tests', '5 additional premium tests', 'Detailed answer review', 'Direct DM Support with Admin'].map(f => (
                        <li key={f} className="flex items-start gap-1">
                           <span className="material-symbols-outlined text-primary text-[14px] shrink-0 mt-[2px]">check_circle</span>
                           <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => onPayClick('pro')} 
                    disabled={hasProAccess || paymentProcessing}
                    className={`w-full py-2 rounded-full font-label-md text-xs active:scale-95 font-bold transition-all ${
                      hasProAccess 
                        ? 'border border-outline-variant text-on-surface-variant cursor-not-allowed bg-transparent' 
                        : 'bg-primary text-white hover:bg-primary-container'
                    }`}
                  >
                    {hasProAccess ? 'Already Owned' : 'Unlock All'}
                  </button>
                </div>

              </div>
              
              {!user && (
                <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-lg p-2 mt-sm">
                  You'll be asked to login first, then redirected back to complete payment.
                </p>
              )}
            </div>
          </div>
        </div>
      )}




      <SupportChatWidget 
        user={user} 
        hasPremiumAccess={hasPremiumAccess} 
        onOpenUpgradeModal={() => setShowUnlockModal(true)} 
      />
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
    <span className="inline-flex items-center gap-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/90">
      <span className="material-symbols-outlined text-[16px] text-teal-300">{icon}</span>
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
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-sm text-center">
      <span className="block text-xs uppercase font-bold tracking-wider opacity-60 mb-1">{label}</span>
      <span className="font-headline-md text-headline-md font-extrabold text-white">{value}</span>
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
