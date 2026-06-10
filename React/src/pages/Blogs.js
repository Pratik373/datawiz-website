import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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
        className="px-6 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all justify-self-end whitespace-nowrap"
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
        className="flex items-center gap-2 group animate-fade-in"
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
                navigate('/tests')
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">quiz</span>
              My Tests
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

export default function Blogs() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const blogPosts = [
    {
      id: 'ai-courses',
      title: "The Only Free AI Course List You'll Need in 2026",
      excerpt: "8 world-class AI courses from Google, IBM, Harvard, MIT & Anthropic — curated so you don't waste a single hour. Perfect for CDAC aspirants, professionals, and students alike.",
      author: 'DataWiz Team',
      date: 'June 2026',
      readTime: '8 min read',
      tag: 'AI Learning Guide',
      icon: 'psychology',
      link: '/blogs/ai-courses'
    },
    {
      id: 'whats-happening-in-ai',
      title: "What Is Currently Happening in AI? | 2026 Edition",
      excerpt: "AI is everywhere right now — in your phone, your apps, your search results, and even your doctor's office. A simple, no-jargon guide to the biggest things going on in Artificial Intelligence right now.",
      author: 'DataWiz Team',
      date: 'June 2026',
      readTime: '6 min read',
      tag: 'Tech & AI',
      icon: 'insights',
      link: '/blogs/whats-happening-in-ai'
    }
  ]

  const filteredPosts = blogPosts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-md">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Home
            </button>
          </div>
          <ProfileDropdown user={user} navigate={navigate} />
        </div>
      </header>

      {/* Main Container */}
      <main className="mt-[72px] flex-grow">
        {/* Title Section */}
        <section className="max-w-container-max mx-auto px-gutter py-lg text-center md:text-left">
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-label-md text-label-md mb-md">
            DataWiz Resources
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-sm">DataWiz Blogs</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Curated guides, learning paths, and exam insights written by industry professionals and teachers.
          </p>
        </section>

        {/* Search Section */}
        <section className="max-w-container-max mx-auto px-gutter mb-lg">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full pl-[56px] pr-md py-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-input-text text-input-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search articles by title, topic, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Blogs Grid */}
        <section className="max-w-container-max mx-auto px-gutter pb-xl flex-grow">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(post.link)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col h-full hover-card transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-md">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">{post.icon}</span>
                    </div>
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md text-xs uppercase tracking-wider">
                      {post.tag}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg flex-grow leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto border-t border-outline-variant/40 pt-sm flex items-center justify-between font-body-sm text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span>{post.author}</span>
                    </div>
                    <div className="flex gap-md">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-xl px-gutter text-center">
              <div className="w-48 h-48 bg-surface-container rounded-full flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-[80px] text-outline-variant">find_in_page</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">No articles found</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-lg">
                We couldn't find any blog posts matching your search query.
              </p>
              <button onClick={() => setSearchQuery('')} className="text-primary font-label-md text-label-md hover:underline">
                Clear search filter
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant w-full py-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md px-gutter max-w-container-max mx-auto">
          <div className="flex flex-col gap-xs">
            <div className="font-headline-sm text-headline-sm font-bold text-primary text-left">DataWiz</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-left">&copy; 2026 DataWiz. CDAC C-CAT Exam Prep Platform.</p>
          </div>
          <div className="flex flex-wrap gap-md md:justify-end items-center">
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => navigate('/')} className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">FAQ</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
