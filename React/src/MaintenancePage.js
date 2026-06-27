import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { STARTER_PRICE_INR, formatINR } from './pricingConfig';
import './MaintenancePage.css';

export default function MaintenancePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dots, setDots] = useState('');
  const [loggedInEmail, setLoggedInEmail] = useState(null);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedInEmail(session?.user?.email || null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedInEmail(null);
    window.location.href = '/login';
  };

  const handleNotify = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  const features = [
    { icon: '📋', title: '5 Full Mock Tests', desc: 'Complete Section A + Section B coverage with 100 questions each' },
    { icon: '⏱', title: 'Timed Exam Mode', desc: 'Simulate real exam pressure with 60-minute section timers' },
    { icon: '📊', title: 'Score Analysis', desc: 'Instant results with detailed answer key and review' },
    { icon: '📄', title: 'PDF Practice Sets', desc: 'Downloadable question papers with digital OMR answer sheets' },
    { icon: '🔒', title: 'Secure & Private', desc: 'All tests delivered via encrypted, signed URLs' },
    { icon: '♾️', title: 'Unlimited Access', desc: `Access all tests anytime — just ${formatINR(STARTER_PRICE_INR)} one-time` },
  ];

  return (
    <div className="maint-root">
      {/* Animated background */}
      <div className="maint-bg">
        <div className="maint-orb maint-orb-1" />
        <div className="maint-orb maint-orb-2" />
        <div className="maint-orb maint-orb-3" />
        <div className="maint-grid" />
      </div>

      <div className="maint-content">
        {/* Logo */}
        <div className="maint-logo-row">
          <img
            src="/assets/logo.jpeg"
            alt="Datawiz6"
            className="maint-logo"
          />
          <span className="maint-brand">Datawiz6</span>
        </div>

        {/* Main heading */}
        <div className="maint-badge">🔧 Maintenance Mode</div>
        <h1 className="maint-title">
          Something Great is<br />
          <span className="maint-title-accent">Coming Soon</span>
        </h1>
        <p className="maint-subtitle">
          We're setting up <strong>5 premium CDAC C-CAT mock tests</strong> for just <strong>{formatINR(STARTER_PRICE_INR)}</strong>.
          Our team is working hard to deliver the best exam preparation experience. Stay tuned{dots}
        </p>

        {/* Countdown-style info bar */}
        <div className="maint-info-bar">
          <div className="maint-info-item">
            <span className="maint-info-number">5</span>
            <span className="maint-info-label">Mock Tests</span>
          </div>
          <div className="maint-info-divider" />
          <div className="maint-info-item">
            <span className="maint-info-number">100</span>
            <span className="maint-info-label">Questions Each</span>
          </div>
          <div className="maint-info-divider" />
          <div className="maint-info-item">
            <span className="maint-info-number">{formatINR(STARTER_PRICE_INR)}</span>
            <span className="maint-info-label">One-Time Only</span>
          </div>
          <div className="maint-info-divider" />
          <div className="maint-info-item">
            <span className="maint-info-number">∞</span>
            <span className="maint-info-label">Unlimited Access</span>
          </div>
        </div>

        {/* Feature grid */}
        <div className="maint-features-grid">
          {features.map((f, i) => (
            <div key={i} className="maint-feature-card">
              <div className="maint-feature-icon">{f.icon}</div>
              <h3 className="maint-feature-title">{f.title}</h3>
              <p className="maint-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Notify form */}
        <div className="maint-notify-box">
          <h2 className="maint-notify-title">Get Notified When We Launch</h2>
          <p className="maint-notify-sub">Be the first to access the tests when we go live.</p>
          {submitted ? (
            <div className="maint-notify-success">
              🎉 You're on the list! We'll email you at <strong>{email}</strong> when we launch.
            </div>
          ) : (
            <form className="maint-notify-form" onSubmit={handleNotify}>
              <input
                type="email"
                className="maint-notify-input"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="maint-notify-btn">Notify Me 🚀</button>
            </form>
          )}
        </div>

        {/* Footer note */}
        {loggedInEmail ? (
          <p className="maint-footer-note">
            Signed in as <strong style={{ color: '#d6dcff' }}>{loggedInEmail}</strong>.{' '}
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', color: '#a3b8ff', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', fontSize: 'inherit' }}
            >
              Sign out &amp; switch account
            </button>
          </p>
        ) : (
          <p className="maint-footer-note">
            Are you an admin?{' '}
            <a href="/login" className="maint-admin-link">Sign in here</a>
          </p>
        )}
      </div>
    </div>
  );
}
