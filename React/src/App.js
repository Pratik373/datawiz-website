import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { supabase } from './supabaseClient';
import LoginPage from './LoginPage';
import ResetPassword from './ResetPassword';
import StudyMaterial from './StudyMaterial';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import PricingSection from './PricingSection';
import StudentTestPortal from './StudentTestPortal';
import MaintenancePage from './MaintenancePage';



/* ═══════════════════════════════════════════
   Landing Page (Home)
═══════════════════════════════════════════ */
function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [user, setUser] = useState(null);

  const logoUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg';
  const bannerUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/ChatGPT%20Image%20Dec%2024,%202025,%2010_54_44%20PM.png';

  // Track auth state for Login / Logout button
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Please enter your email');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('emails')
        .insert([{ email: email, created_at: new Date() }]);

      if (error) {
        if (error.message && error.message.includes('duplicate')) {
          setMessage('This email is already registered. Redirecting to exam...');
          setMessageType('success');
          setTimeout(() => { navigate('/mock-tests'); }, 1500);
        } else {
          setMessage('Error saving email. Please try again.');
          setMessageType('error');
          console.error(error);
        }
      } else {
        setMessage('✓ Thank you! Redirecting to exam...');
        setMessageType('success');
        setEmail('');
        setTimeout(() => { navigate('/mock-tests'); }, 1500);
      }
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="hero">
        <nav className="navbar">
          <div className="nav-container">
            <div className="logo-section">
              <img className="logo-image" src={logoUrl} alt="Datawiz6 logo" />
              <h1 className="logo">Datawiz6</h1>
            </div>
            <div className="nav-links">
              <a href="#about">About</a>
              <a href="#materials">Study Materials</a>
              <a href="#subscribe">Mock Test</a>
              <a href="#pricing">Pricing</a>
              <a href="#social">Follow</a>


              {/* ── Login / Logout button ── */}
              {user ? (
                <button
                  id="logout-btn"
                  className="nav-login-btn nav-logout-btn"
                  onClick={handleLogout}
                  title={user.email}
                >
                  Logout
                </button>
              ) : (
                <button
                  id="login-nav-btn"
                  className="nav-login-btn"
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>
        <div className="banner-container">
          <div
            className="banner-image"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
          <div className="banner-overlay" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
        </div>
        <div className="hero-copy">
          <span className="hero-tag">Free Mock Test</span>
          <h1>Secure Your Free CDAC C-CAT Mock Test</h1>
          <p>Submit your email and get instant access to the exam with guided preparation.</p>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <h2>About This Channel</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Datawiz6 is dedicated to making Data Science and Statistics accessible to everyone.
                We provide in-depth tutorials, practical examples, and real-world applications to help
                you master these essential skills.
              </p>
              <ul className="features">
                <li>📊 In-depth Data Science tutorials</li>
                <li>📈 Statistics fundamentals &amp; advanced concepts</li>
                <li>💻 Python &amp; R programming guides</li>
                <li>🎯 Real-world project implementations</li>
                <li>🚀 Career tips &amp; opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Study Materials Promo Section */}
      <section id="materials" className="materials-promo">
        <div className="container">
          <div className="materials-promo-inner">
            <div className="materials-promo-left">
              <span className="materials-promo-badge">📚 15 Books</span>
              <h2>CDAC C-CAT Study Materials</h2>
              <p>
                Access our curated collection of 15 essential books for C-CAT preparation —
                including programming, OS, networks, aptitude &amp; more.
                Login to view &amp; download PDFs for free.
              </p>
              <div className="materials-promo-tags">
                {['C Programming', 'OS', 'Networks', 'Aptitude', 'Digital Design', 'AI'].map(tag => (
                  <span key={tag} className="promo-tag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="materials-promo-right">
              <button
                id="study-material-btn"
                className="materials-promo-btn"
                onClick={() => navigate('/study-material')}
              >
                Browse Study Materials →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Email Subscription Section */}
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
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Social Links Section */}
      <section id="social" className="social-section">
        <div className="container">
          <h2>Follow Us</h2>
          <div className="social-links">
            <a
              href="https://www.youtube.com/@Datawiz6"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card youtube"
            >
              <div className="social-icon">
                <img
                  className="social-logo"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg"
                  alt="YouTube"
                />
              </div>
              <h3>YouTube</h3>
              <p>@Datawiz6</p>
              <span className="cta">Subscribe Now →</span>
            </a>

            <a
              href="https://www.linkedin.com/in/datawiz6/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card linkedin"
            >
              <div className="social-icon">
                <img
                  className="social-logo"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg"
                  alt="LinkedIn"
                />
              </div>
              <h3>LinkedIn</h3>
              <p>@datawiz6</p>
              <span className="cta">Connect →</span>
            </a>

            <a
              href="mailto:allaboutstatistics19@gmail.com"
              className="social-card email"
            >
              <div className="social-icon">
                <img
                  className="social-logo"
                  src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg"
                  alt="Gmail"
                />
              </div>
              <h3>Email</h3>
              <p>allaboutstatistics19@gmail.com</p>
              <span className="cta">Get in Touch →</span>
            </a>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* ── Mock Tests Preview Section ── */}
      <section id="mock-tests-preview" style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(180deg, #0b1026 0%, #0f1535 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(111,87,255,0.15)',
            color: '#a3b8ff',
            padding: '0.4rem 1rem',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>MOCK TESTS</div>

          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 1rem',
          }}>Practice with Real C-CAT Pattern Tests</h2>
          <p style={{ color: '#8e9dcc', fontSize: '1.1rem', marginBottom: '3rem' }}>
            Try the free interactive mock test or unlock unlimited PDF tests with our premium plan.
          </p>

          {/* Preview cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}>
            {/* Free card */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(126,232,184,0.25)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
            }}>
              <span style={{
                background: 'rgba(126,232,184,0.15)',
                color: '#7ee8b8',
                padding: '0.3rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>🆓 FREE</span>
              <h3 style={{ color: '#fff', margin: '1rem 0 0.5rem', fontSize: '1.1rem' }}>C-CAT Full Mock Test</h3>
              <p style={{ color: '#8e9dcc', fontSize: '0.9rem', margin: '0 0 1rem' }}>100 questions, 120 mins — interactive with auto-grading.</p>
              <div style={{ display: 'flex', gap: '0.75rem', color: '#a3b8ff', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <span>⏱ 120 mins</span><span>📋 100 Qs</span>
              </div>
            </div>

            {/* Premium card */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(111,87,255,0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <span style={{
                background: 'rgba(111,87,255,0.2)',
                color: '#a3b8ff',
                padding: '0.3rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>🔒 PREMIUM</span>
              <h3 style={{ color: '#fff', margin: '1rem 0 0.5rem', fontSize: '1.1rem' }}>PDF Practice Sets</h3>
              <p style={{ color: '#8e9dcc', fontSize: '0.9rem', margin: '0 0 1rem' }}>Quantitative, Reasoning &amp; more — with Digital OMR sheet.</p>
              <div style={{ display: 'flex', gap: '0.75rem', color: '#a3b8ff', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <span>⏱ 60 mins</span><span>🔒 Unlock for ₹199</span>
              </div>
            </div>

            {/* More coming */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(139,151,255,0.15)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}>
              <div style={{ fontSize: '2rem' }}>📦</div>
              <p style={{ color: '#8e9dcc', margin: 0 }}>More tests being added regularly!</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/mock-tests')}
            style={{
              background: 'linear-gradient(135deg, #6f57ff, #4ab9ff)',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '99px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(111,87,255,0.35)',
            }}
          >
            View All Tests →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Datawiz6. All rights reserved.</p>
          <p>Made with ❤️ for Data Enthusiasts</p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Maintenance Gate
   Rules:
     1. /login, /reset-password, /admin/* → always accessible
     2. Not logged in → maintenance page
     3. Admin email → full access
     4. Whitelisted email → full access
     5. Everyone else → maintenance page
═══════════════════════════════════════════ */
function MaintenanceGate({ children }) {
  const MAINTENANCE = process.env.REACT_APP_MAINTENANCE_MODE === 'true';
  const location   = useLocation();
  const path       = location.pathname;

  // These routes are NEVER blocked regardless of maintenance mode
  const isAlwaysOpen = path === '/login' ||
                       path === '/reset-password' ||
                       path.startsWith('/admin');

  // 'checking' | 'allowed' | 'blocked'
  const [status, setStatus] = useState(MAINTENANCE && !isAlwaysOpen ? 'checking' : 'allowed');

  useEffect(() => {
    if (!MAINTENANCE || isAlwaysOpen) {
      setStatus('allowed');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not logged in — show maintenance
          if (!cancelled) setStatus('blocked');
          return;
        }

        // Admin always gets through
        if (session.user.email === 'adminspp@datawiz.com') {
          if (!cancelled) setStatus('allowed');
          return;
        }

        // Check beta-tester whitelist
        try {
          const res   = await fetch('/api/maintenance-whitelist');
          const json  = await res.json();
          const list  = (json.emails || []).map(e => e.email.toLowerCase());
          if (!cancelled) {
            setStatus(list.includes(session.user.email.toLowerCase()) ? 'allowed' : 'blocked');
          }
        } catch {
          if (!cancelled) setStatus('blocked');
        }
      } catch {
        if (!cancelled) setStatus('blocked');
      }
    })();

    return () => { cancelled = true; };
  }, [MAINTENANCE, isAlwaysOpen, path]);

  if (!MAINTENANCE)      return children;
  if (isAlwaysOpen)      return children;
  if (status === 'allowed') return children;
  if (status === 'checking') return (
    <div style={{ minHeight: '100vh', background: '#060b1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8e9dcc', fontSize: '1rem' }}>Loading…</div>
    </div>
  );
  return <MaintenancePage />;
}

/* ═══════════════════════════════════════════
   App Root — Router setup
═══════════════════════════════════════════ */
function App() {
  return (
    <BrowserRouter>
      <MaintenanceGate>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/study-material" element={<StudyMaterial />} />
          <Route path="/mock-tests" element={<StudentTestPortal />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </MaintenanceGate>
    </BrowserRouter>
  );
}

export default App;
