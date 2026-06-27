import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { STARTER_PRICE_INR, STARTER_ORIGINAL_PRICE_INR, PRO_PRICE_INR, PRO_ORIGINAL_PRICE_INR, formatINR } from '../pricingConfig'
import ProfileDropdown from '../components/ProfileDropdown'
import SupportChatWidget from '../components/SupportChatWidget'

const heroImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyOXogB7LYDkE7jxtYEi1yAzkvpqJyP5jhpeGAOs4kYoBSp_BQ7pZVodLs7aoLI-_xw6gkKDnki2-ql5CAwKO0I-Mis6aZBzRcYFsR832PVwWTmwlpU7FW5q3YzMKhEo89YFHaEp_ripjxmXwid_Iqi0qELm-O8P636KK31y5y9CJ9aYqU_6k65oAlZZ6HS6ydcPwvfkE9J47FrnKIw0U12gaFYpDslM9N0M_jd8vQ_japZTacf3GYgEBYlqAABZjjM4ZzTonLDiM'

const API_BASE = process.env.REACT_APP_API_URL || ''



const reviewsData = [
  {
    name: 'Amit Sharma',
    avatarBg: 'bg-primary/10 text-primary',
    tag: 'Verified Student • Free Mock Test User',
    stars: 5,
    text: 'The free mock test was extremely well-structured and matched the exact C-CAT interface. Convinced me to upgrade!'
  },
  {
    name: 'Aditya Verma',
    avatarBg: 'bg-secondary/10 text-secondary',
    tag: 'Verified Student • Free Plan User',
    stars: 4,
    text: 'Very good quality questions in the free C-CAT test. Wish there were a few more free papers, but the Starter Pack is value for money.'
  },
  {
    name: 'Priya Patel',
    avatarBg: 'bg-tertiary/10 text-tertiary',
    tag: 'Verified Student • Paid Pack User',
    stars: 5,
    text: 'Purchased the Starter Pack and the 5 full-length tests are worth every rupee. Extremely high-quality questions for Sections A & B.'
  },
  {
    name: 'Sneha Kulkarni',
    avatarBg: 'bg-primary/10 text-primary',
    tag: 'Verified Student • Paid Pack User',
    stars: 5,
    text: 'The level of Section B coding questions in the premium mock tests is excellent. Perfect for practice and timing.'
  },
  {
    name: 'Rohan Deshmukh',
    avatarBg: 'bg-secondary/10 text-secondary',
    tag: 'Verified Student • Paid Pack User',
    stars: 5,
    text: 'The analytics and review interface after submitting the test are very clean. Helped me identify my weak spots easily.'
  },
  {
    name: 'Neha Joshi',
    avatarBg: 'bg-tertiary/10 text-tertiary',
    tag: 'Verified Student • Paid Pack User',
    stars: 4,
    text: 'Excellent explanations for the statistics questions. Interface is smooth. A great mock exam platform.'
  },
  {
    name: 'Vikram Singh',
    avatarBg: 'bg-primary/10 text-primary',
    tag: 'Verified Student • Paid Pack User',
    stars: 5,
    text: 'The questions are classified beautifully into easy, medium, and hard. Very realistic test environment.'
  },
  {
    name: 'Rahul Nair',
    avatarBg: 'bg-secondary/10 text-secondary',
    tag: 'Verified Student • Paid Pack User',
    stars: 4,
    text: 'The simulation of 120 minutes for 100 questions is highly accurate. Great practice resource for Sections A & B.'
  }
]

function ReviewCard({ review }) {
  const initials = review.name.split(' ').map(n => n[0]).join('')
  return (
    <div className="w-[350px] shrink-0 bg-white border border-outline-variant p-md rounded-2xl shadow-sm flex flex-col justify-between hover:border-primary/50 transition-colors">
      <div className="space-y-sm">
        <div className="flex gap-xs">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`material-symbols-outlined text-[20px] ${
                i < review.stars ? 'text-amber-500' : 'text-outline-variant/60'
              }`}
              style={{ fontVariationSettings: i < review.stars ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          ))}
        </div>
        <p className="text-on-surface font-body-sm italic leading-relaxed text-left">
          "{review.text}"
        </p>
      </div>
      <div className="flex items-center gap-sm mt-md pt-sm border-t border-outline-variant/40">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${review.avatarBg}`}>
          {initials}
        </div>
        <div className="min-w-0 text-left">
          <h4 className="font-label-md text-label-md text-on-surface truncate">{review.name}</h4>
          <p className="text-[12px] text-on-surface-variant truncate">{review.tag}</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [reviews, setReviews] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setHasPremiumAccess(false)
      return
    }
    fetch(`${API_BASE}/api/user-test-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
      .then(res => res.json())
      .then(data => setHasPremiumAccess(Boolean(data.hasPremiumAccess)))
      .catch(() => setHasPremiumAccess(false))
  }, [user])

  useEffect(() => {
    const fetchApprovedReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          const colorBgs = [
            'bg-primary/10 text-primary',
            'bg-secondary/10 text-secondary',
            'bg-tertiary/10 text-tertiary'
          ]
          const mapped = data.map((r, i) => {
            const isFree = r.test_id === 'free-ccat-mock-test' || r.test_id === 'free-test'
            const testTitle = isFree ? 'Free Mock Test' : 'Paid Plan Test'
            return {
              name: r.user_name,
              avatarBg: colorBgs[i % colorBgs.length],
              tag: `Verified Student • ${testTitle}`,
              stars: r.rating,
              text: r.review_text
            }
          })
          setReviews(mapped)
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err)
      }
    }

    fetchApprovedReviews()
  }, [])

  const activeReviews = useMemo(() => {
    return reviews.length > 0 ? reviews : reviewsData
  }, [reviews])

  const marqueeRow = useMemo(() => {
    return [...activeReviews, ...activeReviews, ...activeReviews]
  }, [activeReviews])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  const goTo = (path) => {
    window.scrollTo(0, 0)
    navigate(path)
  }

  const handleUnlockAll = () => {
    if (user) {
      sessionStorage.setItem('pendingPayment', 'true')
      navigate('/tests')
    } else {
      sessionStorage.setItem('redirectAfterLogin', '/tests')
      sessionStorage.setItem('pendingPayment', 'true')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-surface/80 glass-nav border-b border-outline-variant">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-white flex items-center justify-center">
              <img alt="DataWiz Logo" className="w-full h-full object-cover" src="https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg" />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">DataWiz</span>
          </div>
          <nav className="hidden md:flex gap-lg items-center">
            <button onClick={() => scrollTo('footer')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">About</button>
            <button onClick={() => goTo('/study-material')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">Study Materials</button>
            <button onClick={() => goTo('/blogs')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">Blogs</button>
            <button onClick={() => goTo('/tests')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">Your Tests</button>
            <button onClick={() => scrollTo('reviews')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">Reviews</button>
            <button onClick={() => scrollTo('pricing')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">Pricing</button>
            <button onClick={() => scrollTo('follow')} className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors cursor-pointer">Follow</button>
          </nav>
          <div className="flex items-center gap-sm">
            <ProfileDropdown user={user} navigate={navigate} />
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Collapsible Side Panel Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer Body */}
          <div className="relative w-[220px] h-full bg-white shadow-xl flex flex-col z-10 animate-slide-in-right">
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <nav className="flex flex-col p-4 gap-base overflow-y-auto">
              <button 
                onClick={() => { setMobileMenuOpen(false); scrollTo('footer') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
                About
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); goTo('/study-material') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                Study Materials
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); goTo('/blogs') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">feed</span>
                Blogs
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); goTo('/tests') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">quiz</span>
                Your Tests
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); scrollTo('reviews') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">rate_review</span>
                Reviews
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); scrollTo('pricing') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Pricing
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); scrollTo('follow') }} 
                className="flex items-center gap-sm py-2 px-3 rounded-lg text-left text-on-surface-variant hover:bg-surface-container hover:text-primary font-body-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                Follow
              </button>
            </nav>
          </div>
        </div>
      )}

      <section className="pt-xl overflow-hidden">
        <div className="relative h-[600px] w-full">
          <img alt="Hero" className="absolute inset-0 w-full h-full object-cover" src={heroImg} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8F7F4]/90 via-[#F8F7F4]/60 to-transparent" />
          <div className="relative h-full max-w-container-max mx-auto px-gutter flex flex-col justify-center items-start gap-md">
            <span className="px-sm py-1 bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md rounded-full">Free Mock Test</span>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-[#2C2C2A] max-w-2xl leading-tight">
              Secure Your Free CDAC C-CAT Mock Test
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              India's most focused C-CAT prep &mdash; Sections A &amp; B. Master the entrance exam with a companion built for technical excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-base mt-sm">
              <button onClick={() => goTo('/tests')} className="px-lg py-4 bg-primary text-on-primary font-label-md text-label-md rounded-full hover:bg-primary-container shadow-sm active:scale-95 transition-all">
                Get Free Access
              </button>
              <button onClick={() => goTo('/study-material')} className="px-lg py-4 border border-primary text-primary font-label-md text-label-md rounded-full hover:bg-white active:scale-95 transition-all">
                Browse Study Materials
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-surface-container-low py-sm border-y border-outline-variant w-full overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter flex flex-col sm:flex-row items-center justify-between gap-md w-full">
          <span className="font-label-md text-label-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">auto_stories</span>
            15 Books available
          </span>
          <div className="flex flex-wrap justify-center sm:justify-start gap-xs">
            <span className="px-3 py-1 bg-white border border-outline-variant rounded-full text-xs font-medium text-on-surface-variant">Mathematics</span>
            <span className="px-3 py-1 bg-white border border-outline-variant rounded-full text-xs font-medium text-on-surface-variant">English</span>
            <span className="px-3 py-1 bg-white border border-outline-variant rounded-full text-xs font-medium text-on-surface-variant">Data Structures</span>
            <span className="px-3 py-1 bg-white border border-outline-variant rounded-full text-xs font-medium text-on-surface-variant">Operating Systems</span>
          </div>
          <button onClick={() => goTo('/study-material')} className="text-primary font-bold text-label-md flex items-center gap-xs hover:underline cursor-pointer sm:ml-auto">
            Explore All <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      <main className="w-full max-w-container-max mx-auto px-gutter py-xl space-y-xl overflow-hidden">
        <section className="space-y-md" id="about">
          <div className="text-center max-w-xl mx-auto space-y-base">
            <h2 className="font-headline-md text-headline-md text-on-surface">Comprehensive Focus</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">Targeted preparation for Section A &amp; B, covering the most critical technical domains.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="p-md bg-white border border-outline-variant rounded-xl hover-card transition-all space-y-sm">
              <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm">Data Science</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">In-depth modules on data cleaning, visualization, and the complete lifecycle of data analysis.</p>
            </div>
            <div className="p-md bg-white border border-outline-variant rounded-xl hover-card transition-all space-y-sm">
              <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-3xl">functions</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm">Statistics</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Master probability, distributions, and inferential statistics required for the C-CAT exam.</p>
            </div>
            <div className="p-md bg-white border border-outline-variant rounded-xl hover-card transition-all space-y-sm">
              <div className="w-12 h-12 bg-tertiary-fixed rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary text-3xl">code</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm">Python/R</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Hands-on coding patterns and syntax focus for the leading programming languages in data wizry.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-lg w-full">
          <div className="text-center max-w-xl mx-auto space-y-base mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface">Choose Your Prep Pack</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">Get instant access to full-length C-CAT mock papers with detailed explanations and score analysis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-6xl mx-auto w-full px-gutter">
            
            {/* Card 1: Free Mock Test */}
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className="h-[28px] bg-transparent" />
              <div className="p-md text-center border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md">Free Mock Test</h3>
                <p className="text-on-surface-variant text-body-sm">Evaluate your prep level</p>
              </div>
              <div className="px-md py-lg text-center space-y-md flex-grow">
                <div className="flex items-center justify-center gap-sm">
                  <span className="text-primary font-display-lg text-[40px] font-extrabold">₹0</span>
                  <span className="text-red-500 line-through font-body-lg text-body-lg font-bold">₹199</span>
                </div>
                <ul className="text-left space-y-sm py-md">
                  {[
                    '1 Full-Length Mock Test (Sections A & B)',
                    '100 Questions & 120 Minutes',
                    'Available to every visitor without login',
                    'Detailed Answers Key & Review',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-base text-body-md">
                      <span className="material-symbols-outlined text-primary shrink-0 mt-[2px]">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-md">
                <button onClick={() => goTo('/tests')} className="w-full py-4 border border-primary text-primary font-label-md text-label-md rounded-full hover:bg-primary/5 transition-all active:scale-95 font-bold uppercase tracking-wide">
                  Start Free Test
                </button>
              </div>
            </div>

            {/* Card 2: Starter Pack */}
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col justify-between relative hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className="h-[28px] bg-transparent" />
              <div className="p-md text-center border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md">Starter Pack</h3>
                <p className="text-on-surface-variant text-body-sm">Great for starting your preparation</p>
              </div>
              <div className="px-md py-lg text-center space-y-md flex-grow relative">
                {/* Corner top right discount badge */}
                <div className="absolute top-3 right-3 z-10 animate-badge-popup">
                  <div className="relative w-[100px] h-[68px] bg-[#E91E63] rounded-xl overflow-hidden shadow-md flex items-center justify-center p-1 select-none">
                    {/* Floating Shapes */}
                    <div className="absolute top-1 left-2 w-3.5 h-3.5 border-[2px] border-[#FF4081]/60 rounded-full animate-float-slow" />
                    <div className="absolute bottom-1 right-2 w-4 h-4 border-[2px] border-[#FF4081]/60 rounded-full animate-float-fast" />
                    <div className="absolute -top-0.5 right-6 w-6 h-0.5 bg-[#FF4081]/50 rounded-full transform rotate-[35deg] animate-float-reverse" />
                    <div className="absolute bottom-1.5 left-1 w-5 h-0.5 bg-[#FF4081]/50 rounded-full transform -rotate-[40deg] animate-float-slow" />
                    
                    {/* Floating Dots */}
                    <div className="absolute top-5 right-2 w-0.5 h-0.5 bg-white/40 rounded-full animate-float-slow" />
                    <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-white/50 rounded-full animate-float-fast" />

                    {/* Center White Card (Tilted with Rocking Animation) */}
                    <div className="relative bg-white px-1.5 py-0.5 rounded-lg shadow-sm border border-black/5 transform -rotate-[3deg] animate-card-rocking w-[78px] text-center">
                      <div className="flex items-baseline justify-center">
                        <span className="text-[13px] font-black text-[#E91E63] leading-none tracking-tight">80%</span>
                        <span className="text-[7px] font-extrabold text-[#E91E63] uppercase tracking-wider pl-0.5">OFF</span>
                      </div>
                      <div className="text-[7.5px] font-black text-black leading-none uppercase tracking-wide mt-0.5">
                        DISCOUNT
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-sm">
                  <span className="text-primary font-display-lg text-[40px] font-extrabold">{formatINR(STARTER_PRICE_INR)}</span>
                  <span className="text-red-500 line-through font-body-lg text-body-lg font-bold">{formatINR(STARTER_ORIGINAL_PRICE_INR)}</span>
                </div>
                <ul className="text-left space-y-sm py-md">
                  {[
                    '5 Full-Length Mock Tests (Sections A & B)',
                    '100 Questions & 120 Minutes Per Test',
                    'Easy, Medium & Hard Level Question Papers',
                    'Detailed Explanations & Answers Key',
                    'Direct DM Support with Admin',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-base text-body-md">
                      <span className="material-symbols-outlined text-primary shrink-0 mt-[2px]">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-md">
                <button onClick={() => {
                  sessionStorage.setItem('pendingPlan', 'starter');
                  handleUnlockAll();
                }} className="w-full py-4 border border-primary text-primary font-label-md text-label-md rounded-full hover:bg-primary/5 transition-all active:scale-95 font-bold uppercase tracking-wide">
                  Buy Starter Pack
                </button>
              </div>
            </div>

            {/* Card 3: Complete Pack (Pro) */}
            <div className="bg-white border-2 border-primary rounded-xl overflow-hidden shadow-md flex flex-col justify-between relative hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className="bg-primary h-[28px] flex items-center justify-center text-center">
                <span className="text-on-primary uppercase tracking-widest font-bold text-[10px]">BEST VALUE &bull; POPULAR choice</span>
              </div>
              <div className="p-md text-center border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md">Complete Pack</h3>
                <p className="text-on-surface-variant text-body-sm">Full syllabus mock test series</p>
              </div>
              <div className="px-md py-lg text-center space-y-md flex-grow relative">
                {/* Corner top right discount badge */}
                <div className="absolute top-3 right-3 z-10 animate-badge-popup">
                  <div className="relative w-[100px] h-[68px] bg-[#E91E63] rounded-xl overflow-hidden shadow-md flex items-center justify-center p-1 select-none">
                    {/* Floating Shapes */}
                    <div className="absolute top-1 left-2 w-3.5 h-3.5 border-[2px] border-[#FF4081]/60 rounded-full animate-float-slow" />
                    <div className="absolute bottom-1 right-2 w-4 h-4 border-[2px] border-[#FF4081]/60 rounded-full animate-float-fast" />
                    <div className="absolute -top-0.5 right-6 w-6 h-0.5 bg-[#FF4081]/50 rounded-full transform rotate-[35deg] animate-float-reverse" />
                    <div className="absolute bottom-1.5 left-1 w-5 h-0.5 bg-[#FF4081]/50 rounded-full transform -rotate-[40deg] animate-float-slow" />
                    
                    {/* Floating Dots */}
                    <div className="absolute top-5 right-2 w-0.5 h-0.5 bg-white/40 rounded-full animate-float-slow" />
                    <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-white/50 rounded-full animate-float-fast" />

                    {/* Center White Card (Tilted with Rocking Animation) */}
                    <div className="relative bg-white px-1.5 py-0.5 rounded-lg shadow-sm border border-black/5 transform -rotate-[3deg] animate-card-rocking w-[78px] text-center">
                      <div className="flex items-baseline justify-center">
                        <span className="text-[13px] font-black text-[#E91E63] leading-none tracking-tight">85%</span>
                        <span className="text-[7px] font-extrabold text-[#E91E63] uppercase tracking-wider pl-0.5">OFF</span>
                      </div>
                      <div className="text-[7.5px] font-black text-black leading-none uppercase tracking-wide mt-0.5">
                        DISCOUNT
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-sm">
                  <span className="text-primary font-display-lg text-[40px] font-extrabold">{formatINR(PRO_PRICE_INR)}</span>
                  <span className="text-red-500 line-through font-body-lg text-body-lg font-bold">{formatINR(PRO_ORIGINAL_PRICE_INR)}</span>
                </div>
                <ul className="text-left space-y-sm py-md">
                  {[
                    '10 Full-Length Mock Tests (Sections A & B)',
                    'Includes all 5 Starter Tests + 5 Premium Tests',
                    'Easy, Medium & Hard Level Question Papers',
                    'Detailed Explanations & Answers Key',
                    'Comprehensive Score Analysis',
                    'Direct DM Support with Admin',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-base text-body-md">
                      <span className="material-symbols-outlined text-primary shrink-0 mt-[2px]">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-md">
                <button onClick={() => {
                  sessionStorage.setItem('pendingPlan', 'pro');
                  handleUnlockAll();
                }} className="w-full py-4 bg-primary text-on-primary font-label-md text-label-md rounded-full shadow hover:bg-primary-container transition-all active:scale-95 font-bold uppercase tracking-wide">
                  Buy Complete Pack
                </button>
              </div>
            </div>

          </div>
        </section>

        <section id="reviews" className="space-y-md py-md overflow-hidden w-full">
          <div className="text-center max-w-xl mx-auto space-y-base mb-sm px-gutter">
            <h2 className="font-headline-md text-headline-md text-on-surface">Reviews</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              Hear from CDAC aspirants who used DataWiz mock tests to prepare for Sections A & B.
            </p>
          </div>

          <div className="select-none pointer-events-auto marquee-fade w-full overflow-hidden">
            <div className="flex overflow-hidden w-full">
              <div className="flex gap-md pr-md animate-marquee-left pause-hover">
                {marqueeRow.map((review, idx) => (
                  <ReviewCard key={`review-${idx}`} review={review} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="follow" className="grid grid-cols-1 sm:grid-cols-3 gap-md w-full">
          {[
            { icon: 'play_circle', color: 'text-red-600', bg: 'bg-red-100', title: 'YouTube', desc: 'Visual tutorials', url: 'https://www.youtube.com/@Datawiz6' },
            { icon: 'share', color: 'text-blue-700', bg: 'bg-blue-100', title: 'LinkedIn', desc: 'Study community', url: 'https://www.linkedin.com/in/datawiz6/' },
            { icon: 'mail', color: 'text-on-surface', bg: 'bg-surface-container', title: 'Direct Email', desc: 'Ask questions', url: 'mailto:allaboutstatistics19@gmail.com' },
          ].map((link) => (
            <a key={link.title} className="p-md bg-white border border-outline-variant rounded-xl flex items-center gap-md hover-card transition-all group" href={link.url} target="_blank" rel="noopener noreferrer">
              <div className={`w-12 h-12 ${link.bg} rounded-full flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${link.color}`}>{link.icon}</span>
              </div>
              <div>
                <h5 className="font-label-md text-label-md group-hover:text-primary">{link.title}</h5>
                <p className="text-[12px] text-on-surface-variant">{link.desc}</p>
              </div>
            </a>
          ))}
        </section>
      </main>

      <footer id="footer" className="bg-surface-container-low py-lg mt-xl border-t border-outline-variant w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md px-gutter max-w-container-max mx-auto">
          <div className="space-y-base">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-headline-sm text-headline-sm font-bold text-primary cursor-pointer">DataWiz</button>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
              &copy; 2026 DataWiz. CDAC C-CAT Exam Prep Platform. Empowering students with precise study tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-md md:justify-end items-start">
            <button onClick={() => scrollTo('footer')} className="text-on-surface-variant hover:text-primary font-body-sm text-body-sm transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => scrollTo('footer')} className="text-on-surface-variant hover:text-primary font-body-sm text-body-sm transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={() => scrollTo('footer')} className="text-on-surface-variant hover:text-primary font-body-sm text-body-sm transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => scrollTo('footer')} className="text-on-surface-variant hover:text-primary font-body-sm text-body-sm transition-colors cursor-pointer">FAQ</button>
          </div>
        </div>
      </footer>
      <SupportChatWidget 
        user={user} 
        hasPremiumAccess={hasPremiumAccess} 
        onOpenUpgradeModal={() => navigate('/tests')} 
      />
    </div>
  )
}
