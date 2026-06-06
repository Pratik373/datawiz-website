import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const logoUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD00LRNanrfNXVDk0tHzw1rpa8xl37K5qVwI9hWiOOekYTkSk9bWnkQw3sYas1MVLdA5P9ZRFh8NxtKZ33AP_lbS3G7J5uhY-VkVVIG45MJBqAgmN4HHKuxs1J9leRkvlxBpwJakwHUr4JH6t9dVSZbjbKoI7y2bdQAwq4wiZjkFzziZh2A1q3dwBHsCSNTEhUg8VLJpBC2L5jKhJKcs2Kba_IYhAdTFFwP4koOTM5dDwwaJSbQDqz4-qyKIWVhyv4HxBfzWv0S-24'

export default function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className={`fixed top-0 w-full z-50 glass-nav border-b border-outline-variant transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-white flex items-center justify-center shrink-0">
            <img className="w-full h-full object-cover" src={logoUrl} alt="DataWiz Logo" />
          </div>
          <span className="font-display text-headline-md font-bold text-on-surface">DataWiz</span>
        </div>

        <nav className="hidden md:flex gap-lg items-center">
          <a className="text-on-surface-variant hover:text-primary font-body-md transition-colors" href="#about">About</a>
          <a className="text-on-surface-variant hover:text-primary font-body-md transition-colors" href="#materials">Study Materials</a>
          <Link className="text-on-surface-variant hover:text-primary font-body-md transition-colors" to="/mock-tests">Mock Test</Link>
          <a className="text-on-surface-variant hover:text-primary font-body-md transition-colors" href="#pricing">Pricing</a>
          <a className="text-on-surface-variant hover:text-primary font-body-md transition-colors" href="#social">Follow</a>
          <Link className="text-on-surface-variant hover:text-primary font-body-md transition-colors" to="/tests">Your Tests</Link>
        </nav>

        <div className="flex items-center gap-md">
          {user ? (
            <>
              <span className="hidden sm:block text-body-sm text-on-surface-variant">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md active:scale-95"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-md py-2 border border-primary text-primary font-label-md rounded-full hover:bg-primary/5 active:scale-95 transition-all"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
